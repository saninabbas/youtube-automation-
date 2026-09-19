import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '@/lib/auth';
import { getApiKey, addUserVoice, UserVoice } from '@/lib/db';
import { storage, getTempDir } from '@/lib/storage';
import { inspectMedia } from '@/lib/providers/videoProvider';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MIN_FILE_SIZE = 8 * 1024; // ~8 KB
const ALLOWED_AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.aac', '.flac']);

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication Check
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    // 2. ElevenLabs API Key Check
    const apiKey = getApiKey('elevenlabs') || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('[VoiceClone] ElevenLabs API key not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Voice cloning service is currently unavailable. Please contact support or choose a studio voice.',
        },
        { status: 503 }
      );
    }

    // 3. Parse and Validate Form Data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseErr) {
      return NextResponse.json(
        { success: false, error: 'Invalid form submission. Please provide a valid audio sample.' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    const rawName = (formData.get('name') as string) || '';

    // Sanitize voice name (prevent XSS, strip HTML tags, limit length)
    const cleanName = rawName.replace(/[<>"'&]/g, '').trim().substring(0, 50) ||
      (user.name ? `${user.name}'s Voice` : 'My Voice');

    if (!file || !(file instanceof Blob) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Please provide an audio recording or upload a sound file.' },
        { status: 400 }
      );
    }

    // 4. File Size Checks
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'The audio file is too large. Maximum supported size is 25 MB.' },
        { status: 413 }
      );
    }

    if (file.size < MIN_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Please record at least 5 seconds of clear speech.' },
        { status: 400 }
      );
    }

    // 5. File Extension Check
    const originalFileName = file.name || 'sample.wav';
    const ext = path.extname(originalFileName).toLowerCase();
    if (ext && !ALLOWED_AUDIO_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { success: false, error: "This audio format isn't supported. Please upload an MP3, WAV, M4A, WebM, or OGG file." },
        { status: 400 }
      );
    }

    // 6. Server-Side Audio Inspection with FFmpeg (Prevents MIME spoofing & corrupted audio)
    const fileBytes = Buffer.from(await file.arrayBuffer());
    const tempDir = getTempDir('voice_audit');
    const safeExt = ext && ALLOWED_AUDIO_EXTENSIONS.has(ext) ? ext : '.wav';
    const tempFilePath = path.join(tempDir, `audit_${uuidv4()}${safeExt}`);

    try {
      await fs.promises.writeFile(tempFilePath, fileBytes);
      const media = await inspectMedia(tempFilePath);

      // Verify that the file contains actual audio streams
      if (!media.audioCodec && !media.videoCodec) {
        return NextResponse.json(
          { success: false, error: "We couldn't process this recording. The file does not contain valid audio data." },
          { status: 400 }
        );
      }

      // Check duration constraints
      if (media.durationSec > 0 && media.durationSec < 4.5) {
        return NextResponse.json(
          { success: false, error: 'Please record at least 5 seconds of clear speech.' },
          { status: 400 }
        );
      }

      if (media.durationSec > 300) {
        return NextResponse.json(
          { success: false, error: 'Your recording is too long. Please provide an audio sample under 5 minutes.' },
          { status: 400 }
        );
      }
    } catch (auditErr: any) {
      console.warn('[VoiceClone] Server-side audio inspection warning:', auditErr.message);
    } finally {
      // Clean up temporary inspection file
      if (fs.existsSync(tempFilePath)) {
        try {
          await fs.promises.unlink(tempFilePath);
        } catch (_) {}
      }
    }

    // 7. Call ElevenLabs Instant Voice Cloning with Timeout & Resilience
    const elevenFormData = new FormData();
    elevenFormData.append('name', cleanName);
    elevenFormData.append('description', `Cloned via AutoVideo SaaS for user ${user.id}`);
    const audioBlob = new Blob([fileBytes], { type: file.type || 'audio/wav' });
    elevenFormData.append('files', audioBlob, originalFileName);

    let elevenRes: Response;
    try {
      elevenRes = await fetch('https://api.elevenlabs.io/v1/voices/add', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
        body: elevenFormData,
        signal: AbortSignal.timeout(35000), // 35s timeout
      });
    } catch (fetchErr: any) {
      console.error('[VoiceClone] ElevenLabs network/timeout error:', fetchErr.message);
      if (fetchErr.name === 'TimeoutError' || fetchErr.message?.includes('timeout')) {
        return NextResponse.json(
          { success: false, error: 'Connection to voice service timed out. Please check your internet connection and try again.' },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Failed to connect to voice cloning service. Please try again later.' },
        { status: 502 }
      );
    }

    if (!elevenRes.ok) {
      const errText = await elevenRes.text().catch(() => '');
      console.error(`[VoiceClone] ElevenLabs API failed (${elevenRes.status}):`, errText.substring(0, 300));

      if (elevenRes.status === 429) {
        return NextResponse.json(
          { success: false, error: 'Voice cloning service is experiencing high demand. Please wait a minute and try again.' },
          { status: 429 }
        );
      }

      if (elevenRes.status === 401 || elevenRes.status === 403) {
        return NextResponse.json(
          { success: false, error: 'Voice cloning provider authentication failed. Please contact support.' },
          { status: 502 }
        );
      }

      if (elevenRes.status === 400) {
        return NextResponse.json(
          { success: false, error: "We couldn't process this recording. Please ensure clear speech without background noise and try again." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'The voice cloning service encountered a temporary error. Please try again in a moment.' },
        { status: 502 }
      );
    }

    let elevenData: any;
    try {
      elevenData = await elevenRes.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Voice provider returned an unparseable response.' },
        { status: 502 }
      );
    }

    const voiceId = elevenData?.voice_id;
    if (!voiceId || typeof voiceId !== 'string' || !/^[a-zA-Z0-9_-]{15,35}$/.test(voiceId)) {
      console.error('[VoiceClone] Invalid voice ID returned:', voiceId);
      return NextResponse.json(
        { success: false, error: 'Voice provider did not return a valid voice identifier.' },
        { status: 502 }
      );
    }

    // 8. Atomic Persistence: Save Local Sample & Database Record
    const storageKey = `voices/${user.id}/${voiceId}.wav`;
    let sampleUrl: string | undefined = undefined;

    try {
      const stored = await storage.putObject(storageKey, fileBytes, 'audio/wav');
      sampleUrl = stored.url;
    } catch (saveErr) {
      console.warn('[VoiceClone] Could not save local audio sample copy:', saveErr);
    }

    // Insert voice record in database
    let savedVoice: UserVoice;
    try {
      savedVoice = addUserVoice(user.id, cleanName, voiceId, sampleUrl);
    } catch (dbErr: any) {
      console.error('[VoiceClone] Database persistence error:', dbErr);
      // Clean up stored file to prevent orphan files
      try {
        await storage.deleteObject(storageKey);
      } catch (_) {}

      // Clean up remote ElevenLabs voice
      try {
        await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
          method: 'DELETE',
          headers: { 'xi-api-key': apiKey },
        });
      } catch (_) {}

      return NextResponse.json(
        { success: false, error: 'Failed to save cloned voice to your account. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Voice "${cleanName}" successfully cloned!`,
        voice: {
          id: savedVoice.id,
          name: savedVoice.name,
          voice_id: savedVoice.voice_id,
          sample_url: savedVoice.sample_url,
          created_at: savedVoice.created_at,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[VoiceClone] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during voice cloning. Please try again.' },
      { status: 500 }
    );
  }
}
