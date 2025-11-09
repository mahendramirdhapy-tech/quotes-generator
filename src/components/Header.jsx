export default function Header({ user, onLoginClick, onLogout }) {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon"></div>
            <span className="logo-text">QuoteGen</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-700">Hello, {user.email}</span>
                <button
                  onClick={onLogout}
                  className="btn btn-small bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={onLoginClick}
                className="btn btn-small bg-indigo-600 hover:bg-indigo-700 text-white"
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
