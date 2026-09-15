import { ProjectMetadata, getApiKey } from '../db';

export interface ScriptStructure {
  title: string;
  hook: string;
  introduction: string;
  sections: Array<{
    heading: string;
    subsections: Array<{
      subheading: string;
      narration: string;
      visualPrompt: string;
      visualSubject?: string;
      environment?: string;
      cameraMovement?: string;
      lighting?: string;
      colorStyle?: string;
      continuityNotes?: string;
      durationSec: number;
    }>;
  }>;
  conclusion: string;
  callToAction: string;
}

export interface GeneratedScene {
  sceneIndex: number;
  sectionName: string;
  narration: string;
  visualPrompt: string;
  visualSubject?: string;
  environment?: string;
  cameraMovement?: string;
  lighting?: string;
  colorStyle?: string;
  continuityNotes?: string;
  estimatedDurationSec: number;
  subtitleText: string;
}

export interface AiProvider {
  generateScript(params: {
    channelName: string;
    niche: string;
    language: string;
    topic: string;
    targetLengthMinutes: number;
    visualStyle?: string;
    introStyle?: string;
    outroCta?: string;
    contentRules?: string;
  }): Promise<{ script: ScriptStructure; fullNarration: string }>;

  generateScenes(params: {
    script: ScriptStructure;
    niche: string;
    language: string;
    targetLengthMinutes: number;
    visualStyle?: string;
  }): Promise<GeneratedScene[]>;

  generateMetadata(params: {
    script: ScriptStructure;
    scenes: GeneratedScene[];
    channelName: string;
    niche: string;
    topic: string;
  }): ProjectMetadata;
}

class DefaultAiProvider implements AiProvider {
  async generateScript(params: {
    channelName: string;
    niche: string;
    language: string;
    topic: string;
    targetLengthMinutes: number;
    visualStyle?: string;
    introStyle?: string;
    outroCta?: string;
    contentRules?: string;
  }): Promise<{ script: ScriptStructure; fullNarration: string }> {
    const { channelName, niche, topic, targetLengthMinutes, introStyle, outroCta, visualStyle } = params;

    // 1. Try Google Gemini if configured in DB or ENV
    const geminiKey = getApiKey('gemini');
    if (geminiKey) {
      try {
        return await this.generateScriptWithGemini(params, geminiKey);
      } catch (err: any) {
        console.warn(`[AiProvider] Gemini generation failed (${err.message}). Trying fallback...`);
      }
    }

    // 2. Try OpenAI if configured in DB or ENV
    const openAiKey = getApiKey('openai');
    if (openAiKey) {
      try {
        return await this.generateScriptWithOpenAI(params, openAiKey);
      } catch (err: any) {
        console.warn(`[AiProvider] OpenAI generation failed (${err.message}). Trying fallback...`);
      }
    }

    // 3. Built-in Calibrated Multi-Niche Offline Script Engine
    const script = this.buildCalibratedScript(channelName, niche, topic, targetLengthMinutes, introStyle, outroCta, visualStyle);
    const narrationParts: string[] = [script.hook, script.introduction];

    for (const section of script.sections) {
      for (const sub of section.subsections) {
        narrationParts.push(sub.narration);
      }
    }

    narrationParts.push(script.conclusion);
    narrationParts.push(script.callToAction);

    const fullNarration = narrationParts.join('\n\n');
    return { script, fullNarration };
  }

