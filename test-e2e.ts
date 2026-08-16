import { getDb, DEFAULT_USER_ID } from './src/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { videoWorker } from './src/lib/queue/worker';
import { storage } from './src/lib/storage';
import fs from 'fs';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForProject(projectId: string, maxWaitMs = 120000) {
  const db = getDb();
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const project: any = db.prepare('SELECT * FROM content_projects WHERE id = ?').get(projectId);
    const stages: any[] = db.prepare('SELECT * FROM video_jobs WHERE project_id = ?').all(projectId);
    
    console.log(`[Status Check] Project "${project.topic}": status=${project.status}, stage=${project.current_stage}`);
    for (const s of stages) {
      console.log(`   - Stage ${s.stage}: ${s.status} ${s.error_message ? `(Error: ${s.error_message})` : ''}`);
    }

    if (project.status === 'COMPLETED') {
      console.log(`>>> PROJECT ${projectId} COMPLETED SUCCESSFULLY! <<<`);
      return project;
    }
    if (project.status === 'FAILED') {
      throw new Error(`Project failed at stage ${project.current_stage}: ${project.error_message}`);
    }

    await sleep(3000);
  }
  throw new Error(`Timeout waiting for project ${projectId}`);
}

async function runEndToEndTests() {
  console.log('=== STARTING END-TO-END VERIFICATION ===\n');
  const db = getDb();

  // Test 1: Channel "Healthy Years"
  console.log('--- TEST 1: Healthy Years (Health Niche) ---');
  const channel1Id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO channels (id, user_id, name, niche, language, voice, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(channel1Id, DEFAULT_USER_ID, 'Healthy Years', 'Health', 'en', 'en-US-ChristopherNeural', now, now);

  const project1Id = uuidv4();
  db.prepare(`
    INSERT INTO content_projects (id, user_id, channel_id, topic, target_length_minutes, language, status, current_stage, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(project1Id, DEFAULT_USER_ID, channel1Id, '5 Morning Habits That Can Improve Your Health', 8, 'en', 'PENDING', 'SCRIPT', now, now);

  console.log(`Queuing video generation for Project 1 (${project1Id})...`);
  videoWorker.startProjectPipeline(project1Id);
  await waitForProject(project1Id);

  // Inspect Project 1 Outputs
  const p1Output: any = db.prepare('SELECT * FROM video_outputs WHERE project_id = ?').get(project1Id);
  const p1Scenes: any[] = db.prepare('SELECT * FROM video_scenes WHERE project_id = ?').all(project1Id);
  const p1Assets: any[] = db.prepare('SELECT * FROM generated_assets WHERE project_id = ?').all(project1Id);

  console.log(`\nProject 1 Results:`);
  console.log(`- Total Scenes: ${p1Scenes.length}`);
  console.log(`- Total Assets: ${p1Assets.length}`);
  console.log(`- Final MP4 Path: ${storage.getFilePath(p1Output.storage_key)}`);
  console.log(`- Final MP4 Size: ${(p1Output.filesize_bytes / 1024).toFixed(2)} KB`);
  console.log(`- Final MP4 Exists on Disk: ${fs.existsSync(storage.getFilePath(p1Output.storage_key))}`);
  if (!fs.existsSync(storage.getFilePath(p1Output.storage_key))) {
    throw new Error('Project 1 MP4 file does not exist on disk!');
  }

  // Test 2: Channel "Tech Explained"
  console.log('\n--- TEST 2: Tech Explained (Technology Niche) ---');
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

  console.log(`Queuing video generation for Project 2 (${project2Id})...`);
  videoWorker.startProjectPipeline(project2Id);
  await waitForProject(project2Id);

  // Inspect Project 2 Outputs
  const p2Output: any = db.prepare('SELECT * FROM video_outputs WHERE project_id = ?').get(project2Id);
  const p2Scenes: any[] = db.prepare('SELECT * FROM video_scenes WHERE project_id = ?').all(project2Id);
  const p2Assets: any[] = db.prepare('SELECT * FROM generated_assets WHERE project_id = ?').all(project2Id);

  console.log(`\nProject 2 Results:`);
  console.log(`- Total Scenes: ${p2Scenes.length}`);
  console.log(`- Total Assets: ${p2Assets.length}`);
  console.log(`- Final MP4 Path: ${storage.getFilePath(p2Output.storage_key)}`);
  console.log(`- Final MP4 Size: ${(p2Output.filesize_bytes / 1024).toFixed(2)} KB`);
  console.log(`- Final MP4 Exists on Disk: ${fs.existsSync(storage.getFilePath(p2Output.storage_key))}`);
  if (!fs.existsSync(storage.getFilePath(p2Output.storage_key))) {
    throw new Error('Project 2 MP4 file does not exist on disk!');
  }

  console.log('\n=== ALL END-TO-END MULTI-CHANNEL TESTS PASSED SUCCESSFULLY! ===');
}

runEndToEndTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
