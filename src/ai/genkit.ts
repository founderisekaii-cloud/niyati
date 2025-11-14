import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { openAI } from 'genkitx-openai';

export const ai = genkit({
  plugins: [
    googleAI(),
    openAI({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  ],
  logLevel: 'debug',
  model: 'googleai/gemini-1.5-flash-latest',
});
