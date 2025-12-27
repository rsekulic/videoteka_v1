
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

  // Primary search via TMDB for high-res assets
  let tmdbData = await searchTMDB(input, 'movie');
  if (!tmdbData) {
    tmdbData = await searchTMDB(input, 'tv');
  }
  
  if (tmdbData) {
    // Critical: Overwrite the TMDB 'N/A' defaults with live RT scores
    const scores = await enrichWithScores(tmdbData.title, tmdbData.year);
    return {
      ...tmdbData,
      id: Math.random().toString(36).substr(2, 9),
      tomatoMeter: scores.tomatoMeter || 'N/A',
      audienceScore: scores.audienceScore || 'N/A'
    } as MediaItem;
  }

  // Fallback if TMDB fails completely
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
    
    // Using Gemini 3 Pro with high thinking budget to ensure it doesn't miss scores in search results
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a precision data extractor. Your task is to find the Rotten Tomatoes scores for: "${title} (${year})".

      Step-by-Step Instructions:
      1. Use Google Search to find the official Rotten Tomatoes page for this specific production.
      2. Locate the "Tomatometer" (Critics Score) and the "Audience Score".
      3. If you find multiple versions (e.g., a movie and a remake), select the one matching the year ${year}.
      4. Ensure you capture the percentage symbol (e.g., "94%").
      5. Return ONLY a JSON object. No preamble. No chat.
      
      Example: {"tomatoMeter": "85%", "audienceScore": "90%"}`,
      config: {
        thinkingConfig: { thinkingBudget: 16000 },
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tomatoMeter: { type: Type.STRING, description: "The critics score, e.g. 88%" },
            audienceScore: { type: Type.STRING, description: "The audience score, e.g. 92%" }
          },
          required: ['tomatoMeter', 'audienceScore']
        }
      }
    });

    const text = response.text;
    if (!text) return { tomatoMeter: 'N/A', audienceScore: 'N/A' };
    
    const result = JSON.parse(text);
    return {
      tomatoMeter: result.tomatoMeter && result.tomatoMeter !== 'N/A' ? result.tomatoMeter : 'N/A',
      audienceScore: result.audienceScore && result.audienceScore !== 'N/A' ? result.audienceScore : 'N/A'
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
      contents: `Find complete metadata for: "${input}". 
      ${isUrl ? 'Extract directly from the URL.' : 'Search Google for the most accurate match.'}
      Focus on finding the REAL Rotten Tomatoes percentages.
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
