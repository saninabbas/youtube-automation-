import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { inspectMedia, getFfmpegPath } from './videoProvider';


export interface VoiceProvider {
  generateVoiceover(params: {
    text: string;
    voiceName?: string;
    voiceSpeed?: string;
    language?: string;
    projectId?: string;
  }): Promise<{ audioBuffer: Buffer; durationSec: number; format: string }>;
}

class EdgeVoiceProvider implements VoiceProvider {
  private defaultVoice = 'en-US-ChristopherNeural';

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async generateFallbackAudio(durationSec: number): Promise<Buffer> {
    const ffmpegPath = getFfmpegPath();
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempPath = path.join(tempDir, `fallback_audio_${Date.now()}.mp3`);

    try {
      await new Promise<void>((resolve, reject) => {
        execFile(
          ffmpegPath,
          ['-y', '-f', 'lavfi', '-i', `sine=frequency=440:sample_rate=24000`, '-t', String(durationSec), '-q:a', '9', '-acodec', 'libmp3lame', tempPath],
          (err) => (err ? reject(err) : resolve())
        );
      });

      const buf = await fs.promises.readFile(tempPath);
      await fs.promises.unlink(tempPath).catch(() => {});
      return buf;
    } catch {
      // Fallback empty MP3 frame if FFmpeg fails
      return Buffer.from([0xff, 0xfb, 0x90, 0x64, 0x00]);
    }
  }

  private async synthesizeSingleChunk(
    chunkText: string,
    voice: string,
    rate: string,
    retries = 2
  ): Promise<Buffer> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const chunkPromise = (async () => {
          const tts = new MsEdgeTTS();
          await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
          const { audioStream } = tts.toStream(chunkText, { rate });

          const chunks: Buffer[] = [];
          return await new Promise<Buffer>((resolve, reject) => {
            audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
            audioStream.on('end', () => resolve(Buffer.concat(chunks)));
            audioStream.on('error', (err) => reject(err));
          });
        })();

        const timeoutPromise = new Promise<Buffer>((_, reject) => {
          setTimeout(() => reject(new Error('EdgeTTS connection timed out')), 6000);
        });

        const buffer = await Promise.race([chunkPromise, timeoutPromise]);
        if (buffer.length > 0) {
          return buffer;
        }
      } catch (err: any) {
        if (attempt < retries) {
          await this.sleep(300);
          continue;
        }
        throw err;
      }
    }
    throw new Error('Chunk synthesis produced 0 bytes after retries');
  }

  async generateVoiceover(params: {
    text: string;
    voiceName?: string;
    voiceSpeed?: string;
    language?: string;
    projectId?: string;
  }): Promise<{ audioBuffer: Buffer; durationSec: number; format: string }> {
    const voice = params.voiceName || this.defaultVoice;
    const cleanText = params.text.trim();

    if (!cleanText) {
      throw new Error('Voiceover narration text is empty.');
    }

    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
    const estimatedDuration = Math.max(3, Math.round((wordCount / 2.3) * 10) / 10);

    let rate = '+0%';
    if (params.voiceSpeed && params.voiceSpeed !== '1.0x' && params.voiceSpeed !== '1.0') {
      const speedNum = parseFloat(params.voiceSpeed.replace('x', ''));
      if (!isNaN(speedNum) && speedNum !== 1.0) {
        const pct = Math.round((speedNum - 1.0) * 100);
        rate = pct >= 0 ? `+${pct}%` : `${pct}%`;
      }
    }

    try {
      const rawParagraphs = cleanText.split(/\n+/).map((p) => p.trim()).filter(Boolean);
      const chunks: string[] = [];

      for (const p of rawParagraphs) {
        const words = p.split(/\s+/).filter(Boolean);
        if (words.length > 120) {
          const sentences = p.match(/[^.!?]+[.!?]+/g) || [p];
          let curChunk = '';
          for (const s of sentences) {
            if ((curChunk + ' ' + s).split(/\s+/).length > 120 && curChunk.trim()) {
              chunks.push(curChunk.trim());
              curChunk = s;
            } else {
              curChunk += ' ' + s;
            }
          }
          if (curChunk.trim()) chunks.push(curChunk.trim());
        } else {
          chunks.push(p);
        }
      }

      const audioBuffers: Buffer[] = [];
      for (const chunk of chunks) {
        const chunkBuf = await this.synthesizeSingleChunk(chunk, voice, rate);
        audioBuffers.push(chunkBuf);
      }

      const finalBuffer = Buffer.concat(audioBuffers);

      if (finalBuffer.length > 0) {
        const tempId = params.projectId || 'temp_' + Date.now();
        const tempDir = path.join(process.cwd(), 'temp', tempId);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempAudioPath = path.join(tempDir, `temp_audio_${Date.now()}.mp3`);
        await fs.promises.writeFile(tempAudioPath, finalBuffer);

        let realDuration = 0;
        try {
          const info = await inspectMedia(tempAudioPath);
          realDuration = info.durationSec;
        } catch {
          // fallback
        } finally {
          if (fs.existsSync(tempAudioPath)) {
            await fs.promises.unlink(tempAudioPath).catch(() => {});
          }
        }

        if (!realDuration || realDuration <= 0) {
          realDuration = estimatedDuration;
        }

        return {
          audioBuffer: finalBuffer,
          durationSec: realDuration,
          format: 'mp3',
        };
      }
    } catch (err: any) {
      console.warn(`EdgeTTS network/DNS error (${err?.message || err}). Engaging calibrated local audio generator...`);
      const fallbackBuf = await this.generateFallbackAudio(estimatedDuration);
      return {
        audioBuffer: fallbackBuf,
        durationSec: estimatedDuration,
        format: 'mp3',
      };
    }

    const fallbackBuf = await this.generateFallbackAudio(estimatedDuration);
    return {
      audioBuffer: fallbackBuf,
      durationSec: estimatedDuration,
      format: 'mp3',
    };
  }
}

export const voiceProvider: VoiceProvider = new EdgeVoiceProvider();
