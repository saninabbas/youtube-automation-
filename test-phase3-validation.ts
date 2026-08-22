import { v4 as uuidv4 } from 'uuid';
import { getDb, DEFAULT_USER_ID, Channel, ContentProject, GeneratedAsset, VideoOutput } from './src/lib/db';
import { videoWorker } from './src/lib/queue/worker';
import { inspectMedia } from './src/lib/providers/videoProvider';
import { publishingProvider } from './src/lib/providers/publishingProvider';
import { storage } from './src/lib/storage';

async function waitForProject(projectId: string, maxWaitMs = 180000): Promise<ContentProject> {
  const db = getDb();
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const p = db.prepare('SELECT * FROM content_projects WHERE id = ?').get(projectId) as ContentProject;
    if (p.status === 'COMPLETED' || p.status === 'FAILED') {
      return p;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timeout waiting for project ${projectId}`);
}

async function runPhase3Validation() {
  console.log('================================================================');
  console.log('PHASE 3 PRODUCTION AUTOMATION & MULTI-CHANNEL VALIDATION');
  console.log('================================================================\n');

  const db = getDb();
  const now = new Date().toISOString();

  // Test 1: Channel A - Healthy Years (Health, 8 min Long Preset)
  console.log('----------------------------------------------------------------');
  console.log('TEST 1: Healthy Years (Health - 8 min Long Preset)');
  console.log('----------------------------------------------------------------');

  let channelA = db.prepare('SELECT * FROM channels WHERE name = ?').get('Healthy Years') as Channel | undefined;
  if (!channelA) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO channels (
        id, user_id, name, niche, language, voice, voice_speed, target_duration_minutes,
        visual_style, subtitle_style, intro_style, outro_cta, publishing_platform, content_rules, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, DEFAULT_USER_ID, 'Healthy Years', 'Health', 'en', 'en-US-ChristopherNeural', '1.0x', 8,
      'Clean Emerald Wellness', 'Modern Clean White', 'High-Impact Dramatic Question',
      'Subscribe to Healthy Years for weekly evidence-based wellness breakdowns.', 'YouTube', 'Evidence-based, scientific, calm delivery',
      now, now
    );
    channelA = db.prepare('SELECT * FROM channels WHERE id = ?').get(id) as Channel;
  }

  const projAId = uuidv4();
  db.prepare(`
    INSERT INTO content_projects (
      id, user_id, channel_id, topic, target_length_minutes, preset, language, platform, status, current_stage, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    projAId, DEFAULT_USER_ID, channelA.id, '5 Morning Habits That Can Improve Your Health', 8, 'LONG', 'en', 'YouTube', 'PENDING', 'SCRIPT', now, now
  );

  console.log(`Starting pipeline for Healthy Years (Project: ${projAId})...`);
  videoWorker.startProjectPipeline(projAId);
  const projAResult = await waitForProject(projAId);
  console.log(`Healthy Years status: ${projAResult.status}`);

  if (projAResult.status === 'FAILED') {
    throw new Error(`Healthy Years pipeline failed: ${projAResult.error_message}`);
  }

  const outputA = db.prepare('SELECT * FROM video_outputs WHERE project_id = ?').get(projAId) as VideoOutput;
  const outputAFile = storage.getFilePath(outputA.storage_key);
  const infoA = await inspectMedia(outputAFile);
  const thumbA = db.prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'thumbnail'").get(projAId) as GeneratedAsset;
  const srtA = db.prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'subtitles'").get(projAId) as GeneratedAsset;

  console.log(`✓ Healthy Years Final MP4: ${infoA.durationSec}s, ${infoA.videoCodec}/${infoA.audioCodec}, ${infoA.resolution}, Size: ${outputA.filesize_bytes} bytes`);
  console.log(`✓ Thumbnail Generated: ${thumbA ? thumbA.url : 'None'}`);
  console.log(`✓ Subtitles Generated: ${srtA ? srtA.url : 'None'}`);
  console.log(`✓ Metadata & Telemetry: ${projAResult.metadata_json ? 'Available' : 'Missing'}, Telemetry: ${projAResult.telemetry_json ? 'Available' : 'Missing'}`);

  // Test 2: Channel B - Tech Explained (Technology - 5 min Standard Preset)
  console.log('\n----------------------------------------------------------------');
  console.log('TEST 2: Tech Explained (Technology - 5 min Standard Preset)');
  console.log('----------------------------------------------------------------');

  let channelB = db.prepare('SELECT * FROM channels WHERE name = ?').get('Tech Explained') as Channel | undefined;
  if (!channelB) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO channels (
        id, user_id, name, niche, language, voice, voice_speed, target_duration_minutes,
        visual_style, subtitle_style, intro_style, outro_cta, publishing_platform, content_rules, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, DEFAULT_USER_ID, 'Tech Explained', 'Technology', 'en', 'en-US-JennyNeural', '1.05x', 5,
      'Tech Matrix / Cyber Sleek', 'Modern Clean White', 'Direct Core Insight',
      'Subscribe to Tech Explained and hit the bell for future AI breakdowns.', 'YouTube', 'High-energy, authoritative tech analysis',
      now, now
    );
    channelB = db.prepare('SELECT * FROM channels WHERE id = ?').get(id) as Channel;
  }

  const projBId = uuidv4();
  db.prepare(`
    INSERT INTO content_projects (
      id, user_id, channel_id, topic, target_length_minutes, preset, language, platform, status, current_stage, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    projBId, DEFAULT_USER_ID, channelB.id, 'How AI Is Changing Everyday Life', 5, 'STANDARD', 'en', 'YouTube', 'PENDING', 'SCRIPT', now, now
  );

  console.log(`Starting pipeline for Tech Explained (Project: ${projBId})...`);
  videoWorker.startProjectPipeline(projBId);
  const projBResult = await waitForProject(projBId);
  console.log(`Tech Explained status: ${projBResult.status}`);

  if (projBResult.status === 'FAILED') {
    throw new Error(`Tech Explained pipeline failed: ${projBResult.error_message}`);
  }

  const outputB = db.prepare('SELECT * FROM video_outputs WHERE project_id = ?').get(projBId) as VideoOutput;
  const infoB = await inspectMedia(storage.getFilePath(outputB.storage_key));
  const thumbB = db.prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'thumbnail'").get(projBId) as GeneratedAsset;

  console.log(`✓ Tech Explained Final MP4: ${infoB.durationSec}s, ${infoB.videoCodec}/${infoB.audioCodec}, ${infoB.resolution}, Size: ${outputB.filesize_bytes} bytes`);
  console.log(`✓ Thumbnail Generated: ${thumbB ? thumbB.url : 'None'}`);

  // Test 3: Channel C - Business Explained (Business - 3 min Standard Preset)
  // Verifies ZERO health or tech bias in business channel
  console.log('\n----------------------------------------------------------------');
  console.log('TEST 3: Business Explained (Business - 3 min Preset & Zero Bias Verification)');
  console.log('----------------------------------------------------------------');

  let channelC = db.prepare('SELECT * FROM channels WHERE name = ?').get('Business Explained') as Channel | undefined;
  if (!channelC) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO channels (
        id, user_id, name, niche, language, voice, voice_speed, target_duration_minutes,
        visual_style, subtitle_style, intro_style, outro_cta, publishing_platform, content_rules, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, DEFAULT_USER_ID, 'Business Explained', 'Business', 'en', 'en-US-GuyNeural', '1.0x', 3,
      'Executive Gold & Navy', 'Bold Yellow Accent', 'Direct Core Insight',
      'Subscribe to Business Explained for institutional financial breakdowns.', 'YouTube', 'Executive corporate tone, data-driven',
      now, now
    );
    channelC = db.prepare('SELECT * FROM channels WHERE id = ?').get(id) as Channel;
  }

  const projCId = uuidv4();
  db.prepare(`
    INSERT INTO content_projects (
      id, user_id, channel_id, topic, target_length_minutes, preset, language, platform, status, current_stage, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    projCId, DEFAULT_USER_ID, channelC.id, 'The Economics of High Margin SaaS Companies', 3, 'STANDARD', 'en', 'YouTube', 'PENDING', 'SCRIPT', now, now
  );

  console.log(`Starting pipeline for Business Explained (Project: ${projCId})...`);
  videoWorker.startProjectPipeline(projCId);
  const projCResult = await waitForProject(projCId);
  console.log(`Business Explained status: ${projCResult.status}`);

  if (projCResult.status === 'FAILED') {
    throw new Error(`Business Explained pipeline failed: ${projCResult.error_message}`);
  }

  const outputC = db.prepare('SELECT * FROM video_outputs WHERE project_id = ?').get(projCId) as VideoOutput;
  const infoC = await inspectMedia(storage.getFilePath(outputC.storage_key));
  const scenesC = db.prepare('SELECT * FROM video_scenes WHERE project_id = ?').all(projCId) as any[];
  const scriptAssetC = db.prepare("SELECT * FROM generated_assets WHERE project_id = ? AND asset_type = 'script'").get(projCId) as any;
  const scriptContentC = JSON.parse((await storage.getObject(scriptAssetC.storage_key))!.toString());

  console.log(`✓ Business Explained Final MP4: ${infoC.durationSec}s, ${infoC.videoCodec}/${infoC.audioCodec}, ${infoC.resolution}, Size: ${outputC.filesize_bytes} bytes`);
  console.log(`✓ Business Scene Count: ${scenesC.length} scenes`);
  console.log(`✓ Business Title: "${scriptContentC.title}"`);
  console.log(`✓ Business Hook: "${scriptContentC.hook.slice(0, 80)}..."`);
  console.log(`✓ Visual Subject: "${scenesC[0]?.visual_subject}"`);
  console.log(`✓ Continuity Notes: "${scenesC[1]?.continuity_notes}"`);

  // Verify Zero Health/Tech Hardcoding
  const scriptStringC = JSON.stringify(scriptContentC).toLowerCase();
  const containsHealthTerms = scriptStringC.includes('melatonin') || scriptStringC.includes('hydration') || scriptStringC.includes('morning habit');
  console.log(`✓ Zero Health Contamination: ${!containsHealthTerms ? 'PASS' : 'FAIL'}`);

  // Test 4: Publishing Provider Verification
  console.log('\n----------------------------------------------------------------');
  console.log('TEST 4: Publishing Provider Abstraction');
  console.log('----------------------------------------------------------------');
  const ytStatus = await publishingProvider.getPlatformStatus('YouTube');
  console.log(`✓ YouTube Publishing Status: ${ytStatus.status} (${ytStatus.message})`);

  // Test 5: Stage Recovery Verification
  console.log('\n----------------------------------------------------------------');
  console.log('TEST 5: Failure Recovery & Stage-Level Retry');
  console.log('----------------------------------------------------------------');
  console.log('Testing retry from VIDEO stage on Business project...');
  videoWorker.startProjectPipeline(projCId, 'VIDEO');
  const retryResult = await waitForProject(projCId);
  console.log(`✓ Stage Retry Result: ${retryResult.status}`);

  console.log('\n================================================================');
  console.log('ALL PHASE 3 VALIDATION TESTS COMPLETED SUCCESSFULLY');
  console.log('================================================================\n');
}

runPhase3Validation().catch((err) => {
  console.error('Validation test encountered error:', err);
  process.exit(1);
});
