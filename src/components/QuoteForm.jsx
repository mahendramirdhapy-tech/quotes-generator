import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function QuoteForm({ user, todaysQuotes, onNewQuote, onLoginRequired }) {
  const [keyword, setKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(null);
  const [error, setError] = useState('');

  // Fallback quotes for when API fails
  const getFallbackQuote = (keyword) => {
    const fallbackQuotes = {
      motivation: [
        { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
        { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" }
      ],
      success: [
        { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { quote: "The road to success and the road to failure are almost exactly the same.", author: "Colin R. Davis" },
        { quote: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" }
      ],
      love: [
        { quote: "The best thing to hold onto in life is each other.", author: "Audrey Hepburn" },
        { quote: "Love is composed of a single soul inhabiting two bodies.", author: "Aristotle" },
        { quote: "Where there is love there is life.", author: "Mahatma Gandhi" }
      ],
      life: [
        { quote: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
        { quote: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
        { quote: "Get busy living or get busy dying.", author: "Stephen King" }
      ],
      happiness: [
        { quote: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
        { quote: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama" },
        { quote: "Be happy for this moment. This moment is your life.", author: "Omar Khayyam" }
      ]
    };

    const defaultQuotes = [
      { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
      { quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
      { quote: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" }
    ];

    const normalizedKeyword = keyword.toLowerCase();
    const quotes = fallbackQuotes[normalizedKeyword] || defaultQuotes;
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    return {
      ...randomQuote,
      model_used: 'fallback'
    };
  };

  const generateQuoteWithFallback = async (keyword, attempt = 0) => {
    const models = [
      'openai/gpt-3.5-turbo',
      'google/palm-2-chat-bison', 
      'meta-llama/llama-2-13b-chat'
    ];

    const model = models[attempt];
    
    if (!model) {
      // If all models fail, use fallback quotes
      return getFallbackQuote(keyword);
    }

    try {
      console.log('Attempting with model:', model);
      
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
              content: `You are a creative quote generator. Generate inspiring, meaningful quotes based on given keywords. 
                       Always respond with a valid JSON object containing "quote" and "author" fields only.
                       Example: {"quote": "The only way to do great work is to love what you do.", "author": "Steve Jobs"}`
            },
            {
              role: 'user',
              content: `Generate a short, inspiring quote about "${keyword}". Return only valid JSON: {"quote": "text here", "author": "name here"}`
            }
          ],
          max_tokens: 100,
          temperature: 0.7,
        }),
      });

      console.log('Response status:', response.status);

      if (response.status === 401) {
        throw new Error('Invalid API key. Using fallback quotes.');
      }

      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Using fallback quotes.');
      }

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from AI service');
      }

      const content = data.choices[0].message.content;
      
      // Clean and parse the response
      try {
        const jsonMatch = content.match(/\{.*\}/s);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const quoteData = JSON.parse(jsonString);
        
        if (!quoteData.quote || !quoteData.author) {
          throw new Error('Missing quote or author in response');
        }

        return {
          quote: quoteData.quote,
          author: quoteData.author,
          model_used: model
        };
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // Use fallback if parsing fails
        return getFallbackQuote(keyword);
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed with model ${model}:`, error);
      
      // Try next fallback model
      if (attempt < models.length - 1) {
        console.log(`Trying next model: ${models[attempt + 1]}`);
        return generateQuoteWithFallback(keyword, attempt + 1);
      } else {
        // If all API models fail, use fallback quotes
        return getFallbackQuote(keyword);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!user) {
      onLoginRequired();
      return;
    }

    if (todaysQuotes >= 5) {
      setError('Daily limit reached. Please login for unlimited access.');
      return;
    }

    if (!keyword.trim()) {
      setError('Please enter a keyword');
      return;
    }

    setIsGenerating(true);
    try {
      const quoteData = await generateQuoteWithFallback(keyword.trim());

      // Try to save to Supabase, but continue even if it fails
      let savedQuote = quoteData;
      try {
        const { data, error: saveError } = await supabase
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

        if (!saveError && data) {
          savedQuote = data;
        } else {
          console.warn('Failed to save to database, using local quote:', saveError);
          // Add local ID for UI
          savedQuote = { ...quoteData, id: Date.now().toString() };
        }
      } catch (dbError) {
        console.warn('Database error, using local quote:', dbError);
        savedQuote = { ...quoteData, id: Date.now().toString() };
      }

      setCurrentQuote(savedQuote);
      onNewQuote(savedQuote);
      setKeyword('');
      
      // Show success message
      if (quoteData.model_used === 'fallback') {
        setError('Note: Using inspirational quotes library (AI service unavailable)');
      } else {
        setError('');
      }
    } catch (error) {
      console.error('Quote generation error:', error);
      setError('Failed to generate quote. Please try again.');
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
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label htmlFor="keyword" className="label">
            Enter Keyword
          </label>
          <input
            type="text"
            id="keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g., motivation, success, love, life, happiness..."
            className="input"
            disabled={isGenerating}
            required
          />
        </div>
        
        {error && (
          <div className={`alert ${error.includes('Using inspirational') ? 'alert-success' : 'alert-error'}`}>
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isGenerating || !keyword.trim() || (user && todaysQuotes >= 5)}
          className="btn btn-primary"
        >
          {isGenerating ? '✨ Generating...' : 'Generate Quote'}
        </button>
      </form>

      {currentQuote && (
        <div className="quote-container">
          <div className="text-center">
            <blockquote className="quote-text">
              "{currentQuote.quote}"
            </blockquote>
            <p className="quote-author">— {currentQuote.author}</p>
            <p className="text-sm text-gray-500 mt-2">
              {currentQuote.model_used === 'fallback' ? '✨ Inspirational Quote' : '🤖 AI Generated'}
            </p>
            
            <div className="action-buttons">
              <button
                onClick={copyToClipboard}
                className="btn btn-secondary btn-small"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              {navigator.share && (
                <button
                  onClick={shareQuote}
                  className="btn btn-primary btn-small"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
