export default function DashboardStats({ stats }) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
        {/* Summaries Card */}
        <div className="p-4 rounded-2xl shadow bg-white hover:shadow-md transition-all">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📄</span>
            <h3 className="text-lg font-semibold">Total Summaries</h3>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.total_summaries ?? 0}</p>
        </div>
  
        {/* Diagnoses Card */}
        <div className="p-4 rounded-2xl shadow bg-white hover:shadow-md transition-all">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🩺</span>
            <h3 className="text-lg font-semibold">Total Diagnoses</h3>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.total_diagnoses ?? 0}</p>
        </div>
  
        {/* Feedbacks Card */}
        <div className="p-4 rounded-2xl shadow bg-white hover:shadow-md transition-all">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">💬</span>
            <h3 className="text-lg font-semibold">Total Feedbacks</h3>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.total_feedbacks ?? 0}</p>
        </div>
      </div>
    );
  }
  