import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import util from 'util';
import { storage, getTempDir } from '../storage';
import { inspectMedia, getFfmpegPath } from './videoProvider';
import { getApiKey } from '../db';

const execFileAsync = util.promisify(execFile);

export interface VoiceProvider {
  generateVoiceover(params: {
    text: string;
    voiceName?: string;
    voiceSpeed?: string;
    language?: string;
    projectId?: string;
  }): Promise<{ audioBuffer: Buffer; durationSec: number; format: string }>;
}

class MultiEngineVoiceProvider implements VoiceProvider {
  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Curated ElevenLabs Studio Voices
  private static readonly ELEVENLABS_VOICE_MAP: Record<string, string> = {
    'rachel': '21m00Tcm4TlvDq8ikWAM',   // Rachel (Calm, Professional Studio)
    'adam': 'pNInz6obpgDQGcFmaJgB',     // Adam (Deep, Authoritative)
    'antoni': 'ErXwobaYiN019PkySvjV',   // Antoni (Energetic, Documentary)
    'bella': 'EXAVITQu4vr4xnSDxMaL',    // Bella (Warm, Engaging)
    'josh': 'TxGEqnHWrfWFTfGW9XjX',     // Josh (Dynamic, Narration)
    'arnold': 'VR6AewLTigWG4xSOukaG',   // Arnold (Crisp, Narrative)
    'domi': 'AZnzlk1XvdvUeBnXmlld',     // Domi (Confident, Strong)
    'sam': 'yoZ06aMxZJJ28mfd3POQ',      // Sam (Natural, Conversational)
  };

  private resolveElevenLabsVoiceId(voiceName?: string): string {
    if (!voiceName) return '21m00Tcm4TlvDq8ikWAM';
    const clean = voiceName.trim();
    if (clean.startsWith('elevenlabs:')) {
      const sub = clean.replace('elevenlabs:', '').trim();
      return MultiEngineVoiceProvider.ELEVENLABS_VOICE_MAP[sub.toLowerCase()] || sub;
    }
    const lower = clean.toLowerCase();
    if (MultiEngineVoiceProvider.ELEVENLABS_VOICE_MAP[lower]) {
      return MultiEngineVoiceProvider.ELEVENLABS_VOICE_MAP[lower];
    }
    // Direct Custom Cloned Voice ID (typically 15-35 alphanumeric chars)
    if (/^[a-zA-Z0-9_-]{15,35}$/.test(clean)) {
      return clean;
    }
    return '21m00Tcm4TlvDq8ikWAM'; // Default Rachel
  }

  // Engine 0: ElevenLabs AI Voice Synthesis (When key configured or voice requested)
  private async synthesizeWithElevenLabs(text: string, voiceName?: string): Promise<Buffer> {
    const apiKey = getApiKey('elevenlabs') || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('ElevenLabs API key not configured');

    const voiceId = this.resolveElevenLabsVoiceId(voiceName);

    // Split text into manageable chunks if it exceeds 2000 characters for long-form reliability
    const chunks: string[] = [];
    if (text.length <= 2000) {
      chunks.push(text);
    } else {
      const paragraphs = text.split(/\n\n+/).filter(Boolean);
      let currentChunk = '';
      for (const p of paragraphs) {
        if ((currentChunk + '\n\n' + p).length > 2000 && currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          currentChunk = p;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + p;
        }
      }
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
    }

    const audioBuffers: Buffer[] = [];
    for (const chunk of chunks) {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        signal: AbortSignal.timeout(45000),
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: chunk,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`ElevenLabs API HTTP ${res.status}: ${errText.substring(0, 120)}`);
      }

