
export type ContentType = 'Movie' | 'TV Series';

export interface MediaItem {
  id: string;
  title: string;
  year: string;
  type: ContentType;
  genre: string[];
  description: string;
  poster: string;
  backdrop: string;
  runtime?: string;
  seasons?: number;
  director?: string;
  cast: string[];
  trailerUrl?: string;
  is_favorite?: boolean;
}

export type Category = 'All' | 'Movies' | 'TV Series' | 'Trending' | 'Favorites';
