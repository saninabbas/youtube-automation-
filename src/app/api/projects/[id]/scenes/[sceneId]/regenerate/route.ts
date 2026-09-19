import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getDb, ContentProject, VideoScene, GeneratedAsset } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { videoProvider } from '@/lib/providers/videoProvider';
import { ffmpegCompositor } from '@/lib/providers/ffmpegCompositor';
import { storage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const projectId = resolvedParams?.id;
    const sceneId = resolvedParams?.sceneId;

    if (!projectId || !sceneId) {
      return NextResponse.json({ error: 'Project ID and Scene ID are required' }, { status: 400 });
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const db = getDb();
    const project = db
      .prepare('SELECT * FROM content_projects WHERE id = ?')
      .get(projectId) as ContentProject | undefined;

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.user_id && project.user_id !== user.id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Find the scene
    let scene = db
      .prepare('SELECT * FROM video_scenes WHERE project_id = ? AND (id = ? OR scene_index = ?)')
      .get(projectId, sceneId, Number(sceneId)) as VideoScene | undefined;

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    // Parse optional overrides from request body
    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const visualPrompt = body.visualPrompt || scene.visual_prompt;
    const cameraMovement = body.cameraMovement || scene.camera_movement || undefined;
    const visualStyle = body.visualStyle || 'Cinematic High-Contrast';
    const durationSec = body.durationSec || scene.estimated_duration_sec || 6;
    const niche = body.niche || 'General';

    // If prompt changed, update scene in DB
    if (body.visualPrompt && body.visualPrompt !== scene.visual_prompt) {
      db.prepare('UPDATE video_scenes SET visual_prompt = ? WHERE id = ?').run(visualPrompt, scene.id);
    }

    // Generate the new clip
    const clipKey = `clips/${projectId}/scene_${scene.scene_index}_clip_1.mp4`;
    const localFilePath = storage.getFilePath(clipKey);
    const fileDir = path.dirname(localFilePath);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    console.log(`[RegenerateScene] Re-synthesizing Scene ${scene.scene_index} for project ${projectId}...`);

    await videoProvider.generateVideoClip({
      prompt: visualPrompt,
      durationSec,
      outputPath: localFilePath,
      sceneIndex: scene.scene_index,
      clipIndex: 1,
      niche,
      visualStyle,
      cameraMovement,
      lighting: scene.lighting || undefined,
      colorStyle: scene.color_style || undefined,
      continuityNotes: scene.continuity_notes || undefined,
      aspectRatio: '9:16',
      projectId,
      sceneId: scene.id,
    });

    const now = new Date().toISOString();
    const clipUrl = storage.getUrl(clipKey);

    // Update or insert asset record for this scene's clip
    const existingAsset = db
      .prepare("SELECT * FROM generated_assets WHERE project_id = ? AND scene_id = ? AND asset_type = 'clip'")
      .get(projectId, scene.id) as GeneratedAsset | undefined;

    if (existingAsset) {
      db.prepare(
        'UPDATE generated_assets SET storage_key = ?, url = ?, duration_sec = ?, created_at = ? WHERE id = ?'
      ).run(clipKey, clipUrl, durationSec, now, existingAsset.id);
    } else {
      db.prepare(
        `INSERT INTO generated_assets (id, project_id, scene_id, asset_type, storage_key, url, duration_sec, metadata_json, created_at)
         VALUES (?, ?, ?, 'clip', ?, ?, ?, ?, ?)`
      ).run(
        uuidv4(),
        projectId,
        scene.id,
        clipKey,
        clipUrl,
        durationSec,
        JSON.stringify({ clipIndex: 1, sceneIndex: scene.scene_index }),
        now
      );
    }

    // Re-compose the final video in background with the updated clip
    let finalVideoUrl: string | null = null;
    try {
      const allClips = db
        .prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'clip' ORDER BY created_at ASC")
        .all(projectId) as GeneratedAsset[];

      const audioAsset = db
        .prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'audio' ORDER BY created_at DESC LIMIT 1")
        .get(projectId) as GeneratedAsset | undefined;

      if (allClips.length > 0) {
        const clipPaths = allClips.map((c) => storage.getFilePath(c.storage_key));
        const audioPath = audioAsset ? storage.getFilePath(audioAsset.storage_key) : '';
        const totalDuration = allClips.reduce((sum, c) => sum + (c.duration_sec || 0), 0);

        const composition = await ffmpegCompositor.composeVideo({
          projectId,
          clipFilePaths: clipPaths,
          audioFilePath: audioPath,
          totalDurationSec: totalDuration,
          aspectRatio: '9:16',
        });

        finalVideoUrl = composition.url;

        // Update video_outputs
        db.prepare('DELETE FROM video_outputs WHERE project_id = ?').run(projectId);
        db.prepare(
          `INSERT INTO video_outputs (id, project_id, storage_key, url, duration_sec, resolution, filesize_bytes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          uuidv4(),
          projectId,
          composition.storageKey,
          composition.url,
          composition.durationSec,
          composition.resolution,
          composition.filesizeBytes,
          now
        );
      }
    } catch (compErr: any) {
      console.warn('[RegenerateScene] Re-composition warning:', compErr.message);
    }

    return NextResponse.json({
      success: true,
      sceneId: scene.id,
      sceneIndex: scene.scene_index,
      clipUrl,
      finalVideoUrl,
      message: `Scene ${scene.scene_index} regenerated successfully`,
    });
  } catch (err: any) {
    console.error('[RegenerateScene] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to regenerate scene' }, { status: 500 });
  }
}
