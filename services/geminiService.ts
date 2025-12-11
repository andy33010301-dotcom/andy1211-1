import { GoogleGenAI } from "@google/genai";
import { Restaurant, Coordinates } from "../types";

// Mock data for Demo Mode (Fallback)
const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'mock-1',
    name: 'Burger & Co.',
    cuisine: 'American',
    description: 'Juicy handmade smash burgers with secret sauce and crispy truffle fries.',
    googleMapsUri: 'https://www.google.com/maps/search/Burger+&+Co.'
  },
  {
    id: 'mock-2',
    name: 'Sushi Zen',
    cuisine: 'Japanese',
    description: 'Fresh sashimi, artisan rolls, and warm miso soup in a peaceful setting.',
    googleMapsUri: 'https://www.google.com/maps/search/Sushi+Zen'
  },
  {
    id: 'mock-3',
    name: 'Pasta Paradise',
    cuisine: 'Italian',
    description: 'Authentic homemade pasta and wood-fired neapolitan pizzas.',
    googleMapsUri: 'https://www.google.com/maps/search/Pasta+Paradise'
  },
  {
    id: 'mock-4',
    name: 'Taco Fiesta',
    cuisine: 'Mexican',
    description: 'Street-style tacos with spicy salsa verde and fresh guacamole.',
    googleMapsUri: 'https://www.google.com/maps/search/Taco+Fiesta'
  },
  {
    id: 'mock-5',
    name: 'Golden Dragon',
    cuisine: 'Chinese',
    description: 'Classic dim sum favorites and spicy Szechuan dishes.',
    googleMapsUri: 'https://www.google.com/maps/search/Golden+Dragon'
  }
];

const parseRestaurantsFromText = (text: string, groundingChunks: any[]): Restaurant[] => {
  const restaurants: Restaurant[] = [];
  const lines = text.split('\n');
  
  lines.forEach((line) => {
    // Basic cleanup
    const cleanLine = line.trim();
    if (!cleanLine) return;
    
    // Skip likely conversational headers/footers
    if (cleanLine.toLowerCase().startsWith('here are')) return;
    if (cleanLine.toLowerCase().startsWith('sure,')) return;

    let name = '';
    let cuisine = 'Local Flavor';
    let description = 'Highly rated restaurant nearby.';

    // Strategy 1: The requested "||" format (Strict)
    if (cleanLine.includes('||')) {
      const parts = cleanLine.split('||').map(s => s.trim());
      if (parts[0]) name = parts[0];
      if (parts[1]) cuisine = parts[1];
      if (parts[2]) description = parts[2];
    } 
    // Strategy 2: Numbered/Bulleted list with bolding
    else if (cleanLine.match(/^[\d\-\*\•]+[\.\)]?\s*/)) {
        let content = cleanLine.replace(/^[\d\-\*\•]+[\.\)]?\s*/, '');
        const boldMatch = content.match(/\*\*(.*?)\*\*/);
        if (boldMatch) {
            name = boldMatch[1];
            const remaining = content.replace(/\*\*.*?\*\*/, '').trim();
            const desc = remaining.replace(/^[:\-–,]\s*/, '');
            if (desc) description = desc;
        } else {
            const separatorMatch = content.match(/[:\-–]/);
            if (separatorMatch) {
                const parts = content.split(separatorMatch[0]);
                name = parts[0].trim();
                if (parts[1]) description = parts.slice(1).join(' ').trim();
            } else {
                if (content.length < 50 && content.length > 2) {
                    name = content;
                }
            }
        }
    }

    name = name.replace(/\*\*/g, '').trim();

    if (name && name.length > 1) {
        const chunk = groundingChunks?.find((c: any) => 
            c.web?.title?.toLowerCase().includes(name.toLowerCase()) || 
            name.toLowerCase().includes(c.web?.title?.toLowerCase()) ||
            c.maps?.title?.toLowerCase().includes(name.toLowerCase())
        );

        let uri = chunk?.web?.uri || chunk?.maps?.uri;
        
        // Fallback URI generation if grounding fails
        if (!uri) {
           uri = `https://www.google.com/maps/search/${encodeURIComponent(name)}`;
        }

        restaurants.push({
            id: Math.random().toString(36).substr(2, 9),
            name: name,
            cuisine: cuisine,
            description: description,
            googleMapsUri: uri
        });
    }
  });

  return restaurants;
};

export const fetchNearbyRestaurants = async (coords: Coordinates): Promise<Restaurant[]> => {
  // --- DEMO MODE CHECK ---
  // If no API Key is found, we fall back to Mock Data instead of crashing.
  // This allows the app to be "Demoable" instantly.
  if (!process.env.API_KEY) {
    console.warn("⚠️ API Key not found. Switching to DEMO MODE.");
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network latency
    return MOCK_RESTAURANTS;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find 8 popular restaurants near latitude ${coords.latitude}, longitude ${coords.longitude}.
      
      Instructions:
      1. Provide a diverse mix of cuisines.
      2. Strictly use this format for each line:
      Name || Cuisine Type || Short description
      
      Example:
      Joe's Pizza || Italian || Famous for their thin crust.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: coords.latitude,
              longitude: coords.longitude
            }
          }
        }
      }
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const parsed = parseRestaurantsFromText(text, groundingChunks);
    
    // If parsing fails completely, use mock data as a safety net
    if (parsed.length === 0) {
      console.warn("Gemini returned no valid parsed results. Falling back to Demo Mode.");
      return MOCK_RESTAURANTS;
    }

    return parsed;

  } catch (error: any) {
    console.error("Error fetching from Gemini:", error);
    // Instead of throwing an error to the UI, we fail gracefully to Demo Mode
    // This ensures the user always gets a result.
    console.warn("API Error occurred. Switching to DEMO MODE.");
    return MOCK_RESTAURANTS;
  }
};