  async generateScenes(params: {
    script: ScriptStructure;
    niche: string;
    language: string;
    targetLengthMinutes: number;
    visualStyle?: string;
  }): Promise<GeneratedScene[]> {
    const { script, niche, visualStyle = 'Cinematic High-Contrast' } = params;
    const scenes: GeneratedScene[] = [];
    let sceneIndex = 1;

    // Scene 1: Hook
    const hookWords = script.hook.split(/\s+/).filter(Boolean).length;
    const hookDuration = Math.max(8, Math.round(hookWords / 2.3));
    scenes.push({
      sceneIndex: sceneIndex++,
      sectionName: 'Hook',
      narration: script.hook,
      visualPrompt: `High-impact cinematic opening visual for ${script.title}, ${visualStyle} lighting, ${niche} aesthetic, 4k ultra realistic`,
      visualSubject: `High-impact visual representation of ${script.title}`,
      environment: `Modern documentary studio with atmospheric ambient depth`,
      cameraMovement: `Slow linear forward push-in with centered focus`,
      lighting: `Dramatic directional rim lighting with subtle warm fill`,
      colorStyle: `${visualStyle} palette tailored to ${niche}`,
      continuityNotes: `Establishes primary color grade and atmospheric tone for the entire video`,
      estimatedDurationSec: hookDuration,
      subtitleText: script.hook,
    });

    // Scene 2: Introduction
    const introWords = script.introduction.split(/\s+/).filter(Boolean).length;
    const introDuration = Math.max(12, Math.round(introWords / 2.3));
    scenes.push({
      sceneIndex: sceneIndex++,
      sectionName: 'Introduction',
      narration: script.introduction,
      visualPrompt: `Wide cinematic shot establishing context for ${script.title}, ${visualStyle} aesthetic, professional documentary style`,
      visualSubject: `Contextual thematic overview of ${script.title}`,
      environment: `Expansive cinematic space matching ${niche} domain`,
      cameraMovement: `Gentle wide-angle horizontal tracking glide`,
      lighting: `Balanced natural key lighting with soft background diffusion`,
      colorStyle: `${visualStyle} balanced tones`,
      continuityNotes: `Expands perspective from Scene 1 while maintaining cohesive color grading`,
      estimatedDurationSec: introDuration,
      subtitleText: script.introduction,
    });

    // Section Scenes with Visual Continuity
    for (let sIdx = 0; sIdx < script.sections.length; sIdx++) {
      const section = script.sections[sIdx];
      for (let subIdx = 0; subIdx < section.subsections.length; subIdx++) {
        const sub = section.subsections[subIdx];
        const words = sub.narration.split(/\s+/).filter(Boolean).length;
        const duration = sub.durationSec || Math.max(12, Math.round(words / 2.3));

        const prevEnv = subIdx > 0 ? section.subsections[subIdx - 1].environment : 'Consistent studio context';
        const camMovements = [
          'Steady forward dolly glide with subtle depth shift',
          'Smooth horizontal parallax tracking shot',
          'Macro focus pull revealing intricate technical detail',
          'Elevated medium angle with atmospheric lighting sweep',
          'Centered cinematic framing with slow zoom',
        ];
        const cameraMovement = sub.cameraMovement || camMovements[(sIdx + subIdx) % camMovements.length];

        scenes.push({
          sceneIndex: sceneIndex++,
          sectionName: `${section.heading} - ${sub.subheading}`,
          narration: sub.narration,
          visualPrompt: sub.visualPrompt || `Detailed visual representation of ${sub.subheading}, cinematic depth of field, ${niche} context, smooth motion`,
          visualSubject: sub.visualSubject || sub.subheading,
          environment: sub.environment || `${niche} specific environment, ${visualStyle}`,
          cameraMovement,
          lighting: sub.lighting || `Controlled studio lighting with subtle accent rim`,
          colorStyle: sub.colorStyle || `${visualStyle} themed palette`,
          continuityNotes: sub.continuityNotes || `Maintains lighting and environmental palette from previous scene (${prevEnv})`,
          estimatedDurationSec: duration,
          subtitleText: sub.narration,
        });
      }
    }

    // Conclusion Scene
    const conclWords = script.conclusion.split(/\s+/).filter(Boolean).length;
    const conclDuration = Math.max(12, Math.round(conclWords / 2.3));
    scenes.push({
      sceneIndex: sceneIndex++,
      sectionName: 'Conclusion',
      narration: script.conclusion,
      visualPrompt: `Inspiring wide perspective closing shot summarizing ${script.title}, warm atmospheric glow, modern cinematic`,
      visualSubject: `Synthesis and summary visualization for ${script.title}`,
      environment: `Panoramic wide environment reflecting positive culmination`,
      cameraMovement: `Slow wide-angle pull-out revealing grand scale`,
      lighting: `Warm golden hour atmospheric illumination`,
      colorStyle: `${visualStyle} warm highlights`,
      continuityNotes: `Culmination of visual motifs, resolving into expansive wide shot`,
      estimatedDurationSec: conclDuration,
      subtitleText: script.conclusion,
    });

    // Call To Action Scene
    const ctaWords = script.callToAction.split(/\s+/).filter(Boolean).length;
    const ctaDuration = Math.max(8, Math.round(ctaWords / 2.3));
    scenes.push({
      sceneIndex: sceneIndex++,
      sectionName: 'Call To Action',
      narration: script.callToAction,
      visualPrompt: `Sleek branded outro visual with subtle motion, subscription and notification invitation, clean minimalist style`,
      visualSubject: `Branded channel outro graphic and engagement callout`,
      environment: `Clean minimalist branded visual canvas`,
      cameraMovement: `Subtle linear forward drift with elegant graphic overlay`,
      lighting: `Soft ambient glow on brand accents`,
      colorStyle: `${visualStyle} brand signature colors`,
      continuityNotes: `Transitions smoothly from cinematic conclusion to clean outro slate`,
      estimatedDurationSec: ctaDuration,
      subtitleText: script.callToAction,
    });

    return scenes;
  }

