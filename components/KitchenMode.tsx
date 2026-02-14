
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Recipe } from '../types';
import { ChevronLeft, ChevronRight, MicOff, RotateCcw, X } from 'lucide-react';

interface KitchenModeProps {
  recipe: Recipe;
  onBack: () => void;
}

export const KitchenMode: React.FC<KitchenModeProps> = ({ recipe, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const recognitionRef = useRef<any>(null);
  const isMounted = useRef(true);
  const isSpeaking = useRef(false);
  const waitingForSpeak = useRef(false); // Flag to prevent onend from restarting while we wait for the speak useEffect
  const lastActionTime = useRef(0);

  const totalSteps = recipe.instructions.length;

  const startRecognitionRef = useRef<() => void>(() => {});

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    isSpeaking.current = true;
    waitingForSpeak.current = false; // We are now officially speaking
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      isSpeaking.current = true;
    };
    
    utterance.onend = () => {
      setTimeout(() => {
        isSpeaking.current = false;
        if (isMounted.current) {
          startRecognitionRef.current();
        }
      }, 1000); // Generous delay to ensure audio hardware is ready
    };

    utterance.onerror = () => {
      isSpeaking.current = false;
      if (isMounted.current) {
        startRecognitionRef.current();
      }
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const handleNext = useCallback(() => {
    const now = Date.now();
    if (now - lastActionTime.current < 2000) return; 
    
    if (currentStep < totalSteps - 1) {
      lastActionTime.current = now;
      waitingForSpeak.current = true; // Block auto-restart
      if (recognitionRef.current) recognitionRef.current.abort();
      
      setCurrentStep(prev => prev + 1);
      setLastCommand('Next Step');
    } else {
      speak("That was the last step. Enjoy your meal!");
    }
  }, [currentStep, totalSteps, speak]);

  const handleBack = useCallback(() => {
    const now = Date.now();
    if (now - lastActionTime.current < 2000) return;
    
    if (currentStep > 0) {
      lastActionTime.current = now;
      waitingForSpeak.current = true; // Block auto-restart
      if (recognitionRef.current) recognitionRef.current.abort();
      
      setCurrentStep(prev => prev - 1);
      setLastCommand('Previous Step');
    }
  }, [currentStep]);

  const handleRepeat = useCallback(() => {
    const now = Date.now();
    if (now - lastActionTime.current < 2000) return;
    
    lastActionTime.current = now;
    waitingForSpeak.current = true; // Block auto-restart
    if (recognitionRef.current) recognitionRef.current.abort();
    
    speak(recipe.instructions[currentStep]);
    setLastCommand('Repeating');
  }, [recipe.instructions, currentStep, speak]);

  const handleExit = useCallback(() => {
    const now = Date.now();
    if (now - lastActionTime.current < 1000) return;
    lastActionTime.current = now;
    setLastCommand('Exiting...');
    isMounted.current = false;
    if (recognitionRef.current) recognitionRef.current.abort();
    window.speechSynthesis.cancel();
    onBack();
  }, [onBack]);

  // Read step whenever it changes
  useEffect(() => {
    speak(`Step ${currentStep + 1}. ${recipe.instructions[currentStep]}`);
  }, [currentStep, recipe.instructions, speak]);

  useEffect(() => {
    isMounted.current = true;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const startRecognition = () => {
      // Never start if we're speaking, about to speak, or unmounted
      if (!isMounted.current || isSpeaking.current || waitingForSpeak.current) return;
      
      try {
        if (recognitionRef.current) {
          recognitionRef.current.onend = null; // Detach previous listener
          recognitionRef.current.abort();
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };
        
        recognition.onend = () => {
          setIsListening(false);
          // Only restart if we aren't waiting for a navigation-triggered speak
          if (isMounted.current && !isSpeaking.current && !waitingForSpeak.current) {
            setTimeout(startRecognition, 600);
          }
        };

        recognition.onerror = (event: any) => {
          setIsListening(false);
          if (isMounted.current && !isSpeaking.current && !waitingForSpeak.current && event.error !== 'no-speech') {
            setTimeout(startRecognition, 1000);
          }
        };

        recognition.onresult = (event: any) => {
          if (isSpeaking.current || waitingForSpeak.current) return;

          const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
          
          if (transcript.includes('next') || transcript.includes('forward') || transcript.includes('continue')) {
            handleNext();
          } else if (transcript.includes('back') || transcript.includes('previous')) {
            handleBack();
          } else if (transcript.includes('repeat')) {
            handleRepeat();
          } else if (transcript.includes('stop') || transcript.includes('exit') || transcript.includes('close')) {
            handleExit();
          }
        };

        recognition.start();
      } catch (err) {
        console.error("Speech recognition start failed:", err);
      }
    };

    startRecognitionRef.current = startRecognition;

    return () => {
      isMounted.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      }
      window.speechSynthesis.cancel();
    };
  }, [handleNext, handleBack, handleRepeat, handleExit]);

  return (
    <div className="fixed inset-0 bg-slate-900 text-white z-[60] flex flex-col p-6 md:p-12 overflow-hidden">
      {/* Top Bar - Fixed height */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between flex-shrink-0 h-16">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <X size={28} />
          <span className="text-xl font-bold hidden sm:inline">Exit</span>
        </button>
        <div className="flex items-center gap-3 bg-slate-800/50 px-6 py-2 rounded-full border border-slate-700">
          {isListening && !isSpeaking.current && !waitingForSpeak.current ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
              <span className="text-blue-400 font-bold uppercase tracking-widest text-xs">Listening</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <MicOff size={16} className="text-slate-500" />
              <span className="text-slate-500 text-xs font-bold uppercase">
                {isSpeaking.current ? 'Speaking...' : 'Paused'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto text-center overflow-y-auto my-4 px-2">
        <div className="mb-4 flex-shrink-0">
          <span className="text-blue-500 text-xl font-black uppercase tracking-[0.2em]">Step {currentStep + 1} / {totalSteps}</span>
        </div>
        
        <div className="w-full">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight md:leading-snug animate-in slide-in-from-bottom-4 duration-500 break-words">
            {recipe.instructions[currentStep]}
          </h2>
        </div>

        {lastCommand && (
          <div className="mt-8 py-2 px-4 bg-white/5 rounded-lg border border-white/10 flex-shrink-0">
             <p className="text-blue-400 text-sm font-bold uppercase tracking-widest">"{lastCommand}"</p>
          </div>
        )}
      </div>

      {/* Bottom Bar Controls */}
      <div className="w-full max-w-4xl mx-auto grid grid-cols-3 gap-4 sm:gap-8 flex-shrink-0 h-32 md:h-40">
        <button 
          onClick={handleBack}
          disabled={currentStep === 0}
          className="flex flex-col items-center justify-center gap-1 p-4 bg-slate-800 rounded-3xl hover:bg-slate-700 disabled:opacity-20 transition-all border border-slate-700 group"
        >
          <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform sm:w-12 h-12" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
        </button>

        <button 
          onClick={handleRepeat}
          className="flex flex-col items-center justify-center gap-1 p-4 bg-blue-600 rounded-3xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/40 border border-blue-500 group"
        >
          <RotateCcw size={32} className="group-active:rotate-180 transition-transform duration-500 sm:w-12 h-12" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Repeat</span>
        </button>

        <button 
          onClick={handleNext}
          disabled={currentStep === totalSteps - 1}
          className="flex flex-col items-center justify-center gap-1 p-4 bg-slate-800 rounded-3xl hover:bg-slate-700 disabled:opacity-20 transition-all border border-slate-700 group"
        >
          <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform sm:w-12 h-12" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Next</span>
        </button>
      </div>

      {/* Voice Guide Hint */}
      <div className="text-center mt-4 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 flex-shrink-0">
        Say: "Next" • "Back" • "Repeat" • "Stop"
      </div>
    </div>
  );
};
