export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500">Track your ad performance and ROI.</p>
          </div>
          <div className="flex bg-gray-100 rounded-xl p-1">
            {["7 Days", "30 Days", "90 Days"].map((period, i) => (
              <button
                key={period}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  i === 1 ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Spend", value: "$2,450", change: "+12%" },
          { label: "Revenue", value: "$12,740", change: "+24%" },
          { label: "ROAS", value: "5.2x", change: "+18%" },
          { label: "Conversions", value: "342", change: "+15%" },
        ].map((metric) => (
          <div key={metric.label} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="text-gray-500 text-sm mb-1">{metric.label}</div>
            <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
            <div className="text-emerald-600 text-sm font-medium">{metric.change}</div>
          </div>
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Revenue Over Time</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
          <div className="text-center">
            <div className="text-4xl mb-2">📈</div>
            <p className="text-gray-500">Chart visualization coming soon</p>
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Performance by Platform</h3>
        <div className="space-y-4">
          {[
            { platform: "Meta", spend: "$1,200", revenue: "$6,240", roas: "5.2x", color: "from-blue-500 to-blue-600" },
            { platform: "TikTok", spend: "$850", revenue: "$4,080", roas: "4.8x", color: "from-gray-800 to-black" },
            { platform: "Instagram", spend: "$400", revenue: "$2,420", roas: "6.1x", color: "from-purple-500 to-pink-500" },
          ].map((item) => (
            <div key={item.platform} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-sm`}>
                {item.platform[0]}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.platform}</div>
                <div className="text-sm text-gray-500">Spend: {item.spend}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{item.revenue}</div>
                <div className="text-sm text-emerald-600">{item.roas} ROAS</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