  generateMetadata(params: {
    script: ScriptStructure;
    scenes: GeneratedScene[];
    channelName: string;
    niche: string;
    topic: string;
  }): ProjectMetadata {
    const { script, scenes, channelName, niche, topic } = params;

    let currentSec = 0;
    const chapters: string[] = [];
    for (const scene of scenes) {
      const mins = Math.floor(currentSec / 60);
      const secs = Math.floor(currentSec % 60);
      const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      chapters.push(`${timeStr} - ${scene.sectionName}`);
      currentSec += scene.estimatedDurationSec;
    }

    const description = [
      `In this comprehensive breakdown from ${channelName}, we dive deep into ${topic}. Discover the actionable insights, proven methodologies, and scientific principles you can apply immediately.\n`,
      `📌 CHAPTERS:\n${chapters.join('\n')}\n`,
      `💡 KEY TAKEAWAYS:\n• Comprehensive analysis of ${topic}\n• Practical execution framework for ${niche}\n• Long-term sustainable compounding principles\n`,
      `🔔 SUBSCRIBE to ${channelName} for weekly in-depth breakdowns on ${niche} & high-performance strategies.\n`,
      `#${niche.replace(/\s+/g, '')} #${topic.split(' ').slice(0, 3).join('').replace(/[^a-zA-Z0-9]/g, '')} #Education #Masterclass`,
    ].join('\n');

    const cleanTopic = topic.replace(/[^a-zA-Z0-9 ]/g, '');
    const tags = [
      niche,
      channelName,
      cleanTopic,
      ...cleanTopic.split(' ').filter((w) => w.length > 3),
      `${niche} breakdown`,
      `${niche} guide`,
      'educational video',
      'mastery',
      'how to',
      'practical guide',
      'in depth analysis',
    ];

    const hashtags = [
      `#${niche.replace(/\s+/g, '')}`,
      `#${cleanTopic.split(' ').slice(0, 2).join('')}`,
      '#Guide',
      '#Mastery',
      '#Insights',
    ];

    const suggestedFilename = `${channelName.toLowerCase().replace(/\s+/g, '_')}_${cleanTopic.toLowerCase().replace(/\s+/g, '_')}.mp4`;

    return {
      youtubeTitle: `${topic} | Complete ${niche} Masterclass`,
      description,
      tags: Array.from(new Set(tags)),
      hashtags,
      shortDescription: `A comprehensive masterclass on ${topic} by ${channelName}.`,
      suggestedFilename,
    };
  }

