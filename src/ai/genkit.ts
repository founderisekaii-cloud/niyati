import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {openai} from 'openai/genkit';

export const ai = genkit({
  plugins: [
    googleAI(),
    openai({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
