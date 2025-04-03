import { useState } from 'react';
import axios from 'axios';

export default function AccountSettings({ doctor, refreshDoctor, close }) {
    const [username, setUsername] = useState(doctor.username || '');
    const [email, setEmail] = useState(doctor.email || '');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const payload = { username, email };
            if (password) payload.password = password;

            await axios.put('http://localhost:8000/account/update', payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });

            setMessage('Account updated successfully!');
            refreshDoctor();
            close();
        } catch (err) {
            setMessage('Error updating account.');
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Update Account</h2>
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label>Username:</label>
                        <input
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full border rounded p-2"
                        />
                    </div>
                    <div>
                        <label>Email:</label>
                        <input
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full border rounded p-2"
                        />
                    </div>
                    <div>
                        <label>New Password (optional):</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full border rounded p-2"
                        />
                    </div>
                    <div className="flex justify-between">
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={close}
                            className="bg-gray-400 text-white px-4 py-2 rounded"
                        >
                            Cancel
                        </button>
                    </div>
                    {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
                </form>
            </div>
        </div>
    );
}
