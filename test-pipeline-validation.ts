import { getDb, DEFAULT_USER_ID } from './src/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { videoWorker, PIPELINE_STAGES } from './src/lib/queue/worker';
import { storage } from './src/lib/storage';
import { inspectMedia } from './src/lib/providers/videoProvider';
import fs from 'fs';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForProject(projectId: string, timeoutMs = 300000) {
  const db = getDb();
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const project: any = db.prepare('SELECT * FROM content_projects WHERE id = ?').get(projectId);
    const stages: any[] = db.prepare('SELECT * FROM video_jobs WHERE project_id = ?').all(projectId);

    console.log(`[Status] Project "${project.topic}": status=${project.status}, stage=${project.current_stage}`);
    for (const s of stages) {
      console.log(`   - Stage ${s.stage.padEnd(12)}: ${s.status} ${s.error_message ? `(Error: ${s.error_message})` : ''}`);
    }

    if (project.status === 'COMPLETED') {
      return project;
    }
    if (project.status === 'FAILED') {
      throw new Error(`Project failed at stage ${project.current_stage}: ${project.error_message}`);
    }

    await sleep(4000);
  }
  throw new Error(`Timeout waiting for project ${projectId}`);
}

async function runValidation() {
  console.log('===============================================================');
  console.log('        STARTING REAL END-TO-END PIPELINE VALIDATION');
  console.log('===============================================================\n');

  const db = getDb();
  const now = new Date().toISOString();

  // -------------------------------------------------------------
  // TEST 1: HEALTHY YEARS (HEALTH - 8 MINUTES)
  // -------------------------------------------------------------
  console.log('>>> [1/3] TEST CHANNEL 1: Healthy Years (Health - 8 Minutes)');
  const channel1Id = uuidv4();
  db.prepare(`
    INSERT INTO channels (id, user_id, name, niche, language, voice, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(channel1Id, DEFAULT_USER_ID, 'Healthy Years', 'Health', 'en', 'en-US-ChristopherNeural', now, now);

  const project1Id = uuidv4();
  db.prepare(`
    INSERT INTO content_projects (id, user_id, channel_id, topic, target_length_minutes, language, status, current_stage, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(project1Id, DEFAULT_USER_ID, channel1Id, '5 Morning Habits That Can Improve Your Health', 8, 'en', 'PENDING', 'SCRIPT', now, now);

  console.log(`Starting pipeline for Healthy Years (Project ID: ${project1Id})...`);
  videoWorker.startProjectPipeline(project1Id);
  await sleep(600);
  await waitForProject(project1Id);

  const p1Output: any = db.prepare('SELECT * FROM video_outputs WHERE project_id = ?').get(project1Id);
  const p1Scenes: any[] = db.prepare('SELECT * FROM video_scenes WHERE project_id = ?').all(project1Id);
  const p1Clips: any[] = db.prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'clip'").all(project1Id);
  const p1Audio: any = db.prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'audio'").get(project1Id);
  const p1Subs: any = db.prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'subtitles'").get(project1Id);

  const p1Mp4Path = storage.getFilePath(p1Output.storage_key);
  const p1Meta = await inspectMedia(p1Mp4Path);

  console.log('\n--- HEALTHY YEARS VALIDATION RESULTS ---');
  console.log(`- Final MP4 exists on disk: ${fs.existsSync(p1Mp4Path)}`);
  console.log(`- Final MP4 path: ${p1Mp4Path}`);
  console.log(`- Total Scenes: ${p1Scenes.length}`);
  console.log(`- Total 8s Video Clips: ${p1Clips.length}`);
  console.log(`- Voiceover Audio: ${p1Audio ? storage.getFilePath(p1Audio.storage_key) : 'MISSING'}`);
  console.log(`- Subtitles File: ${p1Subs ? storage.getFilePath(p1Subs.storage_key) : 'MISSING'}`);
  console.log(`- FFmpeg Inspected Duration: ${p1Meta.durationSec.toFixed(2)}s`);
  console.log(`- FFmpeg Video Codec: ${p1Meta.videoCodec}`);
  console.log(`- FFmpeg Audio Codec: ${p1Meta.audioCodec}`);
  console.log(`- FFmpeg Resolution: ${p1Meta.resolution}`);
  console.log(`- File Size: ${(p1Output.filesize_bytes / (1024 * 1024)).toFixed(2)} MB`);

  if (!fs.existsSync(p1Mp4Path) || p1Output.filesize_bytes === 0) {
    throw new Error('Project 1 MP4 file failed generation');
  }
  if (!p1Meta.videoCodec?.toLowerCase().includes('h264')) {
    throw new Error(`Project 1 video codec is not H.264: ${p1Meta.videoCodec}`);
  }
  if (!p1Meta.audioCodec?.toLowerCase().includes('aac')) {
    throw new Error(`Project 1 audio codec is not AAC: ${p1Meta.audioCodec}`);
  }

  // -------------------------------------------------------------
  // TEST 2: STAGE RETRY (Simulate Failed Stage and Retry)
  // -------------------------------------------------------------
  console.log('\n>>> [2/3] TEST STAGE RETRY: Simulating VIDEO Stage Failure & Retry');
  const retryProjectId = uuidv4();
  db.prepare(`
    INSERT INTO content_projects (id, user_id, channel_id, topic, target_length_minutes, language, status, current_stage, error_message, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(retryProjectId, DEFAULT_USER_ID, channel1Id, 'Retry Test: Health Protocols', 3, 'en', 'FAILED', 'VIDEO', 'Intentional simulated GPU timeout during clip encoding', now, now);

  // Seed SCRIPT and SCENES as completed
  for (const stage of PIPELINE_STAGES) {
    let stStatus = 'PENDING';
    let errMsg: string | null = null;
    if (stage === 'SCRIPT' || stage === 'SCENES') {
      stStatus = 'COMPLETED';
    } else if (stage === 'VIDEO') {
      stStatus = 'FAILED';
      errMsg = 'Intentional simulated GPU timeout during clip encoding';
    }
    db.prepare(`
      INSERT INTO video_jobs (id, project_id, stage, status, error_message, started_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), retryProjectId, stage, stStatus, errMsg, now);
  }

  // Add dummy script asset & scene for retry
  const retryScriptKey = `scripts/${retryProjectId}/script.json`;
  await storage.putObject(retryScriptKey, JSON.stringify({
    title: 'Retry Test: Health Protocols',
    hook: 'Quick morning check.',
    introduction: 'Intro to health test.',
    sections: [{ heading: 'Point 1', subsections: [{ subheading: 'Sub 1', narration: 'Test narration.', visualPrompt: 'Test visual.', durationSec: 10 }] }],
    conclusion: 'Conclusion test.',
    callToAction: 'Subscribe test.',
  }));
  db.prepare(`
    INSERT INTO generated_assets (id, project_id, asset_type, storage_key, url, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), retryProjectId, 'script', retryScriptKey, storage.getUrl(retryScriptKey), now);

  db.prepare(`
    INSERT INTO video_scenes (id, project_id, scene_index, narration, visual_prompt, estimated_duration_sec, subtitle_text, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), retryProjectId, 1, 'Test narration for retry.', 'Visual prompt retry test', 10, 'Test subtitle', now);

  console.log(`Triggering retry from VIDEO stage for Project ${retryProjectId}...`);
  videoWorker.startProjectPipeline(retryProjectId, 'VIDEO');
  await sleep(600);
  await waitForProject(retryProjectId);

  const retryProject: any = db.prepare('SELECT * FROM content_projects WHERE id = ?').get(retryProjectId);
  const retryVideoJob: any = db.prepare("SELECT * FROM video_jobs WHERE project_id = ? AND stage = 'VIDEO'").get(retryProjectId);
  const retryFinalJob: any = db.prepare("SELECT * FROM video_jobs WHERE project_id = ? AND stage = 'FINAL_VIDEO'").get(retryProjectId);

  console.log('\n--- RETRY TEST RESULTS ---');
  console.log(`- Final Project Status: ${retryProject.status}`);
  console.log(`- VIDEO Job Status: ${retryVideoJob.status}`);
  console.log(`- FINAL_VIDEO Job Status: ${retryFinalJob.status}`);

  if (retryProject.status !== 'COMPLETED' || retryVideoJob.status !== 'COMPLETED') {
    throw new Error('Stage retry failed to recover project');
  }

  // -------------------------------------------------------------
  // TEST 3: TECH EXPLAINED (TECHNOLOGY - 5 MINUTES)
  // -------------------------------------------------------------
  console.log('\n>>> [3/3] TEST CHANNEL 2: Tech Explained (Technology - 5 Minutes)');
  const channel2Id = uuidv4();
  db.prepare(`
    INSERT INTO channels (id, user_id, name, niche, language, voice, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(channel2Id, DEFAULT_USER_ID, 'Tech Explained', 'Technology', 'en', 'en-US-JennyNeural', now, now);

  const project2Id = uuidv4();
  db.prepare(`
    INSERT INTO content_projects (id, user_id, channel_id, topic, target_length_minutes, language, status, current_stage, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(project2Id, DEFAULT_USER_ID, channel2Id, 'How AI Is Changing Everyday Life', 5, 'en', 'PENDING', 'SCRIPT', now, now);

  console.log(`Starting pipeline for Tech Explained (Project ID: ${project2Id})...`);
  videoWorker.startProjectPipeline(project2Id);
  await sleep(600);
  await waitForProject(project2Id);

  const p2Output: any = db.prepare('SELECT * FROM video_outputs WHERE project_id = ?').get(project2Id);
  const p2Scenes: any[] = db.prepare('SELECT * FROM video_scenes WHERE project_id = ?').all(project2Id);
  const p2Clips: any[] = db.prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'clip'").all(project2Id);
  const p2Audio: any = db.prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'audio'").get(project2Id);
  const p2Subs: any = db.prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'subtitles'").get(project2Id);

  const p2Mp4Path = storage.getFilePath(p2Output.storage_key);
  const p2Meta = await inspectMedia(p2Mp4Path);

  console.log('\n--- TECH EXPLAINED VALIDATION RESULTS ---');
  console.log(`- Final MP4 exists on disk: ${fs.existsSync(p2Mp4Path)}`);
  console.log(`- Final MP4 path: ${p2Mp4Path}`);
  console.log(`- Total Scenes: ${p2Scenes.length}`);
  console.log(`- Total 8s Video Clips: ${p2Clips.length}`);
  console.log(`- Voiceover Audio: ${p2Audio ? storage.getFilePath(p2Audio.storage_key) : 'MISSING'}`);
  console.log(`- Subtitles File: ${p2Subs ? storage.getFilePath(p2Subs.storage_key) : 'MISSING'}`);
  console.log(`- FFmpeg Inspected Duration: ${p2Meta.durationSec.toFixed(2)}s`);
  console.log(`- FFmpeg Video Codec: ${p2Meta.videoCodec}`);
  console.log(`- FFmpeg Audio Codec: ${p2Meta.audioCodec}`);
  console.log(`- FFmpeg Resolution: ${p2Meta.resolution}`);
  console.log(`- File Size: ${(p2Output.filesize_bytes / (1024 * 1024)).toFixed(2)} MB`);

  if (!fs.existsSync(p2Mp4Path) || p2Output.filesize_bytes === 0) {
    throw new Error('Project 2 MP4 file failed generation');
  }
  if (!p2Meta.videoCodec?.toLowerCase().includes('h264')) {
    throw new Error(`Project 2 video codec is not H.264: ${p2Meta.videoCodec}`);
  }
  if (!p2Meta.audioCodec?.toLowerCase().includes('aac')) {
    throw new Error(`Project 2 audio codec is not AAC: ${p2Meta.audioCodec}`);
  }

  console.log('\n===============================================================');
  console.log('   ALL PIPELINE VALIDATION TESTS COMPLETED SUCCESSFULLY!');
  console.log('===============================================================\n');
}

runValidation().catch((err) => {
  console.error('Validation failed with error:', err);
  process.exit(1);
});
