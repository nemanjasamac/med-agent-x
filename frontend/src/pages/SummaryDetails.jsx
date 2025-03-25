import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function SummaryDetail() {
    const { id } = useParams();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    const [diagnosis, setDiagnosis] = useState(null);
    const [diagnosing, setDiagnosing] = useState(false);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/summaries/${id}`);
                setSummary(res.data);
            } catch (err) {
                console.error("Error fetching summary:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [id]);

    const handleDownload = () => {
        const fileContent = `
File: ${summary.file_name}
Date: ${summary.created_at.slice(0, 10)}

${summary.patient_id ? `Patient ID: ${summary.patient_id}\n` : ""}
${summary.notes ? `Uploader Notes: ${summary.notes}\n\n` : ""}

🧠 Summary:
${summary.summary}

🧩 Keywords:
${summary.keywords.join(", ")}
  `.trim();

        const blob = new Blob([fileContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${summary.file_name}.txt`;
        link.click();

        URL.revokeObjectURL(url);
    }

    const handleDiagnosis = async () => {
        setDiagnosing(true);
        setDiagnosis(null);

        try {
            const res = await axios.post("http://localhost:8000/diagnose", {
                summary: summary.summary,
            });
            setDiagnosis(res.data.diagnosis);
        } catch (err) {
            console.error("Diagnosis failed:", err);
            setDiagnosis("Failed to generate diagnosis.");
        } finally {
            setDiagnosing(false);
        }
    };



    if (loading) return <div className="p-6">Loading summary...</div>;

    if (!summary) return <div className="p-6 text-red-600">Summary not found</div>;

    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded shadow">
            <button
                onClick={handleDownload}
                className="mb-4 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded transition"
            >
                📥 Download Summary (.txt)
            </button>


            <h2 className="text-2xl font-bold text-blue-700 mb-4">{summary.file_name}</h2>
            <p className="text-sm text-gray-500 mb-4">Uploaded: {summary.created_at.slice(0, 10)}</p>

            {summary.patient_id && (
                <p className="text-sm text-gray-500 mb-2">
                    <strong>Patient ID:</strong> {summary.patient_id}
                </p>
            )}

            {summary.notes && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Uploader Notes:</h3>
                    <p className="text-gray-700 whitespace-pre-line">{summary.notes}</p>
                </div>
            )}

            <h3 className="text-lg font-semibold mb-2 text-gray-800">🧠 Full Summary:</h3>
            <p className="text-gray-800 leading-relaxed whitespace-pre-line mb-6">{summary.summary}</p>



            <h3 className="text-lg font-semibold mb-2 text-gray-800">🧩 Extracted Keywords:</h3>
            <div className="flex flex-wrap gap-2">
                {summary.keywords.map((kw, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                        {kw}
                    </span>
                ))}
            </div>
            <button
                onClick={handleDiagnosis}
                disabled={diagnosing || !summary}
                className="mb-4 bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 mt-6 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {diagnosing ? "Running Diagnosis..." : "Run Diagnosis"}
            </button>

            {diagnosis && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">🧬 Diagnosis Suggestions:</h3>
                    <p className="text-gray-700 whitespace-pre-line">{diagnosis}</p>
                </div>
            )}


        </div>
    );
}

export default SummaryDetail;
