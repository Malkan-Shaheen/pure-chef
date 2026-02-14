
export interface Ingredient {
  id: string;
  name: string;
}

export interface RecipeIngredient {
  name: string;
  amount: string;
  isMissing: boolean;
}

export interface NutritionData {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  calories: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  imageUrl?: string;
  nutrition_total: NutritionData;
  nutrition_per_serving: NutritionData;
  servings_count: number;
  nutrition_source: string;
  is_estimated: boolean;
}

export interface TasteProfile {
  lovedRecipes: string[];
  dislikedRecipes: string[];
  preferences: {
    spiceLevel: 'mild' | 'medium' | 'hot';
    texture: string[];
    flavorBias: string[];
  };
}

export type FeedbackType = 'LOVED' | 'OKAY' | 'DISLIKED';

export type RecipeMode = 'STANDARD' | 'HIGH_PROTEIN' | 'KETO' | 'UNDER_500_CAL';

export type RecipeEmotion = 'COMFORT' | 'LIGHT' | 'ENERGIZED' | 'COZY' | 'LAZY' | 'IMPRESS';

export type AppState = 'LANDING' | 'SCANNING' | 'EDITING' | 'GENERATING' | 'RESULTS' | 'KITCHEN';
