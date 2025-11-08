export interface Chapter {
  docId?: string; // Firestore document ID
  id: string;
  title: string;
  summary: string;
  wordCount: number;
  releaseDate: string; // ISO 8601 format
  basePrice: number;
  content: string; // Default/English content
  content_en?: string; // English content
  content_hi?: string; // Hindi content
  content_mr?: string; // Marathi content
}
