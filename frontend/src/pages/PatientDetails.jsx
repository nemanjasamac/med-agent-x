import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function PatientDetails() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [summaries, setSummaries] = useState([]);
    const handleDeletePatient = () => {
        if (window.confirm("Are you sure you want to delete this patient?")) {
            axios.delete(`http://localhost:8000/patients/${id}`)
                .then(() => {
                    alert("Patient deleted successfully");
                    navigate("/patients");
                })
                .catch((err) => {
                    console.error(err);
                    alert("An error occurred while deleting the patient.");
                });
        }
    };
    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                const patientResponse = await axios.get(`http://localhost:8000/patients/${id}`);
                setPatient(patientResponse.data);

                const summariesResponse = await axios.get(`http://localhost:8000/summaries?patient_id=${id}`);
                console.log("Summaries Response:", summariesResponse.data);
                setSummaries(Array.isArray(summariesResponse.data.summaries) ? summariesResponse.data.summaries : []);
            } catch (error) {
                console.error("Error fetching patient data:", error);
            }

        };
        fetchPatientData();
    }, [id]);

    if (!patient) return <div>Loading patient data...</div>;

    return (
        <div className="p-6">
            {/* Dashboard Header */}
            <div className="bg-white rounded-lg shadow p-4 mb-6 border">
                <h2 className="text-xl font-semibold mb-2">Patient Dashboard</h2>
                <p><strong>Name:</strong> {patient.name}</p>
                <p><strong>Age:</strong> {patient.age} years</p>
                <p><strong>Gender:</strong> {patient.gender}</p>
                <p><strong>Contact:</strong> {patient.contact}</p>
                <p><strong>Registered on:</strong> {new Date(patient.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-4">
                <Link to={`/patients/${id}/edit`} className="bg-yellow-500 text-white px-4 py-2 rounded">Edit Patient</Link>
                <button
                    onClick={handleDeletePatient}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                >
                    Delete Patient
                </button>
            </div>


            <h2 className="text-xl font-semibold mt-6 mb-4">Summaries</h2>
            {Array.isArray(summaries) && summaries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {summaries.map(summary => (
                        <div key={summary.id} className="bg-white border rounded-lg shadow hover:shadow-md transition p-4 flex flex-col justify-between">
                            <div>
                                <h3 className="font-semibold text-lg mb-1">{summary.file_name}</h3>
                                <p className="text-sm text-gray-600 mb-2">{summary.summary?.substring(0, 150) + "..." || "No summary available."}</p>
                                <p className="text-xs text-gray-400">
                                    Generated on: {new Date(summary.created_at).toLocaleDateString() || "Unknown"}
                                </p>
                            </div>
                            <Link to={`/dashboard/${summary.id}`} className="mt-3 inline-block bg-blue-500 text-white px-3 py-1 rounded text-center hover:bg-blue-600">
                                View Full Summary
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No summaries available for this patient.</p>
            )}

        </div>
    );
}
