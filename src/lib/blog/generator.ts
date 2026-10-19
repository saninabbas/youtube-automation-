/**
 * AUTORA.LIVE — Intelligent SEO Blog Article Generator
 *
 * Utilizes Google Gemini 3.8 Flash with OpenRouter fallback to generate
 * comprehensive, publication-ready 1,200 - 1,800 word SEO articles.
 */

import { EditorialTopic } from './editorial-calendar';

export interface GeneratedBlogArticle {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  excerpt: string;
  category: 'Guides' | 'YouTube Growth' | 'AI Automation' | 'Niches' | 'Case Studies';
  readTime: string;
  publishDate: string;
  coverImage: string;
  gradient: string;
  tags: string[];
  content: string;
  wordCount: number;
}

const CURATED_COVER_IMAGES = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
];

const CURATED_GRADIENTS = [
  'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
];

export async function generateBlogArticle(topic: EditorialTopic): Promise<GeneratedBlogArticle> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  const systemPrompt = `You are a world-class YouTube growth strategist, AI video engineer, and SEO technical writer for AUTORA.LIVE (https://autora.live/).
Write a comprehensive, publication-ready, deeply informative SEO blog article based on the provided editorial brief.

CRITICAL INSTRUCTIONS:
1. Target Word Count: 1,300 to 1,750 words. Be thorough, granular, and practical.
2. Tone: Clear, natural, professional, authoritative, and engaging. Avoid generic AI introductory clichés (NEVER say "In today's fast-paced digital world", "In this ever-evolving landscape", "Let's dive in", "Delve into").
3. Structure:
   - Engaging introduction explaining the specific friction or challenge creators face.
   - Logical H2 (##) and H3 (###) hierarchy with actionable sub-sections.
   - Clear comparison tables or bulleted step-by-step frameworks wherever helpful.
   - Practical, concrete examples (specific settings, timeline metrics, prompt techniques, dB audio levels, etc.).
   - Include a dedicated section naturally discussing search engine optimization and competitor research with Scorankio (https://seoranko.site/) as an organic discovery companion for video metadata.
   - Include natural, honest references to AUTORA.LIVE features (e.g. [AUTORA's Automated Workflow](/workflow), [Video Templates](/templates), [AUTORA Studio](/signup)) without exaggerated claims or fake performance guarantees.
   - Conclude with a practical summary and a 5-to-7-point Actionable Creator Checklist.
   - Include 3 to 4 useful, practical FAQs at the end.
4. Factual Integrity:
   - Use verified factual guidelines (YouTube Studio analytics, LUFS audio norms, official platform policies).
   - Never invent test results, fake statistics, or nonexistent features.
5. Formatting: Output clean, standard Markdown with proper headers (## and ###). Do NOT wrap the entire output in backtick code fences.`;

  const userPrompt = `EDITORIAL TOPIC BRIEF:
Topic: ${topic.topic}
Proposed Title: ${topic.proposedTitle}
Primary Target Keyword: ${topic.primaryKeyword}
Search Intent: ${topic.searchIntent}
Supporting Keywords: ${topic.supportingKeywords.join(', ')}
Target Audience: ${topic.targetAudience}
Category: ${topic.category}
Key Factual Reference Sources: ${topic.researchSources.join(' | ')}

Please write the complete article in Markdown.`;

  let articleMarkdown = '';

  // 1. Try Gemini 3.8 Flash
  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt + '\n\n' + userPrompt }
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
            },
          }),
          signal: AbortSignal.timeout(90000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 1000) {
          articleMarkdown = text.trim();
        }
      }
    } catch (err: any) {
      console.warn('[BlogGenerator] Gemini generation failed, trying fallback:', err.message);
    }
  }

  // 2. Try OpenRouter Fallback
  if (!articleMarkdown && openRouterKey) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://autora.live',
          'X-Title': 'AUTORA.LIVE Blog Generator',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(90000),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim().length > 1000) {
          articleMarkdown = text.trim();
        }
      }
    } catch (err: any) {
      console.warn('[BlogGenerator] OpenRouter fallback failed:', err.message);
    }
  }

  if (!articleMarkdown) {
    throw new Error('Failed to generate article: all AI providers failed or were unconfigured.');
  }

  // Clean any leading H1 if model generated one duplicate
  let cleanedContent = articleMarkdown;
  const firstHeadingMatch = cleanedContent.match(/^#\s+(.+)$/m);
  let resolvedTitle = topic.proposedTitle;
  if (firstHeadingMatch && firstHeadingMatch.index !== undefined && firstHeadingMatch.index < 200) {
    resolvedTitle = firstHeadingMatch[1].trim();
    // Remove the # Title line so content starts with intro / ##
    cleanedContent = cleanedContent.replace(/^#\s+[^\n]+\n+/, '').trim();
  }

  // Extract excerpt from first paragraph
  const paragraphs = cleanedContent.split('\n\n').filter((p) => !p.startsWith('#') && p.trim().length > 40);
  const excerpt = paragraphs[0]
    ? paragraphs[0].replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1').replace(/[*_`]/g, '').trim().slice(0, 160) + '...'
    : `Explore practical strategies, workflows, and industry standards for ${topic.topic.toLowerCase()} on AUTORA.LIVE.`;

  const wordCount = cleanedContent.trim().split(/\s+/).length;
  const readTime = `${Math.max(1, Math.ceil(wordCount / 220))} min read`;
  const publishDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const coverImage = CURATED_COVER_IMAGES[topic.dayIndex % CURATED_COVER_IMAGES.length];
  const gradient = CURATED_GRADIENTS[topic.dayIndex % CURATED_GRADIENTS.length];

  return {
    slug: topic.proposedSlug,
    title: resolvedTitle,
    seoTitle: `${resolvedTitle} | AUTORA Blog`,
    seoDescription: excerpt,
    excerpt,
    category: topic.category,
    readTime,
    publishDate,
    coverImage,
    gradient,
    tags: [topic.primaryKeyword, ...topic.supportingKeywords.slice(0, 4)],
    content: cleanedContent,
    wordCount,
  };
}
