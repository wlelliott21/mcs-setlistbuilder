import type { GigTemplate } from '@/types';

export const APP_NAME = 'Setlist Builder';

export const GIG_TEMPLATES: GigTemplate[] = [
  {
    id: 'wedding',
    name: 'Wedding Reception',
    description: 'Cocktail hour, dinner, and dance sets',
    sets: [
      { name: 'Cocktail Hour', targetDuration: 60 },
      { name: 'Dinner Set', targetDuration: 45 },
      { name: 'First Dances', targetDuration: 15 },
      { name: 'Dance Set 1', targetDuration: 45 },
      { name: 'Dance Set 2', targetDuration: 45 },
    ],
  },
  {
    id: 'corporate',
    name: 'Corporate Event',
    description: 'Background music and entertainment sets',
    sets: [
      { name: 'Background / Arrival', targetDuration: 45 },
      { name: 'Dinner Set', targetDuration: 60 },
      { name: 'Party Set 1', targetDuration: 45 },
      { name: 'Party Set 2', targetDuration: 45 },
    ],
  },
  {
    id: 'private-party',
    name: 'Private Party',
    description: 'Casual sets with high energy finish',
    sets: [
      { name: 'Set 1', targetDuration: 45 },
      { name: 'Set 2', targetDuration: 45 },
      { name: 'Set 3 — Finale', targetDuration: 45 },
    ],
  },
  {
    id: 'club',
    name: 'Club / Venue Gig',
    description: 'Two high-energy sets with break',
    sets: [
      { name: 'Set 1', targetDuration: 60 },
      { name: 'Set 2', targetDuration: 60 },
    ],
  },
];

export const DEFAULT_BUFFER_TIME = 15;
