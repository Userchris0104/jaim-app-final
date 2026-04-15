export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure your JAIM account and preferences.</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Store Connection */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Store Connection</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.337 3.415c-.193-.017-.39-.017-.584-.017-2.18 0-3.89 1.695-4.493 3.322H8.185c-.228 0-.426.16-.474.386l-.277 1.358a.488.488 0 00.474.588h1.747l-1.747 8.73a.488.488 0 00.474.588h1.84a.488.488 0 00.474-.386l1.747-8.932h2.343a.488.488 0 00.474-.588l-.277-1.358a.488.488 0 00-.474-.386h-2.059c.339-.965.976-1.626 1.777-1.626.193 0 .39.017.584.051a.488.488 0 00.537-.353l.277-1.358a.488.488 0 00-.29-.558 3.78 3.78 0 00-.943-.137z"/>
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900">Shopify</div>
                <div className="text-sm text-gray-500">Not connected</div>
              </div>
            </div>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition">
              Connect
            </button>
          </div>
        </div>

        {/* Ad Platforms */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Ad Platforms</h3>
          <div className="space-y-3">
            {[
              { name: "Meta Ads", status: "Not connected", color: "blue" },
              { name: "TikTok Ads", status: "Not connected", color: "gray" },
            ].map((platform) => (
              <div key={platform.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-gray-300 rounded-full" />
                  <span className="font-medium text-gray-900">{platform.name}</span>
                  <span className="text-sm text-gray-500">{platform.status}</span>
                </div>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition">
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Settings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Budget Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Daily Budget Limit</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  defaultValue={50}
                  className="flex-1 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                <span className="text-gray-500">per day</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Budget Cap</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  defaultValue={1500}
                  className="flex-1 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                <span className="text-gray-500">per month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white rounded-xl font-semibold hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600 transition shadow-lg shadow-violet-500/25">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
