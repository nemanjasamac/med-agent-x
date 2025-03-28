import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import DashboardStats from '../components/DashboardStats';
import RecentActivity from '../components/RecentActivity';

function Dashboard() {
	const [summaries, setSummaries] = useState([]);
	const [loading, setLoading] = useState(true);

	const [searchField, setSearchField] = useState("keyword");
	const [searchTerm, setSearchTerm] = useState("");

	const [page, setPage] = useState(1);
	const [perPage] = useState(10);;
	const [total, setTotal] = useState(0);

	const [activeTag, setActiveTag] = useState("");

	const [stats, setStats] = useState(null);
	const [recentSummaries, setRecentSummmaries] = useState([]);

	useEffect(() => {
		try {
			axios.get('http://localhost:8000/dashboard-stats').then((res) => {
				setStats(res.data)
			})
		} catch (error) {
			console.error("Failed to fetch stats", error);
		}
	}, [])

	useEffect(() => {
		axios.get('http://localhost:8000/recent-summaries').then(res => setRecentSummmaries(res.data)).catch(err => console.error("Failed to fetch recent summaries", err))
	}, [])

	const handleTagClick = (keyword) => {
		if (activeTag === keyword) return;
		setSearchField("keyword");
		setActiveTag(keyword);
		setSearchTerm(keyword);
		setPage(1);
		// window.scrollTo({ top: 0, behavior: 'smooth' });
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
	}, [searchTerm, searchField, page]);

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
		if (searchTerm !== "") {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}, [page], [searchTerm]);

	const totalPages = Math.ceil(total / perPage) || 1;

	return (
		<div className='max-w-4xl mx-auto mt-10 p-4'>
			<h1 className='text-3xl font-bold mb-6 text-blue-600'>Patient Summaries</h1>
			{stats &&
				<DashboardStats stats={stats} />}
			<RecentActivity summaries={recentSummaries} />
			<div className='bg-white p-4 rounded-xl shadow mb-6'>
				<h2 className='text-lg font-semibold mb-3 flex items-center gap-2'>
					🔍 Search & Filter
				</h2>
				<div className='flex flex-col md:flex-row gap-2'>
					<select value={searchField} onChange={(e) => setSearchField(e.target.value)} className='px-3 py-2 border rounded w-full md:w-auto'>
						<option value="keyword">Keyword</option>
						<option value="file_name">File Name</option>
						<option value="patient_id">Patient ID</option>
					</select>
					<input type="text" placeholder={`Search by ${searchField.replace("_", " ")}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='flex-1 px-4 py-2 border rounded shadow-sm' />
					{activeTag && (
						<button
							onClick={() => {
								setSearchField("keyword");
								setActiveTag("");
								setSearchTerm("");
								setPage(1);
								// window.scrollTo({ top: 0, behavior: 'smooth' });
							}}
							className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 transition"
						>
							Clear Filter: {activeTag}
						</button>
					)}
				</div>
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
									className={`bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full cursor-pointer ${activeTag === keyword ? 'ring-2 ring-blue-300' : ''
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
		</div >
	);
}

export default Dashboard;