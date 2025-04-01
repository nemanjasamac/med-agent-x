import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="bg-white shadow-md px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600">MedAgentX</h1>
        <nav className="space-x-4">
          <Link to="/" className="text-gray-700 hover:text-blue-600 transition">Home</Link>
          <Link to="/upload" className="text-gray-700 hover:text-blue-600 transition">Upload</Link>
          <Link to="/patients" className="text-gray-700 hover:text-blue-600 transition">Patients</Link>
          <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 transition">Dashboard</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
