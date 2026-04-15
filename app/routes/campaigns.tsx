export default function CampaignsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <p className="text-gray-500">Manage your Meta and TikTok advertising campaigns.</p>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Meta */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Meta Ads</h3>
              <p className="text-sm text-gray-500">Facebook & Instagram</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <span className="w-2 h-2 bg-gray-300 rounded-full" />
            Not connected
          </div>
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
            Connect Meta
          </button>
        </div>

        {/* TikTok */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-white">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">TikTok Ads</h3>
              <p className="text-sm text-gray-500">TikTok for Business</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <span className="w-2 h-2 bg-gray-300 rounded-full" />
            Not connected
          </div>
          <button className="w-full py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition">
            Connect TikTok
          </button>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="text-6xl mb-4">📣</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No campaigns yet</h3>
        <p className="text-gray-500">Connect your ad accounts to start creating campaigns.</p>
      </div>
    </div>
  );
}
