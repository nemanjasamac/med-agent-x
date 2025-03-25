import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Dashboard() {
	const [summaries, setSummaries] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchSummaries = async () => {
			try {
				const res = await axios.get("http://127.0.0.1:8000/summaries");
				setSummaries(res.data);
			} catch (error) {
				console.error("Failed to fetch summaries", error)
			} finally {
				setLoading(false);
			}
		};
		fetchSummaries();
	}, []);

	return (
		<div className='max-w-4xl mx-auto mt-10 p-4'>
			<h1 className='text-2xl font-bold mb-6 text-blue-600'>Patient Summaries</h1>
			{loading && <p>Loading...</p>}

			{!loading && summaries.length === 0 && (
				<p className='text-gray-600'>No summaries found</p>
			)}

			<div className='space-y-6'>
				{summaries.map((summary) => (
					<div key={summary.id} className='border rounded-lg shadow p-4 bg-white'>
						<div className='flex justify-between items-center mb-2'>
							<span className='text-sm text-gray-500'>{summary.created_at.slice(0, 10)}</span>
							<span className='text-sm text-blue-500 font-medium'>{summary.file_name}</span>
						</div>
						<Link to={`/dashboard/${summary.id}`} className='text-blue-500 '>
							<p className='text-gray-800 mb-2 line-clamp-3'>{summary.summary}</p></Link>
						<div className='flex flex-wrap gap-2'>
							{summary.keywords.map((kw, idx) => (
								<span key={idx} className='bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full'>
									{kw}
								</span>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

export default Dashboard;