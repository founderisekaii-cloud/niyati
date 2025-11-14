
'use server';

/**
 * @fileOverview Implements a Genkit flow to enrich chapter content using AI.
 * This flow can take raw or pre-formatted chapter text. It can generate a title,
 * subtitle, and summary, and can optionally clean metadata headers from the content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// 1. Define Input Schema
const EnrichChapterInputSchema = z.object({
  fullContent: z.string().describe('The complete, raw text content of the chapter, which may include a title.'),
  isFormatted: z.boolean().describe('Indicates if the content is already formatted and should not be altered.'),
  hasMetadataHeaders: z.boolean().describe('Indicates if the content includes story/chapter headers that need to be removed.'),
});
export type EnrichChapterInput = z.infer<typeof EnrichChapterInputSchema>;

// 2. Define Output Schema
const EnrichChapterOutputSchema = z.object({
  title: z.string().describe('The extracted or generated title of the chapter in English.'),
  subtitle: z.string().describe("A one-sentence quote or tagline for the chapter, found just below the title."),
  summary: z.string().describe('A compelling, 3-sentence summary of the chapter in English.'),
  cleanedContent: z.string().describe('The chapter content. If hasMetadataHeaders is true, the main title, subtitle, and any redundant headings are removed. If isFormatted is true, original formatting is preserved.'),
  coverImage: z.string().describe('URL of the generated cover image for the chapter.'),
});
export type EnrichChapterOutput = z.infer<typeof EnrichChapterOutputSchema>;


// 3. Create the Text Generation Prompt
const generationPrompt = ai.definePrompt({
    name: 'chapterEnrichmentPrompt',
    input: { schema: EnrichChapterInputSchema },
    output: { schema: z.object({
        title: z.string().describe("Extract the chapter title from the text in English. If no clear title is present, create a concise, compelling one based on the content."),
        subtitle: z.string().describe("Extract the single quote or tagline sentence that appears immediately after the title. If not present, leave it blank."),
        summary: z.string().describe("Generate a compelling, 3-sentence summary in English, suitable for a chapter listing page. It should be engaging and concise."),
        cleanedContent: z.string().describe("Return the main body of the chapter content. IMPORTANT: If `hasMetadataHeaders` is true, you MUST remove the primary title, the subtitle, and any other introductory headings (like 'Niyati', 'Season X', etc.). If `isFormatted` is true, you MUST return the content with its original line breaks and paragraph structure intact."),
    })},
    prompt: `You are an expert editor. Your task is to process a chapter's text and return structured data.

Here are your instructions. Follow them precisely.

1.  **Analyze the Input:** The user will provide chapter text in \`fullContent\` and two boolean flags: \`isFormatted\` and \`hasMetadataHeaders\`.

2.  **Metadata Extraction (Always Perform):**
    *   **Title:** Find the main title of the chapter (e.g., "LET'S BEGIN THE STORY"). Extract it. If no clear title exists, create a suitable one based on the content.
    *   **Subtitle:** Find the italicized quote or tagline sentence that appears immediately after the title. Extract it. If there isn't one, return an empty string.

3.  **Summary Generation (Always Perform):**
    *   Read the entire \`fullContent\` and write a compelling, 3-sentence summary in English.

4.  **Content Cleaning (This is conditional):**
    *   **IF \`hasMetadataHeaders\` is TRUE:** You MUST remove the story name (e.g., "Niyati"), the season/chapter line (e.g., "Season X – Chapter Y"), the main title, and the subtitle from the beginning of the content.
    *   **IF \`hasMetadataHeaders\` is FALSE:** You MUST NOT remove any text.
    *   **IF \`isFormatted\` is TRUE:** This is a strict rule. You MUST preserve the original line breaks and paragraph spacing of the content exactly as provided. Do not add, remove, or alter whitespace.
    *   **IF \`isFormatted\` is FALSE:** You may re-format the text for better readability (e.g., standard paragraph spacing).

Combine these rules. For example, if \`hasMetadataHeaders\` is true AND \`isFormatted\` is true, you will remove the headers but leave the rest of the text's formatting untouched.

Full Chapter Content:
{{{fullContent}}}
    `,
});

const summaryOnlyPrompt = ai.definePrompt({
    name: 'summaryOnlyPrompt',
    input: { schema: z.object({ fullContent: z.string() }) },
    output: { schema: z.object({
        summary: z.string().describe("Generate a compelling, 3-sentence summary in English based on the provided text.")
    })},
    prompt: `Generate a compelling, 3-sentence summary in English for the following chapter content:
    
    {{{fullContent}}}
    `
});


// 4. Create the Main Enrichment Flow
const enrichChapterFlow = ai.defineFlow(
  {
    name: 'enrichChapterFlow',
    inputSchema: EnrichChapterInputSchema,
    outputSchema: EnrichChapterOutputSchema,
  },
  async (input) => {
    
    let title = 'Untitled';
    let subtitle = '';
    let summary = '';
    let cleanedContent = input.fullContent;
    let coverImage = '';

    // If content is already formatted and has no headers, we only need a summary.
    if (input.isFormatted && !input.hasMetadataHeaders) {
        const summaryResult = await summaryOnlyPrompt({ fullContent: input.fullContent });
        summary = summaryResult.output?.summary || "Summary could not be generated.";
    } else {
        // Otherwise, run the full enrichment and cleaning process.
        const textGenResult = await generationPrompt(input);
        const output = textGenResult.output;
        if (!output) {
            throw new Error("Failed to generate all required text fields from AI.");
        }
        title = output.title;
        subtitle = output.subtitle;
        summary = output.summary;
        cleanedContent = output.cleanedContent;
    }
    
    // Always use a placeholder image to avoid billing issues and give predictable results.
    const seed = (title || 'chapter').replace(/\s+/g, '-').toLowerCase();
    coverImage = `https://picsum.photos/seed/${seed}/400/400`;

    // Step 3: Return all content
    return {
      title,
      subtitle,
      summary,
      cleanedContent,
      coverImage,
    };
  }
);


// 5. Export a simple async wrapper function
export async function enrichChapterContent(input: EnrichChapterInput): Promise<EnrichChapterOutput> {
  return await enrichChapterFlow(input);
}
