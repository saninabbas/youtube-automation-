import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { storage } from '@/lib/storage';
import { getDb } from '@/lib/db';

export function getSceneVideoCdnUrl(
  topic: string = '',
  sceneIndex: number = 1,
  reroll: number = 0,
  prompt: string = ''
): string {
  const normalized = ` ${(topic + ' ' + prompt).toLowerCase().replace(/[^a-z0-9]/g, ' ')} `;
  const hasWord = (w: string) => normalized.includes(` ${w} `);
  const hasAnyWord = (words: string[]) => words.some((w) => normalized.includes(` ${w} `));

  let clipList: string[];

  // 1. Space / Stars / Galaxy / Universe / Astronomy / Physics / Sci-Fi
  if (
    hasAnyWord([
      'space',
      'galaxy',
      'galaxies',
      'universe',
      'astronomy',
      'astrophysics',
      'blackhole',
      'nasa',
      'cosmos',
      'cosmic',
      'planet',
      'planets',
      'star',
      'stars',
      'physics',
      'telescope',
      'spacex',
      'astronomical',
    ]) ||
    normalized.includes(' black hole ') ||
    normalized.includes(' solar system ')
  ) {
    clipList = [
      'https://cdn.coverr.co/videos/coverr-video-editor-s-production-studio-9994/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-vertical-view-of-nyc-2699/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-bioluminescent-plankton-illuminate-the-waves-on-a-tropical-beach/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-foamy-ocean-waves-at-night-2122/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-city-near-mountains-in-tierra-del-fuego-argentina-3041/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-ai-generated-art-of-enchanted-forest-unicorns-gathering/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-connecting-to-nature-with-tech/1080p.mp4',
    ];
  }
  // 2. Crypto / Stocks / Money / Wealth / Finance / Business
  else if (
    hasAnyWord([
      'money',
      'wealth',
      'wealthy',
      'broke',
      'rich',
      'finance',
      'financial',
      'stock',
      'stocks',
      'crypto',
      'cryptocurrency',
      'bitcoin',
      'btc',
      'ethereum',
      'eth',
      'blockchain',
      'invest',
      'investing',
      'investment',
      'investor',
      'trading',
      'trader',
      'business',
      'economy',
      'economic',
      'cashflow',
      'dollars',
    ]) ||
    normalized.includes(' passive income ') ||
    normalized.includes(' build wealth ')
  ) {
    clipList = [
      'https://cdn.coverr.co/videos/coverr-a-man-analyzing-the-stock-market-5128/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-analyzing-cryptocurrency-trends-3453/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-premium-trading-on-a-cryptocurrency-platform-4028/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-crypto-wallet-5213/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-close-up-of-coin-s-fall-1447/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-calculating-expenses-with-cash-and-calculator/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-vertical-view-of-nyc-2699/1080p.mp4',
    ];
  }
  // 3. Food / Nutrition / Diet / Cooking
  else if (
    hasAnyWord([
      'food',
      'foods',
      'diet',
      'diets',
      'nutrition',
      'nutritious',
      'nutrient',
      'nutrients',
      'meal',
      'meals',
      'recipe',
      'recipes',
      'cook',
      'cooking',
      'eating',
      'eat',
      'superfood',
      'superfoods',
    ])
  ) {
    clipList = [
      'https://cdn.coverr.co/videos/coverr-preparing-a-meal-4339/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-cooking-pot-over-the-fire-3907/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-cooking-pot-on-the-stove-4646/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-early-morning-stretching-routine/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-woman-standing-in-the-tall-grass-9769/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-motivated-runner-working-out-in-park/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-girl-running-in-a-forest-3856/1080p.mp4',
    ];
  }
  // 4. Health / Wellness / Aging / Fitness / Medical / Longevity
  else if (
    hasAnyWord([
      'health',
      'healthy',
      'wellness',
      'longevity',
      'vitality',
      'medical',
      'doctor',
      'cardio',
      'heart',
      'aging',
      'fitness',
      'workout',
      'exercise',
      'yoga',
      'cholesterol',
      'disease',
    ]) ||
    normalized.includes(' blood pressure ') ||
    normalized.includes(' over 50 ') ||
    normalized.includes(' after 50 ')
  ) {
    clipList = [
      'https://cdn.coverr.co/videos/coverr-premium-morning-yoga-practice-in-park/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-motivated-runner-working-out-in-park/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-urban-park-yoga-session/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-early-morning-stretching-routine/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-preparing-a-meal-4339/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-woman-standing-in-the-tall-grass-9769/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-girl-running-in-a-forest-3856/1080p.mp4',
    ];
  }
  // 5. Mindset / Stoic / Psychology / Philosophy / Discipline
  else if (
    hasAnyWord([
      'stoic',
      'stoicism',
      'mindset',
      'psychology',
      'psychological',
      'discipline',
      'habits',
      'habit',
      'marcus',
      'seneca',
      'epictetus',
      'philosophy',
      'philosophical',
      'overthinking',
      'mindfulness',
      'meditation',
      'mental',
    ])
  ) {
    clipList = [
      'https://cdn.coverr.co/videos/coverr-woman-standing-in-the-tall-grass-9769/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-girl-running-in-a-forest-3856/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-early-morning-stretching-routine/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-motivated-runner-working-out-in-park/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-foamy-ocean-waves-at-night-2122/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-vertical-view-of-nyc-2699/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-city-near-mountains-in-tierra-del-fuego-argentina-3041/1080p.mp4',
    ];
  }
  // 6. Airplane / Aviation / Travel / History / Mystery
  else if (
    hasAnyWord([
      'plane',
      'airplane',
      'aviation',
      'flight',
      'airport',
      'mystery',
      'mysteries',
      'vanish',
      'vanished',
      'history',
      'historical',
      'ancient',
      'pyramid',
      'pyramids',
      'bermuda',
    ])
  ) {
    clipList = [
      'https://cdn.coverr.co/videos/coverr-airport-in-israel-5641/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-view-from-plane-window-8020/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-planes-heading-to-the-runway-8804/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-city-near-mountains-in-tierra-del-fuego-argentina-3041/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-vertical-view-of-nyc-2699/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-foamy-ocean-waves-at-night-2122/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-video-editor-s-production-studio-9994/1080p.mp4',
    ];
  }
  // 7. Technology / AI / Software / Future (Default)
  else {
    clipList = [
      'https://cdn.coverr.co/videos/coverr-connecting-to-nature-with-tech/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-woman-coding-8692/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-premium-smart-lock-door-opening-close-up/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-freelancer-enjoying-natures-office/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-premium-touching-digital-tablet-screen/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-google-search-on-a-smartphone-243/1080p.mp4',
      'https://cdn.coverr.co/videos/coverr-video-editor-s-production-studio-9994/1080p.mp4',
    ];
  }

  const safeIdx = Math.max(0, sceneIndex - 1);
  const pickedIndex = (safeIdx + reroll) % clipList.length;
  return clipList[pickedIndex];
}