  private buildCalibratedScript(
    channelName: string,
    niche: string,
    topic: string,
    targetLengthMinutes: number,
    introStyle?: string,
    outroCta?: string,
    visualStyle: string = 'Cinematic High-Contrast'
  ): ScriptStructure {
    const ctaText = outroCta || `If you found this breakdown valuable, subscribe to ${channelName}, like the video, and join the conversation in the comments below.`;
    const cleanTopic = topic.trim();
    const normalized = ` ${cleanTopic.toLowerCase().replace(/[^a-z0-9]/g, ' ')} `;
    const hasAnyWord = (words: string[]) => words.some((w) => normalized.includes(` ${w} `));

    // Determine domain flavor to generate rich contextual narration
    let domainFocus = 'practical frameworks, core mechanics, and actionable insights';
    let defaultEnv = 'Modern documentary studio with cinematic lighting';

    if (hasAnyWord(['space', 'galaxy', 'universe', 'astronomy', 'astrophysics', 'black hole', 'blackhole', 'nasa', 'cosmos', 'cosmic', 'planet', 'physics', 'telescope'])) {
      domainFocus = 'cosmic astrophysics, gravitational anomalies, and deep-space observation';
      defaultEnv = 'High-tech astronomical observatory with panoramic celestial visuals';
    } else if (hasAnyWord(['crypto', 'cryptocurrency', 'bitcoin', 'btc', 'ethereum', 'eth', 'blockchain', 'web3'])) {
      domainFocus = 'decentralized consensus algorithms, cryptographic proof, and digital asset economics';
      defaultEnv = 'Cryptographic analytics terminal with real-time on-chain visualizations';
    } else if (hasAnyWord(['wealth', 'money', 'finance', 'invest', 'investing', 'investment', 'stocks', 'broke', 'rich', 'cashflow', 'dollars', 'trading'])) {
      domainFocus = 'asymmetric risk management, compounding capital systems, and financial autonomy';
      defaultEnv = 'High-rise executive finance suite with floor-to-ceiling architectural glass';
    } else if (hasAnyWord(['stoic', 'stoicism', 'mindset', 'marcus', 'seneca', 'epictetus', 'philosophy', 'discipline', 'habits', 'mental', 'overthinking'])) {
      domainFocus = 'the dichotomy of control, psychological resilience, and unwavering mental clarity';
      defaultEnv = 'Serene minimalist sanctuary with classical architecture and warm natural lighting';
    } else if (hasAnyWord(['food', 'foods', 'diet', 'nutrition', 'eat', 'eating', 'meal', 'superfood', 'superfoods'])) {
      domainFocus = 'cellular nutrient density, anti-inflammatory compounds, and metabolic vitality';
      defaultEnv = 'Bright modern culinary research studio with organic whole foods';
    } else if (hasAnyWord(['health', 'healthy', 'wellness', 'longevity', 'vitality', 'cardio', 'fitness', 'exercise', 'aging'])) {
      domainFocus = 'cellular longevity protocols, metabolic resilience, and systemic vitality';
      defaultEnv = 'State-of-the-art sports science and longevity clinical suite';
    } else if (hasAnyWord(['ai', 'artificial intelligence', 'tech', 'technology', 'robot', 'robotics', 'neural', 'software', 'coding', 'computing'])) {
      domainFocus = 'frontier neural architectures, autonomous computing, and next-generation innovation';
      defaultEnv = 'Cutting-edge technology research laboratory with holographic interfaces';
    }

    const numSections = Math.max(3, Math.min(6, Math.round(targetLengthMinutes * 0.9)));
    const sectionDuration = Math.max(25, Math.round((targetLengthMinutes * 60 - 45) / numSections));

    const pillars = [
      {
        title: 'Core Fundamentals & Underlying Mechanisms',
        desc: `To truly understand ${cleanTopic}, we must first examine the foundational principles that govern this domain. Analyzing how these core factors interact provides the structural bedrock for everything that follows.`,
        subject: `Foundational mechanisms of ${cleanTopic}`,
      },
      {
        title: 'Critical Drivers & Strategic Advantages',
        desc: `When analyzing ${cleanTopic} through a data-driven lens, specific patterns emerge that separate high-performers from the rest. Leveraging these key drivers creates a sustainable, compounding advantage.`,
        subject: `Strategic analytical drivers of ${cleanTopic}`,
      },
      {
        title: 'Common Misconceptions & Fatal Pitfalls',
        desc: `A major mistake most people make when approaching ${cleanTopic} is relying on outdated assumptions. By identifying and avoiding these common traps, you bypass years of trial, error, and wasted effort.`,
        subject: `Key pitfalls and corrections regarding ${cleanTopic}`,
      },
      {
        title: 'Advanced Methodologies & Execution Protocols',
        desc: `Once the baseline is established, mastering the nuances of ${cleanTopic} requires systematic execution. Implementing structured feedback loops ensures consistent, reliable progress over time.`,
        subject: `Advanced execution frameworks for ${cleanTopic}`,
      },
      {
        title: 'Long-Term Compounding & Future Implications',
        desc: `Looking ahead, the broader impact of ${cleanTopic} will continue to compound. Those who adapt early and build resilient systems around these insights will achieve outsized results.`,
        subject: `Future trajectory and compounding impact of ${cleanTopic}`,
      },
      {
        title: 'Actionable Blueprint & Immediate Implementation',
        desc: `Theory without execution is meaningless. By breaking down ${cleanTopic} into clear, bite-sized daily action steps, you can start building momentum immediately today.`,
        subject: `Practical implementation blueprint for ${cleanTopic}`,
      },
    ];

    const sections = [];
    for (let i = 0; i < numSections; i++) {
      const p = pillars[i % pillars.length];
      sections.push({
        heading: `Part ${i + 1}: ${p.title}`,
        subsections: [
          {
            subheading: `Deep-Dive Analysis on ${cleanTopic}`,
            narration: `${p.desc} In the context of ${domainFocus}, mastering this aspect of ${cleanTopic} provides a profound shift in perspective.`,
            visualPrompt: `Cinematic, photorealistic visualization of ${p.subject}, ${visualStyle} lighting, ${defaultEnv}, 8k ultra high resolution`,
            visualSubject: p.subject,
            environment: defaultEnv,
            cameraMovement: 'Slow smooth cinematic push-in with shallow depth of field',
            lighting: 'Dramatic directional studio rim lighting with warm ambient fill',
            durationSec: sectionDuration,
          },
        ],
      });
    }

    return {
      title: cleanTopic,
      hook: `What if understanding the hidden truths behind ${cleanTopic} could fundamentally transform your perspective on ${niche}? Today, on ${channelName}, we break down the definitive blueprint.`,
      introduction: `Welcome back to ${channelName}. In this comprehensive breakdown, we are exploring ${cleanTopic}—diving deep into ${domainFocus}. Whether you are just getting started or looking to master advanced strategies, this video provides the exact principles you need.`,
      sections,
      conclusion: `Mastering ${cleanTopic} is not about luck; it is about applying consistent, validated principles and letting compounding do the work. Implement these takeaways, stay disciplined, and build for the long term.`,
      callToAction: ctaText,
    };
  }

