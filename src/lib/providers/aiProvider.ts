import { ProjectMetadata, getApiKey } from '../db';
import { resolveGlobalVisualStyle, applyGlobalStyleToPrompt } from '../video/visualStyles';

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

    let script: ScriptStructure | null = null;

    // 1. Try OpenRouter if configured in DB or ENV
    const openRouterKey = getApiKey('openrouter') || process.env.OPENROUTER_API_KEY;
    if (openRouterKey) {
      try {
        const res = await this.generateScriptWithOpenRouter(params, openRouterKey);
        script = res.script;
      } catch (err: any) {
        console.warn(`[AiProvider] OpenRouter generation failed (${err.message}). Trying fallback...`);
      }
    }

    // 2. Try Google Gemini if configured in DB or ENV
    if (!script) {
      const geminiKey = getApiKey('gemini') || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (geminiKey) {
        try {
          const res = await this.generateScriptWithGemini(params, geminiKey);
          script = res.script;
        } catch (err: any) {
          console.warn(`[AiProvider] Gemini generation failed (${err.message}). Trying fallback...`);
        }
      }
    }

    // 3. Try OpenAI if configured in DB or ENV
    if (!script) {
      const openAiKey = getApiKey('openai') || process.env.OPENAI_API_KEY;
      if (openAiKey) {
        try {
          const res = await this.generateScriptWithOpenAI(params, openAiKey);
          script = res.script;
        } catch (err: any) {
          console.warn(`[AiProvider] OpenAI generation failed (${err.message}). Trying fallback...`);
        }
      }
    }

    // 4. Built-in Calibrated Multi-Niche Offline Script Engine
    if (!script) {
      script = this.buildCalibratedScript(channelName, niche, topic, targetLengthMinutes, introStyle, outroCta, visualStyle);
    }

    // Validate & Enrich word count if needed
    const targetWordCount = Math.round(targetLengthMinutes * 138);
    this.enrichScriptToTargetWordCount(script, topic, niche, targetWordCount, visualStyle || 'Cinematic High-Contrast');

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
    const globalStyle = resolveGlobalVisualStyle(visualStyle);
    const scenes: GeneratedScene[] = [];
    let sceneIndex = 1;

    // Scene 1: Hook (First 3-5 seconds high-retention visual hook)
    const hookWords = script.hook.split(/\s+/).filter(Boolean).length;
    const hookDuration = Math.max(6, Math.round(hookWords / 2.3));
    const hookCameraMovement = 'Slow linear forward push-in with centered focus';
    const hookEnvironment = `Modern documentary studio with atmospheric ambient depth matching ${niche}`;
    const rawHookPrompt = `High-impact cinematic opening visual for ${script.title}, ${niche} aesthetic, 4k ultra realistic`;
    const hookPrompt = applyGlobalStyleToPrompt(rawHookPrompt, globalStyle, {
      isHook: true,
      niche,
      environment: hookEnvironment,
      cameraMovement: hookCameraMovement,
    });

    scenes.push({
      sceneIndex: sceneIndex++,
      sectionName: 'Hook',
      narration: script.hook,
      visualPrompt: hookPrompt,
      visualSubject: `High-impact visual representation of ${script.title}`,
      environment: hookEnvironment,
      cameraMovement: hookCameraMovement,
      lighting: globalStyle.dna.lighting,
      colorStyle: globalStyle.dna.colorPalette,
      continuityNotes: `Establishes primary ${globalStyle.name} color grade and atmospheric tone for the entire video`,
      estimatedDurationSec: hookDuration,
      subtitleText: script.hook,
    });

    // Scene 2: Introduction
    const introWords = script.introduction.split(/\s+/).filter(Boolean).length;
    const introDuration = Math.max(10, Math.round(introWords / 2.3));
    const introCameraMovement = 'Gentle wide-angle horizontal tracking glide';
    const introEnvironment = `Expansive cinematic space matching ${niche} domain`;
    const rawIntroPrompt = `Wide cinematic shot establishing context for ${script.title}, ${niche} aesthetic`;
    const introPrompt = applyGlobalStyleToPrompt(rawIntroPrompt, globalStyle, {
      isHook: false,
      niche,
      environment: introEnvironment,
      cameraMovement: introCameraMovement,
    });

    scenes.push({
      sceneIndex: sceneIndex++,
      sectionName: 'Introduction',
      narration: script.introduction,
      visualPrompt: introPrompt,
      visualSubject: `Contextual thematic overview of ${script.title}`,
      environment: introEnvironment,
      cameraMovement: introCameraMovement,
      lighting: globalStyle.dna.lighting,
      colorStyle: globalStyle.dna.colorPalette,
      continuityNotes: `Expands perspective from Scene 1 while maintaining cohesive ${globalStyle.name} visual DNA`,
      estimatedDurationSec: introDuration,
      subtitleText: script.introduction,
    });

    // Section Scenes with Visual Continuity and Exact Narration Segment Mapping
    for (let sIdx = 0; sIdx < script.sections.length; sIdx++) {
      const section = script.sections[sIdx];
      for (let subIdx = 0; subIdx < section.subsections.length; subIdx++) {
        const sub = section.subsections[subIdx];
        const words = sub.narration.split(/\s+/).filter(Boolean).length;
        const duration = sub.durationSec || Math.max(8, Math.round(words / 2.3));

        const prevEnv = subIdx > 0 ? section.subsections[subIdx - 1].environment : 'Consistent documentary context';
        const camMovements = [
          'Steady forward dolly glide with subtle depth shift',
          'Smooth horizontal parallax tracking shot',
          'Macro focus pull revealing intricate technical detail',
          'Elevated medium angle with atmospheric lighting sweep',
          'Centered cinematic framing with slow zoom',
        ];
        const cameraMovement = sub.cameraMovement || camMovements[(sIdx + subIdx) % camMovements.length];
        const environment = sub.environment || `${niche} specific environment, ${globalStyle.name}`;

        const rawPrompt = sub.visualPrompt || `Detailed visual representation of ${sub.subheading}, ${niche} context, smooth motion`;
        const visualPrompt = applyGlobalStyleToPrompt(rawPrompt, globalStyle, {
          isHook: false,
          niche,
          environment,
          cameraMovement,
        });

        scenes.push({
          sceneIndex: sceneIndex++,
          sectionName: `${section.heading} - ${sub.subheading}`,
          narration: sub.narration,
          visualPrompt,
          visualSubject: sub.visualSubject || sub.subheading,
          environment,
          cameraMovement,
          lighting: sub.lighting || globalStyle.dna.lighting,
          colorStyle: sub.colorStyle || globalStyle.dna.colorPalette,
          continuityNotes: sub.continuityNotes || `Maintains lighting and environmental palette from previous scene (${prevEnv})`,
          estimatedDurationSec: duration,
          subtitleText: sub.narration,
        });
      }
    }

    // Conclusion Scene
    const conclWords = script.conclusion.split(/\s+/).filter(Boolean).length;
    const conclDuration = Math.max(10, Math.round(conclWords / 2.3));
    const conclCamera = 'Slow wide-angle pull-out revealing grand scale';
    const conclEnv = `Panoramic wide environment reflecting positive culmination in ${niche}`;
    const rawConclPrompt = `Inspiring wide perspective closing shot summarizing ${script.title}, warm atmospheric glow`;
    const conclPrompt = applyGlobalStyleToPrompt(rawConclPrompt, globalStyle, {
      isHook: false,
      niche,
      environment: conclEnv,
      cameraMovement: conclCamera,
    });

    scenes.push({
      sceneIndex: sceneIndex++,
      sectionName: 'Conclusion',
      narration: script.conclusion,
      visualPrompt: conclPrompt,
      visualSubject: `Synthesis and summary visualization for ${script.title}`,
      environment: conclEnv,
      cameraMovement: conclCamera,
      lighting: globalStyle.dna.lighting,
      colorStyle: globalStyle.dna.colorPalette,
      continuityNotes: `Culmination of visual motifs, resolving into expansive wide shot`,
      estimatedDurationSec: conclDuration,
      subtitleText: script.conclusion,
    });

    // Call To Action Scene
    const ctaWords = script.callToAction.split(/\s+/).filter(Boolean).length;
    const ctaDuration = Math.max(6, Math.round(ctaWords / 2.3));
    const ctaCamera = 'Subtle linear forward drift with elegant graphic overlay';
    const ctaEnv = `Clean minimalist branded visual canvas in ${niche}`;
    const rawCtaPrompt = `Sleek branded outro visual with subtle motion, subscription and notification invitation, clean minimalist style`;
    const ctaPrompt = applyGlobalStyleToPrompt(rawCtaPrompt, globalStyle, {
      isHook: false,
      niche,
      environment: ctaEnv,
      cameraMovement: ctaCamera,
    });

    scenes.push({
      sceneIndex: sceneIndex++,
      sectionName: 'Call To Action',
      narration: script.callToAction,
      visualPrompt: ctaPrompt,
      visualSubject: `Branded channel outro graphic and engagement callout`,
      environment: ctaEnv,
      cameraMovement: ctaCamera,
      lighting: globalStyle.dna.lighting,
      colorStyle: globalStyle.dna.colorPalette,
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
    } else if (hasAnyWord(['car', 'cars', 'supercar', 'supercars', 'bmw', 'ferrari', 'lamborghini', 'porsche', 'tesla', 'driving', 'automotive', 'racing', 'engine', 'vehicle', 'vehicles', 'speed'])) {
      domainFocus = 'aerodynamic powertrain engineering, precision vehicle dynamics, and track-tested automotive performance';
      defaultEnv = 'High-tech automotive aerodynamic design studio and sunlit mountain highway';
    } else if (hasAnyWord(['ocean', 'sea', 'marine', 'water', 'deepsea', 'nature', 'wildlife', 'animals', 'animal', 'forest', 'plants', 'gardening', 'trees'])) {
      domainFocus = 'marine biodiversity, abyssal ecosystem dynamics, and environmental conservation';
      defaultEnv = 'Expansive coastal shoreline and bioluminescent oceanic depths';
    } else if (hasAnyWord(['music', 'song', 'guitar', 'piano', 'sound', 'audio', 'beat', 'beats', 'track', 'art', 'dance', 'culture'])) {
      domainFocus = 'acoustic resonance, harmonic composition, and creative expression';
      defaultEnv = 'Modern acoustic mastering studio with warm ambient backlighting';
    } else if (hasAnyWord(['architecture', 'building', 'buildings', 'skyscraper', 'house', 'houses', 'realestate', 'construction', 'city', 'urban'])) {
      domainFocus = 'structural engineering aesthetics, spatial geometry, and sustainable architectural design';
      defaultEnv = 'Architectural design pavilion overlooking a scenic modern skyline';
    } else if (hasAnyWord(['plane', 'airplane', 'aviation', 'flight', 'mystery', 'mysteries', 'history', 'ancient', 'pyramid', 'bermuda'])) {
      domainFocus = 'historical investigations, navigational anomalies, and aviation breakthroughs';
      defaultEnv = 'Expansive aerial flight cockpit and historical exploration chamber';
    } else if (hasAnyWord(['ai', 'artificial intelligence', 'tech', 'technology', 'robot', 'robotics', 'neural', 'software', 'coding', 'computing'])) {
      domainFocus = 'frontier neural architectures, autonomous computing, and next-generation innovation';
      defaultEnv = 'Cutting-edge technology research laboratory with holographic interfaces';
    }

    const isShorts = targetLengthMinutes < 2;
    const targetWordCount = Math.round(targetLengthMinutes * 138);

    // Dynamic chapter count based on duration
    const numSections = isShorts
      ? Math.max(2, Math.min(4, Math.round(targetLengthMinutes * 4)))
      : Math.min(12, Math.max(5, Math.round(targetLengthMinutes * 1.1)));

    const sectionDuration = Math.max(15, Math.round((targetLengthMinutes * 60 - 40) / numSections));

    // Dynamic topic-driven pillar generation matching user's requested topic and niche
    const generateTopicPillars = (topicStr: string, nicheStr: string, domainStr: string) => [
      {
        title: `The Fundamentals & Core Mechanics of ${topicStr}`,
        sub1: `Understanding the Foundation of ${topicStr}`,
        desc1: `When analyzing ${topicStr}, we must first examine the core principles that govern its foundation. In the context of ${nicheStr}, understanding these baseline mechanics is essential for grasping the wider implications and long-term trajectory.`,
        sub2: `Key Drivers & Critical Dynamics`,
        desc2: `As these foundational elements interact, they generate powerful secondary effects. Industry leaders and experts in ${nicheStr} consistently point to these critical dynamics as the primary forces shaping outcomes today.`,
        subject: `High-impact cinematic conceptual visualization illustrating the core foundation of ${topicStr}`,
      },
      {
        title: `Catalysts & Rapid Transformations in ${topicStr}`,
        sub1: `The Shift in Traditional Paradigms`,
        desc1: `Recent breakthroughs and shifting landscapes have accelerated the pace of change surrounding ${topicStr}. What used to take years to develop is now evolving in real time, challenging traditional assumptions across ${nicheStr}.`,
        sub2: `Emerging Trends & Breakthrough Systems`,
        desc2: `These rapid transformations create new opportunities while dismantling obsolete methodologies. Adapting to this new reality requires a deep understanding of ${domainStr}.`,
        subject: `Cinematic wide shot showing dynamic motion and technological evolution in ${topicStr}`,
      },
      {
        title: `Strategic Frameworks & Execution Methodologies`,
        sub1: `The Blueprint for Implementation`,
        desc1: `To harness the full potential of ${topicStr}, structured frameworks are required. By breaking down complex variables into actionable phases, professionals in ${nicheStr} can maximize performance and eliminate unnecessary risk.`,
        sub2: `Optimization & Risk Mitigation`,
        desc2: `Every major shift brings unique challenges. Identifying potential friction points early enables strategic resilience and long-term sustainability in ${nicheStr}.`,
        subject: `Clean architectural perspective showing structured strategy and precision engineering for ${topicStr}`,
      },
      {
        title: `Data Insights & Macro Perspectives`,
        sub1: `Quantitative Evidence & Pattern Recognition`,
        desc1: `Empirical data surrounding ${topicStr} reveals clear patterns. Analyzing historical data points alongside modern benchmarks provides an undeniable perspective on where ${nicheStr} is heading.`,
        sub2: `Comparative Analysis & Industry Standards`,
        desc2: `When compared to historical precedents, the current trajectory of ${topicStr} highlights unprecedented shifts in behavioral and economic models.`,
        subject: `High-tech analytical terminal display visualizing data curves and insights for ${topicStr}`,
      },
      {
        title: `Real-World Case Studies & Field Applications`,
        sub1: `Practical Execution in Modern Environments`,
        desc1: `Theory only tells half the story. Examining real-world applications of ${topicStr} demonstrates how top performers navigate obstacles and capitalize on emerging advantages.`,
        sub2: `Measurable Outcomes & Key Takeaways`,
        desc2: `The results speak for themselves. Those who proactively integrate these principles achieve compound advantages across every facet of ${nicheStr}.`,
        subject: `Dynamic medium-angle shot of real-world implementation and high performance in ${topicStr}`,
      },
      {
        title: `The Future Horizon: Long-Term Outlook for ${topicStr}`,
        sub1: `Next-Generation Evolution & Horizon Scanning`,
        desc1: `Looking ahead, the evolution of ${topicStr} promises to redefine the boundaries of ${nicheStr}. Early adopters who position themselves along these emerging frontiers will lead the next decade.`,
        sub2: `Final Synthesis & Actionable Directive`,
        desc2: `Mastering ${topicStr} is not just an advantage—it is a necessity. By taking decisive action today, you unlock new levels of growth, efficiency, and long-term success.`,
        subject: `Breathtaking inspiring cinematic sunrise perspective symbolizing the bright future of ${topicStr}`,
      },
    ];

    const pillars = generateTopicPillars(cleanTopic, niche, domainFocus);

    const sections = [];
    for (let i = 0; i < numSections; i++) {
      const p = pillars[i % pillars.length];
      const partNum = i + 1;

      // In shorts mode, provide concise punchy narration; in long-form, provide full multi-sentence paragraphs
      const narrationA = isShorts
        ? `Look closely at ${p.title}. When analyzing ${cleanTopic}, ${p.desc1.slice(0, 110)}.`
        : `${p.desc1}`;

      const narrationB = isShorts
        ? `This leads directly to ${p.sub2}. ${p.desc2.slice(0, 100)}.`
        : `${p.desc2}`;

      const sub1Duration = Math.max(8, Math.round((sectionDuration / 2) * 10) / 10);
      const sub2Duration = Math.max(8, Math.round((sectionDuration / 2) * 10) / 10);

      sections.push({
        heading: `Part ${partNum}: ${p.title}`,
        subsections: [
          {
            subheading: p.sub1,
            narration: narrationA,
            visualPrompt: `Cinematic photorealistic 8k visualization of ${p.title} - ${p.sub1}, focusing on ${p.subject}, ${visualStyle} lighting, ${defaultEnv}, 35mm anamorphic lens, volumetric atmospheric depth`,
            visualSubject: p.subject,
            environment: defaultEnv,
            cameraMovement: 'Slow steady cinematic push-in with shallow depth of field',
            lighting: 'Dramatic directional studio rim lighting with volumetric haze',
            colorStyle: `${visualStyle} color grade`,
            continuityNotes: `Establishes dramatic visual continuity for Part ${partNum}`,
            durationSec: sub1Duration,
          },
          {
            subheading: p.sub2,
            narration: narrationB,
            visualPrompt: `High-impact cinematic shot depicting ${p.sub2}, ${p.subject}, atmospheric haze, photorealistic documentary style, ${visualStyle}`,
            visualSubject: p.subject,
            environment: defaultEnv,
            cameraMovement: 'Smooth horizontal parallax tracking glide',
            lighting: 'High-contrast cinematic illumination with deep atmospheric shadows',
            colorStyle: `${visualStyle} palette`,
            continuityNotes: `Direct continuous transition from ${p.sub1}`,
            durationSec: sub2Duration,
          },
        ],
      });
    }

    const hookText = isShorts
      ? `What is the real secret behind ${cleanTopic}? In the next 60 seconds, everything you thought you knew changes.`
      : `What is the true power behind ${cleanTopic}? Across ${niche}, this breakthrough is reshaping how we understand ${domainFocus}. Here is the complete breakdown.`;

    const introText = isShorts
      ? `Welcome to ${channelName}. Most people misunderstand ${cleanTopic}, but the actual mechanisms are far more fascinating.`
      : `Welcome back to ${channelName}. Today, we are conducting an in-depth analysis of ${cleanTopic}. What you are about to discover will give you a strategic advantage in ${niche}.`;

    const conclusionText = isShorts
      ? `Understanding ${cleanTopic} is the key to mastering ${niche}. Apply these principles today.`
      : `The analysis of ${cleanTopic} proves how rapidly ${niche} is evolving. By understanding these core mechanisms, you stay ahead of the curve and position yourself for long-term success.`;

    return {
      title: cleanTopic,
      hook: hookText,
      introduction: introText,
      sections,
      conclusion: conclusionText,
      callToAction: ctaText,
    };
  }

  // Count total spoken words across all script elements
  private countScriptWords(script: ScriptStructure): number {
    let count = (script.hook || '').split(/\s+/).filter(Boolean).length;
    count += (script.introduction || '').split(/\s+/).filter(Boolean).length;
    for (const sec of script.sections || []) {
      for (const sub of sec.subsections || []) {
        count += (sub.narration || '').split(/\s+/).filter(Boolean).length;
      }
    }
    count += (script.conclusion || '').split(/\s+/).filter(Boolean).length;
    count += (script.callToAction || '').split(/\s+/).filter(Boolean).length;
    return count;
  }

  // Script Length Validator & Auto-Enricher: ensures script reaches required word count
  private enrichScriptToTargetWordCount(
    script: ScriptStructure,
    topic: string,
    niche: string,
    targetWordCount: number,
    visualStyle: string
  ): void {
    let currentWords = this.countScriptWords(script);
    if (currentWords >= targetWordCount * 0.85) return;

    console.log(`[AiProvider] Script word count (${currentWords}) is below target (${targetWordCount}). Auto-enriching narrative depth...`);

    const cleanTopic = topic.trim();
    const additions = [
      `Delving deeper into this phenomenon reveals a critical dimension that scientific models frequently emphasize. When analyzing the cascading secondary effects of ${cleanTopic}, researchers note that the interactions between structural resistance and kinetic energy produce nonlinear feedback loops. This means that initial disruptions do not simply resolve—they compound over time, amplifying both thermal and gravitational stresses.`,
      `To fully understand the global implications of this scenario, we have to examine the historical and theoretical parallels documented across modern computational simulations. Every data point confirms that the threshold between systemic stability and sudden collapse is astonishingly narrow, requiring us to re-evaluate our fundamental assumptions about ${cleanTopic}.`,
      `Furthermore, empirical observations demonstrate that environmental adaptation under such extreme conditions follows very specific physical laws. As the primary forces reshape the landscape, secondary ecosystems and atmospheric layers begin to reorganize into unfamiliar patterns, proving that nature's capacity for recalibration is both terrifying and resilient.`,
      `The strategic takeaway from this analysis goes far beyond theoretical curiosity. By studying what happens when the core mechanisms of ${cleanTopic} are pushed to their absolute limits, scientists gain invaluable insights into how fragile our everyday reality truly is, and what it takes to preserve long-term systemic balance.`,
    ];

    let addIdx = 0;
    while (currentWords < targetWordCount * 0.88 && addIdx < additions.length * 3) {
      for (const sec of script.sections) {
        if (currentWords >= targetWordCount * 0.88) break;
        const textToAdd = additions[addIdx % additions.length];
        if (sec.subsections.length > 0) {
          const targetSub = sec.subsections[addIdx % sec.subsections.length];
          targetSub.narration += `\n\n${textToAdd}`;
          currentWords = this.countScriptWords(script);
        }
        addIdx++;
      }
    }

    console.log(`[AiProvider] Script enriched successfully to ${currentWords} words (Target: ${targetWordCount}).`);
  }

  private buildMasterPrompt(params: {
    channelName: string;
    niche: string;
    language: string;
    topic: string;
    targetLengthMinutes: number;
    visualStyle?: string;
    introStyle?: string;
    outroCta?: string;
    contentRules?: string;
  }): string {
    const targetWordCount = Math.round(params.targetLengthMinutes * 138);
    const isLongForm = params.targetLengthMinutes >= 2;
    const minSections = isLongForm ? Math.min(12, Math.max(6, Math.round(params.targetLengthMinutes))) : 3;

    const isHealthTopic = /health|wellness|longevity|disease|medical|medicine|diet|nutrition|supplement|aging|vitality|symptom|cancer|cardio|fitness|gut\b/i.test(
      `${params.topic} ${params.niche}`
    );

    const healthSafeguard = isHealthTopic
      ? `\nHEALTH CONTENT SAFEGUARD DIRECTIVE (STRICT REGULATORY & PLATFORM COMPLIANCE):
- The topic involves health, longevity, nutrition, or medical science.
- You MUST ensure all statements are strictly educational, informational, and grounded in reputable scientific consensus.
- NEVER provide individualized medical diagnosis, prescriptive treatment protocols, or claim miraculous cures for diseases.
- Frame advice around lifestyle, holistic habits, and balanced nutrition, with clear encouragement to consult licensed healthcare providers.`
      : '';

    const formatInstructions = isLongForm
      ? `TARGET DURATION: Exactly ${params.targetLengthMinutes} minutes.
Spoken narration across all sections MUST contain approximately ${targetWordCount} words total (calculated at standard documentary speech rate of 138 words per minute).
LONG-FORM STRUCTURE REQUIREMENTS (MANDATORY):
- Provide between ${minSections} and ${Math.min(14, minSections + 2)} distinct, deeply developed chapters/sections.
- Each chapter/section MUST contain 2 to 3 detailed subsections.
- Each subsection narration MUST be an in-depth, rich, spoken analysis containing between 80 and 130 words.
- NEVER produce a brief summary or skip sections. Each point must explore specific real-world mechanisms, physics, historical parallels, or psychological triggers.
- Ensure the cumulative narration across all sections reaches ~${targetWordCount} words.`
      : `TARGET DURATION: Shorts format (${Math.round(params.targetLengthMinutes * 60)} seconds).
Spoken narration MUST contain approximately ${targetWordCount} words total (~${targetWordCount} words, high tempo, instant visual hook, zero filler).`;

    return `You are a world-class documentary director and lead video writer for channel "${params.channelName}" (Niche: ${params.niche}, Language: ${params.language}, Visual Style: ${params.visualStyle || 'Cinematic'}).
Write a mesmerizing, high-retention video script for the exact topic: "${params.topic}".

${formatInstructions}
Adhere to channel tone: ${params.contentRules || 'Engaging, clear, professional delivery'}.
Intro Hook Style: ${params.introStyle || 'High-Impact Dramatic Question'}.
Outro CTA: ${params.outroCta || 'Subscribe and hit the bell'}.${healthSafeguard}

CRITICAL NARRATIVE CONTINUITY & SCENE COHESION RULES (MANDATORY FOR COMMERCIAL SAAS):
1. SEAMLESS STORYTELLING: The script MUST flow as a single continuous story without disjointed cuts.
   - Scene 1 (Hook): Grips the audience with high tension, mystery, or a provocative question directly about "${params.topic}".
   - Scene 2 (Intro): Bridges from the hook into the core thesis ("Here is the astonishing truth...").
   - Middle Scenes: Every subsection MUST begin with a natural narrative bridge connecting from the previous point (e.g., "To see this in action...", "Now look closer at...", "This breakthrough changes everything...").
   - Conclusion & CTA: Resolves the journey with inspiring perspective and a compelling subscriber call to action.
2. VISUAL CONTINUITY:
   - Every "visualPrompt" MUST explicitly depict the subject matter of "${params.topic}" (NEVER use generic office or laptop stock descriptions unless the topic is specifically about office work).
   - All visualPrompts MUST share the same aesthetic DNA: "${params.visualStyle || 'Cinematic High-Contrast'}, 35mm anamorphic, volumetric cinematic lighting, 8k resolution, photorealistic".
   - "continuityNotes" must specify camera and color continuity from the preceding shot.

You must return valid JSON strictly conforming to this schema:
{
  "title": "${params.topic}",
  "hook": "High-impact opening hook (~30-50 words)",
  "introduction": "Compelling narrative bridge into the story (~40-60 words)",
  "sections": [
    {
      "heading": "Act / Chapter Title",
      "subsections": [
        {
          "subheading": "Scene Specific Title",
          "narration": "Deep narrative spoken text with transitional bridge (~80-120 words)...",
          "visualPrompt": "Detailed cinematic visual prompt specifically depicting this moment of ${params.topic}, ${params.visualStyle || 'Cinematic'}, 4k photo",
          "visualSubject": "Main subject in motion",
          "environment": "Physical cinematic setting",
          "cameraMovement": "Slow cinematic forward dolly / tracking glide",
          "lighting": "Atmospheric dramatic lighting matching the mood",
          "colorStyle": "${params.visualStyle || 'Cinematic'} color palette",
          "continuityNotes": "Matches color grade and visual motif from preceding scene",
          "durationSec": 30
        }
      ]
    }
  ],
  "conclusion": "Resonant philosophical or practical summary (~40-60 words)",
  "callToAction": "Natural subscriber call to action for ${params.channelName} (~30-50 words)"
}`;
  }

  private async generateScriptWithOpenRouter(
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
    const prompt = this.buildMasterPrompt(params);
    let formattedKey = apiKey.trim();
    if (!formattedKey.startsWith('sk-or-v1-') && formattedKey.length === 64) {
      formattedKey = `sk-or-v1-${formattedKey}`;
    }
    const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(120000),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${formattedKey}`,
        'HTTP-Referer': 'https://youtube-automation-three-neon.vercel.app/',
        'X-Title': 'YouTube Automation SaaS',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an award-winning documentary director and video scriptwriter. You strictly output valid JSON matching the requested schema without markdown wrapping.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 8000,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter API error (${res.status}): ${errText.substring(0, 200)}`);
    }

    const data = await res.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenRouter returned empty response');
    }

    let parsed: ScriptStructure;
    try {
      let cleaned = rawContent.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      parsed = JSON.parse(cleaned);
    } catch (e: any) {
      throw new Error(`Failed to parse OpenRouter JSON output: ${e.message}`);
    }

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
    const prompt = this.buildMasterPrompt(params);

    let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      signal: AbortSignal.timeout(120000),
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
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!res.ok) {
      // Fallback with standard settings
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        signal: AbortSignal.timeout(120000),
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
            maxOutputTokens: 8192,
          },
        }),
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      throw new Error('Gemini returned empty response');
    }

    let cleaned = rawContent.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed: ScriptStructure = JSON.parse(cleaned);

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
    const prompt = this.buildMasterPrompt(params);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an award-winning documentary director and video scriptwriter. You strictly output valid JSON.' },
          { role: 'user', content: prompt },
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
