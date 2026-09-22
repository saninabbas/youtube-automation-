import { getApiKey } from '../db';

export interface ScriptGenerationParams {
  topic: string;
  audience?: string;
  tone?: 'Professional' | 'Casual' | 'Educational' | 'Storytelling' | 'Energetic' | 'Documentary';
  lengthMinutes?: number;
  language?: string;
  style?: 'PODCAST' | 'VLOG' | 'EDUCATIONAL' | 'NEWS' | 'STORYTELLING';
}

export interface GeneratedPersonalScene {
  sceneNumber: number;
  sceneType: 'hook' | 'intro' | 'main' | 'example' | 'conclusion' | 'cta';
  heading: string;
  narration: string;
  visualPrompt: string;
  sceneTopic: string;
  durationSec: number;
}

export interface GeneratedPersonalScript {
  title: string;
  topic: string;
  totalDurationSec: number;
  wordCount: number;
  estimatedDurationFormatted: string;
  scenes: GeneratedPersonalScene[];
}

export class PersonalCreatorScriptService {
  /**
   * Analyze custom pasted script: word count, char count, estimated duration, scene division
   */
  analyzeCustomScript(scriptText: string, topic = 'My Custom Video'): GeneratedPersonalScript {
    const clean = scriptText.trim();
    const words = clean.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Average speaking rate: 145 words per minute (2.4 words per second)
    const totalDurationSec = Math.max(10, Math.round(wordCount / 2.4));
    const mins = Math.floor(totalDurationSec / 60);
    const secs = totalDurationSec % 60;
    const estimatedDurationFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;

    // Divide paragraphs into logical scenes
    const paragraphs = clean.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const scenes: GeneratedPersonalScene[] = [];

    if (paragraphs.length <= 1) {
      // Split into sentences if only one giant block
      const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
      const chunkSize = Math.max(1, Math.ceil(sentences.length / 5));
      for (let i = 0; i < sentences.length; i += chunkSize) {
        const slice = sentences.slice(i, i + chunkSize).join(' ').trim();
        const sceneNum = scenes.length + 1;
        const dur = Math.max(4, Math.round(slice.split(/\s+/).length / 2.4));
        scenes.push({
          sceneNumber: sceneNum,
          sceneType: sceneNum === 1 ? 'hook' : sceneNum === 5 ? 'cta' : 'main',
          heading: `Scene ${sceneNum}`,
          narration: slice,
          visualPrompt: this.generateSmartVisualPrompt(slice, topic),
          sceneTopic: topic,
          durationSec: dur,
        });
      }
    } else {
      paragraphs.forEach((p, idx) => {
        const sceneNum = idx + 1;
        const dur = Math.max(4, Math.round(p.split(/\s+/).length / 2.4));
        scenes.push({
          sceneNumber: sceneNum,
          sceneType: idx === 0 ? 'hook' : idx === paragraphs.length - 1 ? 'cta' : 'main',
          heading: `Scene ${sceneNum}`,
          narration: p.trim(),
          visualPrompt: this.generateSmartVisualPrompt(p, topic),
          sceneTopic: topic,
          durationSec: dur,
        });
      });
    }

    return {
      title: topic,
      topic,
      totalDurationSec,
      wordCount,
      estimatedDurationFormatted,
      scenes,
    };
  }