  private async generateScriptWithGemini(
    params: {
      channelName: string;
      niche: string;
      language: string;
      topic: string;
      targetLengthMinutes: number;
      visualStyle?: string;
      introStyle?: string;
      outroCta?: string;
      contentRules?: string;
    },
    apiKey: string
  ): Promise<{ script: ScriptStructure; fullNarration: string }> {
    const targetWordCount = Math.round(params.targetLengthMinutes * 138);

    const prompt = `You are a professional video script writer and director for channel "${params.channelName}" (Niche: ${params.niche}, Language: ${params.language}, Visual Style: ${params.visualStyle || 'Cinematic'}).
Write an engaging, deep video script for the topic: "${params.topic}".
TARGET DURATION: Exactly ${params.targetLengthMinutes} minutes (Spoken narration MUST contain approximately ${targetWordCount} total words to fill this duration at 138 words per minute).
Adhere to editorial rules: ${params.contentRules || 'Engaging, clear, professional delivery'}.
Intro Hook Style: ${params.introStyle || 'High-Impact Dramatic Question'}.
Outro CTA: ${params.outroCta || 'Subscribe and hit the bell'}.

You must return valid JSON strictly conforming to this schema:
{
  "title": "${params.topic}",
  "hook": "Compelling hook (~30-50 words)",
  "introduction": "Engaging introduction (~40-60 words)",
  "sections": [
    {
      "heading": "Section Title",
      "subsections": [
        {
          "subheading": "Point Title",
          "narration": "Detailed spoken narration (~60-100 words)...",
          "visualPrompt": "Cinematic visual description for point",
          "visualSubject": "Core subject",
          "environment": "Physical setting",
          "cameraMovement": "Camera motion vector",
          "lighting": "Lighting description",
          "colorStyle": "Color palette",
          "continuityNotes": "Continuity notes from previous scene",
          "durationSec": 35
        }
      ]
    }
  ],
  "conclusion": "Insightful summary conclusion (~40-60 words)",
  "callToAction": "Call to action subscribing to ${params.channelName} (~30-50 words)"
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      signal: AbortSignal.timeout(6000),
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      throw new Error('Gemini returned empty response');
    }

    const parsed: ScriptStructure = JSON.parse(rawContent);

    const narrationParts: string[] = [parsed.hook, parsed.introduction];
    for (const sec of parsed.sections) {
      for (const sub of sec.subsections) {
        narrationParts.push(sub.narration);
      }
    }
    narrationParts.push(parsed.conclusion);
    narrationParts.push(parsed.callToAction);

    const fullNarration = narrationParts.join('\n\n');
    return { script: parsed, fullNarration };
  }

  private async generateScriptWithOpenAI(
    params: {
      channelName: string;
      niche: string;
      language: string;
      topic: string;
      targetLengthMinutes: number;
      visualStyle?: string;
      introStyle?: string;
      outroCta?: string;
      contentRules?: string;
    },
    apiKey: string
  ): Promise<{ script: ScriptStructure; fullNarration: string }> {
    const targetWordCount = Math.round(params.targetLengthMinutes * 138);

    const systemPrompt = `You are a professional video script writer and director for channel "${params.channelName}" (Niche: ${params.niche}, Language: ${params.language}, Visual Style: ${params.visualStyle || 'Cinematic'}).
Write an engaging, deep video script for the topic: "${params.topic}".
TARGET DURATION: Exactly ${params.targetLengthMinutes} minutes (Spoken narration MUST contain approximately ${targetWordCount} total words to fill this duration at 138 words per minute).
Adhere to editorial rules: ${params.contentRules || 'Engaging, clear, professional delivery'}.
Intro Hook Style: ${params.introStyle || 'High-Impact Dramatic Question'}.
Outro CTA: ${params.outroCta || 'Subscribe and hit the bell'}.

You must return valid JSON strictly conforming to this schema:
{
  "title": "${params.topic}",
  "hook": "Compelling hook (~30-50 words)",
  "introduction": "Engaging introduction (~40-60 words)",
  "sections": [
    {
      "heading": "Section Title",
      "subsections": [
        {
          "subheading": "Point Title",
          "narration": "Detailed spoken narration (~60-100 words)...",
          "visualPrompt": "Cinematic visual description for point",
          "visualSubject": "Core subject",
          "environment": "Physical setting",
          "cameraMovement": "Camera motion vector",
          "lighting": "Lighting description",
          "colorStyle": "Color palette",
          "continuityNotes": "Continuity notes from previous scene",
          "durationSec": 35
        }
      ]
    }
  ],
  "conclusion": "Insightful summary conclusion (~40-60 words)",
  "callToAction": "Call to action subscribing to ${params.channelName} (~30-50 words)"
}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate video script for: "${params.topic}"` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenAI returned empty response');
    }

    const parsed: ScriptStructure = JSON.parse(rawContent);

    const narrationParts: string[] = [parsed.hook, parsed.introduction];
    for (const sec of parsed.sections) {
      for (const sub of sec.subsections) {
        narrationParts.push(sub.narration);
      }
    }
    narrationParts.push(parsed.conclusion);
    narrationParts.push(parsed.callToAction);

    const fullNarration = narrationParts.join('\n\n');
    return { script: parsed, fullNarration };
  }
}

export const aiProvider: AiProvider = new DefaultAiProvider();
