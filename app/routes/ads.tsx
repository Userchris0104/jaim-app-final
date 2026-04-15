export default function AdsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ads</h1>
        <p className="text-gray-500">Review, approve, and manage your AI-generated ad creatives.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8">
        {["All Ads", "Ready", "Processing", "Published", "Archived"].map((tab, i) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              i === 0
                ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="text-6xl mb-4">🎨</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No ads yet</h3>
        <p className="text-gray-500 mb-6">Generate your first AI-powered ad creative from your products.</p>
        <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white rounded-xl font-semibold hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600 transition shadow-lg shadow-violet-500/25">
          Generate Ads
        </button>
      </div>
    </div>
  );
}
