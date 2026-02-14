
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Recipe, RecipeIngredient, RecipeMode, RecipeEmotion, TasteProfile } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const detectIngredientsFromImage = async (base64Image: string): Promise<string[]> => {
  const ai = getAI();
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image,
    },
  };
  
  const prompt = "Identify all individual food ingredients visible in this refrigerator or pantry photo. Return only a comma-separated list of the items. Do not include containers, brands, or adjectives like 'fresh' or 'large' unless necessary.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [imagePart, { text: prompt }] },
  });

  const text = response.text || "";
  return text.split(',').map(i => i.trim()).filter(i => i.length > 0);
};

export const generateRecipes = async (
  ingredients: string[], 
  mode: RecipeMode = 'STANDARD',
  emotion: RecipeEmotion = 'COMFORT',
  tasteProfile?: TasteProfile
): Promise<Recipe[]> => {
  const ai = getAI();
  
  let modeConstraint = "";
  switch(mode) {
    case 'HIGH_PROTEIN':
      modeConstraint = "CRITICAL: Every recipe must be high in protein (focus on meat, eggs, beans, or dairy provided).";
      break;
    case 'KETO':
      modeConstraint = "CRITICAL: Every recipe must be Ketogenic (high fat, low carb). Avoid sugars and high-starch items.";
      break;
    case 'UNDER_500_CAL':
      modeConstraint = "CRITICAL: Every recipe must be under 500 calories per serving.";
      break;
    default:
      modeConstraint = "Provide balanced and delicious recipes.";
  }

  let emotionConstraint = "";
  switch(emotion) {
    case 'COMFORT':
      emotionConstraint = "STYLE: Soul-warming, familiar, and hearty. Focus on textures that feel like a hug.";
      break;
    case 'LIGHT':
      emotionConstraint = "STYLE: Crisp, vibrant, and clean. Focus on fresh flavors, citrus, and raw or lightly cooked elements.";
      break;
    case 'ENERGIZED':
      emotionConstraint = "STYLE: Power-packed and balanced. Focus on high-nutrient density to provide lasting energy.";
      break;
    case 'COZY':
      emotionConstraint = "STYLE: Slow-cooked vibes, warm spices (cinnamon, cumin, etc.), and soothing warmth.";
      break;
    case 'LAZY':
      emotionConstraint = "STYLE: Minimum effort, maximum flavor. One-pot or 5-minute prep style. Very few steps.";
      break;
    case 'IMPRESS':
      emotionConstraint = "STYLE: Sophisticated and gourmet. Focus on elegant presentation and unique flavor pairings to wow a guest.";
      break;
  }

  const tasteContext = tasteProfile ? `
  USER PERSONAL PALATE (Taste Memory):
  - Loved flavor patterns: ${tasteProfile.lovedRecipes.join(', ')}
  - Avoided patterns: ${tasteProfile.dislikedRecipes.join(', ')}
  - Preferred Spice: ${tasteProfile.preferences.spiceLevel}
  - Preferred Textures: ${tasteProfile.preferences.texture.join(', ')}
  - Flavor bias: ${tasteProfile.preferences.flavorBias.join(', ')}
  
  ADJUSTMENT: Prioritize these preferences in the 3 generated options. If the user loves a specific style, reflect that in the "Chef's Choice" option.
  ` : "";

  const prompt = `Based on these ingredients: [${ingredients.join(', ')}], and basic pantry staples (oil, salt, pepper, water), generate 3 distinct and valid recipes. 
  
  Dietary Mode: ${mode}
  ${modeConstraint}

  User Mood/Emotion: ${emotion}
  ${emotionConstraint}

  ${tasteContext}

  Strategy for the 3 recipes:
  1. "Pantry Hero": A recipe using ONLY what the user has.
  2. "The Gap": A high-value recipe that is missing EXACTLY ONE key ingredient. This ingredient should unlock a significantly different or "better" meal.
  3. "Chef's Choice": A creative recipe using as many of the provided ingredients as possible.

  Nutrition Rules:
  - For each recipe, calculate the Nutrition Breakdown (Macros).
  - Use standard nutrition data (similar to USDA or Edamam).
  - If exact amount is unknown, estimate a standard portion (e.g., 50g-100g) and mark is_estimated as true.
  - Return nutrition_total (sum of all ingredients) and nutrition_per_serving.
  - Required macros: calories (kcal), protein_g, carbs_g, fat_g.

  Recipe Rules:
  - For EVERY recipe, strictly highlight if an ingredient is missing (isMissing: true).
  - Ensure instructions are clear steps.
  - CRITICAL: When providing instructions for meal preparation, please include the quantity of each ingredient inside the instruction text itself. 
  - Output MUST be a valid JSON array of objects following the schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            prepTime: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            servings_count: { type: Type.NUMBER },
            nutrition_source: { type: Type.STRING },
            is_estimated: { type: Type.BOOLEAN },
            nutrition_total: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein_g: { type: Type.NUMBER },
                carbs_g: { type: Type.NUMBER },
                fat_g: { type: Type.NUMBER }
              }
            },
            nutrition_per_serving: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein_g: { type: Type.NUMBER },
                carbs_g: { type: Type.NUMBER },
                fat_g: { type: Type.NUMBER }
              }
            },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.STRING },
                  isMissing: { type: Type.BOOLEAN }
                },
                required: ["name", "amount", "isMissing"]
              }
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "description", "prepTime", "calories", "ingredients", "instructions", "nutrition_total", "nutrition_per_serving", "servings_count"]
        }
      }
    }
  });

  const recipes = JSON.parse(response.text || "[]") as Recipe[];
  return recipes.map((r, idx) => ({ ...r, id: `recipe-${idx}` }));
};

export const generateRecipeImage = async (recipeTitle: string): Promise<string> => {
  const ai = getAI();
  const prompt = `A high-quality, professional, minimalist overhead food photograph of ${recipeTitle}. Set on a clean kitchen counter with a soft minimalist blue background. Natural morning lighting, high resolution, aesthetic and appetizing presentation.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  return `https://picsum.photos/seed/${encodeURIComponent(recipeTitle)}/600/600`;
};
