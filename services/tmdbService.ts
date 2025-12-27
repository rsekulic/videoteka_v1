
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = '4f9f5c0b6b4b56bc56dfa12f7fd990ca';
const TMDB_READ_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0ZjlmNWMwYjZiNGI1NmJjNTZkZmExMmY3ZmQ5OTBjYSIsIm5iZiI6MTc2Njg2OTc4NS41MTUsInN1YiI6IjY5NTA0YjE5Mzc0OWIxM2Y2NDhjZTRkMCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.-SU_LwMmI2JWo4iawHi1ytwncz1gbGkAO8jNpi3Z-7k';

const fetchHeaders = {
  'accept': 'application/json',
  'Authorization': `Bearer ${TMDB_READ_ACCESS_TOKEN}`
};

export async function searchTMDB(query: string, type: 'movie' | 'tv' = 'movie') {
  try {
    // 1. Search for the ID
    const searchRes = await fetch(
      `${TMDB_BASE_URL}/search/${type}?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`,
      { method: 'GET', headers: fetchHeaders }
    );
    const searchData = await searchRes.json();
    
    if (!searchData.results || searchData.results.length === 0) return null;
    
    // Pick the most popular result
    const bestMatch = searchData.results[0];
    
    // 2. Fetch full details including credits and videos (trailers)
    const detailsRes = await fetch(
      `${TMDB_BASE_URL}/${type}/${bestMatch.id}?append_to_response=credits,videos&language=en-US`,
      { method: 'GET', headers: fetchHeaders }
    );
    const details = await detailsRes.json();

    // Find a trailer (prioritize YouTube trailers)
    const trailer = details.videos?.results?.find(
      (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
    ) || details.videos?.results?.find((v: any) => v.type === 'Trailer');

    const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined;

    return {
      title: type === 'movie' ? details.title : details.name,
      year: (type === 'movie' ? details.release_date : details.first_air_date)?.split('-')[0] || 'N/A',
      rating: details.vote_average?.toFixed(1) || 'N/A',
      type: type === 'movie' ? 'Movie' : 'TV Series',
      genre: details.genres?.map((g: any) => g.name) || [],
      description: details.overview,
      poster: details.poster_path ? `https://image.tmdb.org/t/p/w780${details.poster_path}` : '',
      backdrop: details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : '',
      runtime: type === 'movie' ? `${details.runtime}m` : undefined,
      seasons: type === 'tv' ? details.number_of_seasons : undefined,
      director: details.credits?.crew?.find((c: any) => c.job === 'Director')?.name || 
                details.credits?.crew?.find((c: any) => c.job === 'Executive Producer')?.name || 'Unknown',
      cast: details.credits?.cast?.slice(0, 5).map((c: any) => c.name) || [],
      trailerUrl,
      // Placeholder scores to be enriched by Gemini
      tomatoMeter: '...', 
      audienceScore: '...'
    };
  } catch (error) {
    console.error("TMDB API Error:", error);
    return null;
  }
}
