import { useState, useEffect, useRef } from "react";

interface BrandStyleProfile {
  colors: { hex: string; label: string }[];
  visualTone: string;
  contentStyle: string;
  mood: string;
  keyPatterns: string;
  conflicts: string | null;
}

interface Store {
  id: string;
  name: string;
  domain: string;
  email?: string;
  currency?: string;
  connectedAt?: string;
}

export default function SettingsPage() {
  // Store connection state
  const [store, setStore] = useState<Store | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);

  // Brand style state
  const [brandImages, setBrandImages] = useState<string[]>([]);
  const [brandProfile, setBrandProfile] = useState<BrandStyleProfile | null>(null);
  const [includeShopifyImages, setIncludeShopifyImages] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [brandSuccess, setBrandSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load store connection and brand style on mount
  useEffect(() => {
    fetchStoreConnection();
    fetchBrandStyle();
  }, []);

  const fetchStoreConnection = async () => {
    try {
      setStoreLoading(true);
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.connected && data.store) {
        setStore(data.store);
      } else {
        setStore(null);
      }
    } catch (error) {
      console.error('Error fetching store connection:', error);
      setStore(null);
    } finally {
      setStoreLoading(false);
    }
  };

  const fetchBrandStyle = async () => {
    try {
      const response = await fetch('/api/brand-style');
      const data = await response.json();
      if (data.success) {
        setBrandImages(data.referenceImages || []);
        setBrandProfile(data.profile);
      }
    } catch (error) {
      console.error('Error fetching brand style:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setBrandError('Invalid file type. Only JPG, PNG, WEBP allowed.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setBrandError('File too large. Maximum 5MB.');
      return;
    }

    // Check max images
    if (brandImages.length >= 5) {
      setBrandError('Maximum 5 images allowed. Remove one first.');
      return;
    }

    setUploading(true);
    setBrandError(null);

    try {
      const formData = new FormData();
      formData.append('action', 'upload');
      formData.append('file', file);

      const response = await fetch('/api/brand-style', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setBrandImages(data.images);
      setBrandSuccess('Image uploaded');
      setTimeout(() => setBrandSuccess(null), 3000);
    } catch (error: any) {
      setBrandError(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (key: string) => {
    try {
      const formData = new FormData();
      formData.append('action', 'remove');
      formData.append('key', key);

      const response = await fetch('/api/brand-style', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setBrandImages(data.images);
      }
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setBrandError(null);

    try {
      const formData = new FormData();
      formData.append('action', 'analyze');
      formData.append('includeShopifyImages', includeShopifyImages.toString());

      const response = await fetch('/api/brand-style', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setBrandProfile(data.profile);
      setBrandSuccess('Brand style analyzed successfully!');
      setTimeout(() => setBrandSuccess(null), 5000);
    } catch (error: any) {
      setBrandError(error.message || 'Failed to analyze brand style');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReanalyze = () => {
    setBrandProfile(null);
    handleAnalyze();
  };

  // Generate R2 public URL from key
  const getImageUrl = (key: string) => {
    // For R2, we'll use a proxy endpoint or direct R2 URL
    return `/api/brand-style/image?key=${encodeURIComponent(key)}`;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure your JAIM account and preferences.</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Brand Style Section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Brand Style</h3>
          <p className="text-sm text-gray-500 mb-6">
            Upload images from your social accounts that represent how your brand looks and feels.
            Combined with your Shopify products, JAIM will match your visual identity in every ad.
          </p>

          {/* Error/Success Messages */}
          {brandError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {brandError}
            </div>
          )}

          {brandSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {brandSuccess}
            </div>
          )}

          {/* Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              uploading ? 'border-violet-300 bg-violet-50' : 'border-gray-200 hover:border-violet-400 hover:bg-violet-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-8 h-8 text-violet-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm text-violet-600 font-medium">Uploading...</span>
              </div>
            ) : (
              <>
                <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-600 font-medium">
                  Drag and drop or click to upload
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG, WEBP only. Max 5 images, 5MB each.
                </p>
              </>
            )}
          </div>

          {/* Uploaded Images Thumbnails */}
          {brandImages.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {brandImages.map((key, index) => (
                <div key={key} className="relative group">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={getImageUrl(key)}
                      alt={`Brand image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>';
                      }}
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(key);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {brandImages.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-violet-400 hover:text-violet-500 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Shopify Images Toggle */}
          <div className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              id="includeShopify"
              checked={includeShopifyImages}
              onChange={(e) => setIncludeShopifyImages(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            <label htmlFor="includeShopify" className="text-sm text-gray-600">
              Also use my Shopify product images in the analysis
            </label>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className={`mt-6 w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              analyzing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25'
            }`}
          >
            {analyzing ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analysing brand style...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Analyse brand style
              </>
            )}
          </button>

          {/* Brand Style Profile Summary */}
          {brandProfile && (
            <div className="mt-6 p-5 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Brand Style Summary</h4>
                <button
                  onClick={handleReanalyze}
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                >
                  Re-analyse
                </button>
              </div>

              {/* Color Palette */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Color Palette</p>
                <div className="flex gap-2">
                  {brandProfile.colors.map((color, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm"
                        style={{ backgroundColor: color.hex }}
                        title={`${color.label}: ${color.hex}`}
                      />
                      <span className="text-[10px] text-gray-500">{color.hex}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Style Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Visual Tone</p>
                  <p className="text-gray-900 font-medium">{brandProfile.visualTone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Content Style</p>
                  <p className="text-gray-900 font-medium">{brandProfile.contentStyle}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Mood</p>
                  <p className="text-gray-900 font-medium">{brandProfile.mood}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Key Patterns</p>
                  <p className="text-gray-900">{brandProfile.keyPatterns}</p>
                </div>
              </div>

              {/* Conflicts Warning */}
              {brandProfile.conflicts && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-800">Conflicts detected</p>
                      <p className="text-sm text-amber-700 mt-1">{brandProfile.conflicts}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Store Connection */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Store Connection</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                store ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gray-300'
              }`}>
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.958 4.285A2.78 2.78 0 0019.78 2h-1.157a2.78 2.78 0 00-2.592 1.78L14.06 9.572H9.94L7.969 3.78A2.78 2.78 0 005.377 2H4.22a2.78 2.78 0 00-2.178 2.285L.084 12.58a1 1 0 00.985 1.158h4.156l-.98 7.203a1 1 0 00.988 1.139h3.534a1 1 0 00.988-.861l1.245-9.148h2l1.245 9.148a1 1 0 00.988.861h3.534a1 1 0 00.988-1.139l-.98-7.203h4.156a1 1 0 00.985-1.158l-1.958-8.295z"/>
                </svg>
              </div>
              <div>
                {storeLoading ? (
                  <>
                    <div className="font-medium text-gray-900">Shopify</div>
                    <div className="text-sm text-gray-400">Loading...</div>
                  </>
                ) : store ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{store.name || 'Shopify Store'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                        Connected
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{store.domain}</div>
                  </>
                ) : (
                  <>
                    <div className="font-medium text-gray-900">Shopify</div>
                    <div className="text-sm text-gray-500">Not connected</div>
                  </>
                )}
              </div>
            </div>
            {store ? (
              <a
                href="/products"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Manage
              </a>
            ) : (
              <a
                href="/products"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
              >
                Connect
              </a>
            )}
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
