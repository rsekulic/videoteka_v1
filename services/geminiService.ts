
import { GoogleGenAI, Type } from "@google/genai";
import { MediaItem } from "../types";
import { searchTMDB } from "./tmdbService";

export async function fetchMovieDetails(input: string): Promise<Partial<MediaItem> | null> {
  const isUrl = input.includes('rottentomatoes.com');
  
  if (isUrl) {
    const rtData = await fetchViaGemini(input);
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

  let tmdbData = await searchTMDB(input, 'movie');
  if (!tmdbData) {
    tmdbData = await searchTMDB(input, 'tv');
  }
  
  if (tmdbData) {
    const scores = await enrichWithScores(tmdbData.title, tmdbData.year);
    return {
      ...tmdbData,
      id: Math.random().toString(36).substr(2, 9),
      tomatoMeter: scores.tomatoMeter || 'N/A',
      audienceScore: scores.audienceScore || 'N/A'
    } as MediaItem;
  }

  return fetchViaGemini(input);
}

async function enrichWithScores(title: string, year: string) {
  try {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      console.warn("API Key missing, skipping score enrichment.");
      return { tomatoMeter: 'N/A', audienceScore: 'N/A' };
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search Google for the Rotten Tomatoes page of the production: "${title} (${year})". 
      Extract the current 'Tomatometer' (critic percentage) and 'Audience Score' (audience percentage).
      Return ONLY a JSON object with two keys: "tomatoMeter" and "audienceScore". 
      Example format: {"tomatoMeter": "85%", "audienceScore": "90%"}. 
      If a score is missing or the page isn't found, use "N/A".`,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tomatoMeter: { type: Type.STRING, description: "TomatoMeter score, e.g. 85%" },
            audienceScore: { type: Type.STRING, description: "Audience score, e.g. 90%" }
          },
          required: ['tomatoMeter', 'audienceScore']
        }
      }
    });

    const text = response.text;
    if (typeof text !== 'string' || !text) {
      return { tomatoMeter: 'N/A', audienceScore: 'N/A' };
    }
    
    const result = JSON.parse(text);
    return {
      tomatoMeter: result.tomatoMeter || 'N/A',
      audienceScore: result.audienceScore || 'N/A'
    };
  } catch (error) {
    console.error("Score Enrichment Error:", error);
    return { tomatoMeter: 'N/A', audienceScore: 'N/A' };
  }
}

async function fetchViaGemini(input: string): Promise<Partial<MediaItem> | null> {
  try {
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) return null;
    
    const ai = new GoogleGenAI({ apiKey });
    const isUrl = input.includes('http');
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform a deep search for metadata on: "${input}". 
      ${isUrl ? 'Extract scores and details directly from this URL.' : 'Search for official Rotten Tomatoes and TMDB data for this title.'}
      Focus on getting the actual Tomatometer and Audience scores.
      Return the result as a strict JSON object.`,
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
            poster: { type: Type.STRING },
            backdrop: { type: Type.STRING },
            runtime: { type: Type.STRING },
            seasons: { type: Type.NUMBER },
            director: { type: Type.STRING },
            cast: { type: Type.ARRAY, items: { type: Type.STRING } },
            trailerUrl: { type: Type.STRING }
          },
          required: ['title', 'year', 'tomatoMeter', 'audienceScore', 'type', 'genre', 'description', 'poster', 'backdrop', 'cast']
        }
      }
    });

    const text = response.text;
    if (typeof text !== 'string' || !text) return null;
    
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
