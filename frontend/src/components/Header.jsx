function Header() {
    return (
      <header className="bg-white shadow-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo / Title */}
          <h1 className="text-2xl font-bold text-blue-600">MedAgentX</h1>
  
          {/* Navigation Links */}
          <nav className="space-x-4">
            <a href="#" className="text-gray-700 hover:text-blue-600 transition">Home</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition">Upload</a>
            <a href="#" className="text-gray-700 hover:text-blue-600 transition">Dashboard</a>
          </nav>
        </div>
      </header>
    );
  }
  
  export default Header;
  