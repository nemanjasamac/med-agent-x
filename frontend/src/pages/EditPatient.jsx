import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function EditPatient() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`http://localhost:8000/patients/${id}`)
            .then(res => {
                setPatient(res.data);
                setLoading(false);
            })
            .catch(err => console.error("Error fetching patient: ", err));
    }, [id]);

    const handleChange = (e) => {
        setPatient({ ...patient, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.put(`http://localhost:8000/patients/${id}`, patient)
            .then(() => navigate(`/patients/${id}`))
            .catch(err => console.error("Error updating patient: ", err));
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Edit Patient</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="name" value={patient.name} onChange={handleChange} placeholder="Name" className="border p-2 w-full" required />
                <input type="number" name="age" value={patient.age || ""} onChange={handleChange} placeholder="Age" className="border p-2 w-full" />
                <input type="text" name="gender" value={patient.gender || ""} onChange={handleChange} placeholder="Gender" className="border p-2 w-full" />
                <input type="text" name="contact" value={patient.contact || ""} onChange={handleChange} placeholder="Contact" className="border p-2 w-full" />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Save Changes</button>
            </form>
        </div>
    );
}
