import { GoogleGenAI, Type } from "@google/genai";
import { ThemeColors } from "../types";

// NOTE: process.env.API_KEY is assumed to be injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTheme = async (prompt: string): Promise<ThemeColors | null> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
      model,
      contents: `Create a stunning, cohesive color theme for a modern block puzzle game based on this description: "${prompt}".
      The colors should provide good contrast and look professional.
      Ensure the text color is readable against the background.
      Return valid Hex codes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            background: { type: Type.STRING, description: "Main app background color (Hex)" },
            board: { type: Type.STRING, description: "Game board background color (Hex)" },
            emptyCell: { type: Type.STRING, description: "Empty grid cell color (Hex)" },
            primaryBlock: { type: Type.STRING, description: "Primary vibrant color for blocks (Hex)" },
            secondaryBlock: { type: Type.STRING, description: "Secondary vibrant color for blocks (Hex)" },
            tertiaryBlock: { type: Type.STRING, description: "Tertiary vibrant color for blocks (Hex)" },
            accent: { type: Type.STRING, description: "Accent color for UI elements/buttons (Hex)" },
            text: { type: Type.STRING, description: "Main text color (Hex)" },
            name: { type: Type.STRING, description: "A creative name for this theme" },
          },
          required: ["background", "board", "emptyCell", "primaryBlock", "secondaryBlock", "tertiaryBlock", "accent", "text"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ThemeColors;
    }
    return null;
  } catch (error) {
    console.error("Failed to generate theme:", error);
    return null;
  }
};