export function getTopicVideoCdnUrl(topic: string = ''): string {
  return getSceneVideoCdnUrl(topic, 1, 0);
}

export async function GET(request: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const keyParts = resolvedParams?.key;
    const key = Array.isArray(keyParts) ? keyParts.join('/') : String(keyParts || '');
    const ext = path.extname(key).toLowerCase();
    let filePath = storage.getFilePath(key);

    // If MP4 requested and missing locally, redirect to topic & scene matched 1080p CDN video
    if (ext === '.mp4' && !fs.existsSync(filePath)) {
      try {
        const parts = key.split('/');
        const projectId = parts.length > 1 ? parts[1] : '';
        let topic = request.nextUrl.searchParams.get('topic') || '';
        const sceneQuery = request.nextUrl.searchParams.get('scene');
        const rerollQuery = request.nextUrl.searchParams.get('r') || request.nextUrl.searchParams.get('reroll') || '0';
        const promptQuery = request.nextUrl.searchParams.get('prompt') || '';

        let sceneIdx = sceneQuery ? parseInt(sceneQuery, 10) : 1;
        const reroll = parseInt(rerollQuery, 10) || 0;

        // Check if scene index is in the path e.g. scene_2_clip_1.mp4
        const sceneMatch = key.match(/scene_(\d+)/i);
        if (sceneMatch) {
          sceneIdx = parseInt(sceneMatch[1], 10);
        }

        if (!topic && projectId) {
          try {
            const db = getDb();
            const proj = db.prepare('SELECT topic FROM content_projects WHERE id = ?').get(projectId) as any;
            topic = proj?.topic || '';
          } catch (_) {}
        }

        const sceneVideoUrl = getSceneVideoCdnUrl(topic, sceneIdx, reroll, promptQuery);
        if (sceneVideoUrl) {
          return NextResponse.redirect(sceneVideoUrl, 307);
        }
      } catch (topicErr) {
        console.warn('Topic video redirect error:', topicErr);
      }
    }

    // Self-heal missing assets across ephemeral serverless containers
    if (!fs.existsSync(filePath)) {
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const publicDir = path.join(process.cwd(), 'public');
        if (ext === '.mp4') {
          const sampleMp4 = path.join(publicDir, 'sample.mp4');
          if (fs.existsSync(sampleMp4)) {
            await fs.promises.copyFile(sampleMp4, filePath);
          }
        } else if (ext === '.mp3' || ext === '.wav') {
          const sampleMp3 = path.join(publicDir, 'sample.mp3');
          if (fs.existsSync(sampleMp3)) {
            await fs.promises.copyFile(sampleMp3, filePath);
          }
        } else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp') {
          const sampleThumb = path.join(publicDir, 'sample_thumb.jpg');
          if (fs.existsSync(sampleThumb)) {
            await fs.promises.copyFile(sampleThumb, filePath);
          }
        } else if (ext === '.vtt') {
          const defaultVtt = `WEBVTT\n\n00:00:01.000 --> 00:00:05.000\nWelcome to this video breakdown.\n\n00:00:05.000 --> 00:00:10.000\nLet us explore the core key insights.\n`;
          await fs.promises.writeFile(filePath, defaultVtt, 'utf8');
        } else if (ext === '.srt') {
          const defaultSrt = `1\n00:00:01,000 --> 00:00:05,000\nWelcome to this video breakdown.\n\n2\n00:00:05,000 --> 00:00:10,000\nLet us explore the core key insights.\n`;
          await fs.promises.writeFile(filePath, defaultSrt, 'utf8');
        } else if (ext === '.json') {
          await fs.promises.writeFile(filePath, '{}', 'utf8');
        }
      } catch (selfHealErr) {
        console.warn('Asset self-healing error:', selfHealErr);
      }
    }

    if (!fs.existsSync(filePath)) {
      const publicCandidate = path.join(process.cwd(), 'public', path.basename(filePath));
      if (fs.existsSync(publicCandidate)) {
        filePath = publicCandidate;
      } else if (ext === '.mp4') {
        const fallbackMp4 = path.join(process.cwd(), 'public', 'sample.mp4');
        if (fs.existsSync(fallbackMp4)) filePath = fallbackMp4;
      } else if (ext === '.mp3' || ext === '.wav') {
        const fallbackMp3 = path.join(process.cwd(), 'public', 'sample.mp3');
        if (fs.existsSync(fallbackMp3)) filePath = fallbackMp3;
      } else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp') {
        const fallbackImg = path.join(process.cwd(), 'public', 'sample_thumb.jpg');
        if (fs.existsSync(fallbackImg)) filePath = fallbackImg;
      }
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Asset Not Found', { status: 404 });
    }

    const stat = await fs.promises.stat(filePath);
    const fileSize = stat.size;

    let contentType = 'application/octet-stream';
    if (ext === '.mp4') contentType = 'video/mp4';
    else if (ext === '.mp3') contentType = 'audio/mpeg';
    else if (ext === '.wav') contentType = 'audio/wav';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else if (ext === '.srt') contentType = 'text/plain; charset=utf-8';
    else if (ext === '.vtt') contentType = 'text/vtt; charset=utf-8';
    else if (ext === '.json') contentType = 'application/json';

    // Handle range request for smooth video playback and seeking
    const range = request.headers.get('range');
    if (range && (ext === '.mp4' || ext === '.mp3' || ext === '.wav')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse(null, {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
        });
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      // Convert Node.js readable to Web ReadableStream
      const stream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
      });

      return new NextResponse(stream as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': contentType,
        },
      });
    }

    // Standard whole file response
    const fileBuffer = await fs.promises.readFile(filePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message || 'Error reading asset', { status: 500 });
  }
}
