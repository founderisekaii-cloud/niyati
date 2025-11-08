'use server';

/**
 * @fileOverview Implements a Genkit flow for translating text into different languages.
 *
 * - translateText - A function that handles the text translation.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLang: z
    .string()
    .describe('The target language code (e.g., "hi" for Hindi, "mr" for Marathi).'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const translationPrompt = ai.definePrompt({
  name: 'translationPrompt',
  input: { schema: TranslateTextInputSchema },
  output: { schema: TranslateTextOutputSchema },
  prompt: `Translate the following text into the language corresponding to the code '{{targetLang}}'.

Text to translate:
"{{text}}"

Return only the translated text in the 'translatedText' field.`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async input => {
    const { output } = await translationPrompt(input);
    return output!;
  }
);
