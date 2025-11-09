import { useState } from 'react';

export default function QuoteHistory({ quotes }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = async (quote, index) => {
    await navigator.clipboard.writeText(`"${quote.quote}" - ${quote.author}`);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const shareQuote = async (quote) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Quote',
          text: `"${quote.quote}" - ${quote.author}`,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Quote History</h2>
      
      <div className="space-y-4">
        {quotes.map((quote, index) => (
          <div key={quote.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition duration-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <blockquote className="text-lg font-serif text-gray-800 italic mb-2">
                  "{quote.quote}"
                </blockquote>
                <p className="text-gray-600">— {quote.author}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Generated for: {quote.keyword} • {new Date(quote.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => copyToClipboard(quote, index)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600 transition duration-200 p-2"
                >
                  {copiedIndex === index ? (
                    <span className="text-green-600 text-sm">Copied!</span>
                  ) : (
                    <>
                      <span>Copy</span>
                    </>
                  )}
                </button>
                
                {navigator.share && (
                  <button
                    onClick={() => shareQuote(quote)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600 transition duration-200 p-2"
                  >
                    <span>Share</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
