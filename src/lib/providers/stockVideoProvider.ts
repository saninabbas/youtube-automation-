import { execFile } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { getFfmpegPath } from './videoProvider';
import { getApiKey } from '../db';

const execFileAsync = util.promisify(execFile);

export interface StockVideoMatch {
  url: string;
  width: number;
  height: number;
  duration: number;
}

export class StockVideoEngine {
  private sanitize(str: string): string {
    return str.replace(/[:\\'%]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Extract clean keywords for video search from visual prompt
  public extractSearchKeywords(prompt: string, niche: string): string[] {
    const clean = prompt
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .replace(/\b(scene|clip|shot|high|definition|cinematic|lighting|context|modern|ultra|resolution|8k|4k|photo|photography|visual|style|contrast|focus|view|background|foreground)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = clean.split(' ').filter((w) => w.length > 3);
    const candidates: string[] = [];

    // 1. Two-word keyword phrase
    if (words.length >= 2) {
      candidates.push(`${words[0]} ${words[1]}`);
    }

    // 2. Single core keywords
    for (const w of words.slice(0, 3)) {
      candidates.push(w);
    }

    // 3. Niche fallback keyword
    const nicheClean = niche.toLowerCase().split(' ')[0];
    if (nicheClean && !candidates.includes(nicheClean)) {
      candidates.push(nicheClean);
    }

    return candidates;
  }

  // Search Coverr.co open 1080p stock video catalog with index offset for distinct clips
  async searchCoverrVideo(query: string, clipOffset: number = 0): Promise<string | null> {
    try {
      const url = `https://coverr.co/api/videos?query=${encodeURIComponent(query)}&page=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });

      if (res.ok) {
        const data: any = await res.json();
        if (data.hits && data.hits.length > 0) {
          const hit = data.hits[clipOffset % data.hits.length] || data.hits[0];
          if (hit.base_filename) {
            return `https://cdn.coverr.co/videos/${hit.base_filename}/1080p.mp4`;
          }
        }
      }
    } catch (err: any) {
      console.warn(`[StockVideo] Coverr search error: ${err.message}`);
    }
    return null;
  }

  // Search Pexels Video API with offset
  async searchPexelsVideo(query: string, clipOffset: number = 0, apiKey?: string): Promise<string | null> {
    const token = apiKey || getApiKey('pexels_api_key') || process.env.PEXELS_API_KEY;
    if (!token) return null;

    try {
      const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape&size=medium`;
      const res = await fetch(url, {
        headers: {
          Authorization: token,
          'User-Agent': 'Mozilla/5.0 AutoVideo/1.0',
        },
      });

      if (res.ok) {
        const data: any = await res.json();
        if (data.videos && data.videos.length > 0) {
          const vid = data.videos[clipOffset % data.videos.length] || data.videos[0];
          const file = vid.video_files?.find((f: any) => f.quality === 'hd' && f.width >= 1280) || vid.video_files?.[0];
          if (file?.link) {
            return file.link;
          }
        }
      }
    } catch (err: any) {
      console.warn(`[StockVideo] Pexels search failed (${err.message})`);
    }
    return null;
  }

  // Search Pixabay Video API
  async searchPixabayVideo(query: string, clipOffset: number = 0, apiKey?: string): Promise<string | null> {
    const key = apiKey || getApiKey('pixabay_api_key') || process.env.PIXABAY_API_KEY;
    if (!key) return null;

    try {
      const url = `https://pixabay.com/api/videos/?key=${key}&q=${encodeURIComponent(query)}&per_page=10`;
      const res = await fetch(url);
      if (res.ok) {
        const data: any = await res.json();
        if (data.hits && data.hits.length > 0) {
          const hit = data.hits[clipOffset % data.hits.length] || data.hits[0];
          const vidUrl = hit.videos?.large?.url || hit.videos?.medium?.url || hit.videos?.small?.url;
          if (vidUrl) {
            return vidUrl;
          }
        }
      }
    } catch (err: any) {
      console.warn(`[StockVideo] Pixabay search failed (${err.message})`);
    }
    return null;
  }

  // Find real stock video footage with distinct offset (Coverr HD -> Pexels HD -> Pixabay HD)
  async findStockVideo(queries: string[] | string, clipOffset: number = 0): Promise<string | null> {
    const queryList = Array.isArray(queries) ? queries : [queries];

    for (const q of queryList) {
      if (!q || q.length < 2) continue;

      // 1. Try Coverr HD Catalog (100% Free, high quality 1080p live action)
      const coverrUrl = await this.searchCoverrVideo(q, clipOffset);
      if (coverrUrl) return coverrUrl;

      // 2. Try Pexels HD Video
      const pexelsUrl = await this.searchPexelsVideo(q, clipOffset);
      if (pexelsUrl) return pexelsUrl;

      // 3. Try Pixabay HD Video
      const pixabayUrl = await this.searchPixabayVideo(q, clipOffset);
      if (pixabayUrl) return pixabayUrl;
    }

    return null;
  }

  // Download stock video and render into trimmed/scaled 1080p scene (30fps CFR + strip audio)
  async renderStockVideoScene(params: {
    videoUrl: string;
    durationSec: number;
    outputPath: string;
    sceneIndex: number;
    headline: string;
    niche: string;
    accent: string;
  }): Promise<void> {
    const { videoUrl, durationSec, outputPath, sceneIndex } = params;
    const ffmpegPath = getFfmpegPath();
    const tempDir = path.dirname(outputPath);
    const rand = Math.random().toString(36).substring(2, 7);
    const tempStockMp4 = path.join(tempDir, `stock_dl_${sceneIndex}_${rand}.mp4`);

    try {
      // 1. Download the real video clip
      const res = await fetch(videoUrl);
      if (!res.ok) throw new Error(`Stock video download HTTP ${res.status}`);
      const arrayBuf = await res.arrayBuffer();
      await fs.promises.writeFile(tempStockMp4, Buffer.from(arrayBuf));

      // 2. Process with FFmpeg (scale, crop to 1920x1080, force 30fps CFR, strip audio, clean full-screen footage)
      const filterGraph = [
        `scale=1920:1080:force_original_aspect_ratio=increase`,
        `crop=1920:1080`,
        `setsar=1`,
      ].join(',');

      await execFileAsync(ffmpegPath, [
        '-y',
        '-stream_loop',
        '-1',
        '-i',
        tempStockMp4,
        '-an',
        '-vf',
        filterGraph,
        '-r',
        '30',
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-preset',
        'ultrafast',
        '-t',
        String(durationSec),
        outputPath,
      ]);
    } finally {
      if (fs.existsSync(tempStockMp4)) {
        await fs.promises.unlink(tempStockMp4).catch(() => {});
      }
    }
  }
}

export const stockVideoEngine = new StockVideoEngine();
