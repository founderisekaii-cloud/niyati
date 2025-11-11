
'use server';

/**
 * @fileOverview Implements a Genkit flow to enrich chapter content using AI.
 * This flow takes the full text of a chapter, generates a title, subtitle, and summary,
 * and cleans the title/headings from the main content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// 1. Define Input Schema
const EnrichChapterInputSchema = z.object({
  fullContent: z.string().describe('The complete, raw text content of the chapter, which may include a title.'),
});
export type EnrichChapterInput = z.infer<typeof EnrichChapterInputSchema>;

// 2. Define Output Schema
const EnrichChapterOutputSchema = z.object({
  title: z.string().describe('The extracted or generated title of the chapter in English.'),
  subtitle: z.string().describe("A one-sentence quote or tagline for the chapter, found just below the title."),
  summary: z.string().describe('A compelling, 3-sentence summary of the chapter in English.'),
  cleanedContent: z.string().describe('The chapter content with the main title, subtitle, and any redundant headings removed.'),
  coverImage: z.string().describe('A URL for the cover image.'),
});
export type EnrichChapterOutput = z.infer<typeof EnrichChapterOutputSchema>;


// 3. Create the Text Generation Prompt
const generationPrompt = ai.definePrompt({
    name: 'chapterEnrichmentPrompt',
    input: { schema: z.object({ fullContent: z.string() }) },
    output: { schema: z.object({
        title: z.string().describe("Extract the chapter title from the text in English. If no clear title is present, create a concise, compelling one based on the content."),
        subtitle: z.string().describe("Extract the single quote or tagline sentence that appears immediately after the title."),
        summary: z.string().describe("Generate a compelling, 3-sentence summary in English, suitable for a chapter listing page. It should be engaging and concise."),
        cleanedContent: z.string().describe("Return the main body of the chapter content after removing the primary title, the subtitle, and any other introductory headings found at the beginning of the text."),
    })},
    prompt: `You are a master storyteller and editor. Read the full chapter content provided below and perform the following tasks:
    1.  **Title Generation (English):** Extract the title from the text. The title is likely the main heading. If no explicit title exists, create a concise, compelling one in English.
    2.  **Subtitle Extraction:** After the title, there is often a quote or a tagline in italics or quotes. Extract this single sentence as the subtitle.
    3.  **Summary Generation (English):** Generate a compelling, 3-sentence summary in English suitable for a chapter listing page description.
    4.  **Content Cleaning:** Return the main body of the content. It is crucial that you remove the title, the subtitle, and any other introductory headings from the beginning of the text. The returned content should start directly with the first paragraph of the story.

    Full Chapter Content:
    {{{fullContent}}}
    `,
});


// 4. Create the Main Enrichment Flow
const enrichChapterFlow = ai.defineFlow(
  {
    name: 'enrichChapterFlow',
    inputSchema: EnrichChapterInputSchema,
    outputSchema: EnrichChapterOutputSchema,
  },
  async (input) => {
    // Step 1: Generate Title, Summary, and Cleaned Content
    const textGenResult = await generationPrompt(input);
    const { title, subtitle, summary, cleanedContent } = textGenResult.output!;

    if (!title || !summary || !subtitle || cleanedContent === undefined) {
        throw new Error("Failed to generate title, subtitle, summary, or cleaned content.");
    }
    
    // Step 2: Use a placeholder for the cover image to avoid billing errors.
    const placeholderImageUrl = 'https://picsum.photos/seed/placeholder/400/400';

    // Step 3: Return all generated content
    return {
      title,
      subtitle,
      summary,
      cleanedContent,
      coverImage: placeholderImageUrl,
    };
  }
);


// 5. Export a simple async wrapper function
export async function enrichChapterContent(input: EnrichChapterInput): Promise<EnrichChapterOutput> {
  return await enrichChapterFlow(input);
}
