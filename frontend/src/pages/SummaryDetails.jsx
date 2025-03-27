import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function SummaryDetail() {
    const { id } = useParams();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    const [diagnosis, setDiagnosis] = useState(null);
    const [diagnosisDate, setDiagnosisDate] = useState(null);
    const [diagnosing, setDiagnosing] = useState(false);

    const [helpful, setHelpful] = useState(null);
    const [comment, setComment] = useState('');

    const [submittedFeedback, setSubmittedFeedback] = useState(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/summaries/${id}`);
                setSummary(res.data);
                if (res.data?.id) {
                    await axios.get(`http://localhost:8000/diagnosis/${res.data.id}`)
                        .then((response) => {
                            if (response.data?.diagnosis) {
                                setDiagnosis(response.data.diagnosis);
                                setDiagnosisDate(response.data.created_at);
                            }
                        })
                        .catch((err) => {
                            console.error("Error fetching diagnosis:", err);
                        });

                    await axios.get(`http://127.0.0.1:8000/feedback/${res.data.id}`).then((response) => {
                        if (response.data?.id) {
                            setSubmittedFeedback(response.data);
                        }
                    }).catch((err) => {
                        console.error("Error fetching feedback:", err);
                    });
                }
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
                summary_id: summary.id,
            });
            setDiagnosis(res.data.diagnosis);
        } catch (err) {
            console.error("Diagnosis failed:", err);
            setDiagnosis("Failed to generate diagnosis.");
        } finally {
            setDiagnosing(false);
        }
    };


    const handleSubmitFeedback = async () => {
        try {
            if (helpful === null) {
                alert("Please select Yes or No.");
                return;
            }

            const summaryId = summary?.id;

            await axios.post("http://localhost:8000/feedback", {
                summary_id: summaryId,
                helpful,
                comment,
            });

            alert("Feedback submitted. Thank you!");
            setHelpful(null);
            setComment("");
        } catch (err) {
            console.error("Error submitting feedback:", err);
            alert("Something went wrong. Please try again.");
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
            {diagnosis && (
                <div className="mt-6 bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-semibold text-purple-700 mb-2">
                        🩺 Diagnosis Suggestions
                    </h3>
                    {diagnosis.split('\n').map((line, index) => (
                        <p key={index} className="text-sm text-gray-800 mb-1">
                            {line}
                        </p>
                    ))}
                    {diagnosisDate && (
                        <p className="text-xs text-gray-500">Generated on: {new Date(diagnosisDate).toLocaleString()}</p>
                    )}
                </div>
            )}

            {summary && (
                <div className="mt-6">
                    <a
                        href={`http://localhost:8000/export-pdf/${summary.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
                    >
                        Download PDF Report
                    </a>
                </div>
            )}

            <button
                onClick={handleDiagnosis}
                disabled={diagnosing || !summary}
                className="mb-4 bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 mt-6 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {diagnosing ? "Running Diagnosis..." : "Run Diagnosis"}
            </button>

            {/* {diagnosis && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">🧬 Diagnosis Suggestions:</h3>
                    <p className="text-gray-700 whitespace-pre-line">{diagnosis}</p>
                </div>
            )} */}
            {summary && diagnosis && (
                <div className="mt-6">
                    <h2 className="text-md font-semibold mb-2">Was this diagnosis helpful?</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setHelpful(true)} className={`px-3 py-1 rounded ${helpful === true ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>👍 Yes</button>
                        <button onClick={() => setHelpful(false)} className={`px-3 py-1 rounded ${helpful === false ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>👎 No</button>
                    </div>
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional feedback..." className="w-full mt-3 p-2 border rounder" />
                    <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSubmitFeedback}>Submit Feedback</button>
                </div>
            )}
            {submittedFeedback && (
                <div className="mt-6 p-4 border border-gray-200 bg-gray-50 rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        💬 Existing Feedback
                    </h2>
                    <p className="text-sm">
                        <span className="font-medium text-gray-600">Was previous diagnosis helpful?</span>{" "}
                        <span className={submittedFeedback.helpful ? "text-green-600" : "text-red-500"}>
                            {submittedFeedback.helpful ? "Yes ✅" : "No ❌"}
                        </span>
                    </p>
                    {submittedFeedback.comment && (
                        <p className="mt-2 text-sm text-gray-700">
                            <span className="font-medium text-gray-600">Comment:</span>{" "}
                            {submittedFeedback.comment}
                        </p>
                    )}
                </div>
            )}




        </div>
    );
}

export default SummaryDetail;
