
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
        subtitle: z.string().describe("Extract the single quote or tagline sentence that appears immediately after the title. If not present, leave blank."),
        summary: z.string().describe("Generate a compelling, 3-sentence summary in English, suitable for a chapter listing page. It should be engaging and concise."),
        cleanedContent: z.string().describe("Return the main body of the chapter content. IMPORTANT: If `hasMetadataHeaders` is true, you MUST remove the primary title, the subtitle, and any other introductory headings (like 'Niyati', 'Season X', etc.). If `hasMetadataHeaders` is false, you MUST return the content EXACTLY as it was provided, without altering any formatting, line breaks, or paragraph structure."),
    })},
    prompt: `You are a master storyteller and editor. Your primary task is to process a raw chapter text and extract or generate specific pieces of metadata.

    The user will provide the full, unformatted text of a chapter. It typically starts with the story name ("Niyati"), followed by the season/chapter ("Season X – Chapter Y"), then a title for the chapter (e.g., "LET'S BEGIN THE STORY"), and then an italicized subtitle/quote (e.g., "Sometimes what we think..."). The rest is the story content.

    You have two instructions based on the user's input: 'isFormatted' and 'hasMetadataHeaders'.

    1.  **Summary Generation (Always perform this):**
        - Generate a compelling, 3-sentence summary of the entire chapter's content.

    2.  **Title/Subtitle Extraction (Always perform this):**
        - Extract the main title of the chapter (e.g., "LET’S BEGIN THE STORY"). If not found, create one.
        - Extract the italicized quote or tagline that comes directly after the title. If not found, leave it blank.

    3.  **Content Cleaning (Conditional):**
        - **IF \`hasMetadataHeaders\` is TRUE:** Return ONLY the main body of the story. You MUST remove the story name ("Niyati"), the season/chapter line, the main title, and the subtitle if they are present at the beginning.
        - **IF \`hasMetadataHeaders\` is FALSE:** Return the content EXACTLY as it was provided, without any changes to formatting or paragraph structure.
        - **IF \`isFormatted\` is TRUE:** This is a strict instruction. Do NOT change any line breaks, paragraph spacing, or formatting of the original content. Your only job might be to remove headers if requested.

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
