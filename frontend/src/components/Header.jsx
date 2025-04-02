import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Header() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const checkLoginStatus = () => {
            setIsLoggedIn(!!localStorage.getItem("token"));
        };

        checkLoginStatus();

        window.addEventListener("storage", checkLoginStatus);

        return () => window.removeEventListener("storage", checkLoginStatus);
    }, []);

    useEffect(() => {
        const handleLoginEvent = () => {
            setIsLoggedIn(!!localStorage.getItem("token"));
        };

        window.addEventListener("login", handleLoginEvent);

        return () => window.removeEventListener("login", handleLoginEvent);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
        setIsLoggedIn(false);
    };

    return (
        <header className="p-4 shadow flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">MedAgentX</Link>
            <nav className="space-x-4">
                {isLoggedIn ? (
                    <>
                        <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 transition">Dashboard</Link>
                        <Link to="/patients" className="text-gray-700 hover:text-blue-600 transition">Patients</Link>
                        <Link to="/upload" className="text-gray-700 hover:text-blue-600 transition">Upload</Link>
                        <Link to="/account" className="hover:underline hover:text-blue-600">My Account</Link>
                        <button onClick={handleLogout} className="hover:underline hover:text-blue-600">Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/" className="text-gray-700 hover:text-blue-600 transition">Home</Link>
                        <Link to="/login" className="text-gray-700 hover:text-blue-600 transition">Login</Link>
                        <Link to="/register" className="text-gray-700 hover:text-blue-600 transition">Register</Link>
                    </>
                )}
            </nav>
        </header>
    );
}

export default Header;