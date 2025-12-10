import { GoogleGenAI } from "@google/genai";
import { Restaurant, Coordinates } from "../types";

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
      // Even if parts are incomplete, try to use what we have
      if (parts[0]) name = parts[0];
      if (parts[1]) cuisine = parts[1];
      if (parts[2]) description = parts[2];
    } 
    // Strategy 2: Numbered/Bulleted list with bolding (Common fallback output) e.g. "1. **Place**: Desc"
    else if (cleanLine.match(/^[\d\-\*\•]+[\.\)]?\s*/)) {
        // Remove the list marker (e.g. "1. ", "* ", "- ")
        let content = cleanLine.replace(/^[\d\-\*\•]+[\.\)]?\s*/, '');
        
        // Check for Bolded Name (standard Gemini markdown)
        const boldMatch = content.match(/\*\*(.*?)\*\*/);
        if (boldMatch) {
            name = boldMatch[1];
            // Remove name from content to find description
            const remaining = content.replace(/\*\*.*?\*\*/, '').trim();
            // Remove separators like ": " or "- "
            const desc = remaining.replace(/^[:\-–,]\s*/, '');
            if (desc) description = desc;
        } else {
            // No bolding, try splitting by first colon or hyphen
            const separatorMatch = content.match(/[:\-–]/);
            if (separatorMatch) {
                const parts = content.split(separatorMatch[0]);
                name = parts[0].trim();
                if (parts[1]) description = parts.slice(1).join(' ').trim();
            } else {
                // Last resort: take the whole line as name if it's short enough to be a name
                if (content.length < 50 && content.length > 2) {
                    name = content;
                }
            }
        }
    }

    // Final cleanup of the name (remove any remaining markdown stars or extra spaces)
    name = name.replace(/\*\*/g, '').trim();

    // Only add if we successfully extracted a valid-looking name
    if (name && name.length > 1) {
         // Attempt to find a matching grounding chunk for the URL
        const chunk = groundingChunks?.find((c: any) => 
            c.web?.title?.toLowerCase().includes(name.toLowerCase()) || 
            name.toLowerCase().includes(c.web?.title?.toLowerCase()) ||
            c.maps?.title?.toLowerCase().includes(name.toLowerCase())
        );

        let uri = chunk?.web?.uri || chunk?.maps?.uri;

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
  // Check if API Key is available
  if (!process.env.API_KEY) {
    console.error("API Key not found in environment variables");
    throw new Error("API Key is missing. Please set 'API_KEY' in your Vercel Environment Variables.");
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
      Joe's Pizza || Italian || Famous for their thin crust.

      If you strictly cannot follow the format, just ensure the Restaurant Name is the first thing on the line.`,
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
    
    if (parsed.length === 0) {
      console.warn("Gemini response was parsed but resulted in 0 restaurants. Raw text:", text);
      throw new Error("Found no valid restaurants in the area. Please try again.");
    }

    return parsed;

  } catch (error: any) {
    console.error("Error fetching from Gemini:", error);
    // Propagate the specific error message
    throw error;
  }
};