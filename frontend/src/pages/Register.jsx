import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [error, setError] = useState("");

    useEffect(() => {
        if (localStorage.getItem("token")) {
            navigate("/dashboard");
        }
    }, [navigate]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await axios.post("http://localhost:8000/register", form);
            localStorage.setItem("token", res.data.access_token);
            window.dispatchEvent(new Event("login"));
            navigate("/dashboard");
        } catch (err) {
            setError("Registration failed. Please try again.");
        }
    };

    return (
        <div className="max-w-sm mx-auto mt-10 p-4 border rounded">
            <h2 className="text-xl font-semibold mb-4">Doctor Register</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    className="w-full border p-2 rounded"
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full border p-2 rounded"
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full border p-2 rounded"
                />
                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white p-2 rounded"
                >
                    Register
                </button>
                {error && <p className="text-red-500">{error}</p>}
            </form>
        </div>
    );
}
