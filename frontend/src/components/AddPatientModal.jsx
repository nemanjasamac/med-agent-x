import { useState, useEffect } from "react";
import axios from "axios";

function AddPatientModal({ isOpen, onClose, onPatientAdded }) {
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [contact, setContact] = useState("");

    const handleAdd = async () => {
        if (!name.trim()) {
            alert("Patient name is required.");
            return;
        }
        if (age && isNaN(age)) {
            alert("Age must be a number.");
            return;
        }
        if (age && age < 0) {
            alert("Age cannot be negative.");
            return;
        }

        try {
            await axios.post("http://localhost:8000/patients", {
                name,
                age: age ? parseInt(age) : null,
                gender: gender || null,
                contact: contact || null
            });
            alert("Patient added successfully!");
            onPatientAdded();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Error adding patient.");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            if (name.trim()) {
                e.preventDefault();
                handleAdd();
            }
        }
    };
    

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded p-6 shadow w-96 space-y-4">
                <h3 className="text-lg font-bold">Add New Patient</h3>

                <input
                    type="text"
                    placeholder="Full Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="border rounded px-2 py-1 w-full"
                />

                <input
                    type="number"
                    placeholder="Age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    onKeyDown={handleKeyDown}
                    min="0"
                    className="border rounded px-2 py-1 w-full"
                />

                <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="border rounded px-2 py-1 w-full"
                >
                    <option value="">Select Gender (optional)</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                </select>

                <input
                    type="text"
                    placeholder="Contact info (phone, email, etc)"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="border rounded px-2 py-1 w-full"
                />

                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={onClose} className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400">Cancel</button>
                    <button onClick={handleAdd} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Add</button>
                </div>
            </div>
        </div>
    );
}

export default AddPatientModal;
