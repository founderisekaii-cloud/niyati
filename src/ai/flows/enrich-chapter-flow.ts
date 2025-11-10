
'use server';

/**
 * @fileOverview Implements a Genkit flow to enrich chapter content using AI.
 * This flow takes the full text of a chapter and returns a generated title,
 * summary, and a cover image.
 *
 * - enrichChapterContent - The main function to call the AI enrichment flow.
 * - EnrichChapterInput - The input type (full chapter text).
 * - EnrichChapterOutput - The output type (title, summary, cover image).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// 1. Define Input Schema
const EnrichChapterInputSchema = z.object({
  fullContent: z.string().describe('The complete, reassembled text content of the chapter.'),
});
export type EnrichChapterInput = z.infer<typeof EnrichChapterInputSchema>;

// 2. Define Output Schema
const EnrichChapterOutputSchema = z.object({
  title: z.string().describe('The extracted or generated title of the chapter.'),
  summary: z.string().describe('A compelling, 3-sentence summary of the chapter.'),
  coverImage: z.string().describe('A Base64 encoded data URI of the generated cover image.'),
});
export type EnrichChapterOutput = z.infer<typeof EnrichChapterOutputSchema>;


// 3. Create the Text Generation Prompt (Title & Summary)
const generationPrompt = ai.definePrompt({
    name: 'chapterGenerationPrompt',
    input: { schema: z.object({ fullContent: z.string() }) },
    output: { schema: z.object({
        title: z.string().describe("Extract the chapter title from the text. If no clear title is present, create a concise, compelling one based on the content."),
        summary: z.string().describe("A compelling, 3-sentence summary suitable for a chapter listing page. It should be engaging and concise."),
    })},
    prompt: `You are a master storyteller and editor. Read the full chapter content provided below and perform two tasks:
    1. Extract the title. The title is likely the very first line or a clearly marked heading. If no explicit title exists, create one that captures the essence of the chapter.
    2. Generate a compelling, 3-sentence summary suitable for a chapter listing page description. The summary should be engaging and concise, encouraging users to read.
    
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
    
    // Step 2: Generate Cover Image using the generated Title and Summary
    const imageGenResult = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: `Create a visually striking, sharp-edged, square cover image for a fictional story chapter titled '${title}' which is about: '${summary}'. Use a modern, high-quality, and professional aesthetic. The image should be symbolic and intriguing, not literal.`,
    });
    
    const coverImagePart = imageGenResult.media;

    if (!coverImagePart?.url) {
      throw new Error('Failed to generate cover image.');
    }

    // Step 3: Return all generated content
    return {
      title,
      summary,
      coverImage: coverImagePart.url, // URL is a data URI
    };
  }
);


// 5. Export a simple async wrapper function
export async function enrichChapterContent(input: EnrichChapterInput): Promise<EnrichChapterOutput> {
  return await enrichChapterFlow(input);
}
