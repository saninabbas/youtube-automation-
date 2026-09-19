import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getApiKey, addUserVoice } from '@/lib/db';
import { storage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const apiKey = getApiKey('elevenlabs') || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Voice cloning service is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawName = (formData.get('name') as string) || '';
    const voiceName = rawName.trim() || (user.name ? `${user.name}'s Voice` : 'My Voice');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No audio file provided. Please record or upload an audio sample.' },
        { status: 400 }
      );
    }

    if (file.size < 5000) {
      return NextResponse.json(
        { error: 'Audio sample is too short. Please speak or upload at least 5-10 seconds of clear speech.' },
        { status: 400 }
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file exceeds the 25 MB limit. Please provide a shorter sample.' },
        { status: 400 }
      );
    }

    // Prepare multipart form data for ElevenLabs
    const elevenFormData = new FormData();
    elevenFormData.append('name', voiceName);
    elevenFormData.append('description', `Cloned via AutoVideo SaaS for user ${user.id}`);
    elevenFormData.append('files', file, file.name || 'sample_recording.wav');

    const elevenRes = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: elevenFormData,
    });

    if (!elevenRes.ok) {
      const errJson = await elevenRes.json().catch(() => null);
      const errDetail = errJson?.detail?.message || errJson?.detail || 'Voice cloning failed on voice provider.';
      return NextResponse.json(
        { error: `Voice Cloning Error: ${typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail)}` },
        { status: elevenRes.status >= 500 ? 502 : 400 }
      );
    }

    const elevenData = await elevenRes.json();
    const voiceId = elevenData.voice_id;

    if (!voiceId) {
      return NextResponse.json(
        { error: 'Voice provider did not return a valid voice identifier.' },
        { status: 502 }
      );
    }

    // Save audio sample locally for playback
    let sampleUrl: string | undefined = undefined;
    try {
      const fileBytes = Buffer.from(await file.arrayBuffer());
      const storageKey = `voices/${user.id}/${voiceId}.wav`;
      const stored = await storage.putObject(storageKey, fileBytes, 'audio/wav');
      sampleUrl = stored.url;
    } catch (saveErr) {
      console.warn('Could not save local voice sample copy:', saveErr);
    }

    // Store in database
    const savedVoice = addUserVoice(user.id, voiceName, voiceId, sampleUrl);

    return NextResponse.json(
      {
        success: true,
        message: `Voice "${voiceName}" successfully cloned!`,
        voice: savedVoice,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Voice clone error:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during voice cloning.' },
      { status: 500 }
    );
  }
}
