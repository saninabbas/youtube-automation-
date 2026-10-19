/**
 * AUTORA.LIVE — Daily Blog Publishing CLI Daemon / Script
 *
 * Usage:
 *   npx tsx scripts/publish-daily-blog.ts
 *   npm run publish:blog
 *   npx tsx scripts/publish-daily-blog.ts --dry-run
 *   npx tsx scripts/publish-daily-blog.ts --force
 *   npx tsx scripts/publish-daily-blog.ts --day 1
 */

import fs from 'fs';
import path from 'path';

// Manually load .env
try {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      if (k && !process.env[k.trim()]) {
        process.env[k.trim()] = v.join('=').trim();
      }
    }
  });
} catch {}

import { publishDailyBlog } from '../src/lib/blog/publisher';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const dayIndexArg = args.indexOf('--day');
  const dayIndex = dayIndexArg !== -1 && args[dayIndexArg + 1] ? parseInt(args[dayIndexArg + 1], 10) : undefined;

  console.log('================================================================');
  console.log('   AUTORA.LIVE — AUTOMATED DAILY SEO BLOG PUBLISHER');
  console.log(`   Mode: ${dryRun ? 'DRY-RUN (Draft only)' : 'LIVE PUBLISHING'}`);
  console.log(`   Force Override: ${force ? 'YES' : 'NO'}`);
  if (dayIndex) console.log(`   Target Day: ${dayIndex}`);
  console.log('================================================================\n');

  try {
    const result = await publishDailyBlog({ dryRun, force, dayIndex });
    console.log('\n--- EXECUTION RESULT ---');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      if (result.skipped) {
        console.log('\n[INFO] Skipping: An article has already been published today.');
      } else {
        console.log(`\n[SUCCESS] Article ${result.dryRun ? 'drafted' : 'published'} at ${result.url}!`);
      }
      process.exit(0);
    } else {
      console.error(`\n[FAILED] Error: ${result.message}`);
      process.exit(1);
    }
  } catch (err: any) {
    console.error('\n[FATAL] Publishing execution failed:', err);
    process.exit(1);
  }
}

main();
