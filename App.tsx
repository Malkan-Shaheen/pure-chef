
import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Keyboard, 
  Plus, 
  X, 
  ChefHat, 
  Wand2, 
  Sparkles,
  Search,
  Check,
  ShoppingCart,
  AlertCircle,
  Zap,
  Leaf,
  Dumbbell,
  Timer,
  Upload,
  Heart,
  Sun,
  Activity,
  Coffee,
  Smile,
  Star,
  RefreshCw
} from 'lucide-react';
import { Ingredient, Recipe, AppState, RecipeMode, RecipeEmotion, TasteProfile, FeedbackType } from './types';
import { detectIngredientsFromImage, generateRecipes, generateRecipeImage } from './services/gemini';
import { LoadingScreen } from './components/LoadingScreen';
import { RecipeDetail } from './components/RecipeDetail';
import { KitchenMode } from './components/KitchenMode';

// --- Sub-components ---

const LandingView: React.FC<{
  onScanClick: () => void;
  onUploadClick: () => void;
  onTypeClick: () => void;
}> = ({ onScanClick, onUploadClick, onTypeClick }) => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 animate-in fade-in duration-700">
    <div className="bg-blue-100 p-5 rounded-3xl mb-8 shadow-inner">
      <ChefHat size={64} className="text-blue-600" />
    </div>
    <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
      Cook with what<br />you <span className="text-blue-500">already have.</span>
    </h1>
    <p className="text-slate-600 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
      PURE Chef uses AI to turn your fridge ingredients into gourmet meals. 
      Save time, reduce waste, and eat better.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
      <button 
        onClick={onScanClick}
        className="flex-1 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-6 rounded-2xl shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95"
      >
        <Camera size={20} />
        Scan My Fridge
      </button>
      <button 
        onClick={onUploadClick}
        className="flex-1 flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:border-blue-200 text-slate-700 font-bold py-5 px-6 rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
      >
        <Upload size={20} />
        Upload Photo
      </button>
      <button 
        onClick={onTypeClick}
        className="flex-1 flex items-center justify-center gap-3 bg-white border-2 border-slate-100 hover:border-blue-200 text-slate-700 font-bold py-5 px-6 rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
      >
        <Keyboard size={20} />
        Type Ingredients
      </button>
    </div>
    <p className="mt-8 text-slate-400 text-sm flex items-center gap-2">
      <Sparkles size={14} /> Powered by Gemini Vision
    </p>
  </div>
);

const ModeSelector: React.FC<{
  currentMode: RecipeMode;
  onModeChange: (mode: RecipeMode) => void;
}> = ({ currentMode, onModeChange }) => {
  const modes: { id: RecipeMode; label: string; icon: any; color: string }[] = [
    { id: 'STANDARD', label: 'Balanced', icon: Zap, color: 'blue' },
    { id: 'HIGH_PROTEIN', label: 'High Protein', icon: Dumbbell, color: 'blue' },
    { id: 'KETO', label: 'Keto Friendly', icon: Leaf, color: 'purple' },
    { id: 'UNDER_500_CAL', label: 'Under 500 Cal', icon: Timer, color: 'orange' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
            currentMode === mode.id
              ? `border-${mode.color}-500 bg-${mode.color}-50 text-${mode.color}-700 ring-4 ring-${mode.color}-500/10`
              : 'border-slate-100 bg-white text-slate-500 hover:border-blue-200'
          }`}
        >
          <mode.icon size={20} className={currentMode === mode.id ? `text-${mode.color}-600` : 'text-slate-400'} />
          <span className="text-xs font-bold uppercase tracking-wider">{mode.label}</span>
        </button>
      ))}
    </div>
  );
};

const EmotionSelector: React.FC<{
  currentEmotion: RecipeEmotion;
  onEmotionChange: (emotion: RecipeEmotion) => void;
}> = ({ currentEmotion, onEmotionChange }) => {
  const emotions: { id: RecipeEmotion; label: string; icon: any; color: string }[] = [
    { id: 'COMFORT', label: 'Comfort', icon: Heart, color: 'blue' },
    { id: 'LIGHT', label: 'Light & Fresh', icon: Sun, color: 'blue' },
    { id: 'ENERGIZED', label: 'Energized', icon: Activity, color: 'blue' },
    { id: 'COZY', label: 'Cozy', icon: Coffee, color: 'blue' },
    { id: 'LAZY', label: 'Quick & Lazy', icon: Smile, color: 'blue' },
    { id: 'IMPRESS', label: 'Impress', icon: Star, color: 'blue' },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-8">
      {emotions.map((emo) => (
        <button
          key={emo.id}
          onClick={() => onEmotionChange(emo.id)}
          className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
            currentEmotion === emo.id
              ? `border-${emo.color}-500 bg-${emo.color}-50 text-${emo.color}-700 ring-4 ring-${emo.color}-500/10`
              : 'border-slate-100 bg-white text-slate-500 hover:border-blue-200'
          }`}
        >
          <emo.icon size={18} className={currentEmotion === emo.id ? `text-${emo.color}-600` : 'text-slate-400'} />
          <span className="text-[10px] font-bold uppercase tracking-tight text-center">{emo.label}</span>
        </button>
      ))}
    </div>
  );
};

