import { GoogleGenAI } from "@google/genai";
import { Restaurant, Coordinates } from "../types";

const parseRestaurantsFromText = (text: string, groundingChunks: any[]): Restaurant[] => {
  const restaurants: Restaurant[] = [];
  const lines = text.split('\n');
  
  // Simple parsing logic assuming the model follows the requested format reasonably well
  // Format requested: "Name || Cuisine || Description"
  
  lines.forEach((line) => {
    if (line.includes('||')) {
      const parts = line.split('||').map(s => s.trim());
      if (parts.length >= 3) {
        // Clean up markdown list markers if present
        const nameClean = parts[0].replace(/^[\d\-\*\.]+\s*/, '').replace(/\*\*/g, '').trim();
        
        // Attempt to find a matching grounding chunk for the URL
        const chunk = groundingChunks?.find((c: any) => 
          c.web?.title?.toLowerCase().includes(nameClean.toLowerCase()) || 
          nameClean.toLowerCase().includes(c.web?.title?.toLowerCase()) ||
          c.maps?.title?.toLowerCase().includes(nameClean.toLowerCase())
        );

        let uri = chunk?.web?.uri || chunk?.maps?.uri;

        // If no direct URI found in chunks, we leave it undefined (UI handles this)
        
        restaurants.push({
          id: Math.random().toString(36).substr(2, 9),
          name: nameClean,
          cuisine: parts[1],
          description: parts[2],
          googleMapsUri: uri
        });
      }
    }
  });

  return restaurants;
};

export const fetchNearbyRestaurants = async (coords: Coordinates): Promise<Restaurant[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find 8 highly-rated and popular restaurants near the user's current location. 
      Try to include a diverse mix of cuisines (e.g., local favorites, asian, western, dessert, etc.).
      
      CRITICAL OUTPUT FORMAT:
      You MUST list them strictly in this format, one per line:
      Name || Cuisine Type || A short, appetizing 1-sentence description.

      Do not include any intro or outro text. Just the list.`,
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
    // Accessing grounding chunks to get real map links
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const parsed = parseRestaurantsFromText(text, groundingChunks);
    
    // If parsing fails or returns empty, throw error to trigger retry or manual fallback
    if (parsed.length === 0) {
      console.warn("Gemini response was empty or malformed:", text);
      throw new Error("Could not find restaurants. Please try again.");
    }

    return parsed;

  } catch (error) {
    console.error("Error fetching from Gemini:", error);
    throw error;
  }
};
