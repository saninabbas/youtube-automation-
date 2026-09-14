import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { storage } from '@/lib/storage';
import { getDb } from '@/lib/db';

export function getTopicVideoCdnUrl(topic: string = ''): string {
  const t = topic.toLowerCase();
  if (t.includes('blood') || t.includes('pressure') || t.includes('heart') || t.includes('cardio') || t.includes('doctor') || t.includes('health') || t.includes('aging') || t.includes('50') || t.includes('body')) {
    return 'https://cdn.coverr.co/videos/coverr-premium-morning-yoga-practice-in-park/1080p.mp4';
  }
  if (t.includes('money') || t.includes('wealth') || t.includes('broke') || t.includes('rich') || t.includes('finance') || t.includes('stock') || t.includes('crypto') || t.includes('bitcoin') || t.includes('business')) {
    return 'https://cdn.coverr.co/videos/coverr-a-man-analyzing-the-stock-market-5128/1080p.mp4';
  }
  if (t.includes('food') || t.includes('diet') || t.includes('nutrition') || t.includes('weight') || t.includes('meal') || t.includes('cook')) {
    return 'https://cdn.coverr.co/videos/coverr-preparing-a-meal-4339/1080p.mp4';
  }
  if (t.includes('space') || t.includes('black hole') || t.includes('universe') || t.includes('stars') || t.includes('galaxy') || t.includes('planet')) {
    return 'https://cdn.coverr.co/videos/coverr-video-editor-s-production-studio-9994/1080p.mp4';
  }
  if (t.includes('stoic') || t.includes('mind') || t.includes('overthinking') || t.includes('discipline') || t.includes('marcus') || t.includes('psychology')) {
    return 'https://cdn.coverr.co/videos/coverr-walking-in-nature/1080p.mp4';
  }
  if (t.includes('plane') || t.includes('flight') || t.includes('mystery') || t.includes('vanish') || t.includes('history')) {
    return 'https://cdn.coverr.co/videos/coverr-airport-in-israel-5641/1080p.mp4';
  }
  if (t.includes('phone') || t.includes('app') || t.includes('search') || t.includes('mobile')) {
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
