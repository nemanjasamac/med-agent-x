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
    const [diagnosisHistory, setDiagnosisHistory] = useState([]);
    const [activeDiagnosisIndex, setActiveDiagnosisIndex] = useState(null);


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
                    await axios.get(`http://localhost:8000/diagnoses/${res.data.id}`).then((response) => {
                        setDiagnosisHistory(response.data || []);
                    }).catch((err) => {
                        console.error("Error fetching diagnosis history:", err);
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

    const handleDiagnosis = async () => {
        setDiagnosing(true);
        setDiagnosis(null);

        try {
            const res = await axios.post("http://localhost:8000/diagnose", {
                summary: summary.summary,
                summary_id: summary.id,
            });
            setDiagnosis(res.data.diagnosis);
            setDiagnosisDate(new Date());
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
                        <p className="text-sm text-gray-500 mt-1">
                            Generated at: {new Date(diagnosisDate).toLocaleString()}
                        </p>
                    )}

                </div>
            )}
            {diagnosisHistory.length > 0 && (
                <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-300">
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">🕘 Diagnosis History</h3>
                    <ul className="space-y-2">
                        {diagnosisHistory.map((entry, index) => (
                            <li key={entry.id} className="p-2 border rounded hover:bg-gray-50">
                                <button
                                    className="flex items-center justify-between w-full text-left"
                                    onClick={() => setActiveDiagnosisIndex(activeDiagnosisIndex === index ? null : index)}
                                >
                                    <span>
                                        <strong>Generated at:</strong> {new Date(entry.created_at).toLocaleString()}
                                    </span>
                                    <span>{activeDiagnosisIndex === index ? "▲" : "▼"}</span>
                                </button>

                                {activeDiagnosisIndex === index && (
                                    <p className="mt-2 text-sm text-gray-800 whitespace-pre-line">{entry.result}</p>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}



            {summary && (
                <div className="mt-6 flex gap-4 ">
                    <a
                        href={`http://localhost:8000/export-pdf/${summary.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
                    >
                        Download PDF Report
                    </a>
                    <a
                        href={`http://localhost:8000/export-txt/${summary.id}`}
                        target="_blank"
                    >
                        <button className="inline-block px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded">Download Summary (.txt)</button>
                    </a>

                </div>

            )}

            {/* Regenerate Diagnosis Button */}
            <button
                onClick={handleDiagnosis}
                disabled={diagnosing}
                className={`inline-block px-4 py-2 text-sm font-medium text-white rounded mt-3 ${diagnosing ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"} text-white`}
            >
                {diagnosis ? (diagnosing ? "Regenerating..." : "Regenerate Diagnosis") : (diagnosing ? "Generating Diagnosis..." : "Run Diagnosis")}
            </button>

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
