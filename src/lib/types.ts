export interface Chapter {
  docId?: string; // Firestore document ID
  id: string;
  title: string;
  summary: string;
  wordCount: number;
  releaseDate: string; // ISO 8601 format
  basePrice: number; // Will be deprecated in favor of 'price'
  content: string; // Default/English content
  content_en?: string; // English content
  content_hi?: string; // Hindi content
  content_mr?: string; // Marathi content

  // New fields for content management
  seasonNumber: number;
  chapterNumber: number;
  status: 'public' | 'private' | 'protected';
  price: number; // Only if status is 'protected'
  coverImage?: string; // URL or Base64 string
}
