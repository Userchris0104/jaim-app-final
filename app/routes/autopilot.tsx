export default function AutopilotPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Autopilot</h1>
        <p className="text-gray-500">Let JAIM automatically manage your ad campaigns.</p>
      </div>

      {/* Autopilot Status Card */}
      <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-3xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="text-white/90 font-semibold">Autopilot Status</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Currently Inactive</h2>
            <p className="text-white/70">Enable autopilot to let JAIM optimize your ads automatically.</p>
          </div>
          <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-white/90 transition shadow-lg">
            Enable Autopilot
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            icon: "🎯",
            title: "Smart Targeting",
            desc: "AI optimizes audience targeting based on conversion data."
          },
          {
            icon: "💰",
            title: "Budget Optimization",
            desc: "Automatically reallocates budget to best-performing ads."
          },
          {
            icon: "🔄",
            title: "Creative Refresh",
            desc: "Detects ad fatigue and generates fresh creatives."
          },
        ].map((feature) => (
          <div key={feature.title} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="text-3xl mb-3">{feature.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-500 text-sm">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Activity Log Placeholder */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-gray-500">No autopilot activity yet. Enable autopilot to get started.</p>
        </div>
      </div>
    </div>
  );
}