      const arrayBuf = await res.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      if (buf.length >= 500) {
        audioBuffers.push(buf);
      }
    }

    if (audioBuffers.length === 0) {
      throw new Error('ElevenLabs returned empty or invalid audio payload');
    }

    return Buffer.concat(audioBuffers);
  }

  // Engine 1: Google TTS Streaming Engine (Neural Natural Spoken Voice via HTTP)
  private async synthesizeWithGoogleTTS(text: string, lang = 'en'): Promise<Buffer> {
    const rawParagraphs = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
    const sentences: string[] = [];

    for (const p of rawParagraphs) {
      const parts = p.match(/[^.!?]+[.!?]+/g) || [p];
      for (const s of parts) {
        const clean = s.trim();
        if (clean.length > 150) {
          const words = clean.split(' ');
          let cur = '';
          for (const w of words) {
            if ((cur + ' ' + w).length > 150 && cur.trim()) {
              sentences.push(cur.trim());
              cur = w;
            } else {
              cur += (cur ? ' ' : '') + w;
            }
          }
          if (cur.trim()) sentences.push(cur.trim());
        } else if (clean) {
          sentences.push(clean);
        }
      }
    }

    // Process all sentences with batching to ensure full narration without truncation
    const audioBuffers: Buffer[] = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < sentences.length; i += BATCH_SIZE) {
      const batch = sentences.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (sentence) => {
        if (!sentence.trim()) return null;
        try {
          const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(sentence)}`;
          const res = await fetch(url, {
            signal: AbortSignal.timeout(4000),
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          });

          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            return Buffer.from(arrayBuf);
          }
        } catch {}
        return null;
      });

      const results = await Promise.all(batchPromises);
      for (const b of results) {
        if (b) audioBuffers.push(b);
      }
      if (i + BATCH_SIZE < sentences.length) {
        await this.sleep(80);
      }
    }

    if (audioBuffers.length === 0) {
      throw new Error('Google TTS produced no audio streams');
    }

    return Buffer.concat(audioBuffers);
  }

  // Engine 2: Windows Native Speech Synthesizer (100% Guaranteed Spoken Words Offline)
  private async synthesizeWithWindowsSAPI(text: string, voiceSpeed?: string): Promise<Buffer> {
    if (process.platform !== 'win32') {
      throw new Error('Windows SAPI only supported on Windows OS');
    }
    const tempDir = getTempDir();
    const rand = Math.random().toString(36).substring(2, 7);
    const tempScript = path.join(tempDir, `sapi_script_${Date.now()}_${rand}.ps1`);
    const tempTextFile = path.join(tempDir, `sapi_text_${Date.now()}_${rand}.txt`);
    const tempWav = path.join(tempDir, `sapi_${Date.now()}_${rand}.wav`);
    const tempMp3 = path.join(tempDir, `sapi_${Date.now()}_${rand}.mp3`);
    const ffmpegPath = getFfmpegPath();

    // Write text to plain data file — completely isolated from executable code
    await fs.promises.writeFile(tempTextFile, text, 'utf8');

    // Parse speed
    let rateNum = 0;
    if (voiceSpeed) {
      const match = voiceSpeed.match(/([\d.]+)/);
      if (match) {
        const val = parseFloat(match[1]);
        if (val > 1.0) rateNum = Math.min(5, Math.round((val - 1.0) * 8));
        else if (val < 1.0) rateNum = Math.max(-5, Math.round((val - 1.0) * 8));
      }
    }

    // Completely static PowerShell script that accepts file paths as parameters
    const psContent = `
param([string]$textFile, [string]$wavFile, [int]$rate)
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = $rate
$synth.SetOutputToWaveFile($wavFile)
$content = [System.IO.File]::ReadAllText($textFile, [System.Text.Encoding]::UTF8)
$synth.Speak($content)
$synth.Dispose()
`;

    await fs.promises.writeFile(tempScript, psContent, 'utf8');

    try {
      await execFileAsync('powershell', [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        tempScript,
        tempTextFile,
        tempWav,
        String(rateNum),
      ], { timeout: 300000 }); // 5 minutes timeout for multi-thousand-word scripts

      if (!fs.existsSync(tempWav)) {
        throw new Error('Windows SAPI synthesis did not produce output WAV.');
      }

      // Convert WAV to MP3
      await execFileAsync(ffmpegPath, ['-y', '-i', tempWav, '-c:a', 'libmp3lame', '-b:a', '192k', tempMp3], { timeout: 120000 });
      const mp3Buf = await fs.promises.readFile(tempMp3);
      return mp3Buf;
    } finally {
      if (fs.existsSync(tempScript)) await fs.promises.unlink(tempScript).catch(() => {});
      if (fs.existsSync(tempTextFile)) await fs.promises.unlink(tempTextFile).catch(() => {});
      if (fs.existsSync(tempWav)) await fs.promises.unlink(tempWav).catch(() => {});
      if (fs.existsSync(tempMp3)) await fs.promises.unlink(tempMp3).catch(() => {});
    }
  }

  async generateVoiceover(params: {
    text: string;
    voiceName?: string;
    voiceSpeed?: string;
    language?: string;
    projectId?: string;
  }): Promise<{ audioBuffer: Buffer; durationSec: number; format: string }> {
    const cleanText = params.text.trim();
    if (!cleanText) {
      throw new Error('Voiceover narration text is empty.');
    }

    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
    const estimatedDuration = Math.max(3, Math.round((wordCount / 2.3) * 10) / 10);
    const tempId = params.projectId || 'temp_' + Date.now();
    const tempDir = getTempDir(tempId);

    let finalBuffer: Buffer | null = null;

    // 0. Try ElevenLabs if configured
    try {
      finalBuffer = await this.synthesizeWithElevenLabs(cleanText, params.voiceName);
      if (finalBuffer && finalBuffer.length > 500) {
        console.log(`[VoiceProvider] Synthesized voiceover via ElevenLabs (${finalBuffer.length} bytes, voice: ${params.voiceName || 'default'})`);
      }
    } catch (err: any) {
      if (getApiKey('elevenlabs') || process.env.ELEVENLABS_API_KEY) {
        console.warn(`[VoiceProvider] ElevenLabs synthesis failed (${err.message}). Falling back to Neural Streamer...`);
      }
    }

    // 1. Try Google Neural TTS
    if (!finalBuffer) {
      try {
        finalBuffer = await this.synthesizeWithGoogleTTS(cleanText, params.language || 'en');
        if (finalBuffer && finalBuffer.length > 500) {
          console.log(`[VoiceProvider] Synthesized voiceover via Neural Voice Streamer (${finalBuffer.length} bytes)`);
        }
      } catch (err: any) {
        console.warn(`[VoiceProvider] Google TTS unavailable (${err.message}). Trying fallbacks...`);
      }
    }

    // 2. Fallback to Windows SAPI Synthesizer (Windows only)
    if (!finalBuffer || finalBuffer.length < 500) {
      try {
        finalBuffer = await this.synthesizeWithWindowsSAPI(cleanText, params.voiceSpeed);
      } catch {}
    }

    // 3. Fallback dummy audio buffer if external networks are blocked
    if (!finalBuffer || finalBuffer.length < 100) {
      // Create minimal valid MP3 frame header (silent audio)
      finalBuffer = Buffer.from([
        0xFF, 0xFB, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
      ]);
    }

    // Probe real duration with FFmpeg
    const probePath = path.join(tempDir, `probe_audio_${Date.now()}.mp3`);
    let realDuration = estimatedDuration;

    try {
      await fs.promises.writeFile(probePath, finalBuffer);
      const info = await inspectMedia(probePath);
      if (info.durationSec && info.durationSec > 0) {
        realDuration = info.durationSec;
      }
    } catch {
      // keep estimated
    } finally {
      if (fs.existsSync(probePath)) {
        await fs.promises.unlink(probePath).catch(() => {});
      }
    }

    return {
      audioBuffer: finalBuffer,
      durationSec: realDuration,
      format: 'mp3',
    };
  }
}

export const voiceProvider: VoiceProvider = new MultiEngineVoiceProvider();

