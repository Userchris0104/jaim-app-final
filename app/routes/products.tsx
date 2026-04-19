import { useState, useEffect, useMemo } from "react";
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

interface GeneratedAd {
  id: string;
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
  imageUrl: string | null;
  strategy: string;
}

// Product Preview Modal
function ProductModal({
  product,
  currency,
  onClose,
  formatPrice,
  onAdGenerated,
}: {
  product: Product | null;
  currency?: string;
  onClose: () => void;
  formatPrice: (min?: number, max?: number, currency?: string) => string;
  onAdGenerated?: (ad: GeneratedAd) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [generatedAd, setGeneratedAd] = useState<GeneratedAd | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !generating) onClose();
    };
    if (product) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [product, onClose, generating]);

  // Reset state when product changes
  useEffect(() => {
    setGeneratedAd(null);
    setGenError(null);
  }, [product?.id]);

  const handleGenerateAd = async () => {
    if (!product || generating) return;

    setGenerating(true);
    setGenError(null);

    try {
      const response = await fetch('/api/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate ad');
      }

      setGeneratedAd(result.ad);
      onAdGenerated?.(result.ad);
    } catch (err: any) {
      setGenError(err.message || 'Failed to generate ad');
    } finally {
      setGenerating(false);
    }
  };

  if (!product) return null;

  // Parse tags into array
  const tags = product.tags ? product.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  // Clean description HTML
  const cleanDescription = product.description
    ? product.description.replace(/<[^>]*>/g, "")
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Product Image */}
        <div className="relative">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full aspect-square object-cover rounded-t-xl"
            />
          ) : (
            <div className="w-full aspect-square bg-gray-100 flex items-center justify-center rounded-t-xl">
              <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* Status Badge */}
          <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-xs font-bold ${
            product.status === "active" ? "bg-emerald-500 text-white" : "bg-gray-500 text-white"
          }`}>
            {product.status}
          </div>
        </div>

        {/* Product Info - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">{product.title}</h2>

          {/* Type and Vendor */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            {product.productType && (
              <span className="px-2 py-0.5 bg-gray-100 rounded-md">{product.productType}</span>
            )}
            {product.vendor && (
              <>
                <span>•</span>
                <span>{product.vendor}</span>
              </>
            )}
          </div>

          {/* Price */}
          <div className="text-2xl font-bold text-violet-600 mb-4">
            {formatPrice(product.priceMin, product.priceMax, currency)}
          </div>

          {/* Description */}
          {cleanDescription && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{cleanDescription}</p>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Inventory */}
          {product.inventory !== undefined && (
            <div className="text-sm text-gray-500 mb-6">
              <span className="font-medium">{product.inventory}</span> in stock
            </div>
          )}

          {/* Error Message */}
          {genError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {genError}
            </div>
          )}

          {/* Generated Ad Preview */}
          {generatedAd && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-emerald-700">Ad Generated!</span>
              </div>
              {generatedAd.imageUrl && (
                <img
                  src={generatedAd.imageUrl}
                  alt="Generated Ad"
                  className="w-full aspect-square object-cover rounded-lg mb-3"
                />
              )}
              <div className="space-y-2">
                <p className="font-bold text-gray-900">{generatedAd.headline}</p>
                <p className="text-sm text-gray-600">{generatedAd.primaryText}</p>
                {generatedAd.description && (
                  <p className="text-xs text-gray-500">{generatedAd.description}</p>
                )}
                <span className="inline-block px-3 py-1 bg-violet-600 text-white text-xs font-semibold rounded-lg">
                  {generatedAd.cta}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">Strategy: {generatedAd.strategy}</span>
                <a
                  href="/ads"
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                >
                  View in Ads
                </a>
              </div>
            </div>
          )}

          {/* Generate Ad Button */}
          <button
            onClick={handleGenerateAd}
            disabled={generating}
            className={`w-full py-3 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${
              generating
                ? "bg-gray-400 cursor-not-allowed"
                : generatedAd
                ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/25"
                : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/25"
            }`}
          >
            {generating ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Ad...
              </>
            ) : generatedAd ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Generate Another
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Ad
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Price range options
const PRICE_RANGES = [
  { label: "All prices", value: "all", min: 0, max: Infinity },
  { label: "Under $50", value: "under-50", min: 0, max: 49.99 },
  { label: "$50–$100", value: "50-100", min: 50, max: 100 },
  { label: "$100–$200", value: "100-200", min: 100, max: 200 },
  { label: "$200+", value: "200-plus", min: 200, max: Infinity },
];

// Gender options
const GENDER_OPTIONS = [
  { label: "All Genders", value: "all" },
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
  { label: "Unisex", value: "unisex" },
];

// Detect gender from product tags and title
function detectGender(product: Product): "men" | "women" | "unisex" {
  const menKeywords = ["men", "male", "mens", "man"];
  const womenKeywords = ["women", "female", "womens", "woman"];

  // Parse tags into lowercase array
  const tags = product.tags
    ? product.tags.split(",").map((t) => t.trim().toLowerCase())
    : [];

  // Check tags first
  const hasMenTag = tags.some((tag) =>
    menKeywords.some((kw) => tag === kw || tag.includes(kw))
  );
  const hasWomenTag = tags.some((tag) =>
    womenKeywords.some((kw) => tag === kw || tag.includes(kw))
  );

  if (hasMenTag && hasWomenTag) return "unisex";
  if (hasMenTag) return "men";
  if (hasWomenTag) return "women";

  // Fallback to title check
  const titleLower = product.title.toLowerCase();
  const hasMenTitle = menKeywords.some((kw) => titleLower.includes(kw));
  const hasWomenTitle = womenKeywords.some((kw) => titleLower.includes(kw));

  if (hasMenTitle && hasWomenTitle) return "unisex";
  if (hasMenTitle) return "men";
  if (hasWomenTitle) return "women";

  // Default to unisex if nothing found
  return "unisex";
}

// Check if a product has any gender signal (for filter visibility)
function hasGenderSignal(product: Product): boolean {
  const genderKeywords = ["men", "male", "mens", "man", "women", "female", "womens", "woman"];

  // Check tags
  const tags = product.tags
    ? product.tags.split(",").map((t) => t.trim().toLowerCase())
    : [];

  const hasTagSignal = tags.some((tag) =>
    genderKeywords.some((kw) => tag === kw || tag.includes(kw))
  );
  if (hasTagSignal) return true;

  // Check title
  const titleLower = product.title.toLowerCase();
  const hasTitleSignal = genderKeywords.some((kw) => titleLower.includes(kw));

  return hasTitleSignal;
}

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<ProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [shopInput, setShopInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Check for URL params (from OAuth callback) and auto-sync
  useEffect(() => {
    const connected = searchParams.get("connected");
    const errorParam = searchParams.get("error");
    const connectParam = searchParams.get("connect");

    // Auto-open connect modal when ?connect=true
    if (connectParam === "true") {
      setShowConnectModal(true);
    }

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

  // Extract unique categories from products with counts
  const categories = data?.products
    ? Array.from(
        data.products.reduce((acc, product) => {
          const type = product.productType || "Uncategorized";
          acc.set(type, (acc.get(type) || 0) + 1);
          return acc;
        }, new Map<string, number>())
      ).sort((a, b) => a[0].localeCompare(b[0]))
    : [];

  // Calculate which filters are relevant for this store's products
  const relevantFilters = useMemo(() => {
    const products = data?.products ?? [];
    if (products.length === 0) {
      return { showGender: false, showCategories: false };
    }

    // Gender filter: show only if >20% of products have gender signals
    const productsWithGender = products.filter(hasGenderSignal).length;
    const showGender = productsWithGender / products.length > 0.2;

    // Category filter: show only if 2+ unique productTypes
    const uniqueTypes = new Set(products.map((p) => p.productType || "Uncategorized"));
    const showCategories = uniqueTypes.size > 1;

    return { showGender, showCategories };
  }, [data?.products]);

  // Filter products based on all active filters
  const filteredProducts = data?.products?.filter((product) => {
    // Category filter
    if (selectedCategory !== "all") {
      const productCategory = product.productType || "Uncategorized";
      if (productCategory !== selectedCategory) return false;
    }

    // Gender filter
    if (selectedGender !== "all") {
      const productGender = detectGender(product);
      if (productGender !== selectedGender) return false;
    }

    // Price range filter
    if (selectedPriceRange !== "all") {
      const priceRange = PRICE_RANGES.find((r) => r.value === selectedPriceRange);
      if (priceRange) {
        const price = product.priceMin ?? 0;
        if (price < priceRange.min || price > priceRange.max) return false;
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      if (!product.title.toLowerCase().includes(query)) return false;
    }

    return true;
  }) ?? [];

  // Check if any filter is active
  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedGender !== "all" ||
    selectedPriceRange !== "all" ||
    searchQuery.trim() !== "";

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedGender("all");
    setSelectedPriceRange("all");
    setSearchQuery("");
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
            <>
              {/* Filter Bar */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 space-y-4">
                {/* Row 1: Category Pills - only show if multiple categories */}
                {relevantFilters.showCategories && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === "all"
                          ? "bg-violet-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      All ({data.total})
                    </button>
                    {categories.map(([category, count]) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                          selectedCategory === category
                            ? "bg-violet-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {category} ({count})
                      </button>
                    ))}
                  </div>
                )}

                {/* Row 2: Attribute Filters + Search */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Gender Filter - only show if >20% of products have gender signals */}
                  {relevantFilters.showGender && (
                    <div className="relative">
                      <select
                        value={selectedGender}
                        onChange={(e) => setSelectedGender(e.target.value)}
                        className={`appearance-none pl-4 pr-10 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                          selectedGender !== "all"
                            ? "bg-violet-50 border-violet-200 text-violet-700"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {GENDER_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}

                  {/* Price Range Filter */}
                  <div className="relative">
                    <select
                      value={selectedPriceRange}
                      onChange={(e) => setSelectedPriceRange(e.target.value)}
                      className={`appearance-none pl-4 pr-10 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
                        selectedPriceRange !== "all"
                          ? "bg-violet-50 border-violet-200 text-violet-700"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {PRICE_RANGES.map((range) => (
                        <option key={range.value} value={range.value}>
                          {range.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-10 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition-colors"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Result Count */}
                <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3 -mb-1">
                  <span className="text-gray-500">
                    Showing {filteredProducts.length} of {data.total} products
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-violet-600 hover:text-violet-700 font-medium"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>

              {/* Empty State - No Matching Products */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No products match your filters</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your filters to find what you're looking for.</p>
                  <button
                    onClick={clearAllFilters}
                    className="px-5 py-2 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-violet-200 transition-all group cursor-pointer"
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

      {/* Product Preview Modal */}
      <ProductModal
        product={selectedProduct}
        currency={data?.store?.currency}
        onClose={() => setSelectedProduct(null)}
        formatPrice={formatPrice}
        onAdGenerated={(ad) => {
          setSuccessMessage(`Ad generated for ${selectedProduct?.title}!`);
          setTimeout(() => setSuccessMessage(null), 5000);
        }}
      />
    </div>
  );
}
