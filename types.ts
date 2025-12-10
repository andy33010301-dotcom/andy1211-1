export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  description: string;
  rating?: string;
  priceLevel?: string;
  address?: string;
  googleMapsUri?: string;
}

export type AppState = 'IDLE' | 'LOCATING' | 'SCANNING' | 'RESULTS' | 'PICKING' | 'WINNER' | 'ERROR';
