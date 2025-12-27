
import { GoogleGenAI, Type } from "@google/genai";
import { MediaItem } from "../types";
import { searchTMDB, fetchTMDBById } from "./tmdbService";

export async function fetchMovieDetails(input: string): Promise<Partial<MediaItem> | null> {
  const trimmedInput = input.trim();
  
  // Detection for TMDB URLs: https://www.themoviedb.org/movie/123-title or /tv/123-title
  const tmdbUrlPattern = /themoviedb\.org\/(movie|tv)\/(\d+)/i;
  const urlMatch = trimmedInput.match(tmdbUrlPattern);

  if (urlMatch) {
    const type = urlMatch[1] === 'movie' ? 'movie' : 'tv';
    const id = urlMatch[2];
    const directData = await fetchTMDBById(id, type);
    if (directData) {
      return {
        ...directData,
        id: Math.random().toString(36).substr(2, 9)
      } as MediaItem;
    }
  }

  // Primary search via TMDB for high-res assets
  let tmdbData = await searchTMDB(trimmedInput, 'movie');
  if (!tmdbData) {
    tmdbData = await searchTMDB(trimmedInput, 'tv');
  }
  
  if (tmdbData) {
    return {
      ...tmdbData,
      id: Math.random().toString(36).substr(2, 9)
    } as MediaItem;
  }

  // Fallback if TMDB fails completely
  return fetchViaGemini(trimmedInput);
}

async function fetchViaGemini(input: string): Promise<Partial<MediaItem> | null> {
  try {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) return null;
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Find complete metadata for: "${input}". 
      Search Google for the most accurate match.
      Ensure you capture accurate title, year, genre, and description.
      Return as a JSON object.`,
      config: {
        thinkingConfig: { thinkingBudget: 15000 },
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            year: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['Movie', 'TV Series'] },
            genre: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING },
            poster: { type: Type.STRING },
            backdrop: { type: Type.STRING },
            runtime: { type: Type.STRING },
            seasons: { type: Type.NUMBER },
            director: { type: Type.STRING },
            cast: { type: Type.ARRAY, items: { type: Type.STRING } },
            trailerUrl: { type: Type.STRING }
          },
          required: ['title', 'year', 'type', 'genre', 'description', 'poster', 'backdrop', 'cast']
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const data = JSON.parse(text);
    return {
      ...data,
      id: Math.random().toString(36).substr(2, 9)
    };
  } catch (error) {
    console.error("Gemini Full Fetch Error:", error);
    return null;
  }
}
