export default function ProductsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-500">Manage your product catalog and sync from Shopify.</p>
      </div>

      {/* Sync Button */}
      <div className="flex items-center gap-4 mb-8">
        <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white rounded-xl font-semibold hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600 transition shadow-lg shadow-violet-500/25 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sync Products
        </button>
        <span className="text-gray-500 text-sm">0 products synced</span>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No products yet</h3>
        <p className="text-gray-500 mb-6">Connect your Shopify store and sync your products to get started.</p>
        <button className="px-6 py-3 bg-violet-100 text-violet-700 rounded-xl font-semibold hover:bg-violet-200 transition">
          Connect Shopify
        </button>
      </div>
    </div>
  );
}
