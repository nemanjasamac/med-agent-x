import { useState } from "react";
import axios from "axios";


function Upload() {
	const [file, setFile] = useState(null);
	const [patientId, setPatientId] = useState("");
	const [notes, setNotes] = useState("");

	const [loading, setLoading] = useState(false);
	const [summary, setSummary] = useState(null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!file) return alert("Please upload a file!");

		setLoading(true);
		setSummary(null);

		const formData = new FormData();
		formData.append("file", file);
		formData.append("patient_id", patientId);
		formData.append("notes", notes);

		try{
			const response = await axios.post("http://127.0.0.1:8000/generate-summary", formData,{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});
			setSummary({
				text: response.data.summary,
				keywords: response.data.keywords,
			});
		} catch (err) {
			console.error(err),
			alert("Something went wrong!");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto bg-white shadow-md rounded-md p-6">
			<h2 className="text-2xl font-bold text-blue-600 mb-6">Upload Patient Notes</h2>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="block font-medium text-gray-700 mb-1">
						Patient Notes (PDF or Word)
					</label>
					<input
						type="file"
						accept=".pdf,.doc,.docx"
						onChange={(e) => setFile(e.target.files[0])}
						className="block w-full border border-gray-300 rounded p-2"
						required
					/>
				</div>

				<div>
					<label className="block font-medium text-gray-700 mb-1">Patient ID (optional)</label>
					<input
						type="text"
						value={patientId}
						onChange={(e) => setPatientId(e.target.value)}
						placeholder="e.g. JohnD123"
						className="block w-full border border-gray-300 rounded p-2"
					/>
				</div>

				<div>
					<label className="block font-medium text-gray-700 mb-1">Uploader Notes (optional)</label>
					<textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						rows="4"
						placeholder="e.g. Patient has chronic symptoms..."
						className="block w-full border border-gray-300 rounded p-2"
					></textarea>
				</div>

				<div>
					<button
						type="submit"
						className="bg-blue-600 text-white font-semibold px-4 py-2 rounded hover:bg-blue-700 transition"
					>
						Generate Summary
					</button>
				</div>
			</form>
			{loading && (
				<div className="mt-6 text-blue-600 font-semibold animate-pulse">
					Generating summary...
				</div>
			)}

			{summary && (
				<div className="mt-6 border-t pt-4">
					<h3 className="text-lg font-bold mb-2 text-gray-800">AI Summary:</h3>
					<p className="text-gray-700 mb-4">{summary.text}</p>

					<h4 className="font-semibold text-gray-800">Key Terms:</h4>
					<ul className="list-disc list-inside text-gray-600">
						{summary.keywords.map((kw, idx) => (
							<li key={idx}>{kw}</li>
						))}
					</ul>
				</div>
			)}

		</div>
	);
}

export default Upload;
