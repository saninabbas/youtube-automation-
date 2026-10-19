import { seedEditorialCalendar, getEditorialCalendar } from '../src/lib/db';
import { EDITORIAL_CALENDAR_30_DAYS } from '../src/lib/blog/editorial-calendar';

async function main() {
  console.log('Seeding 30-day editorial calendar into database...');

  const items = EDITORIAL_CALENDAR_30_DAYS.map((item) => ({
    day_index: item.dayIndex,
    topic: item.topic,
    primary_keyword: item.primaryKeyword,
    search_intent: item.searchIntent,
    supporting_keywords_json: JSON.stringify(item.supportingKeywords),
    target_audience: item.targetAudience,
    proposed_title: item.proposedTitle,
    proposed_slug: item.proposedSlug,
    category: item.category,
    research_sources_json: JSON.stringify(item.researchSources),
    status: 'SCHEDULED' as const,
  }));

  seedEditorialCalendar(items);

  const seeded = getEditorialCalendar();
  console.log(`Successfully seeded ${seeded.length} editorial calendar items into database!`);
  console.log('First item:', seeded[0]?.proposed_title);
  console.log('Last item:', seeded[seeded.length - 1]?.proposed_title);
}

main().catch(console.error);
