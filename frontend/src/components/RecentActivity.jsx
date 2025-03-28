import { Link } from 'react-router-dom';

export default function RecentActivity({ summaries }) {
    if (!summaries?.length) return null;

    return (
        <div className="bg-white p-4 rounded-xl shadow mb-6">
            <h2 className="text-lg font-semibold mb-2">Recent Activity</h2>
            <ul className="space-y-2">
                {summaries.map(summary => (
                    <li key={summary.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                            <p className="text-sm text-gray-600">{summary.created_at.slice(0, 10)}</p>
                            <Link to={`/dashboard/${summary.id}`} className="text-blue-500 hover:underline">
                                {summary.file_name}
                            </Link>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {summary.patient_id}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
