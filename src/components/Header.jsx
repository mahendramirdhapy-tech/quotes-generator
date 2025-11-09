export default function Header({ user, onLoginClick, onLogout }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="text-xl font-bold text-gray-800">QuoteGen</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-700 hidden sm:block">
                  Hello, {user.email}
                </span>
                <button
                  onClick={onLogout}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={onLoginClick}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
