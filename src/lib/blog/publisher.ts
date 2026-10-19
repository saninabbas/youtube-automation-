/**
 * AUTORA.LIVE — Daily Automated Blog Publishing Engine
 *
 * Implements idempotent scheduling, quality gating, database persistence,
 * and sitemap synchronization.
 */

import fs from 'fs';
import path from 'path';
import {
  hasPublishedBlogOnDate,
  getNextScheduledEditorialItem,
  getEditorialItemByDay,
  saveDbBlogPost,
  updateEditorialCalendarItem,
  DbBlogPost,
} from '../db';
import { EDITORIAL_CALENDAR_30_DAYS, EditorialTopic } from './editorial-calendar';
import { generateBlogArticle, GeneratedBlogArticle } from './generator';

export interface PublishResult {
  success: boolean;
  message: string;
  skipped?: boolean;
  dryRun?: boolean;
  slug?: string;
  url?: string;
  wordCount?: number;
  publishedAt?: string;
  error?: string;
}

/**
 * Updates public/sitemap.xml to append the newly published blog post if not present.
 */
export function syncSitemapXml(slug: string, dateIso: string = new Date().toISOString().split('T')[0]): void {
  try {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    if (!fs.existsSync(sitemapPath)) return;

    let sitemap = fs.readFileSync(sitemapPath, 'utf8');
    const targetUrl = `https://autora.live/blog/${slug}`;

    if (sitemap.includes(targetUrl)) {
      return; // Already present
    }

    const newUrlNode = `  <url>\n    <loc>${targetUrl}</loc>\n    <lastmod>${dateIso}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.90</priority>\n  </url>\n`;

    const blogIndexLoc = '<loc>https://autora.live/blog</loc>';
    const endUrlTag = '</url>';
    const blogIndexPos = sitemap.indexOf(blogIndexLoc);

    if (blogIndexPos !== -1) {
      const nextEndTagPos = sitemap.indexOf(endUrlTag, blogIndexPos);
      if (nextEndTagPos !== -1) {
        const insertPos = nextEndTagPos + endUrlTag.length + 1;
        sitemap = sitemap.slice(0, insertPos) + newUrlNode + sitemap.slice(insertPos);
        fs.writeFileSync(sitemapPath, sitemap, 'utf8');
        console.log(`[Publisher] Updated public/sitemap.xml with ${targetUrl}`);
      }
    }
  } catch (err: any) {
    console.warn('[Publisher] Could not update public/sitemap.xml:', err.message);
  }
}

/**
 * Executes daily publication cycle.
 */
export async function publishDailyBlog(options: {
  dayIndex?: number;
  dryRun?: boolean;
  force?: boolean;
} = {}): Promise<PublishResult> {
  const todayIso = new Date().toISOString().split('T')[0];

  // 1. Idempotency Check: At most one article per scheduled day
  if (!options.force && hasPublishedBlogOnDate(todayIso)) {
    console.log(`[Publisher] Article has already been published today (${todayIso}). Skipping to prevent duplicates.`);
    return {
      success: true,
      message: `An article has already been published today (${todayIso}).`,
      skipped: true,
    };
  }

  // 2. Select Topic
  let editorialItem = options.dayIndex
    ? getEditorialItemByDay(options.dayIndex)
    : getNextScheduledEditorialItem();

  let topicBrief: EditorialTopic | undefined;

  if (editorialItem) {
    topicBrief = EDITORIAL_CALENDAR_30_DAYS.find((t) => t.dayIndex === editorialItem?.day_index);
  } else {
    // If table not yet seeded or all completed, fall back to first topic in calendar
    topicBrief = EDITORIAL_CALENDAR_30_DAYS[0];
  }

  if (!topicBrief) {
    return {
      success: false,
      message: 'No suitable editorial calendar topic could be resolved.',
    };
  }

  console.log(`[Publisher] Starting generation for Day ${topicBrief.dayIndex}: "${topicBrief.proposedTitle}"...`);

  // 3. Generate Article Content
  let article: GeneratedBlogArticle;
  try {
    article = await generateBlogArticle(topicBrief);
  } catch (genErr: any) {
    if (editorialItem) {
      updateEditorialCalendarItem(editorialItem.id, {
        error_message: genErr.message,
      });
    }
    return {
      success: false,
      message: `Content generation failed: ${genErr.message}`,
      error: genErr.message,
    };
  }

  // 4. Quality Gate
  if (article.wordCount < 800) {
    const errorMsg = `Article failed quality gate: word count (${article.wordCount}) is below minimum requirement (800).`;
    console.error(`[Publisher] ${errorMsg}`);
    if (editorialItem) {
      updateEditorialCalendarItem(editorialItem.id, { error_message: errorMsg });
    }
    return {
      success: false,
      message: errorMsg,
      error: errorMsg,
    };
  }

  // 5. Draft vs Publish Handling
  const isDryRun = options.dryRun === true;
  const status = isDryRun ? 'DRAFT' : 'PUBLISHED';
  const nowIso = new Date().toISOString();

  const savedPost: DbBlogPost = saveDbBlogPost({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    read_time: article.readTime,
    publish_date: article.publishDate,
    cover_image: article.coverImage,
    gradient: article.gradient,
    tags_json: JSON.stringify(article.tags),
    content: article.content,
    seo_title: article.seoTitle,
    seo_description: article.seoDescription,
    status,
    word_count: article.wordCount,
    published_at: isDryRun ? undefined : nowIso,
  });

  if (editorialItem) {
    updateEditorialCalendarItem(editorialItem.id, {
      status: isDryRun ? 'DRAFT_GENERATED' : 'PUBLISHED',
      post_id: savedPost.id,
      published_at: isDryRun ? undefined : nowIso,
      error_message: undefined,
    });
  }

  // 6. Update Sitemap on successful live publication
  if (!isDryRun) {
    syncSitemapXml(savedPost.slug, todayIso);
  }

  const postUrl = `https://autora.live/blog/${savedPost.slug}`;
  console.log(`[Publisher] Successfully ${isDryRun ? 'drafted' : 'published'} article: ${postUrl} (${article.wordCount} words)`);

  return {
    success: true,
    message: isDryRun ? 'Draft article generated successfully.' : 'Article published successfully.',
    dryRun: isDryRun,
    slug: savedPost.slug,
    url: postUrl,
    wordCount: article.wordCount,
    publishedAt: savedPost.published_at,
  };
}
