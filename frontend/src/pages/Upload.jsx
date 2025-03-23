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

		try {
			const response = await axios.post("http://127.0.0.1:8000/generate-summary", formData, {
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
				<div className="mt-8 p-6 bg-white rounded-xl shadow-md border border-gray-200">
					<div className="flex items-center justify-between mb-2">
						<h3 className="text-xl font-bold text-blue-700">🧠 Patient Summary</h3>
						<div className="flex gap-2">
							<button
								onClick={() => {
									navigator.clipboard.writeText(summary.text);
									alert("Summary copied to clipboard!");
								}}
								className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded hover:bg-blue-700 transition"
							>
								📋 Copy
							</button>
							<button
								onClick={() => {
									const data = {
										summary: summary.text,
										keywords: summary.keywords,
									};
									const blob = new Blob([JSON.stringify(data, null, 2)], {
										type: "application/json",
									});
									const url = URL.createObjectURL(blob);
									const link = document.createElement("a");
									link.href = url;
									link.download = "medagentx-summary.json";
									link.click();
									URL.revokeObjectURL(url);
								}}
								className="bg-green-600 text-white text-sm font-medium px-3 py-1 rounded hover:bg-green-700 transition"
							>
								📥 Download JSON
							</button>
						</div>
					</div>

					<p className="text-gray-700 leading-relaxed whitespace-pre-line mb-4">{summary.text}</p>

					<h4 className="text-lg font-semibold text-gray-800 mb-2">🧩 Extracted Medical Terms</h4>
					<div className="flex flex-wrap gap-2">
						{summary.keywords.map((kw, idx) => (
							<span
								key={idx}
								className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
							>
								{kw}
							</span>
						))}
					</div>
				</div>
			)}


		</div>
	);
}

export default Upload;
