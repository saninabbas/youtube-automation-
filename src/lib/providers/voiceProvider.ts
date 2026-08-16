import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import path from 'path';
import fs from 'fs';
import { inspectMedia } from './videoProvider';

export interface VoiceProvider {
  generateVoiceover(params: {
    text: string;
    voiceName?: string;
    language?: string;
    projectId?: string;
  }): Promise<{ audioBuffer: Buffer; durationSec: number; format: string }>;
}

class EdgeVoiceProvider implements VoiceProvider {
  private defaultVoice = 'en-US-ChristopherNeural';

  async generateVoiceover(params: {
    text: string;
    voiceName?: string;
    language?: string;
    projectId?: string;
  }): Promise<{ audioBuffer: Buffer; durationSec: number; format: string }> {
    const voice = params.voiceName || this.defaultVoice;
    const cleanText = params.text.trim();

    if (!cleanText) {
      throw new Error('Voiceover narration text is empty.');
    }

    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(cleanText);

      const chunks: Buffer[] = [];
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        audioStream.on('end', () => resolve(Buffer.concat(chunks)));
        audioStream.on('error', (err) => reject(err));
      });

      if (buffer.length > 0) {
        // Measure exact duration using FFmpeg
        const tempId = params.projectId || 'temp_' + Date.now();
        const tempDir = path.join(process.cwd(), 'temp', tempId);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempAudioPath = path.join(tempDir, `temp_audio_${Date.now()}.mp3`);
        await fs.promises.writeFile(tempAudioPath, buffer);

        let realDuration = 0;
        try {
          const info = await inspectMedia(tempAudioPath);
          realDuration = info.durationSec;
        } catch {
          // fallback word estimation
        } finally {
          if (fs.existsSync(tempAudioPath)) {
            await fs.promises.unlink(tempAudioPath).catch(() => {});
          }
        }

        if (!realDuration || realDuration <= 0) {
          const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
          realDuration = Math.max(2, Math.round((wordCount / 2.3) * 10) / 10);
        }

        return {
          audioBuffer: buffer,
          durationSec: realDuration,
          format: 'mp3',
        };
      }
    } catch (err: any) {
      console.warn('EdgeTTS error, checking fallback:', err);
      throw new Error(`Voiceover synthesis failed with Edge TTS: ${err?.message || err}`);
    }

    throw new Error('Voiceover synthesis produced 0 bytes audio stream');
  }
}

export const voiceProvider: VoiceProvider = new EdgeVoiceProvider();

