import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";

interface Product {
  id: string;
  shopifyId: string;
  title: string;
  description?: string;
  vendor?: string;
  productType?: string;
  status: string;
  imageUrl?: string;
  priceMin?: number;
  priceMax?: number;
  inventory?: number;
  tags?: string;
  syncedAt?: string;
}

interface Store {
  id: string;
  name: string;
  domain: string;
  email?: string;
  currency?: string;
  plan?: string;
  connectedAt?: string;
}

interface ProductsData {
  connected: boolean;
  store: Store | null;
  products: Product[];
  total: number;
}

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<ProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [shopInput, setShopInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for URL params (from OAuth callback) and auto-sync
  useEffect(() => {
    const connected = searchParams.get("connected");
    const errorParam = searchParams.get("error");

    if (connected === "true") {
      setSuccessMessage("Store connected successfully! Syncing products...");
      // Auto-sync products after connection
      setSyncing(true);
      fetch("/api/products", {
        method: "POST",
        body: new URLSearchParams({ action: "sync" }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            setSuccessMessage(`Synced ${result.synced} products successfully!`);
            fetchProducts();
          } else {
            setError(result.error || "Sync failed");
          }
        })
        .catch(() => setError("Failed to sync products"))
        .finally(() => {
          setSyncing(false);
          setTimeout(() => setSuccessMessage(null), 5000);
        });
    }

    if (errorParam) {
      const errorMessages: Record<string, string> = {
        missing_params: "OAuth failed: Missing parameters",
        invalid_state: "OAuth failed: Invalid state (possible CSRF)",
        config_error: "Shopify API not configured",
        oauth_failed: "OAuth failed. Please try again.",
      };
      setError(errorMessages[errorParam] || "An error occurred");
      setTimeout(() => setError(null), 5000);
    }
  }, [searchParams]);

  // Fetch products data
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      const result = await response.json();
      setData(result);
    } catch (e) {
      console.error("Error fetching products:", e);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Sync products
  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch("/api/products", {
        method: "POST",
        body: new URLSearchParams({ action: "sync" }),
      });
      const result = await response.json();

      if (result.success) {
        setSuccessMessage(`Synced ${result.synced} products`);
        if (result.debug) {
          console.log("Sync debug:", result.debug);
        }
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchProducts();
      } else {
        const errorMsg = result.error || "Sync failed";
        console.error("Sync error:", errorMsg, result.debug);
        setError(`${errorMsg}${result.debug?.errorResponse ? ` - ${result.debug.errorResponse}` : ''}`);
      }
    } catch (e) {
      setError("Failed to sync products");
    } finally {
      setSyncing(false);
    }
  };

  // Disconnect store
  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Shopify store? This will remove all synced products.")) {
      return;
    }

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        body: new URLSearchParams({ action: "disconnect" }),
      });
      const result = await response.json();

      if (result.success) {
        setSuccessMessage("Store disconnected");
        fetchProducts();
      }
    } catch (e) {
      setError("Failed to disconnect");
    }
  };

  // Connect to Shopify
  const handleConnect = () => {
    if (!shopInput.trim()) {
      setError("Please enter your Shopify store URL");
      return;
    }

    // Clean up the shop input
    let shop = shopInput.trim();
    shop = shop.replace("https://", "").replace("http://", "");
    shop = shop.replace("/admin", "").replace("/", "");

    if (!shop.includes(".myshopify.com")) {
      shop = `${shop}.myshopify.com`;
    }

    // Redirect to OAuth
    window.location.href = `/auth/shopify?shop=${encodeURIComponent(shop)}`;
  };

  // Format price
  const formatPrice = (min?: number, max?: number, currency = "USD") => {
    if (min === undefined) return "N/A";
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    });
    if (min === max || max === undefined) {
      return formatter.format(min);
    }
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-4 w-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4">
                <div className="aspect-square bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-500">Manage your product catalog and sync from Shopify.</p>
      </div>

      {/* Not connected state */}
      {!data?.connected && (
        <>
          {/* Connect Button */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setShowConnectModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition shadow-lg shadow-emerald-500/25 flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.337 11.914l.59-3.896h-3.736V5.544c0-1.066.522-2.104 2.197-2.104h1.7V.253S14.55 0 13.053 0c-3.114 0-5.15 1.888-5.15 5.307v2.711H4.34v3.896h3.564v9.42a14.2 14.2 0 004.388 0v-9.42h3.044z"/>
              </svg>
              Connect Shopify
            </button>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.958 4.285A2.78 2.78 0 0019.78 2h-1.157a2.78 2.78 0 00-2.592 1.78L14.06 9.572H9.94L7.969 3.78A2.78 2.78 0 005.377 2H4.22a2.78 2.78 0 00-2.178 2.285L.084 12.58a1 1 0 00.985 1.158h4.156l-.98 7.203a1 1 0 00.988 1.139h3.534a1 1 0 00.988-.861l1.245-9.148h2l1.245 9.148a1 1 0 00.988.861h3.534a1 1 0 00.988-1.139l-.98-7.203h4.156a1 1 0 00.985-1.158l-1.958-8.295z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Your Shopify Store</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Link your Shopify store to import your products. JAIM will analyze your catalog and create AI-powered ads automatically.
            </p>
            <button
              onClick={() => setShowConnectModal(true)}
              className="px-6 py-3 bg-violet-100 text-violet-700 rounded-xl font-semibold hover:bg-violet-200 transition"
            >
              Get Started
            </button>
          </div>
        </>
      )}

      {/* Connected state */}
      {data?.connected && data.store && (
        <>
          {/* Store Info Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.337 11.914l.59-3.896h-3.736V5.544c0-1.066.522-2.104 2.197-2.104h1.7V.253S14.55 0 13.053 0c-3.114 0-5.15 1.888-5.15 5.307v2.711H4.34v3.896h3.564v9.42a14.2 14.2 0 004.388 0v-9.42h3.044z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{data.store.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    Connected
                  </span>
                </div>
                <p className="text-sm text-gray-500">{data.store.domain}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{data.total} products</span>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {syncing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync
                  </>
                )}
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-gray-500 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {data.products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No products yet</h3>
              <p className="text-gray-500 mb-6">
                Click "Sync" to import products from your Shopify store.
              </p>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition disabled:opacity-50"
              >
                {syncing ? "Syncing..." : "Sync Products Now"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {data.products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-violet-200 transition-all group"
                >
                  {/* Product Image */}
                  <div className="aspect-square relative bg-gray-100">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-bold ${
                      product.status === "active"
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-500 text-white"
                    }`}>
                      {product.status}
                    </div>

                    {/* Quick Actions Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-100 transition">
                        Generate Ad
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-1 truncate" title={product.title}>
                      {product.title}
                    </h4>
                    {product.vendor && (
                      <p className="text-xs text-gray-500 mb-1">{product.vendor}</p>
                    )}
                    {product.description && (
                      <p
                        className="text-xs text-gray-400 mb-2 line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: product.description.replace(/<[^>]*>/g, '').slice(0, 100) + (product.description.length > 100 ? '...' : '')
                        }}
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-violet-600 font-bold">
                        {formatPrice(product.priceMin, product.priceMax, data.store?.currency)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {product.inventory !== undefined ? `${product.inventory} in stock` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowConnectModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Connect Shopify</h2>
              <button
                onClick={() => setShowConnectModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-500 mb-6">
              Enter your Shopify store URL to connect your store and import products.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store URL
              </label>
              <input
                type="text"
                value={shopInput}
                onChange={(e) => setShopInput(e.target.value)}
                placeholder="https://your-store.myshopify.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              />
              <p className="text-xs text-gray-400 mt-2">
                Enter your full Shopify store URL (e.g. https://your-store.myshopify.com)
              </p>
            </div>

            <button
              onClick={handleConnect}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.337 11.914l.59-3.896h-3.736V5.544c0-1.066.522-2.104 2.197-2.104h1.7V.253S14.55 0 13.053 0c-3.114 0-5.15 1.888-5.15 5.307v2.711H4.34v3.896h3.564v9.42a14.2 14.2 0 004.388 0v-9.42h3.044z"/>
              </svg>
              Connect Store
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              You'll be redirected to Shopify to authorize JAIM
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
