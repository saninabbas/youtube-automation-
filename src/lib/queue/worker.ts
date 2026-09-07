import { v4 as uuidv4 } from 'uuid';
import { getDb, ContentProject, Channel, VideoScene, GeneratedAsset, VideoJob, ProjectTelemetry, ProjectMetadata } from '../db';
import { aiProvider, ScriptStructure, GeneratedScene } from '../providers/aiProvider';
import { videoProvider } from '../providers/videoProvider';
import { voiceProvider } from '../providers/voiceProvider';
import { subtitleProvider } from '../providers/subtitleProvider';
import { ffmpegCompositor } from '../providers/ffmpegCompositor';
import { thumbnailProvider } from '../providers/thumbnailProvider';
import { storage } from '../storage';

export type PipelineStage = 'SCRIPT' | 'VOICE' | 'SCENES' | 'VIDEO' | 'SUBTITLES' | 'FINAL_VIDEO' | 'THUMBNAIL';

export const PIPELINE_STAGES: PipelineStage[] = [
  'SCRIPT',
  'VOICE',
  'SCENES',
  'VIDEO',
  'SUBTITLES',
  'FINAL_VIDEO',
  'THUMBNAIL',
];

export class VideoPipelineWorker {
  private activeJobs = new Set<string>();

  public startProjectPipeline(projectId: string, fromStage?: PipelineStage): void {
    if (this.activeJobs.has(projectId)) {
      console.log(`Pipeline for project ${projectId} is already running.`);
      return;
    }

    this.activeJobs.add(projectId);
    setTimeout(async () => {
      try {
        await this.processPipeline(projectId, fromStage);
      } catch (err) {
        console.error(`Pipeline fatal error for project ${projectId}:`, err);
      } finally {
        this.activeJobs.delete(projectId);
      }
    }, 50);
  }

