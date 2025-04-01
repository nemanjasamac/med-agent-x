import { useState } from "react";

function DiagnosisHistory({ diagnosisHistory }) {
    const [activeIndex, setActiveIndex] = useState(null);

    if (!diagnosisHistory?.length) return null;

    return (
        <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-300">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">🕘 Diagnosis History</h3>
            <ul className="space-y-2">
                {diagnosisHistory.map((entry, index) => (
                    <li key={entry.id} className="p-2 border rounded hover:bg-gray-50">
                        <button
                            className="flex items-center justify-between w-full text-left"
                            onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                        >
                            <span>
                                <strong>Generated at:</strong> {new Date(entry.created_at).toLocaleString()}
                            </span>
                            <span>{activeIndex === index ? "▲" : "▼"}</span>
                        </button>

                        {activeIndex === index && (
                            <p className="mt-2 text-sm text-gray-800 whitespace-pre-line">{entry.result}</p>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default DiagnosisHistory;
