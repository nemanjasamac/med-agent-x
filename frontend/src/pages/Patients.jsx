import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Patients(){
    const [patients, setPatients] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:8000/patients").then(res => setPatients(res.data)).catch(err => console.error("Error fetching patients: ", err));
    }, [])

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Patients</h1>
            <div className="space-y-4">
                {patients.map((patient) => (
                    <div key={patient.id} className="p-4 rounded border shadow-sm">
                        <p><strong>Name:</strong> {patient.name}</p>
                        <p><strong>Age:</strong> {patient.age || "N/A"}</p>
                        <p><strong>Gender:</strong> {patient.gender || "N/A"}</p>
                        <p><strong>Contact:</strong> {patient.contact || "N/A"}</p>
                        <Link to={`/patients/${patient.id}`} className="text-blue-500 hover:underline">View summaries</Link>
                    </div>
                ))}
            </div>
        </div>
    );
}