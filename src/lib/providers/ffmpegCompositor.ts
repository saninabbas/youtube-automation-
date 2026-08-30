import { execFile } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { getFfmpegPath, inspectMedia } from './videoProvider';
import { storage } from '../storage';

const execFileAsync = util.promisify(execFile);

export interface CompositionParams {
  projectId: string;
  clipFilePaths: string[];
  audioFilePath: string;
  subtitleFilePath?: string;
  totalDurationSec: number;
}

export interface CompositionResult {
  storageKey: string;
  url: string;
  filePath: string;
  durationSec: number;
  resolution: string;
  filesizeBytes: number;
  videoCodec: string;
  audioCodec: string;
}

export class FfmpegCompositor {
  async composeVideo(params: {
    projectId: string;
    clipFilePaths: string[];
    audioFilePath: string;
    subtitleFilePath?: string;
    totalDurationSec: number;
  }): Promise<CompositionResult> {
    const { projectId, clipFilePaths, audioFilePath } = params;
    const ffmpegPath = getFfmpegPath();

    if (!clipFilePaths || clipFilePaths.length === 0) {
      throw new Error('No video clips provided for FFmpeg composition.');
    }

    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found at: ${audioFilePath}`);
    }

    // Verify all input clips exist
    for (const clipPath of clipFilePaths) {
      if (!fs.existsSync(clipPath)) {
        throw new Error(`Video clip segment not found on disk: ${clipPath}`);
      }
    }

    const tempDir = path.join(process.cwd(), 'temp', projectId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 1. Create ffmpeg concat list file
    const concatListPath = path.join(tempDir, 'concat_list.txt');
    const concatContent = clipFilePaths
      .map((filePath) => {
        const normalized = filePath.replace(/\\/g, '/');
        return `file '${normalized}'`;
      })
      .join('\n');

    await fs.promises.writeFile(concatListPath, concatContent, 'utf8');

    // Output target
    const finalKey = `final/${projectId}/output.mp4`;
    const finalFilePath = storage.getFilePath(finalKey);
    const finalDir = path.dirname(finalFilePath);
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }

    // FFmpeg execution arguments
    // Concat video demuxer + Audio input + AAC audio + H.264 video + FastStart MP4 container
    const args: string[] = [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatListPath,
      '-i',
      audioFilePath,
      '-r',
      '30',
      '-c:v',
      'libx264',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-pix_fmt',
      'yuv420p',
      '-preset',
      'ultrafast',
      '-movflags',
      '+faststart',
      '-shortest',
      finalFilePath,
    ];

    try {
      await execFileAsync(ffmpegPath, args);
    } catch (err: any) {
      console.error('Primary FFmpeg composition error:', err);
      // Fallback merge
      const fallbackArgs: string[] = [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        concatListPath,
        '-i',
        audioFilePath,
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-movflags',
        '+faststart',
        finalFilePath,
      ];
      await execFileAsync(ffmpegPath, fallbackArgs);
    }

    // 2. Strict FFmpeg Metadata & Stream Inspection
    if (!fs.existsSync(finalFilePath)) {
      throw new Error(`FFmpeg failed: output file was not created at ${finalFilePath}`);
    }

    const stat = await fs.promises.stat(finalFilePath);
    if (stat.size === 0) {
      throw new Error('FFmpeg failed: output file is 0 bytes.');
    }

    const meta = await inspectMedia(finalFilePath);
    if (!meta.isValid || meta.durationSec <= 0) {
      throw new Error(`FFmpeg validation failed: Invalid video duration (${meta.durationSec}s)`);
    }

    if (!meta.videoCodec || !meta.videoCodec.toLowerCase().includes('h264')) {
      throw new Error(`FFmpeg validation failed: Video codec is "${meta.videoCodec}", expected "h264"`);
    }

    if (!meta.audioCodec || !meta.audioCodec.toLowerCase().includes('aac')) {
      throw new Error(`FFmpeg validation failed: Audio codec is "${meta.audioCodec}", expected "aac"`);
    }

    return {
      storageKey: finalKey,
      url: storage.getUrl(finalKey),
      filePath: finalFilePath,
      durationSec: meta.durationSec,
      resolution: meta.resolution || '1920x1080',
      filesizeBytes: stat.size,
      videoCodec: meta.videoCodec,
      audioCodec: meta.audioCodec,
    };
  }
}

export const ffmpegCompositor = new FfmpegCompositor();

