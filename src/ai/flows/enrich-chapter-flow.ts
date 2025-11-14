
'use server';

/**
 * @fileOverview Implements a Genkit flow to enrich chapter content using AI.
 * This flow takes the full text of a chapter, generates a title, subtitle, and summary,
 * and cleans the title/headings from the main content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from '@/lib/firebase';

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
  coverImage: z.string().describe('URL of the generated cover image for the chapter.'),
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
        imagePrompt: z.string().describe("Generate a short, descriptive prompt (max 15 words) for an AI image generator. The prompt should capture the main theme, a key character, or a pivotal scene from the chapter content. Example: 'A lone warrior standing on a cliff overlooking a futuristic city at dusk.'"),
    })},
    prompt: `You are a master storyteller and editor. Your primary task is to process a raw chapter text and extract or generate specific pieces of metadata.

    The user will provide the full, unformatted text of a chapter. It typically starts with the story name ("Niyati"), followed by the season/chapter ("Season X – Chapter Y"), then a title for the chapter (e.g., "LET'S BEGIN THE STORY"), and then an italicized subtitle/quote (e.g., "Sometimes what we think..."). The rest is the story content.

    Perform the following tasks based on the provided content:

    1.  **Extract Title:** Find the main title of the chapter (e.g., "LET’S BEGIN THE STORY").
    2.  **Extract Subtitle:** Find the italicized quote or tagline that comes directly after the title.
    3.  **Generate Summary:** Create a compelling, 3-sentence summary of the entire chapter's content. This should be a good teaser for a reader.
    4.  **Clean Content:** Return ONLY the main body of the story. You must remove the story name ("Niyati"), the season/chapter line, the main title, and the subtitle from the beginning of the text. The returned content should start directly with the first paragraph of the actual story.
    5.  **Generate Image Prompt:** Based on the cleaned content, create a short, evocative prompt for an AI image generator that visually represents a key theme or scene.

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
    // Step 1: Generate Title, Summary, Cleaned Content and Image Prompt
    const textGenResult = await generationPrompt(input);
    const { title, subtitle, summary, cleanedContent, imagePrompt } = textGenResult.output!;

    if (!title || !subtitle || summary === undefined || cleanedContent === undefined || !imagePrompt) {
        throw new Error("Failed to generate all required text fields from AI.");
    }
    
    // Step 2: Generate the cover image. Fallback to placeholder on error.
    let coverImage = '';
    try {
      console.log('Attempting to generate image with prompt:', imagePrompt);
      const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: imagePrompt,
        config: {
          responseMimeType: 'image/jpeg',
        },
      });
      
      if (media && media.url) {
        coverImage = media.url; // This will be a data URI
      } else {
        throw new Error('AI image generation returned no media.');
      }
    } catch(error: any) {
        console.warn("AI image generation failed:", error.message);
        console.log("Falling back to placeholder image.");
        // Use a consistent placeholder based on the title
        const seed = title.replace(/\s+/g, '-').toLowerCase();
        coverImage = `https://picsum.photos/seed/${seed}/400/400`;
    }

    // Step 3: Return all generated content
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
