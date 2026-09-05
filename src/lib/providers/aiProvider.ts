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
    visualStyle?: string
  ): ScriptStructure {
    const lowerNiche = niche.toLowerCase();
    const isHealth = lowerNiche.includes('health') || topic.toLowerCase().includes('health');
    const isTech = lowerNiche.includes('tech') || lowerNiche.includes('ai') || topic.toLowerCase().includes('tech') || topic.toLowerCase().includes('ai');
    const isBusiness = lowerNiche.includes('business') || lowerNiche.includes('finance') || topic.toLowerCase().includes('business') || topic.toLowerCase().includes('money');

    const ctaText = outroCta || `If you found this breakdown valuable, subscribe to ${channelName}, like the video, and join the conversation in the comments below.`;

    // 8-Minute Comprehensive Script (~1150 words -> ~480s audio duration)
    if (targetLengthMinutes >= 7 && isHealth) {
      return {
        title: topic,
        hook: `What if five scientifically validated adjustments to your morning routine could dramatically increase your daily cognitive clarity, optimize your cellular energy production, and compound into decades of vibrant physical longevity? Today, on ${channelName}, we break down the definitive clinical blueprint for morning vitality.`,
        introduction: `Welcome back to ${channelName}. The first two hours after waking set the biochemical foundation for your entire metabolic, cardiovascular, and neurological performance throughout the rest of the day. When you understand how circadian biology, cellular hydration, cortisol curves, and neurotransmitter pathways interact in sequence, you can intentionally design a morning protocol that delivers sustained all-day focus, robust metabolic flexibility, and lasting physical resilience without afternoon crashes.`,
        sections: [
          {
            heading: 'Habit 1: Targeted Cellular Hydration with Essential Mineral Electrolytes',
            subsections: [
              {
                subheading: 'Reversing Nocturnal Hypovolemia and Blood Viscosity',
                narration: 'During seven to eight hours of sleep, the human body loses between six hundred to nine hundred milliliters of water through nocturnal respiration and perspiration. Waking up in this state of mild hypovolemia significantly increases blood viscosity, forcing your cardiovascular system to work harder and reducing cerebral microcirculation. Drinking five hundred to seven hundred milliliters of filtered water immediately upon waking restores vascular volume, stimulates renal filtration, and enhances oxygen delivery to the frontal cortex, rapidly dispelling early morning cognitive brain fog and sluggishness.',
                visualPrompt: 'Cinematic glass of pure mountain mineral water filling in slow motion, refreshing droplets, clean laboratory aesthetic',
                visualSubject: 'Pure structured water pouring into crystal glassware',
                environment: 'Clean minimalist wellness laboratory',
                cameraMovement: 'Slow macro push-in on water surface tension',
                lighting: 'Crisp bright morning diffuse lighting',
                durationSec: 46,
              },
              {
                subheading: 'Electrolyte Transport and Mitochondrial ATP Activation',
                narration: 'Pure plain water is often insufficient to rehydrate intracellular compartments quickly without adequate minerals. Adding a quarter teaspoon of unrefined Himalayan pink salt or bioavailable magnesium glycinate provides vital sodium, potassium, and chloride ions. These electrolytes activate the cellular sodium-potassium ATPase pump, accelerating fluid absorption across intestinal membranes and fueling mitochondrial energy synthesis before you ever consume your first meal of the day, ensuring high baseline cellular vitality.',
                visualPrompt: 'Microscopic 3D animation of cellular membranes absorbing mineral ions, glowing mitochondrial energy surge, 4k scientific visualization',
                visualSubject: 'Cellular ion transport and mitochondrial ATP activation',
                environment: 'Microscopic cellular biology environment with soft glow',
                cameraMovement: 'Smooth orbital rotation around cellular membrane',
                lighting: 'Luminescent bio-fluorescent lighting',
                durationSec: 46,
              },
              {
                subheading: 'Supporting Vascular Endothelium and Renal Clearance',
                narration: 'Proper early morning mineralized hydration also stimulates vascular endothelial nitric oxide synthase, relaxing arterial smooth muscles and promoting healthy baseline blood pressure. It enhances glomerular filtration in the kidneys, assisting your excretory pathways in filtering out metabolic acids that accumulate overnight, leaving your tissues revitalized and primed for physical movement.',
                visualPrompt: 'Sleek visual graphic of vascular circulation and healthy blood flow through microscopic vessels, 4k medical illustration',
                visualSubject: 'Endothelial nitric oxide signaling and blood circulation',
                environment: 'Medical visualization studio with clean aesthetic',
                cameraMovement: 'Smooth tracking motion along vascular pathways',
                lighting: 'Volumetric emerald and indigo lighting',
                durationSec: 44,
              },
            ],
          },
          {
            heading: 'Habit 2: Early Natural Solar Photon Viewing for Circadian Biology',
            subsections: [
              {
                subheading: 'Activating Melanopsin Retinal Ganglion Cells',
                narration: 'Viewing natural morning sunlight within thirty minutes of waking delivers specialized blue and orange wavelengths of light directly to your intrinsically photosensitive retinal ganglion cells. These specialized neurons send an immediate monosynaptic signal via the retinohypothalamic tract to the suprachiasmatic nucleus, the master circadian clock of the human brain. This triggers an optimal morning cortisol peak that promotes energetic wakefulness while simultaneously synchronizing trillions of peripheral cellular clocks across your liver, heart, and metabolic tissues.',
                visualPrompt: 'Morning golden hour sunlight streaming across a lush outdoor landscape, warm solar rays illuminating serene environment',
                visualSubject: 'Natural morning solar rays breaking over horizon',
                environment: 'Serene mountain landscape at sunrise',
                cameraMovement: 'Wide horizontal panoramic glide',
                lighting: 'Warm golden hour direct sunlight',
                durationSec: 48,
              },
              {
                subheading: 'Setting the Nocturnal Melatonin Release Timer',
                narration: 'In addition to stimulating daytime alertness and upregulating dopamine receptors for enhanced motivation, early solar exposure initiates an automatic sixteen-hour biochemical countdown. When your brain registers high-lux morning photons, it suppresses melatonin during the day and programs the pineal gland to release a surge of natural melatonin precisely sixteen hours later, ensuring deep slow-wave restorative sleep when night falls and protecting long-term neurocognitive health.',
                visualPrompt: 'Person enjoying early morning sunlight outdoors, feeling energized and centered, clean cinematic portrait',
                visualSubject: 'Energized individual in natural morning atmosphere',
                environment: 'Sunlit outdoor terrace with green botanicals',
                cameraMovement: 'Medium profile tracking pan',
                lighting: 'Soft warm backlight with lens flare',
                durationSec: 48,
              },
            ],
          },
          {
            heading: 'Habit 3: Dynamic Multi-Planar Mobility and Lymphatic Drainage',
            subsections: [
              {
                subheading: 'Stimulating Synovial Articulation and Decompressing the Spine',
                narration: 'Engaging in five to ten minutes of full-body dynamic joint mobility, gentle spinal articulation, and deep thoracic rotation increases temperature within connective tissues and circulates nourishing synovial fluid across cartilage surfaces. This counteracts overnight spinal disc compression and relieves early morning stiffness, preparing your musculoskeletal framework for upright movement, physical load, and optimal posture throughout the day.',
                visualPrompt: 'Clean minimalist wellness studio, dynamic yoga and mobility routine, smooth steady camera glide',
                visualSubject: 'Dynamic full-body spinal mobility and articulation',
                environment: 'Hardwood minimalist studio with neutral aesthetic',
                cameraMovement: 'Steady linear tracking glide',
                lighting: 'High-key natural window light',
                durationSec: 46,
              },
              {
                subheading: 'Mechanically Pumping the Lymphatic Clearance System',
                narration: 'Unlike your cardiovascular system, which relies on the heart as a central muscular pump, your lymphatic system relies almost exclusively on skeletal muscle contractions and diaphragmatic breathing to move fluid. Dynamic morning movement stimulates the thoracic duct and regional lymph nodes, accelerating the clearance of metabolic waste, cellular debris, and inflammatory byproducts that accumulated in your interstitial fluids overnight.',
                visualPrompt: '3D anatomical illustration showing lymphatic fluid flow through the human vascular system, sleek medical graphic',
                visualSubject: '3D anatomical visualization of lymphatic drainage pathways',
                environment: 'Futuristic medical visualization studio',
                cameraMovement: 'Slow vertical tilt along the spinal column',
                lighting: 'Cyan and emerald volumetric medical illumination',
                durationSec: 46,
              },
            ],
          },
          {
            heading: 'Habit 4: High-Density Protein Nutrition and Glycemic Stability',
            subsections: [
              {
                subheading: 'Preventing Reactive Hypoglycemia and Satiety Signaling',
                narration: 'Consuming thirty to forty grams of high-quality complete protein in your first meal provides sustained amino acid release and prevents the rapid blood glucose spikes and subsequent reactive hypoglycemic crashes associated with refined carbohydrate breakfasts. Protein intake stimulates peptide YY and glucagon-like peptide one while suppressing ghrelin, ensuring stable baseline energy levels and sharp mental performance without mid-morning cravings or energy slumps.',
                visualPrompt: 'Gourmet organic breakfast plate with poached eggs, fresh avocado, vibrant greens and berries, high contrast food photography',
                visualSubject: 'Nutrient-dense organic high-protein meal presentation',
                environment: 'Modern architectural kitchen with marble countertops',
                cameraMovement: 'Overhead 45-degree slow orbital arc',
                lighting: 'Clean directional studio culinary lighting',
                durationSec: 48,
              },
              {
                subheading: 'Supplying Precursors for Neurotransmitter Synthesis',
                narration: 'Bioavailable dietary proteins supply vital aromatic amino acids like L-tyrosine and tryptophan, which cross the blood-brain barrier to serve as essential chemical precursors for dopamine, norepinephrine, and serotonin. This neurochemical substrate directly supports working memory, executive cognitive control, neurotransmitter balance, and emotional equilibrium as you tackle complex challenges.',
                visualPrompt: 'Molecular structure animation of amino acids assembling into neural transmitters, premium 3D graphics',
                visualSubject: 'Molecular amino acid synthesis graphic',
                environment: 'Abstract conceptual scientific space',
                cameraMovement: 'Smooth camera dolly through molecular bonds',
                lighting: 'Vibrant spectral highlights on molecular nodes',
                durationSec: 46,
              },
            ],
          },
          {
            heading: 'Habit 5: Protecting the Brain with Mindful Proactive Focus',
            subsections: [
              {
                subheading: 'Guarding Against Early Cortisol and Dopamine Hijacking',
                narration: 'Reaching for your smartphone the moment you wake up floods your prefrontal cortex with uncurated alerts, breaking headlines, and social comparisons. This induces acute anticipatory anxiety, spikes cortisol unnecessarily, and traps your brain in a reactive, fragmented dopamine-seeking state for the rest of the day. Keeping your first thirty minutes completely screen-free protects your sovereign mental clarity, emotional autonomy, and proactive decision-making capacity.',
                visualPrompt: 'Minimalist wooden workspace, smartphone placed facedown next to a journal and warm cup of tea, calm morning atmosphere',
                visualSubject: 'Digital detox workspace with journal and warm tea',
                environment: 'Calm Scandinavian wooden studio workspace',
                cameraMovement: 'Slow linear push-in towards analog journal',
                lighting: 'Warm diffused morning window light',
                durationSec: 48,
              },
              {
                subheading: 'Deliberate Priority Architecture and Cognitive Priming',
                narration: 'Dedicate five quiet minutes to write down your top three high-impact objectives before opening your email inbox or communicating with external demands. This deliberate priority architecture primes your brain to focus on needle-moving strategic actions rather than getting lost in low-value busywork, creating a profound sense of purpose, agency, and calm momentum from the very start of the day.',
                visualPrompt: 'Fountain pen writing clearly in a leather notebook, intentional handwriting, warm morning sunlight on desk',
                visualSubject: 'Fountain pen crafting deliberate daily priorities',
                environment: 'Serene desk environment with clean morning aesthetics',
                cameraMovement: 'Close-up macro pan across handwritten goals',
                lighting: 'Golden morning raking light across paper texture',
                durationSec: 46,
              },
            ],
          },
        ],
        conclusion: `Transforming your long-term health does not require radical, exhausting overhauls. By systematically implementing cellular hydration, natural light viewing, dynamic movement, protein nutrition, and mindful focus, you establish an unbreakable daily foundation for physical vitality and mental excellence that compounds for decades of vibrant living.`,
        callToAction: ctaText,
      };
    }

    // 5-Minute Comprehensive Script (~700 words -> ~300s audio duration)
    if (targetLengthMinutes >= 4 && isTech) {
      return {
        title: topic,
        hook: `From autonomous cognitive workflows to precision medical breakthroughs and multimodal reasoning, artificial intelligence is no longer an abstract future technology—it is the foundational compute engine actively reshaping global commerce, science, and human potential right before our eyes.`,
        introduction: `Welcome back to ${channelName}. Advanced neural architectures, frontier foundation models, and autonomous intelligent agent frameworks are advancing at an exponential velocity. In this comprehensive technical breakdown, we explore the four core pillars where artificial intelligence is creating measurable, permanent breakthroughs across enterprise operations, scientific discovery, personalized education, and autonomous infrastructure.`,
        sections: [
          {
            heading: '1. Intelligent Cognitive Augmentation and Enterprise Automation',
            subsections: [
              {
                subheading: 'Eliminating Operational Friction in Knowledge Work',
                narration: 'Modern large language models and neural code synthesis engines can parse vast repositories of technical documentation, synthesize complex financial data, and automate boilerplate programming in seconds. This eliminates repetitive administrative friction and frees knowledge workers to focus entirely on high-level strategic reasoning, architectural design, and creative problem solving across every domain.',
                visualPrompt: 'Futuristic digital workspace with sleek holographic code interfaces, data streams flowing smoothly, high tech aesthetics',
                visualSubject: 'Neural code generation and holographic data streams',
                environment: 'Modern high-tech workspace with multi-monitor setup',
                cameraMovement: 'Slow forward dolly past floating interface widgets',
                lighting: 'Cool blue and cyan neon accents with dark slate backdrop',
                durationSec: 40,
              },
              {
                subheading: 'Persistent Contextual Collaborative Agent Swarms',
                narration: 'Rather than acting as isolated prompt-and-response tools, modern intelligent agents now operate as persistent contextual partners. They monitor complex multi-step workflows, anticipate operational bottlenecks, orchestrate cross-platform tasks autonomously, and continuously self-correct their own code execution to guarantee high-reliability outcomes across distributed engineering teams.',
                visualPrompt: 'Split-screen graphic showing professional collaborating with an intelligent AI copilot interface, sleek UI design',
                visualSubject: 'Human-AI collaborative workflow visual interface',
                environment: 'Minimalist corporate tech headquarters',
                cameraMovement: 'Horizontal tracking shot across workstation',
                lighting: 'Clean recessed LED lighting with ambient screen glow',
                durationSec: 40,
              },
            ],
          },
          {
            heading: '2. Precision Healthcare and Computational Molecular Discovery',
            subsections: [
              {
                subheading: 'Deep Learning Computer Vision in Clinical Radiology',
                narration: 'Deep learning convolutional and transformer vision networks trained on millions of high-resolution medical scans can detect micro-calcifications, subtle vascular lesions, and early cellular anomalies months before traditional clinical observation, drastically improving early diagnosis rates in oncology, neurology, and cardiology with sub-millimeter precision.',
                visualPrompt: 'High-tech medical imaging display with AI neural overlay identifying biomarkers, clean clinical lighting',
                visualSubject: 'Computer vision diagnostics detecting micro-anomalies',
                environment: 'Advanced clinical diagnostic suite',
                cameraMovement: 'Slow zoom into high-resolution scan analysis',
                lighting: 'High-contrast clinical white and electric blue',
                durationSec: 40,
              },
              {
                subheading: 'Accelerated Molecular Docking and Generative Therapeutics',
                narration: 'By predicting complex three-dimensional protein folding and molecular dynamics in minutes rather than decades of laborious wet-lab trials, generative biological models are unlocking novel therapeutic compounds and enabling hyper-personalized medicine custom-tailored for individual patient genomes and cellular mutation profiles.',
                visualPrompt: '3D interactive simulation of complex protein structures folding in real time, glowing chemical bonds, biotech laboratory',
                visualSubject: '3D computational protein folding and molecular docking',
                environment: 'Biotech supercomputing research facility',
                cameraMovement: 'Orbital 360-degree rotation around protein complex',
                lighting: 'Vibrant bioluminescent violet and amber points',
                durationSec: 40,
              },
            ],
          },
          {
            heading: '3. Adaptive Education and Universal Knowledge Synthesis',
            subsections: [
              {
                subheading: 'Real-Time Dynamic Comprehension Modeling',
                narration: 'Adaptive educational neural models analyze a student\'s comprehension level in real time, breaking down advanced mathematical, scientific, and philosophical concepts into customized interactive analogies matched to the learner\'s unique cognitive velocity, providing every student with a world-class private tutor.',
                visualPrompt: 'Student using an intuitive holographic educational interface, interactive 3D learning models, futuristic classroom',
                visualSubject: 'Adaptive educational interface custom-tailoring curriculum',
                environment: 'Futuristic modern classroom with natural wood and digital displays',
                cameraMovement: 'Gentle arc shot around student workstation',
                lighting: 'Soft warm diffuse lighting with interactive UI glow',
                durationSec: 38,
              },
              {
                subheading: 'Zero-Latency Multi-Modal Speech Translation',
                narration: 'Zero-latency neural voice translation completely removes linguistic boundaries worldwide, allowing researchers, engineers, and curious minds anywhere on the planet to collaborate seamlessly and access global scientific repositories in their native language.',
                visualPrompt: 'Global network map with illuminated nodes connecting learners across diverse continents, modern motion graphics',
                visualSubject: 'Interconnected global network nodes across continents',
                environment: 'Digital globe visualization space',
                cameraMovement: 'Wide cinematic pull-back revealing global network',
                lighting: 'Deep navy background with glowing gold and cyan connections',
                durationSec: 36,
              },
            ],
          },
          {
            heading: '4. Autonomous Systems and Intelligent Municipal Infrastructure',
            subsections: [
              {
                subheading: 'Predictive Sensor Fusion and Real-Time Trajectory Optimization',
                narration: 'Autonomous mobility systems combine end-to-end computer vision, radar arrays, and lidar point clouds to calculate predictive vehicle trajectories in milliseconds, significantly reducing transit accidents and optimizing urban logistics through intelligent traffic signal coordination.',
                visualPrompt: 'Autonomous electric vehicle smoothly navigating modern city streets at dusk, lidar and vision sensor point cloud overlay',
                visualSubject: 'Autonomous vehicle sensor fusion point cloud mapping',
                environment: 'Modern metropolitan boulevard at twilight',
                cameraMovement: 'Low-angle tracking shot alongside vehicle',
                lighting: 'Dusk sky with vibrant vehicle headlights and lidar pulse highlights',
                durationSec: 38,
              },
            ],
          },
        ],
        conclusion: `Artificial intelligence is fundamentally upgrading the foundational infrastructure of human productivity, healthcare diagnostics, scientific research, and education. Mastering these transformative technologies will be the defining competitive advantage of the next decade.`,
        callToAction: ctaText,
      };
    }

    // 3-Minute Comprehensive Script (~420 words -> ~180s audio duration)
    if (isBusiness) {
      return {
        title: topic,
        hook: `Why do elite software and digital businesses achieve eighty-five percent gross margins and twenty-times revenue valuation multiples, while traditional companies struggle with linear unit economics and razor-thin profits? In today's video, we break down the financial mechanics that separate market leaders from fragile operations.`,
        introduction: `Welcome back to ${channelName}. Building a high-margin enterprise requires mastering customer acquisition efficiency, lifetime value ratios, negative net revenue churn, and capital reinvestment flywheels. Today, we dissect the core economic pillars top venture-backed founders and corporate executives use to scale profitably and build enduring moats.`,
        sections: [
          {
            heading: '1. Customer Acquisition Economics and Payback Cycles',
            subsections: [
              {
                subheading: 'The Critical Lifetime Value to Acquisition Ratio',
                narration: 'A sustainable business engine requires a customer lifetime value that is at least three to four times the fully-loaded cost of acquisition. Keeping payback periods under twelve months allows companies to rapidly redeploy positive cash flows into scalable marketing channels without relying on dilutive external capital or taking on risky debt.',
                visualPrompt: 'Modern corporate boardroom with executive financial dashboard displaying customer acquisition efficiency curves',
                visualSubject: 'Unit economics and LTV/CAC financial ratio metrics',
                environment: 'High-rise executive boardroom with floor-to-ceiling glass',
                cameraMovement: 'Slow cinematic tracking past digital analytics display',
                lighting: 'Crisp morning daylight with subtle gold architectural accents',
                durationSec: 38,
              },
              {
                subheading: 'Negative Net Churn and Cohort Expansion Flywheels',
                narration: 'When existing customers upgrade their software subscriptions and expand usage faster than lost accounts churn away, net revenue retention exceeds one hundred and twenty percent. This creates a compounding growth flywheel where annual recurring revenue expands automatically year over year even without acquiring new logos.',
                visualPrompt: 'Clean minimalist financial chart showing exponential compounding growth curve, dark theme corporate aesthetic',
                visualSubject: 'Exponential cohort retention compounding graph',
                environment: 'Modern financial technology trading floor',
                cameraMovement: 'Smooth linear push-in on upward trending chart',
                lighting: 'Deep navy background with bright gold data line',
                durationSec: 38,
              },
            ],
          },
          {
            heading: '2. Operating Leverage and Scalable Distribution Moats',
            subsections: [
              {
                subheading: 'Decoupling Revenue Growth from Variable Headcount',
                narration: 'High-margin businesses achieve immense operating leverage because onboarding incremental customers incurs near-zero marginal cost of goods sold. Automated distribution and cloud infrastructure allow top-line revenue to scale tenfold while operational overhead remains tightly controlled.',
                visualPrompt: 'Sleek architectural office showing automated logistics and software systems coordinating global enterprise workflows',
                visualSubject: 'Scalable automated enterprise workflow coordination',
                environment: 'Contemporary minimalist corporate headquarters',
                cameraMovement: 'Wide panoramic tracking glide across architectural space',
                lighting: 'Natural indirect daylight with brushed steel highlights',
                durationSec: 38,
              },
              {
                subheading: 'High Return on Invested Capital Reinvestment',
                narration: 'The ultimate indicator of a world-class business is the ability to redeploy surplus operating cash flow into research, development, and strategic distribution at high internal rates of return, compounding enterprise enterprise value indefinitely.',
                visualPrompt: 'Executive financial analysis dashboard displaying return on invested capital growth metrics, premium styling',
                visualSubject: 'High return on invested capital financial metrics',
                environment: 'Executive corporate strategy suite',
                cameraMovement: 'Slow push-in on high-performance metrics display',
                lighting: 'Subtle ambient gold and slate blue lighting',
                durationSec: 36,
              },
            ],
          },
        ],
        conclusion: `Mastering customer acquisition economics, net expansion retention, and operating leverage is what transforms standard businesses into enduring cash-flow compounding machines. Focus on unit economics, customer value, and disciplined reinvestment.`,
        callToAction: ctaText,
      };
    }

    // Generalized calibrated builder for custom niches
    const wordsPerMinute = 138;
    const targetWords = Math.round(targetLengthMinutes * wordsPerMinute);
    const numSections = Math.max(2, Math.min(6, Math.round(targetLengthMinutes * 0.8)));

    const sections = [];
    for (let i = 1; i <= numSections; i++) {
      sections.push({
        heading: `Strategic Pillar ${i}: Foundational Systems of ${topic}`,
        subsections: [
          {
            subheading: `Core Execution Framework ${i}`,
            narration: `To achieve sustained success in ${topic}, professionals in ${niche} must first establish structured operating principles. By measuring key performance indicators and eliminating operational friction, you create predictable compounding progress.`,
            visualPrompt: `Professional high-definition visualization of ${topic}, ${niche} context, modern cinematic lighting`,
            visualSubject: `Core execution framework for ${topic}`,
            environment: `Contemporary professional studio tailored to ${niche}`,
            cameraMovement: 'Slow steady forward push-in',
            lighting: 'Clean high-key studio lighting',
            durationSec: 30,
          },
        ],
      });
    }

    return {
      title: topic,
      hook: `What if understanding the core mechanics behind ${topic} could unlock measurable breakthroughs in ${niche}? Today, we break down the definitive framework.`,
      introduction: `Welcome back to ${channelName}. In this video, we analyze the core strategies and execution methodologies behind ${topic}, giving you actionable insights you can apply immediately.`,
      sections,
      conclusion: `Applying these core frameworks systematically allows you to build durable progress and achieve long-term mastery in ${niche}.`,
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
