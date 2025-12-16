import React, { useState } from 'react';
import { generateTheme } from '../services/geminiService';
import { ThemeColors } from '../types';
import { Wand2, Loader2, Palette } from 'lucide-react';

interface ThemeGeneratorProps {
  onThemeApply: (theme: ThemeColors) => void;
}

const ThemeGenerator: React.FC<ThemeGeneratorProps> = ({ onThemeApply }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const theme = await generateTheme(prompt);
      if (theme) {
        onThemeApply(theme);
        setIsOpen(false);
        setPrompt('');
      } else {
        setError('Failed to generate theme. Try a different prompt.');
      }
    } catch (err) {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-all border border-white/10 shadow-lg"
        title="AI Theme Generator"
      >
        <Palette size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-pop">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                AI Theme Designer
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-300 mb-4 text-sm">
              Describe your dream aesthetic (e.g., "Neon Cyberpunk", "Pastel Beach Sunset", "Matrix Code") and Gemini will design it for you.
            </p>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter a theme description..."
                  className="w-full bg-[#0f3460] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Designing...
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    Generate Theme
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ThemeGenerator;
