import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function QuoteForm({ user, todaysQuotes, onNewQuote, onLoginRequired }) {
  const [keyword, setKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(null);
  const [error, setError] = useState('');

  // ... rest of your existing code (API functions, etc.)

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
            Enter Keyword
          </label>
          <input
            type="text"
            id="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g., motivation, success, love..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
            disabled={isGenerating}
            required
          />
        </div>
        
        {error && (
          <div className={`p-3 rounded-lg text-sm ${
            error.includes('Using inspirational') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isGenerating || !keyword.trim() || (user && todaysQuotes >= 5)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition duration-200 disabled:cursor-not-allowed"
        >
          {isGenerating ? '✨ Generating Quote...' : 'Generate Quote'}
        </button>
      </form>

      {currentQuote && (
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <blockquote className="text-xl md:text-2xl font-serif text-gray-800 italic mb-4">
              "{currentQuote.quote}"
            </blockquote>
            <p className="text-lg text-gray-600 mb-2">— {currentQuote.author}</p>
            <p className="text-sm text-gray-500">
              {currentQuote.model_used === 'fallback' ? '✨ Inspirational Quote' : '🤖 AI Generated'}
            </p>
            
            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 transition duration-200"
              >
                <span>📋 Copy</span>
              </button>
              {navigator.share && (
                <button
                  onClick={shareQuote}
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition duration-200"
                >
                  <span>📤 Share</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