const EditIngredientsView: React.FC<{
  ingredients: Ingredient[];
  newIngredient: string;
  setNewIngredient: (val: string) => void;
  addIngredient: (name: string) => void;
  removeIngredient: (id: string) => void;
  onBack: () => void;
  onGenerate: () => void;
  recipeMode: RecipeMode;
  setRecipeMode: (mode: RecipeMode) => void;
  recipeEmotion: RecipeEmotion;
  setRecipeEmotion: (emotion: RecipeEmotion) => void;
}> = ({ 
  ingredients, 
  newIngredient, 
  setNewIngredient, 
  addIngredient, 
  removeIngredient, 
  onBack, 
  onGenerate, 
  recipeMode, 
  setRecipeMode,
  recipeEmotion,
  setRecipeEmotion
}) => (
  <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
    <div className="bg-white p-8 rounded-3xl shadow-lg">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">My Ingredients</h2>
      <p className="text-slate-500 mb-8">Customize your meal goal and mood.</p>
      
      <div className="mb-6">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">1. Choose Your Mode</label>
        <ModeSelector currentMode={recipeMode} onModeChange={setRecipeMode} />
      </div>

      <div className="mb-6">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">2. How do you feel right now?</label>
        <EmotionSelector currentEmotion={recipeEmotion} onEmotionChange={setRecipeEmotion} />
      </div>

      <div className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Add ingredient..."
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addIngredient(newIngredient)}
            className="w-full bg-slate-50 border border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all"
            autoFocus
          />
        </div>
        <button 
          onClick={() => addIngredient(newIngredient)}
          className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-10 min-h-[100px] content-start">
        {ingredients.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
            <ChefHat size={32} className="mb-2" />
            <p>No ingredients added yet</p>
          </div>
        ) : (
          ingredients.map(ing => (
            <div 
              key={ing.id} 
              className="flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-full border border-blue-100 group hover:bg-blue-100 transition-all"
            >
              <span className="font-medium capitalize">{ing.name}</span>
              <button 
                onClick={() => removeIngredient(ing.id)}
                className="text-blue-400 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-4">
         <button 
          onClick={onBack}
          className="px-6 py-4 rounded-2xl font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
        >
          Back
        </button>
        <button 
          disabled={ingredients.length === 0}
          onClick={onGenerate}
          className="flex-1 flex items-center justify-center gap-3 bg-blue-600 disabled:opacity-50 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Wand2 size={24} />
          Generate Recipes
        </button>
      </div>
    </div>
  </div>
);

const ResultsView: React.FC<{
  recipes: Recipe[];
  onSelect: (r: Recipe) => void;
  onEdit: () => void;
  onRegenerate: () => void;
}> = ({ recipes, onSelect, onEdit, onRegenerate }) => (
  <div className="py-12 px-4 max-w-7xl mx-auto animate-in fade-in duration-500">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
      <div>
        <h2 className="text-4xl font-bold text-slate-900 mb-2">3 Chef Recommendations</h2>
        <p className="text-slate-600 text-lg">Personalized meals based on your unique palate.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button 
          onClick={onRegenerate}
          className="px-8 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-blue-600 hover:border-blue-200 transition-all flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Try 3 More
        </button>
        <button 
          onClick={onEdit}
          className="px-8 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-slate-600 hover:border-slate-200 transition-all"
        >
          Adjust Ingredients
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {recipes.map((recipe) => {
        const missingCount = recipe.ingredients.filter(i => i.isMissing).length;
        const isGapRecipe = missingCount === 1;
        const isPerfectMatch = missingCount === 0;

        return (
          <div 
            key={recipe.id}
            onClick={() => onSelect(recipe)}
            className="group cursor-pointer bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative border border-slate-100"
          >
            <div className="relative h-64 overflow-hidden">
              <img 
                src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/600/600`} 
                alt={recipe.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {isPerfectMatch && (
                <div className="absolute top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                  <Check size={14} /> Perfect Match
                </div>
              )}
              {isGapRecipe && (
                <div className="absolute top-4 left-4 bg-amber-400 text-amber-900 px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                  <ShoppingCart size={14} /> Quick Trip
                </div>
              )}
              
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-bold text-blue-600 shadow-sm">
                {recipe.calories} kcal
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-3 uppercase tracking-widest">
                <Sparkles size={16} />
                AI Crafted
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                {recipe.title}
              </h3>
              <p className="text-slate-500 line-clamp-2 mb-6 leading-relaxed">
                {recipe.description}
              </p>
              
              {isGapRecipe && (
                <div className="mb-6 p-3 bg-amber-50 rounded-xl text-xs font-semibold text-amber-700 flex items-center gap-2 border border-amber-100">
                  <AlertCircle size={14} />
                  Missing: {recipe.ingredients.find(i => i.isMissing)?.name}
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <Camera size={18} />
                  {recipe.prepTime}
                </div>
                <div className="text-blue-500 font-bold flex items-center gap-1 group-hover:gap-3 transition-all">
                  View Recipe <Check size={18} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('LANDING');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeMode, setRecipeMode] = useState<RecipeMode>('STANDARD');
  const [recipeEmotion, setRecipeEmotion] = useState<RecipeEmotion>('COMFORT');
  const [newIngredient, setNewIngredient] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [tasteProfile, setTasteProfile] = useState<TasteProfile>({
    lovedRecipes: [],
    dislikedRecipes: [],
    preferences: { spiceLevel: 'medium', texture: [], flavorBias: [] }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Load Taste Memory from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('purechef_taste_profile');
    if (saved) {
      try {
        setTasteProfile(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse taste profile");
      }
    }
  }, []);

  const handleFeedback = (recipeTitle: string, type: FeedbackType) => {
    setTasteProfile(prev => {
      const updated = { ...prev };
      if (type === 'LOVED') {
        if (!updated.lovedRecipes.includes(recipeTitle)) {
          updated.lovedRecipes = [recipeTitle, ...updated.lovedRecipes].slice(0, 10);
        }
      } else if (type === 'DISLIKED') {
        if (!updated.dislikedRecipes.includes(recipeTitle)) {
          updated.dislikedRecipes = [recipeTitle, ...updated.dislikedRecipes].slice(0, 10);
        }
      }
      localStorage.setItem('purechef_taste_profile', JSON.stringify(updated));
      return updated;
    });
  };

  const addIngredient = (name: string) => {
    if (!name.trim()) return;
    const item: Ingredient = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim().toLowerCase()
    };
    setIngredients(prev => [...prev, item]);
    setNewIngredient('');
  };

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAppState('GENERATING');
    setLoadingMessage('Scanning your ingredients...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const detected = await detectIngredientsFromImage(base64);
        const mapped = detected.map(name => ({
          id: Math.random().toString(36).substr(2, 9),
          name: name.toLowerCase()
        }));
        setIngredients(prev => [...prev, ...mapped]);
        setAppState('EDITING');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      alert('Failed to scan image. Please try again.');
      setAppState('LANDING');
    }
  };

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      alert('Add some ingredients first!');
      return;
    }

    setAppState('GENERATING');
    setLoadingMessage(`Consulting your personal palate...`);

    try {
      const ingredientList = ingredients.map(i => i.name);
      const generatedRecipes = await generateRecipes(ingredientList, recipeMode, recipeEmotion, tasteProfile);
      
      setLoadingMessage('Garnishing visual plates...');
      const enrichedRecipes = await Promise.all(
        generatedRecipes.map(async (r) => {
          const imageUrl = await generateRecipeImage(r.title);
          return { ...r, imageUrl };
        })
      );

      setRecipes(enrichedRecipes);
      setAppState('RESULTS');
    } catch (error) {
      console.error(error);
      alert('Error generating recipes. Please check your API key or try again.');
      setAppState('EDITING');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
      />
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={galleryInputRef} 
        onChange={handleFileUpload} 
      />

      {/* Header */}
      {appState !== 'KITCHEN' && (
        <nav className="p-6 md:px-12 flex items-center justify-between">
          <div 
            onClick={() => {
              setAppState('LANDING');
              setSelectedRecipe(null);
            }} 
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="bg-blue-500 text-white p-2 rounded-xl group-hover:rotate-12 transition-transform">
              <ChefHat size={28} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              PURE<span className="text-blue-500">Chef</span>
            </span>
          </div>
          <div className="hidden md:flex gap-8 text-slate-500 font-medium">
            <a href="#" className="hover:text-blue-500 transition-colors">How it works</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Community</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Premium</a>
          </div>
        </nav>
      )}

      <main>
        {appState === 'LANDING' && (
          <LandingView 
            onScanClick={() => fileInputRef.current?.click()} 
            onUploadClick={() => galleryInputRef.current?.click()}
            onTypeClick={() => setAppState('EDITING')} 
          />
        )}
        
        {appState === 'EDITING' && (
          <EditIngredientsView 
            ingredients={ingredients}
            newIngredient={newIngredient}
            setNewIngredient={setNewIngredient}
            addIngredient={addIngredient}
            removeIngredient={removeIngredient}
            onBack={() => setAppState('LANDING')}
            onGenerate={handleGenerate}
            recipeMode={recipeMode}
            setRecipeMode={setRecipeMode}
            recipeEmotion={recipeEmotion}
            setRecipeEmotion={setRecipeEmotion}
          />
        )}
        
        {appState === 'GENERATING' && <LoadingScreen message={loadingMessage} />}
        
        {appState === 'RESULTS' && (
          selectedRecipe ? (
            <div className="py-12 px-4 max-w-7xl mx-auto">
              <RecipeDetail 
                recipe={selectedRecipe} 
                onBack={() => setSelectedRecipe(null)} 
                onStartKitchen={() => setAppState('KITCHEN')}
                onFeedback={handleFeedback}
              />
            </div>
          ) : (
            <ResultsView 
              recipes={recipes}
              onSelect={setSelectedRecipe}
              onEdit={() => setAppState('EDITING')}
              onRegenerate={handleGenerate}
            />
          )
        )}

        {appState === 'KITCHEN' && selectedRecipe && (
          <KitchenMode 
            recipe={selectedRecipe} 
            onBack={() => setAppState('RESULTS')} 
          />
        )}
      </main>

      {/* Footer (Simplified) */}
      {appState !== 'KITCHEN' && (
        <footer className="py-12 px-4 text-center text-slate-400 text-sm border-t border-blue-50/50 mt-12">
          &copy; 2024 PURE Chef AI. All Rights Reserved. Built with Gemini 3 Pro.
        </footer>
      )}
    </div>
  );
};

export default App;
