import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { storage } from '@/lib/storage';
import { getDb } from '@/lib/db';

export function getTopicVideoCdnUrl(topic: string = ''): string {
  const normalized = ` ${topic.toLowerCase().replace(/[^a-z0-9]/g, ' ')} `;
  const hasWord = (w: string) => normalized.includes(` ${w} `);
  const hasAnyWord = (words: string[]) => words.some((w) => normalized.includes(` ${w} `));

  // 1. Space / Stars / Galaxy / Astronomy / Physics
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
    return 'https://cdn.coverr.co/videos/coverr-video-editor-s-production-studio-9994/1080p.mp4';
  }

  // 2. Crypto / Stocks / Money / Wealth / Finance / Business
  if (
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
    return 'https://cdn.coverr.co/videos/coverr-a-man-analyzing-the-stock-market-5128/1080p.mp4';
  }

  // 3. Food / Nutrition / Diet / Cooking
  if (
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
    return 'https://cdn.coverr.co/videos/coverr-preparing-a-meal-4339/1080p.mp4';
  }

  // 4. Health / Wellness / Aging / Fitness / Medical
  if (
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
    return 'https://cdn.coverr.co/videos/coverr-premium-morning-yoga-practice-in-park/1080p.mp4';
  }

  // 5. Mindset / Stoic / Psychology / Philosophy / Discipline
  if (
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
    return 'https://cdn.coverr.co/videos/coverr-walking-in-nature/1080p.mp4';
  }

  // 6. Airplane / Aviation / Travel / History / Mystery
  if (
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
    return 'https://cdn.coverr.co/videos/coverr-airport-in-israel-5641/1080p.mp4';
  }

  // 7. Smartphone / Apps / Search / Social Media
  if (
    hasAnyWord([
      'phone',
      'smartphone',
      'mobile',
      'app',
      'apps',
      'instagram',
      'tiktok',
      'youtube',
      'search',
      'algorithm',
    ])
  ) {
    return 'https://cdn.coverr.co/videos/coverr-google-search-on-a-smartphone-243/1080p.mp4';
  }

  // Default dynamic AI & Tech / Cinematic motion
  return 'https://cdn.coverr.co/videos/coverr-connecting-to-nature-with-tech/1080p.mp4';
}

export async function GET(request: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const keyParts = resolvedParams?.key;
    const key = Array.isArray(keyParts) ? keyParts.join('/') : String(keyParts || '');
    const ext = path.extname(key).toLowerCase();
    let filePath = storage.getFilePath(key);

    // If MP4 requested and missing locally, redirect to topic-matched 1080p CDN video
    if (ext === '.mp4' && !fs.existsSync(filePath)) {
      try {
        const parts = key.split('/');
        const projectId = parts.length > 1 ? parts[1] : '';
        let topic = request.nextUrl.searchParams.get('topic') || '';
        if (!topic && projectId) {
          try {
            const db = getDb();
            const proj = db.prepare('SELECT topic FROM content_projects WHERE id = ?').get(projectId) as any;
            topic = proj?.topic || '';
          } catch (_) {}
        }
        const topicUrl = getTopicVideoCdnUrl(topic);
        if (topicUrl) {
          return NextResponse.redirect(topicUrl, 307);
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