  public async processPipeline(projectId: string, fromStage?: PipelineStage): Promise<void> {
    const db = getDb();

    const project = db
      .prepare('SELECT * FROM content_projects WHERE id = ?')
      .get(projectId) as ContentProject | undefined;

    if (!project) {
      console.error(`Project ${projectId} not found`);
      return;
    }

    const channel = db
      .prepare('SELECT * FROM channels WHERE id = ?')
      .get(project.channel_id) as Channel | undefined;

    if (!channel) {
      console.error(`Channel ${project.channel_id} not found`);
      return;
    }

    // Initialize all stage jobs if not present
    for (const stage of PIPELINE_STAGES) {
      const existingJob = db
        .prepare('SELECT * FROM video_jobs WHERE project_id = ? AND stage = ?')
        .get(projectId, stage);

      if (!existingJob) {
        db.prepare(
          'INSERT INTO video_jobs (id, project_id, stage, status) VALUES (?, ?, ?, ?)'
        ).run(uuidv4(), projectId, stage, 'PENDING');
      }
    }

    // Determine starting index
    let startIndex = 0;
    if (fromStage) {
      const stageIdx = PIPELINE_STAGES.indexOf(fromStage);
      if (stageIdx >= 0) {
        startIndex = stageIdx;
      }
    }

    // Mark project processing
    const now = new Date().toISOString();
    db.prepare(
      'UPDATE content_projects SET status = ?, current_stage = ?, error_message = NULL, updated_at = ? WHERE id = ?'
    ).run('PROCESSING', PIPELINE_STAGES[startIndex], now, projectId);

    const pipelineStartTime = Date.now();

    for (let i = startIndex; i < PIPELINE_STAGES.length; i++) {
      const stage = PIPELINE_STAGES[i];
      const stageStartTime = new Date().toISOString();

      // Mark stage PROCESSING
      db.prepare(
        'UPDATE video_jobs SET status = ?, started_at = ?, error_message = NULL WHERE project_id = ? AND stage = ?'
      ).run('PROCESSING', stageStartTime, projectId, stage);

      db.prepare(
        'UPDATE content_projects SET current_stage = ?, updated_at = ? WHERE id = ?'
      ).run(stage, stageStartTime, projectId);

      try {
        await this.executeStage(stage, project, channel);

        // Mark stage COMPLETED
        const stageEndTime = new Date().toISOString();
        db.prepare(
          'UPDATE video_jobs SET status = ?, completed_at = ? WHERE project_id = ? AND stage = ?'
        ).run('COMPLETED', stageEndTime, projectId, stage);
      } catch (err: any) {
        const errorMsg = err?.message || 'Stage execution failed';
        console.error(`Error at stage ${stage} for project ${projectId}:`, err);

        const failTime = new Date().toISOString();
        db.prepare(
          'UPDATE video_jobs SET status = ?, error_message = ?, completed_at = ? WHERE project_id = ? AND stage = ?'
        ).run('FAILED', errorMsg, failTime, projectId, stage);

        db.prepare(
          'UPDATE content_projects SET status = ?, current_stage = ?, error_message = ?, updated_at = ? WHERE id = ?'
        ).run('FAILED', stage, errorMsg, failTime, projectId);

        return; // Halt pipeline on failure
      }
    }

    // Collect telemetry upon completion
    const pipelineEndTime = Date.now();
    const totalDurationSec = (pipelineEndTime - pipelineStartTime) / 1000;

    const scenesCount = (db.prepare('SELECT COUNT(*) as count FROM video_scenes WHERE project_id = ?').get(projectId) as any)?.count || 0;
    const clipsCount = (db.prepare("SELECT COUNT(*) as count FROM generated_assets WHERE project_id = ? AND asset_type = 'clip'").get(projectId) as any)?.count || 0;
    const finalOutput = db.prepare('SELECT * FROM video_outputs WHERE project_id = ?').get(projectId) as any;
    const audioAsset = db.prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'audio'").get(projectId) as any;

    const telemetry: ProjectTelemetry = {
      generationStartTime: new Date(pipelineStartTime).toISOString(),
      generationEndTime: new Date(pipelineEndTime).toISOString(),
      totalGenerationDurationSec: Math.round(totalDurationSec * 10) / 10,
      sceneCount: scenesCount,
      clipCount: clipsCount,
      audioDurationSec: audioAsset?.duration_sec || 0,
      finalVideoDurationSec: finalOutput?.duration_sec || 0,
      filesizeBytes: finalOutput?.filesize_bytes || 0,
      providerUsed: videoProvider.getProviderName(),
      generationStatus: 'COMPLETED',
      cost: 'UNAVAILABLE',
    };

    // Determine publishing status & auto-publishing
    let nextPublishStatus = project.publishing_status || 'READY';
    let nextScheduledAt = project.scheduled_at;

    if (project.auto_publish === 1 || channel.auto_publish === 1) {
      nextPublishStatus = 'SCHEDULED';
      if (!nextScheduledAt) {
        // Compute next release slot from channel schedule
        const { publishingScheduler } = await import('../scheduler');
        nextScheduledAt = publishingScheduler.calculateNextReleaseSlot(channel);
      }
    } else if (nextScheduledAt && new Date(nextScheduledAt).getTime() > Date.now()) {
      nextPublishStatus = 'SCHEDULED';
    } else if (nextPublishStatus === 'DRAFT' || nextPublishStatus === 'NOT_CONNECTED') {
      nextPublishStatus = 'READY';
    }

    // Mark project COMPLETED and store telemetry & publishing status
    const completionTime = new Date().toISOString();
    db.prepare(
      `UPDATE content_projects SET 
        status = ?, 
        publishing_status = ?, 
        scheduled_at = ?, 
        telemetry_json = ?, 
        updated_at = ? 
       WHERE id = ?`
    ).run('COMPLETED', nextPublishStatus, nextScheduledAt, JSON.stringify(telemetry), completionTime, projectId);

  }

  private async executeStage(stage: PipelineStage, project: ContentProject, channel: Channel): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();

