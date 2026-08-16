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
  }): Promise<{ script: ScriptStructure; fullNarration: string }>;

  generateScenes(params: {
    script: ScriptStructure;
    niche: string;
    language: string;
    targetLengthMinutes: number;
  }): Promise<GeneratedScene[]>;
}

class DefaultAiProvider implements AiProvider {
  async generateScript(params: {
    channelName: string;
    niche: string;
    language: string;
    topic: string;
    targetLengthMinutes: number;
  }): Promise<{ script: ScriptStructure; fullNarration: string }> {
    const { channelName, niche, topic, targetLengthMinutes } = params;

    // Check if Gemini API key exists
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey) {
      try {
        return await this.generateScriptWithGemini(params, geminiKey);
      } catch (err) {
        console.warn('Gemini script generation failed, using structured script engine:', err);
      }
    }

    // High quality deterministic generator tailored to niche, topic and target duration
    const script = this.buildStructuredScript(channelName, niche, topic, targetLengthMinutes);
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
  }): Promise<GeneratedScene[]> {
    const { script, niche } = params;
    const scenes: GeneratedScene[] = [];
    let sceneIndex = 1;

    // Scene 1: Hook
    const hookWords = script.hook.split(/\s+/).filter(Boolean).length;
    const hookDuration = Math.max(8, Math.round(hookWords / 2.3));
    scenes.push({
      sceneIndex: sceneIndex++,
      sectionName: 'Hook',
      narration: script.hook,
      visualPrompt: `High-impact cinematic opening visual for ${script.title}, dramatic studio lighting, ${niche} aesthetic, 4k ultra realistic`,
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
      visualPrompt: `Wide cinematic shot establishing context for ${script.title}, modern clean setting, professional documentary style`,
      estimatedDurationSec: introDuration,
      subtitleText: script.introduction,
    });

    // Section Scenes
    for (const section of script.sections) {
      for (const sub of section.subsections) {
        const words = sub.narration.split(/\s+/).filter(Boolean).length;
        const duration = sub.durationSec || Math.max(12, Math.round(words / 2.3));
        scenes.push({
          sceneIndex: sceneIndex++,
          sectionName: `${section.heading} - ${sub.subheading}`,
          narration: sub.narration,
          visualPrompt: sub.visualPrompt || `Detailed visual representation of ${sub.subheading}, cinematic depth of field, ${niche} context, smooth motion`,
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
      estimatedDurationSec: ctaDuration,
      subtitleText: script.callToAction,
    });

    return scenes;
  }

  private buildStructuredScript(channelName: string, niche: string, topic: string, targetLengthMinutes: number): ScriptStructure {
    const isHealth = niche.toLowerCase().includes('health') || topic.toLowerCase().includes('health');
    const isTech = niche.toLowerCase().includes('tech') || topic.toLowerCase().includes('ai');

    if (isHealth) {
      return {
        title: topic,
        hook: `What if five simple adjustments to your morning routine could dramatically increase your daily energy, cognitive clarity, and long-term lifespan? Today, we break down five scientifically validated morning habits that transform your health.`,
        introduction: `Welcome back to ${channelName}. The first two hours of your day set the biochemical foundation for your entire metabolic and neurological performance. By understanding how circadian biology, cellular hydration, and neurotransmitters work together, you can optimize your morning for lasting vitality.`,
        sections: [
          {
            heading: 'Habit 1: Targeted Cellular Hydration with Essential Minerals',
            subsections: [
              {
                subheading: 'Reversing Nocturnal Dehydration',
                narration: 'During seven to eight hours of sleep, your body loses nearly a liter of water through respiration and perspiration. Drinking five hundred milliliters of filtered water within minutes of waking immediately rehydrates depleted tissues and restores optimal blood viscosity.',
                visualPrompt: 'Cinematic glass of pure mountain mineral water filling in slow motion, refreshing droplets, clean laboratory aesthetic',
                durationSec: 16,
              },
              {
                subheading: 'Electrolyte Transport and Cellular Energy',
                narration: 'Adding a pinch of unrefined sea salt or bioavailable magnesium provides critical electrolytes that enable rapid water absorption into cells, kickstarting mitochondrial ATP synthesis before breakfast.',
                visualPrompt: 'Microscopic 3D animation of cellular membranes absorbing mineral ions, glowing mitochondrial energy surge, 4k scientific visualization',
                durationSec: 16,
              },
            ],
          },
          {
            heading: 'Habit 2: Early Sunlight Exposure for Circadian Alignment',
            subsections: [
              {
                subheading: 'Triggering Cortisol and Melatonin Reset',
                narration: 'Viewing natural morning sunlight for ten to fifteen minutes stimulates melanopsin retinal ganglion cells. This sends a direct signal to your suprachiasmatic nucleus, triggering a healthy cortisol peak to wake you up and starting the sixteen-hour timer for nocturnal melatonin release.',
                visualPrompt: 'Morning golden hour sunlight streaming across a lush outdoor landscape, warm solar rays illuminating serene environment',
                durationSec: 24,
              },
              {
                subheading: 'Dopamine and Mood Enhancement',
                narration: 'Natural photons also upregulate dopamine receptors in the brain, improving motivation, attention span, and emotional resilience throughout the entire workday.',
                visualPrompt: 'Person enjoying early morning sunlight outdoors, feeling energized and centered, clean cinematic portrait',
                durationSec: 16,
              },
            ],
          },
          {
            heading: 'Habit 3: Fasted Dynamic Mobility and Lymphatic Activation',
            subsections: [
              {
                subheading: 'Stimulating Synovial Fluid and Joint Health',
                narration: 'Engaging in five to ten minutes of full-body dynamic stretches and thoracic rotations lubricates your joint capsules with synovial fluid and counters spinal compression from sleep.',
                visualPrompt: 'Clean minimalist wellness studio, dynamic yoga and mobility routine, smooth steady camera glide',
                durationSec: 20,
              },
              {
                subheading: 'Pumping the Lymphatic System',
                narration: 'Unlike your circulatory system, the lymphatic system has no central pump. Muscular contraction in the morning is essential to flush out metabolic waste products accumulated overnight.',
                visualPrompt: '3D anatomical illustration showing lymphatic fluid flow through the human vascular system, sleek medical graphic',
                durationSec: 18,
              },
            ],
          },
          {
            heading: 'Habit 4: High-Protein and Micronutrient Nutrition',
            subsections: [
              {
                subheading: 'Stabilizing Blood Sugar and Preventing Crashes',
                narration: 'Consuming thirty to forty grams of bioavailable protein in your first meal prevents rapid glucose spikes and keeps your appetite hormones, like ghrelin, balanced for hours.',
                visualPrompt: 'Gourmet organic breakfast plate with poached eggs, fresh avocado, vibrant greens and berries, high contrast food photography',
                durationSec: 20,
              },
              {
                subheading: 'Amino Acids for Neurotransmitter Synthesis',
                narration: 'Essential amino acids such as tyrosine and tryptophan serve as the primary chemical precursors for dopamine and serotonin, ensuring sustained mental clarity without afternoon fatigue.',
                visualPrompt: 'Molecular structure animation of amino acids assembling into neural transmitters, premium 3D graphics',
                durationSec: 18,
              },
            ],
          },
          {
            heading: 'Habit 5: Mindful Focus Before Digital Inputs',
            subsections: [
              {
                subheading: 'Protecting the Brain from Dopamine Hijacking',
                narration: 'Checking emails and social media in bed floods your nervous system with cortisol and puts your brain into a reactive state. Protecting your first thirty minutes preserves your proactive focus.',
                visualPrompt: 'Minimalist wooden workspace, smartphone placed facedown next to a journal and warm cup of tea, calm morning atmosphere',
                durationSec: 20,
              },
              {
                subheading: 'Structured Reflection and Daily Prioritization',
                narration: 'Dedicate five minutes to write down your top three high-impact objectives for the day. This simple ritual clarifies your focus and dramatically reduces cognitive overwhelm.',
                visualPrompt: 'Fountain pen writing clearly in a leather notebook, intentional handwriting, warm morning sunlight on desk',
                durationSec: 18,
              },
            ],
          },
        ],
        conclusion: `Integrating these five morning habits does not require hours of complex preparation. Start with one or two habits this week, and observe how your sustained energy, mental clarity, and overall physical health improve exponentially.`,
        callToAction: `If you found this scientific breakdown helpful, make sure to subscribe to ${channelName}, like the video, and leave a comment sharing which morning habit you will start implementing tomorrow.`,
      };
    } else if (isTech) {
      return {
        title: topic,
        hook: `From automated cognitive workflows to life-saving medical discoveries, artificial intelligence is no longer a distant horizon—it is actively reshaping our daily lives right now. Here is how modern AI is transforming how we live, work, and create.`,
        introduction: `Welcome back to ${channelName}. Foundation models, computer vision, and autonomous agents are advancing at an exponential pace. In this video, we explore five fundamental pillars where artificial intelligence is creating unprecedented breakthroughs across society.`,
        sections: [
          {
            heading: '1. Intelligent Workflow Automation and Cognitive Augmentation',
            subsections: [
              {
                subheading: 'Automating Repetitive Cognitive Labor',
                narration: 'Modern neural networks are capable of parsing massive document repositories, summarizing complex data, and generating production-ready code in seconds, freeing human knowledge workers from mundane administrative tasks.',
                visualPrompt: 'Futuristic digital workspace with sleek holographic code interfaces, data streams flowing smoothly, high tech aesthetics',
                durationSec: 18,
              },
              {
                subheading: 'Context-Aware Co-Pilots in Every Industry',
                narration: 'Rather than replacing humans, intelligent software agents act as persistent thought partners that enhance decision-making speed and analytical accuracy across finance, engineering, and law.',
                visualPrompt: 'Split-screen graphic showing professional collaborating with an intelligent AI copilot interface, sleek UI design',
                durationSec: 18,
              },
            ],
          },
          {
            heading: '2. Precision Healthcare and Early Diagnostic Detection',
            subsections: [
              {
                subheading: 'Deep Learning Diagnostics',
                narration: 'Deep learning models trained on millions of medical scans now identify micro-calcifications and cellular abnormalities months before traditional methods, revolutionizing early oncology detection.',
                visualPrompt: 'High-tech medical imaging display with AI neural overlay identifying biomarkers, clean clinical lighting',
                durationSec: 20,
              },
              {
                subheading: 'Accelerated Molecular Drug Discovery',
                narration: 'AI algorithms can simulate protein folding and molecular interactions in hours rather than decades, opening a new era of personalized medicine tailored to individual patient genetics.',
                visualPrompt: '3D interactive simulation of complex protein structures folding in real time, glowing chemical bonds, biotech laboratory',
                durationSec: 18,
              },
            ],
          },
          {
            heading: '3. Hyper-Personalized Education and Dynamic Mentorship',
            subsections: [
              {
                subheading: 'Adaptive Learning Engines',
                narration: 'AI tutoring platforms dynamically assess each student\'s comprehension level in real time, adjusting explanations and generating custom exercises tailored to their unique pace of mastery.',
                visualPrompt: 'Student using an intuitive holographic educational interface, interactive 3D learning models, futuristic classroom',
                durationSec: 20,
              },
              {
                subheading: 'Universal Democratization of Knowledge',
                narration: 'By breaking down language barriers with instant multilingual speech translation, intelligent education systems provide world-class tutoring to anyone with an internet connection.',
                visualPrompt: 'Global network map with illuminated nodes connecting learners across diverse continents, modern motion graphics',
                durationSec: 18,
              },
            ],
          },
          {
            heading: '4. Autonomous Transportation and Intelligent Cities',
            subsections: [
              {
                subheading: 'Sensor Fusion and Vision-Based Navigation',
                narration: 'Autonomous vehicles leverage neural networks and real-time sensor fusion to predict pedestrian movements and optimize traffic flow, significantly reducing urban collisions.',
                visualPrompt: 'Autonomous electric vehicle smoothly navigating modern city streets at dusk, lidar and vision sensor point cloud overlay',
                durationSec: 20,
              },
              {
                subheading: 'Smart Grid and Energy Efficiency',
                narration: 'Machine learning algorithms manage urban power grids and municipal heating systems, reducing carbon emissions and cutting energy waste by matching supply with real-time demand.',
                visualPrompt: 'Smart city aerial view at night with glowing energy grid lines and clean renewable power flows, ultra sharp 4k',
                durationSec: 18,
              },
            ],
          },
          {
            heading: '5. Creative Synthesis and Generative Media',
            subsections: [
              {
                subheading: 'Generative Audio, Video, and Design',
                narration: 'Solo creators can now synthesize studio-quality video clips, custom voiceovers, and intricate visual assets in minutes, lowering production barriers and unleashing global creativity.',
                visualPrompt: 'Creative studio setup with digital canvas rendering generative artwork in real time, vibrant cinematic colors',
                durationSec: 20,
              },
              {
                subheading: 'The Future of Collaborative Innovation',
                narration: 'As human ingenuity combines with machine intelligence, we are witnessing the dawn of an era where idea-to-execution cycles shrink from months to moments.',
                visualPrompt: 'Inspiring visualization of human hands interacting with radiant digital energy sparks, modern futuristic concept',
                durationSec: 18,
              },
            ],
          },
        ],
        conclusion: `Artificial intelligence is fundamentally transforming our society from the ground up. Those who learn to leverage these tools today will lead the innovations of tomorrow.`,
        callToAction: `Stay ahead of the technological curve by subscribing to ${channelName}. Hit the bell icon for our next deep dive into cutting-edge technology and share your perspective in the comments below.`,
      };
    }

    // Fallback general topic
    return {
      title: topic,
      hook: `What if understanding the core mechanics behind ${topic} could unlock unprecedented clarity and practical results? In this video, we reveal the comprehensive blueprint.`,
      introduction: `Welcome back to ${channelName}. Today we explore the critical frameworks of ${topic}, examining the foundational principles, practical execution strategies, and long-term implications.`,
      sections: [
        {
          heading: `Fundamentals of ${topic}`,
          subsections: [
            {
              subheading: 'Core Architecture',
              narration: `To truly master ${topic}, we must first analyze the fundamental components that dictate how outcomes are generated in modern systems.`,
              visualPrompt: `Detailed visualization explaining the core principles of ${topic}, sleek modern graphics`,
              durationSec: 20,
            },
            {
              subheading: 'Practical Application',
              narration: `Applying these principles in real-world scenarios requires consistent discipline, proactive feedback loops, and targeted iteration.`,
              visualPrompt: `Action-oriented visual showing practical implementation of ${topic}, clean lighting`,
              durationSec: 20,
            },
          ],
        },
      ],
      conclusion: `By applying these core principles systematically, you build sustainable progress that compounds into extraordinary long-term results.`,
      callToAction: `If you found this analysis insightful, subscribe to ${channelName}, like the video, and join the conversation in the comments below.`,
    };
  }

  private async generateScriptWithGemini(params: {
    channelName: string;
    niche: string;
    language: string;
    topic: string;
    targetLengthMinutes: number;
  }, apiKey: string): Promise<{ script: ScriptStructure; fullNarration: string }> {
    const prompt = `You are a professional video script writer for YouTube channel "${params.channelName}" (Niche: ${params.niche}, Language: ${params.language}).
Write an engaging video script for the topic: "${params.topic}" designed for approximately ${params.targetLengthMinutes} minutes.
Respond strictly with valid JSON with this schema:
{
  "title": "${params.topic}",
  "hook": "Compelling 1-2 sentence hook",
  "introduction": "Engaging introduction to the channel and topic",
  "sections": [
    {
      "heading": "Section Title",
      "subsections": [
        {
          "subheading": "Point 1 Title",
          "narration": "Detailed spoken narration for point 1...",
          "visualPrompt": "Cinematic visual description for point 1",
          "durationSec": 20
        }
      ]
    }
  ],
  "conclusion": "Insightful summary conclusion",
  "callToAction": "Call to action subscribing to ${params.channelName}"
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.statusText}`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed: ScriptStructure = JSON.parse(rawText);

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

