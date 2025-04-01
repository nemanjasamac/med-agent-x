import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";

export default function PatientDetails() {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [summaries, setSummaries] = useState([]);

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
            <h1 className="text-2xl font-bold mb-4">{patient.name}</h1>
            <p><strong>Age:</strong> {patient.age || "N/A"}</p>
            <p><strong>Gender:</strong> {patient.gender || "N/A"}</p>
            <p><strong>Contact:</strong> {patient.contact || "N/A"}</p>

            <h2 className="text-xl font-semibold mt-6">Summaries</h2>
            <div className="space-y-4 mt-2">
                {Array.isArray(summaries) && summaries.length > 0 ? (
                    summaries.map(summary => (
                        <div key={summary.id} className="p-4 rounded border shadow-sm">
                            <p><strong>Filename:</strong> {summary.file_name}</p>
                            <p><strong>Summary:</strong> {summary.summary?.substring(0, 200) + "..." || "No summary"}</p>
                            <Link to={`/dashboard/${summary.id}`} className="text-blue-500 hover:underline">View Full</Link>
                        </div>
                    ))
                ) : (
                    <p>No summaries available for this patient.</p>
                )}
            </div>
        </div>
    );
}
