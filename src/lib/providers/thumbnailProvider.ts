import { execFile } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { getFfmpegPath } from './videoProvider';
import { storage } from '../storage';

const execFileAsync = util.promisify(execFile);

export interface ThumbnailParams {
  projectId: string;
  channelName: string;
  niche: string;
  title: string;
  visualStyle?: string;
}

export interface ThumbnailResult {
  storageKey: string;
  url: string;
  filePath: string;
  width: number;
  height: number;
  filesizeBytes: number;
}

export interface ThumbnailProvider {
  generateThumbnail(params: ThumbnailParams): Promise<ThumbnailResult>;
}

class DefaultThumbnailProvider implements ThumbnailProvider {
  async generateThumbnail(params: ThumbnailParams): Promise<ThumbnailResult> {
    const { projectId, channelName, niche, title, visualStyle = 'Cinematic High-Contrast' } = params;
    const ffmpegPath = getFfmpegPath();

    const tempDir = path.join(process.cwd(), 'temp', projectId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputKey = `thumbnails/${projectId}/thumbnail.png`;
    const outputPath = storage.getFilePath(outputKey);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Determine color schemes based on niche / visual style
    let bg1 = '#090a0f';
    let bg2 = '#1e293b';
    let accent = '#38bdf8';
    let tagBg = 'rgba(56, 189, 248, 0.15)';
    let tagBorder = 'rgba(56, 189, 248, 0.4)';

    const lowerNiche = niche.toLowerCase();
    const lowerStyle = visualStyle.toLowerCase();

    if (lowerNiche.includes('health') || lowerStyle.includes('emerald')) {
      bg1 = '#022c22';
      bg2 = '#064e3b';
      accent = '#34d399';
      tagBg = 'rgba(52, 211, 153, 0.15)';
      tagBorder = 'rgba(52, 211, 153, 0.4)';
    } else if (lowerNiche.includes('tech') || lowerNiche.includes('ai') || lowerStyle.includes('cyber')) {
      bg1 = '#090d16';
      bg2 = '#1e1b4b';
      accent = '#60a5fa';
      tagBg = 'rgba(96, 165, 250, 0.15)';
      tagBorder = 'rgba(96, 165, 250, 0.4)';
    } else if (lowerNiche.includes('business') || lowerNiche.includes('finance')) {
      bg1 = '#0a192f';
      bg2 = '#14532d';
      accent = '#facc15';
      tagBg = 'rgba(250, 204, 21, 0.15)';
      tagBorder = 'rgba(250, 204, 21, 0.4)';
    } else if (lowerNiche.includes('history') || lowerStyle.includes('vintage')) {
      bg1 = '#292524';
      bg2 = '#451a03';
      accent = '#f59e0b';
      tagBg = 'rgba(245, 158, 11, 0.15)';
      tagBorder = 'rgba(245, 158, 11, 0.4)';
    }

    // Split title into punchy 2-3 lines max for strong readability
    const words = title.trim().split(/\s+/);
    let line1 = '';
    let line2 = '';
    let line3 = '';

    if (words.length <= 4) {
      line1 = words.join(' ').toUpperCase();
    } else if (words.length <= 8) {
      const mid = Math.ceil(words.length / 2);
      line1 = words.slice(0, mid).join(' ').toUpperCase();
      line2 = words.slice(mid).join(' ').toUpperCase();
    } else {
      const third = Math.ceil(words.length / 3);
      line1 = words.slice(0, third).join(' ').toUpperCase();
      line2 = words.slice(third, third * 2).join(' ').toUpperCase();
      line3 = words.slice(third * 2).join(' ').toUpperCase();
    }

    // Escape XML entities
    const escapeXml = (str: string) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

    const safeTitle1 = escapeXml(line1);
    const safeTitle2 = escapeXml(line2);
    const safeTitle3 = escapeXml(line3);
    const safeChannel = escapeXml(channelName.toUpperCase());
    const safeNiche = escapeXml(niche.toUpperCase());

    const svgContent = `
<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}" />
      <stop offset="50%" stop-color="${bg2}" />
      <stop offset="100%" stop-color="#050608" />
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="20%" r="60%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1280" height="720" fill="url(#bgGrad)" />
  <rect width="1280" height="720" fill="url(#glow)" />

  <!-- Subtle Geometric Frame & Grid -->
  <line x1="80" y1="80" x2="1200" y2="80" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
  <line x1="80" y1="640" x2="1200" y2="640" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
  <line x1="80" y1="80" x2="80" y2="640" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
  <line x1="1200" y1="80" x2="1200" y2="640" stroke="rgba(255,255,255,0.08)" stroke-width="2" />

  <!-- Category & Channel Badge -->
  <g transform="translate(110, 130)">
    <rect width="200" height="38" rx="6" fill="${tagBg}" stroke="${tagBorder}" stroke-width="1.5" />
    <text x="100" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="${accent}" letter-spacing="1.5" text-anchor="middle">
      ${safeNiche}
    </text>
  </g>

  <!-- Channel Name Header -->
  <text x="330" y="155" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" fill="#9ca3af" letter-spacing="1">
    ${safeChannel}
  </text>

  <!-- Main Thumbnail Headlines (Bold, High-Contrast Typography) -->
  <g transform="translate(110, 260)">
    <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="58" font-weight="900" fill="#ffffff" letter-spacing="-1">
      ${safeTitle1}
    </text>
    ${
      safeTitle2
        ? `<text x="0" y="72" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="58" font-weight="900" fill="${accent}" letter-spacing="-1">
      ${safeTitle2}
    </text>`
        : ''
    }
    ${
      safeTitle3
        ? `<text x="0" y="144" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="54" font-weight="900" fill="#ffffff" letter-spacing="-1">
      ${safeTitle3}
    </text>`
        : ''
    }
  </g>

  <!-- Bottom Accent Bar -->
  <rect x="110" y="580" width="160" height="6" rx="3" fill="${accent}" />
  <text x="290" y="588" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#ffffff" letter-spacing="2">
    4K MASTERCLASS
  </text>
</svg>
`;

    const svgPath = path.join(tempDir, 'thumbnail.svg');
    await fs.promises.writeFile(svgPath, svgContent, 'utf8');

    // Use FFmpeg to rasterize SVG into crisp 1280x720 PNG
    const args = ['-y', '-i', svgPath, '-pix_fmt', 'rgba', outputPath];

    try {
      await execFileAsync(ffmpegPath, args);
    } catch (err) {
      // Fallback direct copy or pure color generation if svg rasterizer in FFmpeg needs simple lavfi
      const fallbackArgs = [
        '-y',
        '-f',
        'lavfi',
        '-i',
        `color=c=${bg2}:s=1280x720:d=1`,
        '-vframes',
        '1',
        outputPath,
      ];
      await execFileAsync(ffmpegPath, fallbackArgs);
    }

    const stat = await fs.promises.stat(outputPath);

    return {
      storageKey: outputKey,
      url: storage.getUrl(outputKey),
      filePath: outputPath,
      width: 1280,
      height: 720,
      filesizeBytes: stat.size,
    };
  }
}

export const thumbnailProvider: ThumbnailProvider = new DefaultThumbnailProvider();
