
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
  isLastPart?: boolean; // To know if it's the final part of a chapter

  // Engagement metrics
  likes: number;
  comments: number;
  views: number;
}

// Represents a grouping of all parts of a single chapter
export interface ChapterGroup {
  seasonNumber: number;
  chapterNumber: number;
  title: string;
  subtitle?: string;
  summary: string;
  coverImage: string;
  partCount: number;
  status: 'public' | 'private' | 'protected';
  price: number;
  likes: number;
  comments: number;
  views: number;
  docIds?: string[]; // Add docIds for batch operations
  parts?: Chapter[]; // Include full part data for editing
}