  /**
   * Generate structured script from topic using OpenRouter DeepSeek or Gemini
   */
  async generateScriptFromTopic(params: ScriptGenerationParams): Promise<GeneratedPersonalScript> {
    const {
      topic,
      audience = 'General audience',
      tone = 'Engaging and authoritative',
      lengthMinutes = 3,
      language = 'English',
      style = 'PODCAST',
    } = params;

    const openRouterKey = getApiKey('openrouter') || process.env.OPENROUTER_API_KEY;
    const geminiKey = getApiKey('gemini') || process.env.GEMINI_API_KEY;

    const systemPrompt = `You are a world-class YouTube producer and scriptwriter for presenter-led videos.
Format your output as a STRICT JSON object with this exact schema:
{
  "title": "Compelling YouTube Video Title",
  "scenes": [
    {
      "sceneNumber": 1,
      "sceneType": "hook",
      "heading": "Visual Hook & Attention Grabber",
      "narration": "Spoken presenter script for scene 1",
      "visualPrompt": "Detailed visual description for camera framing and cinematic B-roll",
      "sceneTopic": "Specific subject shown",
      "durationSec": 8
    }
  ]
}
Requirements:
1. Divide the video into 4 to 8 impactful scenes (Hook, Introduction, Main Point 1, Main Point 2, Example/Evidence, Conclusion, Call-to-Action).
2. The narration MUST match the requested language: ${language}.
3. The tone must be: ${tone}.
4. Target length: ~${lengthMinutes} minute(s).
5. The visual prompts must be highly specific, professional, cinematic, and relevant to the scene topic. NEVER suggest yoga or food or unrelated nature for tech/business/finance topics.
6. Return ONLY the raw JSON. Zero markdown code fences, zero commentary.`;

    const userPrompt = `Topic: "${topic}"
Audience: ${audience}
Style: ${style} (Presenter-led ${style.toLowerCase()})
Length: ~${lengthMinutes} minutes`;

    // 1. Try OpenRouter DeepSeek
    if (openRouterKey) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://autovideo.ai',
            'X-Title': 'AutoVideo Personal AI Creator',
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 3500,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = this.parseCleanJson(content);
            if (parsed && parsed.scenes && parsed.scenes.length > 0) {
              return this.finalizeScriptData(parsed, topic);
            }
          }
        }
      } catch (err: any) {
        console.warn('[PersonalCreatorScriptService] OpenRouter call failed, trying fallback:', err.message);
      }
    }

    // 2. Try Gemini
    if (geminiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = this.parseCleanJson(text);
            if (parsed && parsed.scenes && parsed.scenes.length > 0) {
              return this.finalizeScriptData(parsed, topic);
            }
          }
        }
      } catch (err: any) {
        console.warn('[PersonalCreatorScriptService] Gemini call failed, using built-in generator:', err.message);
      }
    }

    // 3. High-Quality Algorithmic Presenter Fallback
    return this.generateAlgorithmicScript(topic, style, lengthMinutes);
  }

  /**
   * Helper to clean JSON string from LLMs
   */
  private parseCleanJson(raw: string): any {
    try {
      const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
      return JSON.parse(clean);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch {}
      }
      return null;
    }
  }

  /**
   * Generates smart visual prompt that guarantees thematic relevance
   */
  generateSmartVisualPrompt(narration: string, topic: string): string {
    const lower = `${topic} ${narration}`.toLowerCase();

    if (lower.includes('code') || lower.includes('software') || lower.includes('developer') || lower.includes('algorithm')) {
      return `Presenter in modern tech studio, cutting to high-tech digital workspace with glowing code and abstract network graphs, cinematic 4k lighting`;
    }
    if (lower.includes('money') || lower.includes('finance') || lower.includes('credit') || lower.includes('wealth') || lower.includes('stock')) {
      return `Presenter addressing camera, transitioning to sleek financial charts, luxury office high-rise overlooking skyscraper skyline, crisp studio depth of field`;
    }
    if (lower.includes('ai') || lower.includes('robot') || lower.includes('future') || lower.includes('intelligence')) {
      return `Presenter with focused expression, cinematic B-roll of glowing neural network pulses and futuristic holographic interfaces, sharp film grading`;
    }
    if (lower.includes('history') || lower.includes('ancient') || lower.includes('roman') || lower.includes('empire')) {
      return `Presenter speaking, dramatic transition to historic marble architecture, warm golden hour sunbeams casting long shadows across stone pillars`;
    }
    if (lower.includes('social media') || lower.includes('phone') || lower.includes('scroll') || lower.includes('algorithm')) {
      return `Presenter talking head, B-roll of person scrolling smartphone in dimly lit room with blue neon screen glow reflecting on face`;
    }

    return `Presenter in elegant minimalist studio, cutting to dynamic cinematic B-roll illustrating ${topic}, crisp focus, 4k cinematic aesthetic`;
  }

  private finalizeScriptData(data: any, topic: string): GeneratedPersonalScript {
    const scenes: GeneratedPersonalScene[] = (data.scenes || []).map((s: any, idx: number) => ({
      sceneNumber: s.sceneNumber || (idx + 1),
      sceneType: s.sceneType || (idx === 0 ? 'hook' : idx === (data.scenes.length - 1) ? 'cta' : 'main'),
      heading: s.heading || `Scene ${idx + 1}`,
      narration: s.narration || '',
      visualPrompt: s.visualPrompt || this.generateSmartVisualPrompt(s.narration || '', topic),
      sceneTopic: s.sceneTopic || topic,
      durationSec: s.durationSec || 6,
    }));

    const totalDurationSec = scenes.reduce((acc, s) => acc + s.durationSec, 0);
    const wordCount = scenes.reduce((acc, s) => acc + s.narration.split(/\s+/).length, 0);
    const mins = Math.floor(totalDurationSec / 60);
    const secs = totalDurationSec % 60;

    return {
      title: data.title || topic,
      topic,
      totalDurationSec,
      wordCount,
      estimatedDurationFormatted: `${mins}:${secs.toString().padStart(2, '0')}`,
      scenes,
    };
  }

  private generateAlgorithmicScript(
    topic: string,
    style: string,
    lengthMinutes: number
  ): GeneratedPersonalScript {
    const scenes: GeneratedPersonalScene[] = [
      {
        sceneNumber: 1,
        sceneType: 'hook',
        heading: 'Opening Hook',
        narration: `Have you ever wondered what's really happening beneath the surface of ${topic}? Today, we are breaking down the truth.`,
        visualPrompt: `Presenter leaning toward camera with an intrigued, confident expression in modern studio, dramatic lighting`,
        sceneTopic: topic,
        durationSec: 6,
      },
      {
        sceneNumber: 2,
        sceneType: 'intro',
        heading: 'Context & The Big Picture',
        narration: `Most people only see the obvious side of ${topic}. But when you look closer, the mechanics tell a completely different story.`,
        visualPrompt: `Presenter speaking at medium framing, subtle camera drift, transitioning to cinematic relevant B-roll of ${topic}`,
        sceneTopic: topic,
        durationSec: 8,
      },
      {
        sceneNumber: 3,
        sceneType: 'main',
        heading: 'The Core Mechanism',
        narration: `Here is the first critical insight: how systems and patterns interact to create massive exponential shifts over time.`,
        visualPrompt: `High-definition conceptual B-roll illustrating dynamic data points and interconnected structures, studio depth of field`,
        sceneTopic: topic,
        durationSec: 10,
      },
      {
        sceneNumber: 4,
        sceneType: 'example',
        heading: 'Real-World Impact',
        narration: `Look at what happens in practice. When you apply this principle, the results speak directly for themselves.`,
        visualPrompt: `Presenter gesturing confidently, split-screen displaying realistic case study visual and modern infographics`,
        sceneTopic: topic,
        durationSec: 8,
      },
      {
        sceneNumber: 5,
        sceneType: 'conclusion',
        heading: 'Key Takeaway',
        narration: `The takeaway is straightforward: mastering ${topic} changes your entire perspective and gives you an undeniable edge.`,
        visualPrompt: `Presenter close-up shot with warm studio backlighting, high contrast and authoritative cinematic presence`,
        sceneTopic: topic,
        durationSec: 7,
      },
      {
        sceneNumber: 6,
        sceneType: 'cta',
        heading: 'Call to Action',
        narration: `If this gave you a new perspective, hit subscribe, drop your thoughts in the comments, and I will see you in the next video.`,
        visualPrompt: `Presenter smiling, animated sleek subscribe button overlay and YouTube notification bell graphic`,
        sceneTopic: topic,
        durationSec: 6,
      },
    ];

    const totalDurationSec = scenes.reduce((acc, s) => acc + s.durationSec, 0);
    const wordCount = scenes.reduce((acc, s) => acc + s.narration.split(/\s+/).length, 0);
    const mins = Math.floor(totalDurationSec / 60);
    const secs = totalDurationSec % 60;

    return {
      title: `${topic} — The Definitive Breakdown`,
      topic,
      totalDurationSec,
      wordCount,
      estimatedDurationFormatted: `${mins}:${secs.toString().padStart(2, '0')}`,
      scenes,
    };
  }
}

export const personalCreatorScriptService = new PersonalCreatorScriptService();