    switch (stage) {
      case 'SCRIPT': {
        const { script, fullNarration } = await aiProvider.generateScript({
          channelName: channel.name,
          niche: channel.niche,
          language: project.language || channel.language,
          topic: project.topic,
          targetLengthMinutes: project.target_length_minutes,
          visualStyle: channel.visual_style,
          introStyle: channel.intro_style,
          outroCta: channel.outro_cta,
          contentRules: channel.content_rules,
        });

        const scriptKey = `scripts/${project.id}/script.json`;
        const res = await storage.putObject(scriptKey, JSON.stringify(script, null, 2), 'application/json');

        db.prepare("DELETE FROM generated_assets WHERE project_id = ? AND asset_type = 'script'").run(project.id);
        db.prepare(
          `INSERT INTO generated_assets (id, project_id, asset_type, storage_key, url, metadata_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          uuidv4(),
          project.id,
          'script',
          res.key,
          res.url,
          JSON.stringify({ fullNarration, title: script.title }),
          now
        );
        break;
      }

      case 'VOICE': {
        const scriptAsset = db
          .prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'script' ORDER BY created_at DESC LIMIT 1")
          .get(project.id) as GeneratedAsset | undefined;

        if (!scriptAsset) {
          throw new Error('Script asset missing for voice synthesis');
        }

        const scriptData = await storage.getObject(scriptAsset.storage_key);
        if (!scriptData) {
          throw new Error('Script data missing from storage');
        }

        const script: ScriptStructure = JSON.parse(scriptData.toString('utf8'));
        const narrationParts: string[] = [script.hook, script.introduction];
        for (const section of script.sections) {
          for (const sub of section.subsections) {
            narrationParts.push(sub.narration);
          }
        }
        narrationParts.push(script.conclusion);
        narrationParts.push(script.callToAction);
        const fullNarration = narrationParts.join('\n\n');

        const voiceRes = await voiceProvider.generateVoiceover({
          text: fullNarration,
          voiceName: channel.voice,
          voiceSpeed: channel.voice_speed,
          language: project.language || channel.language,
          projectId: project.id,
        });

        const audioKey = `audio/${project.id}/narration.${voiceRes.format}`;
        const audioAsset = await storage.putObject(audioKey, voiceRes.audioBuffer, `audio/${voiceRes.format}`);

        db.prepare("DELETE FROM generated_assets WHERE project_id = ? AND asset_type = 'audio'").run(project.id);

        db.prepare(
          `INSERT INTO generated_assets (id, project_id, asset_type, storage_key, url, duration_sec, metadata_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          uuidv4(),
          project.id,
          'audio',
          audioAsset.key,
          audioAsset.url,
          voiceRes.durationSec,
          JSON.stringify({ voice: channel.voice, voiceSpeed: channel.voice_speed, format: voiceRes.format }),
          now
        );
        break;
      }

      case 'SCENES': {
        const scriptAsset = db
          .prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'script' ORDER BY created_at DESC LIMIT 1")
          .get(project.id) as GeneratedAsset | undefined;

        if (!scriptAsset) {
          throw new Error('Script asset missing for scene generation');
        }

        const scriptData = await storage.getObject(scriptAsset.storage_key);
        if (!scriptData) {
          throw new Error('Script content could not be read from storage');
        }

        const audioAsset = db
          .prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'audio' ORDER BY created_at DESC LIMIT 1")
          .get(project.id) as GeneratedAsset | undefined;

        const actualAudioDuration = audioAsset?.duration_sec || (project.target_length_minutes * 60);

        const script: ScriptStructure = JSON.parse(scriptData.toString('utf8'));
        const scenes = await aiProvider.generateScenes({
          script,
          niche: channel.niche,
          language: project.language || channel.language,
          targetLengthMinutes: project.target_length_minutes,
          visualStyle: channel.visual_style,
        });

        // Calibrate scene durations to exactly match true audio duration
        const totalEstimatedDuration = scenes.reduce((sum, s) => sum + s.estimatedDurationSec, 0);
        const durationRatio = totalEstimatedDuration > 0 ? actualAudioDuration / totalEstimatedDuration : 1.0;

        for (const scene of scenes) {
          scene.estimatedDurationSec = Math.max(4, Math.round(scene.estimatedDurationSec * durationRatio * 10) / 10);
        }

        // Clear any previous scenes if retrying
        db.prepare('DELETE FROM video_scenes WHERE project_id = ?').run(project.id);

        const insertSceneStmt = db.prepare(
          `INSERT INTO video_scenes (
            id, project_id, scene_index, narration, visual_prompt, 
            visual_subject, environment, camera_movement, lighting, color_style, continuity_notes, 
            estimated_duration_sec, subtitle_text, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );

        for (const scene of scenes) {
          insertSceneStmt.run(
            uuidv4(),
            project.id,
            scene.sceneIndex,
            scene.narration,
            scene.visualPrompt,
            scene.visualSubject || null,
            scene.environment || null,
            scene.cameraMovement || null,
            scene.lighting || null,
            scene.colorStyle || null,
            scene.continuityNotes || null,
            scene.estimatedDurationSec,
            scene.subtitleText,
            now
          );
        }
        break;
      }

      case 'VIDEO': {
        const scenes = db
          .prepare('SELECT * FROM video_scenes WHERE project_id = ? ORDER BY scene_index ASC')
          .all(project.id) as VideoScene[];

        if (scenes.length === 0) {
          throw new Error('No scenes found for video clip generation');
        }

        // Remove old clip assets on retry
        db.prepare("DELETE FROM generated_assets WHERE project_id = ? AND asset_type = 'clip'").run(project.id);

        for (const scene of scenes) {
          const clips = await videoProvider.generateVideoClipsForScene({
            projectId: project.id,
            sceneId: scene.id,
            sceneIndex: scene.scene_index,
            visualPrompt: scene.visual_prompt,
            durationSec: scene.estimated_duration_sec,
            niche: channel.niche,
            visualStyle: channel.visual_style,
            environment: scene.environment || undefined,
            cameraMovement: scene.camera_movement || undefined,
            lighting: scene.lighting || undefined,
            colorStyle: scene.color_style || undefined,
            continuityNotes: scene.continuity_notes || undefined,
          });

          for (const clip of clips) {
            db.prepare(
              `INSERT INTO generated_assets (id, project_id, scene_id, asset_type, storage_key, url, duration_sec, metadata_json, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(
              uuidv4(),
              project.id,
              scene.id,
              'clip',
              clip.storageKey,
              clip.url,
              clip.durationSec,
              JSON.stringify({ clipIndex: clip.clipIndex, sceneIndex: scene.scene_index }),
              now
            );
          }
        }
        break;
      }

      case 'SUBTITLES': {
        const scenes = db
          .prepare('SELECT * FROM video_scenes WHERE project_id = ? ORDER BY scene_index ASC')
          .all(project.id) as VideoScene[];

        const cues = subtitleProvider.generateCues(
          scenes.map((s) => ({
            sceneIndex: s.scene_index,
            estimatedDurationSec: s.estimated_duration_sec,
            subtitleText: s.subtitle_text,
          }))
        );

        const srtContent = subtitleProvider.generateSrt(cues);
        const vttContent = subtitleProvider.generateVtt(cues);

        const srtKey = `subtitles/${project.id}/captions.srt`;
        const vttKey = `subtitles/${project.id}/captions.vtt`;

        const srtAsset = await storage.putObject(srtKey, srtContent, 'text/plain');
        await storage.putObject(vttKey, vttContent, 'text/vtt');

        db.prepare("DELETE FROM generated_assets WHERE project_id = ? AND asset_type = 'subtitles'").run(project.id);

        db.prepare(
          `INSERT INTO generated_assets (id, project_id, asset_type, storage_key, url, metadata_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          uuidv4(),
          project.id,
          'subtitles',
          srtAsset.key,
          srtAsset.url,
          JSON.stringify({ cueCount: cues.length, vttKey, style: channel.subtitle_style }),
          now
        );
        break;
      }

      case 'FINAL_VIDEO': {
        const clipAssets = db
          .prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'clip' ORDER BY created_at ASC")
          .all(project.id) as GeneratedAsset[];

        if (clipAssets.length === 0) {
          throw new Error('No video clips found for final video composition');
        }

        const audioAsset = db
          .prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'audio' ORDER BY created_at DESC LIMIT 1")
          .get(project.id) as GeneratedAsset | undefined;

        if (!audioAsset) {
          throw new Error('Voiceover audio missing for final video composition');
        }

        const subAsset = db
          .prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'subtitles' ORDER BY created_at DESC LIMIT 1")
          .get(project.id) as GeneratedAsset | undefined;

        const clipPaths = clipAssets.map((c) => storage.getFilePath(c.storage_key));
        const audioPath = storage.getFilePath(audioAsset.storage_key);
        const subPath = subAsset ? storage.getFilePath(subAsset.storage_key) : undefined;

        const totalClipDuration = clipAssets.reduce((sum, c) => sum + (c.duration_sec || 0), 0);

        const composition = await ffmpegCompositor.composeVideo({
          projectId: project.id,
          clipFilePaths: clipPaths,
          audioFilePath: audioPath,
          subtitleFilePath: subPath,
          totalDurationSec: totalClipDuration,
        });

        // Store video output record
        db.prepare('DELETE FROM video_outputs WHERE project_id = ?').run(project.id);
        db.prepare(
          `INSERT INTO video_outputs (id, project_id, storage_key, url, duration_sec, resolution, filesize_bytes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          uuidv4(),
          project.id,
          composition.storageKey,
          composition.url,
          composition.durationSec,
          composition.resolution,
          composition.filesizeBytes,
          now
        );

        db.prepare("DELETE FROM generated_assets WHERE project_id = ? AND asset_type = 'final_video'").run(project.id);
        db.prepare(
          `INSERT INTO generated_assets (id, project_id, asset_type, storage_key, url, duration_sec, metadata_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          uuidv4(),
          project.id,
          'final_video',
          composition.storageKey,
          composition.url,
          composition.durationSec,
          JSON.stringify({ resolution: composition.resolution, filesizeBytes: composition.filesizeBytes }),
          now
        );

        // Generate metadata
        const scriptAsset = db
          .prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'script' ORDER BY created_at DESC LIMIT 1")
          .get(project.id) as GeneratedAsset | undefined;
        const scenes = db
          .prepare('SELECT * FROM video_scenes WHERE project_id = ? ORDER BY scene_index ASC')
          .all(project.id) as VideoScene[];

        if (scriptAsset) {
          const scriptData = await storage.getObject(scriptAsset.storage_key);
          if (scriptData) {
            const script: ScriptStructure = JSON.parse(scriptData.toString('utf8'));
            const metadata = aiProvider.generateMetadata({
              script,
              scenes: scenes.map((s) => ({
                sceneIndex: s.scene_index,
                sectionName: s.visual_subject || `Scene ${s.scene_index}`,
                narration: s.narration,
                visualPrompt: s.visual_prompt,
                estimatedDurationSec: s.estimated_duration_sec,
                subtitleText: s.subtitle_text,
              })),
              channelName: channel.name,
              niche: channel.niche,
              topic: project.topic,
            });

            db.prepare('UPDATE content_projects SET metadata_json = ? WHERE id = ?').run(
              JSON.stringify(metadata),
              project.id
            );
          }
        }
        break;
      }

      case 'THUMBNAIL': {
        const thumbRes = await thumbnailProvider.generateThumbnail({
          projectId: project.id,
          channelName: channel.name,
          niche: channel.niche,
          title: project.topic,
          visualStyle: channel.visual_style,
        });

        db.prepare("DELETE FROM generated_assets WHERE project_id = ? AND asset_type = 'thumbnail'").run(project.id);
        db.prepare(
          `INSERT INTO generated_assets (id, project_id, asset_type, storage_key, url, metadata_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          uuidv4(),
          project.id,
          'thumbnail',
          thumbRes.storageKey,
          thumbRes.url,
          JSON.stringify({ width: thumbRes.width, height: thumbRes.height, filesizeBytes: thumbRes.filesizeBytes }),
          now
        );
        break;
      }
    }
  }
}

export const videoWorker = new VideoPipelineWorker();
