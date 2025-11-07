export interface Chapter {
  id: string;
  title: string;
  summary: string;
  wordCount: number;
  releaseDate: string; // ISO 8601 format
  basePrice: number;
  content: string; // HTML or Markdown content
}
