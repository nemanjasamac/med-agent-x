import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Dashboard() {
	const [summaries, setSummaries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchField, setSearchField] = useState("keyword");
	const [searchTerm, setSearchTerm] = useState("");
	const [page, setPage] = useState(1);
	const [perPage] = useState(10);;
	const [total, setTotal] = useState(0);
	const [activeTag, setActiveTag] = useState("");

	const handleTagClick = (keyword) => {
		if (activeTag === keyword) return;
		setActiveTag(keyword);
		setSearchTerm(keyword);
		setPage(1);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};



	useEffect(() => {
		setPage(1);
	}, [searchField, searchTerm]);

	useEffect(() => {
		const fetchSummaries = async () => {
			try {
				const params = {
					page: page,
					per_page: perPage,
				};
				if (searchTerm.trim()) {
					params[searchField] = searchTerm.trim();
				}

				const response = await axios.get('http://localhost:8000/summaries', {
					params,
				});
				setSummaries(response.data.summaries);
				setTotal(response.data.total);
			} catch (error) {
				console.error("Failed to fetch summaries", error);
			} finally {
				setLoading(false);
			}
		};

		fetchSummaries();
	}, [searchTerm, searchField, total, page]);

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
		if (searchTerm !== "") {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}, [page], [searchTerm]);

	const totalPages = Math.ceil(total / perPage) || 1;

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
				{activeTag && (
					<button
						onClick={() => {
							setActiveTag("");
							setSearchTerm("");
							setPage(1);
							window.scrollTo({ top: 0, behavior: 'smooth' });
						}}
						className="mt-2 px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 transition"
					>
						Clear Filter: {activeTag}
					</button>
				)}
			</div>

			{loading && <p>Loading...</p>}
			{!loading && summaries.length === 0 && <p className='text-gray-600'>No summaries found</p>}

			<div className='space-y-6'>
				{summaries.map((summary) => (
					<div key={summary.id} className='border rounded-lg shadow p-4 bg-white'>
						<div className='flex justify-between items-center mb-2'>
							<span className='text-sm text-gray-500'>{summary.created_at.slice(0, 10)}</span>
							<span className='text-sm text-blue-500 font-medium'>{summary.file_name}</span>
						</div>
						<Link to={`/dashboard/${summary.id}`} className='text-blue-500'>
							<p className='text-gray-800 mb-2 line-clamp-3'>{summary.summary}</p>
						</Link>
						<div className='flex flex-wrap gap-2'>
							{summary.keywords?.map((keyword, index) => (
								<span
									key={index}
									onClick={() => handleTagClick(keyword)}
									className={`inline-block bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded cursor-pointer transition ${activeTag === keyword ? 'ring-2 ring-blue-400' : ''
										}`}
								>
									{keyword}
								</span>
							))}

						</div>
					</div>
				))}

				{/* Pagination */}
				{total > perPage && (
					<div className="flex justify-center items-center gap-2 mt-6">
						<button
							onClick={() => setPage(1)}
							disabled={page === 1}
							className="px-3 py-1 border rounded hover:bg-blue-100 disabled:opacity-50"
						>
							First
						</button>
						<button
							onClick={() => setPage((p) => Math.max(p - 1, 1))}
							disabled={page === 1}
							className="px-3 py-1 border rounded hover:bg-blue-100 disabled:opacity-50"
						>
							Previous
						</button>
						<span className="px-3 py-1 text-sm text-gray-600">
							Page {page} of {totalPages}
						</span>
						<button
							onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
							disabled={page >= totalPages}
							className="px-3 py-1 border rounded hover:bg-blue-100 disabled:opacity-50"
						>
							Next
						</button>
						<button
							onClick={() => setPage(totalPages)}
							disabled={page >= totalPages}
							className="px-3 py-1 border rounded hover:bg-blue-100 disabled:opacity-50"
						>
							Last
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

export default Dashboard;