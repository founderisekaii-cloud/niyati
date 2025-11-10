
'use server';

/**
 * @fileOverview Implements a Genkit flow to enrich chapter content using AI.
 * This flow takes the full text of a chapter and returns a generated title,
 * summary, and a cover image.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// 1. Define Input Schema
const EnrichChapterInputSchema = z.object({
  fullContent: z.string().describe('The complete, reassembled text content of the chapter.'),
});
export type EnrichChapterInput = z.infer<typeof EnrichChapterInputSchema>;

// 2. Define Output Schema
const EnrichChapterOutputSchema = z.object({
  title: z.string().describe('The extracted or generated title of the chapter in English.'),
  summary: z.string().describe('A compelling, 3-sentence summary of the chapter in English.'),
  coverImage: z.string().describe('A URL for the cover image.'),
});
export type EnrichChapterOutput = z.infer<typeof EnrichChapterOutputSchema>;


// 3. Create the Text Generation Prompt (Title & Summary)
const generationPrompt = ai.definePrompt({
    name: 'chapterGenerationPrompt',
    input: { schema: z.object({ fullContent: z.string() }) },
    output: { schema: z.object({
        title: z.string().describe("Extract the chapter title from the text in English. If no clear title is present, create a concise, compelling one based on the content."),
        summary: z.string().describe("Generate a compelling, 3-sentence summary in English, suitable for a chapter listing page. It should be engaging and concise."),
    })},
    prompt: `You are a master storyteller and editor. Read the full chapter content provided below and perform the following tasks:
    1.  **Title Generation (English):** Extract the title from the text. The title is likely the very first line or a clearly marked heading. If no explicit title exists, create a concise, compelling one in English that captures the essence of the chapter.
    2.  **Summary Generation (English):** Generate a compelling, 3-sentence summary in English suitable for a chapter listing page description. The summary should be engaging and concise, encouraging users to read.

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
    // Step 1: Generate Title and Summary
    const textGenResult = await generationPrompt(input);
    const { title, summary } = textGenResult.output!;

    if (!title || !summary) {
        throw new Error("Failed to generate title or summary.");
    }
    
    // Step 2: Use a placeholder for the cover image to avoid billing errors.
    const placeholderImageUrl = 'https://picsum.photos/seed/placeholder/400/400';

    // Step 3: Return all generated content
    return {
      title,
      summary,
      coverImage: placeholderImageUrl,
    };
  }
);


// 5. Export a simple async wrapper function
export async function enrichChapterContent(input: EnrichChapterInput): Promise<EnrichChapterOutput> {
  return await enrichChapterFlow(input);
}
