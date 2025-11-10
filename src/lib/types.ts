export interface Chapter {
  docId?: string; // Firestore document ID
  id: string;
  title: string;
  summary: string;
  wordCount: number;
  releaseDate: string; // ISO 8601 format
  content: string; // Default/English content
  content_en?: string; // English content
  content_hi?: string; // Hindi content
  content_mr?: string; // Marathi content

  // New fields for content management
  seasonNumber: number;
  chapterNumber: number;
  partNumber?: number; // Only for parts, not for final chapter doc
  partType?: 'start' | 'middle' | 'end'; // Only for parts
  status: 'public' | 'private' | 'protected';
  price: number; // Only if status is 'protected'
  coverImage?: string; // URL or Base64 string
}
