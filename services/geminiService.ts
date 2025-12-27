
import { GoogleGenAI, Type } from "@google/genai";
import { MediaItem } from "../types";
import { searchTMDB } from "./tmdbService";

export async function fetchMovieDetails(input: string): Promise<Partial<MediaItem> | null> {
  const isUrl = input.includes('rottentomatoes.com');
  
  // 1. If it's a specific RT URL, use Gemini's crawling capability primarily
  if (isUrl) {
    const rtData = await fetchViaGemini(input);
    // Even if we have a URL, let's try to get a better poster from TMDB using the title Gemini found
    if (rtData?.title) {
      const tmdbFallback = await searchTMDB(rtData.title, rtData.type === 'TV Series' ? 'tv' : 'movie');
      if (tmdbFallback) {
        return {
          ...rtData,
          poster: tmdbFallback.poster || rtData.poster,
          backdrop: tmdbFallback.backdrop || rtData.backdrop,
          trailerUrl: tmdbFallback.trailerUrl || rtData.trailerUrl
        };
      }
    }
    return rtData;
  }

  // 2. If it's a search query, prioritize TMDB for high-quality official assets
  let tmdbData = await searchTMDB(input, 'movie');
  if (!tmdbData) {
    tmdbData = await searchTMDB(input, 'tv');
  }
  
  if (tmdbData) {
    // 3. Enrich TMDB high-res data with Rotten Tomatoes scores using Gemini Search Grounding
    const scores = await enrichWithScores(tmdbData.title, tmdbData.year);
    return {
      ...tmdbData,
      id: Math.random().toString(36).substr(2, 9),
      tomatoMeter: scores.tomatoMeter || 'N/A',
      audienceScore: scores.audienceScore || 'N/A'
    } as MediaItem;
  }

  // 4. Final Fallback: Full Gemini search if TMDB finds nothing
  return fetchViaGemini(input);
}

async function enrichWithScores(title: string, year: string) {
  try {
    const apiKey = process.env.API_KEY || '';
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find the exact Rotten Tomatoes TomatoMeter and Audience Score for the production: "${title} (${year})". 
      Return only the percentages in a JSON object.`,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tomatoMeter: { type: Type.STRING, description: "e.g. 85%" },
            audienceScore: { type: Type.STRING, description: "e.g. 90%" }
          },
          required: ['tomatoMeter', 'audienceScore']
        }
      }
    });

    const text = response.text;
    // Explicit narrowing for TypeScript's strictNullChecks
    if (text === undefined || text === null || typeof text !== 'string') {
      return { tomatoMeter: 'N/A', audienceScore: 'N/A' };
    }
    
    // Using explicit cast 'as string' to satisfy JSON.parse requirement after guard
    return JSON.parse(text as string);
  } catch (error) {
    console.error("Score Enrichment Error:", error);
    return { tomatoMeter: 'N/A', audienceScore: 'N/A' };
  }
}

async function fetchViaGemini(input: string): Promise<Partial<MediaItem> | null> {
  try {
    const apiKey = process.env.API_KEY || '';
    const ai = new GoogleGenAI({ apiKey });
    const isUrl = input.includes('http');
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Extract or find detailed metadata for: "${input}". 
      ${isUrl ? 'This is a direct URL, please crawl it for scores, images, and trailer URLs.' : 'This is a title, please search for official data, including a YouTube trailer link.'}
      Ensure TomatoMeter and Audience scores are included.
      Return the result as JSON.`,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            year: { type: Type.STRING },
            tomatoMeter: { type: Type.STRING },
            audienceScore: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['Movie', 'TV Series'] },
            genre: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING },
            poster: { type: Type.STRING, description: "Official poster URL" },
            backdrop: { type: Type.STRING, description: "High-res backdrop URL" },
            runtime: { type: Type.STRING },
            seasons: { type: Type.NUMBER },
            director: { type: Type.STRING },
            cast: { type: Type.ARRAY, items: { type: Type.STRING } },
            trailerUrl: { type: Type.STRING, description: "Official trailer URL (YouTube preferred)" }
          },
          required: ['title', 'year', 'tomatoMeter', 'audienceScore', 'type', 'genre', 'description', 'poster', 'backdrop', 'cast']
        }
      }
    });

    const text = response.text;
    // Explicit narrowing for TypeScript's strictNullChecks
    if (text === undefined || text === null || typeof text !== 'string') {
      return null;
    }
    
    // Using explicit cast 'as string' to satisfy JSON.parse requirement after guard
    const data = JSON.parse(text as string);
    return {
      ...data,
      id: Math.random().toString(36).substr(2, 9)
    };
  } catch (error) {
    console.error("Gemini Full Fetch Error:", error);
    return null;
  }
}
