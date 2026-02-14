
import React from 'react';

export const LoadingScreen: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-50">
      <div className="relative mb-8">
        {/* Pot */}
        <div className="w-24 h-20 bg-blue-500 rounded-b-3xl border-4 border-blue-600 relative overflow-hidden shadow-lg">
           <div className="absolute top-0 w-full h-4 bg-blue-600/30"></div>
        </div>
        {/* Handles */}
        <div className="absolute -left-3 top-4 w-4 h-6 bg-blue-600 rounded-l-full"></div>
        <div className="absolute -right-3 top-4 w-4 h-6 bg-blue-600 rounded-r-full"></div>
        {/* Spoon */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-2 h-16 bg-amber-800 rounded-full origin-bottom animate-stir">
           <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-4 bg-amber-800 rounded-full"></div>
        </div>
        {/* Steam */}
        <div className="absolute -top-12 left-1/4 animate-bounce delay-100 opacity-50">💨</div>
        <div className="absolute -top-16 left-1/2 animate-bounce delay-300 opacity-50">💨</div>
        <div className="absolute -top-10 left-3/4 animate-bounce delay-500 opacity-50">💨</div>
      </div>
      <h2 className="text-xl font-semibold text-blue-800 animate-pulse">{message}</h2>
      <p className="text-blue-600/70 mt-2">The AI chef is crafting something delicious...</p>
    </div>
  );
};
