
import { MediaItem } from './types';

export const INITIAL_DATA: MediaItem[] = [
  {
    id: '1',
    title: 'Interstellar',
    year: '2014',
    type: 'Movie',
    genre: ['Sci-Fi', 'Drama', 'Adventure'],
    description: 'When Earth becomes uninhabitable, a farmer and ex-pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
    poster: 'https://picsum.photos/seed/interstellar/400/600',
    backdrop: 'https://picsum.photos/seed/interstellar_bg/1200/600',
    runtime: '2h 49m',
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain']
  },
  {
    id: '2',
    title: 'Succession',
    year: '2018-2023',
    type: 'TV Series',
    genre: ['Drama', 'Dark Comedy'],
    description: 'The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their father steps down from the company.',
    poster: 'https://picsum.photos/seed/succession/400/600',
    backdrop: 'https://picsum.photos/seed/succession_bg/1200/600',
    seasons: 4,
    director: 'Jesse Armstrong',
    cast: ['Brian Cox', 'Jeremy Strong', 'Sarah Snook']
  },
  {
    id: '3',
    title: 'Dune: Part Two',
    year: '2024',
    type: 'Movie',
    genre: ['Sci-Fi', 'Action'],
    description: 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.',
    poster: 'https://picsum.photos/seed/dune2/400/600',
    backdrop: 'https://picsum.photos/seed/dune2_bg/1200/600',
    runtime: '2h 46m',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson']
  },
  {
    id: '4',
    title: 'Severance',
    year: '2022',
    type: 'TV Series',
    genre: ['Sci-Fi', 'Thriller'],
    description: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.',
    poster: 'https://picsum.photos/seed/severance/400/600',
    backdrop: 'https://picsum.photos/seed/severance_bg/1200/600',
    seasons: 1,
    director: 'Ben Stiller',
    cast: ['Adam Scott', 'Zach Cherry', 'Britt Lower']
  },
  {
    id: '5',
    title: 'The Bear',
    year: '2022',
    type: 'TV Series',
    genre: ['Drama', 'Comedy'],
    description: 'A young chef from the fine dining world returns to Chicago to run his family sandwich shop.',
    poster: 'https://picsum.photos/seed/thebear/400/600',
    backdrop: 'https://picsum.photos/seed/thebear_bg/1200/600',
    seasons: 3,
    director: 'Christopher Storer',
    cast: ['Jeremy Allen White', 'Ebon Moss-Bachrach', 'Ayo Edebiri']
  },
  {
    id: '6',
    title: 'Oppenheimer',
    year: '2023',
    type: 'Movie',
    genre: ['Biography', 'Drama', 'History'],
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    poster: 'https://picsum.photos/seed/oppenheimer/400/600',
    backdrop: 'https://picsum.photos/seed/oppenheimer_bg/1200/600',
    runtime: '3h',
    director: 'Christopher Nolan',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon']
  },
  {
    id: '7',
    title: 'Dark',
    year: '2017-2020',
    type: 'TV Series',
    genre: ['Sci-Fi', 'Mystery', 'Thriller'],
    description: 'A family saga with a supernatural twist, set in a German town where the disappearance of two young children exposes the relationships among four families.',
    poster: 'https://picsum.photos/seed/dark/400/600',
    backdrop: 'https://picsum.photos/seed/dark_bg/1200/600',
    seasons: 3,
    director: 'Baran bo Odar',
    cast: ['Louis Hofmann', 'Karoline Eichhorn', 'Lisa Vicari']
  },
  {
    id: '8',
    title: 'Parasite',
    year: '2019',
    type: 'Movie',
    genre: ['Thriller', 'Drama', 'Comedy'],
    description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
    poster: 'https://picsum.photos/seed/parasite/400/600',
    backdrop: 'https://picsum.photos/seed/parasite_bg/1200/600',
    runtime: '2h 12m',
    director: 'Bong Joon Ho',
    cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong']
  }
];

export const GENRES = [
  'All', 'Sci-Fi', 'Drama', 'Thriller', 'Action', 'Comedy', 'Mystery', 'Biography'
];
