import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Dashboard() {
	const [summaries, setSummaries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchField, setSearchField] = useState("keyword");
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		const fetchSummaries = async () => {
			try {
				const params = {};
				if (searchTerm.trim()) {
					params[searchField] = searchTerm.trim();
				}

				const response = await axios.get('http://localhost:8000/summaries', {
					params,
				});
				setSummaries(response.data);
			} catch (error) {
				console.error("Failed to fetch summaries", error);
			} finally {
				setLoading(false);
			}
		};

		fetchSummaries();
	}, [searchTerm, searchField]);



	return (
		<div className='max-w-4xl mx-auto mt-10 p-4'>
			<h1 className='text-2xl font-bold mb-6 text-blue-600'>Patient Summaries</h1>
			<div className="flex gap-2 mb-4">
				<select
					value={searchField}
					onChange={(e) => setSearchField(e.target.value)}
					className="px-3 py-2 border rounded"
				>
					<option value="keyword">Keyword</option>
					<option value="file_name">File Name</option>
					<option value="patient_id">Patient ID</option>
				</select>

				<input
					type="text"
					placeholder={`Search by ${searchField.replace("_", " ")}`}
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="flex-1 px-4 py-2 border rounded shadow-sm"
				/>
			</div>
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