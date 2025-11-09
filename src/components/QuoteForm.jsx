import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function QuoteForm({ user, todaysQuotes, onNewQuote, onLoginRequired }) {
  const [keyword, setKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(null);

  const generateQuoteWithFallback = async (keyword, attempt = 0) => {
    const models = [
      'openai/gpt-3.5-turbo',
      'google/palm-2-chat-bison',
      'meta-llama/llama-2-13b-chat'
    ];

    const model = models[attempt];
    
    if (!model) {
      throw new Error('All models failed to generate a quote');
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Quotes Generator'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a creative quote generator. Generate inspiring, meaningful quotes based on given keywords. Always respond with a JSON object containing "quote" and "author" fields. The author should be a fictional but appropriate name.'
            },
            {
              role: 'user',
              content: `Generate an inspiring quote about "${keyword}". Respond with JSON only: {"quote": "the quote text", "author": "author name"}`
            }
          ],
          max_tokens: 150,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Try to parse JSON response
      try {
        const quoteData = JSON.parse(content);
        return {
          quote: quoteData.quote,
          author: quoteData.author,
          model_used: model
        };
      } catch (parseError) {
        // If JSON parsing fails, try to extract quote and author from text
        const lines = content.split('\n').filter(line => line.trim());
        const quote = lines[0]?.replace(/["']/g, '').trim() || content;
        const author = lines[1]?.replace(/[-—]/g, '').trim() || 'Unknown';
        
        return {
          quote: quote,
          author: author,
          model_used: model
        };
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed with model ${model}:`, error);
      
      // Try next fallback model
      if (attempt < models.length - 1) {
        return generateQuoteWithFallback(keyword, attempt + 1);
      } else {
        throw error;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      onLoginRequired();
      return;
    }

    if (todaysQuotes >= 5) {
      alert('Daily limit reached. Please login for unlimited access.');
      return;
    }

    if (!keyword.trim()) return;

    setIsGenerating(true);
    try {
      const quoteData = await generateQuoteWithFallback(keyword.trim());

      // Save to Supabase
      const { data: savedQuote, error } = await supabase
        .from('quotes')
        .insert([
          {
            user_id: user.id,
            keyword: keyword.trim(),
            quote: quoteData.quote,
            author: quoteData.author,
            model_used: quoteData.model_used
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setCurrentQuote(savedQuote);
      onNewQuote(savedQuote);
      setKeyword('');
    } catch (error) {
      console.error('Quote generation error:', error);
      alert('Error generating quote: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (currentQuote) {
      try {
        await navigator.clipboard.writeText(
          `"${currentQuote.quote}" - ${currentQuote.author}`
        );
        alert('Quote copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  const shareQuote = async () => {
    if (currentQuote && navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Quote',
          text: `"${currentQuote.quote}" - ${currentQuote.author}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

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
        
        <button
          type="submit"
          disabled={isGenerating || !keyword.trim() || (user && todaysQuotes >= 5)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition duration-200 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating Quote...' : 'Generate Quote'}
        </button>
      </form>

      {currentQuote && (
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <blockquote className="text-2xl font-serif text-gray-800 italic mb-4">
              "{currentQuote.quote}"
            </blockquote>
            <p className="text-lg text-gray-600">— {currentQuote.author}</p>
            
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 transition duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </button>
              {navigator.share && (
                <button
                  onClick={shareQuote}
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
