
export interface Chapter {
  docId?: string; // Firestore document ID
  title: string;
  subtitle?: string; // Add subtitle
  summary: string;
  wordCount: number;
  releaseDate: string; // ISO 8601 format
  content: string; // Default/English content

  // New fields for content management
  seasonNumber: number;
  chapterNumber: number;
  partNumber: number; // Add part number
  status: 'public' | 'private' | 'protected';
  price: number; // Only if status is 'protected'
  coverImage?: string; // URL or Base64 string
}

// Represents a grouping of all parts of a single chapter
export interface ChapterGroup {
  seasonNumber: number;
  chapterNumber: number;
  title: string;
  summary: string;
  coverImage: string;
  partCount: number;
}
