import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";

interface Campaign {
  id: string;
  name: string;
}

interface Ad {
  id: string;
  storeId: string;
  productId: string;
  title: string;
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
  imageUrl: string | null;
  status: string;
  format: string;
  creativeStrategy: string;
  createdAt: string;
  updatedAt: string;
  // Performance metrics (mock)
  roas: number;
  revenue: number;
  clicks: number;
  ctr: number;
  impressions: number;
  platforms: string[];
  campaign: Campaign;
}

interface AdsData {
  success: boolean;
  ads: Ad[];
  total: number;
  campaigns: Campaign[];
}

// Tab options
const TABS = [
  { label: "All ads", value: "all" },
  { label: "Ready", value: "ready" },
  { label: "Processing", value: "processing" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

// Platform options
const PLATFORM_OPTIONS = [
  { label: "All platforms", value: "all" },
  { label: "TikTok", value: "tiktok" },
  { label: "Instagram", value: "instagram" },
  { label: "Facebook", value: "facebook" },
];

// Format options
const FORMAT_OPTIONS = [
  { label: "All formats", value: "all" },
  { label: "Static image", value: "static" },
  { label: "Carousel", value: "carousel" },
];

// Sort options
const SORT_OPTIONS = [
  { label: "Best performing", value: "best" },
  { label: "Worst performing", value: "worst" },
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Highest ROAS", value: "roas-high" },
  { label: "Highest revenue", value: "revenue-high" },
];

// Platform icon component
function PlatformIcon({ platform }: { platform: string }) {
  const baseClasses = "w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold";

  switch (platform) {
    case "tiktok":
      return (
        <div className={`${baseClasses} bg-black`}>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
          </svg>
        </div>
      );
    case "instagram":
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400`}>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </div>
      );
    case "facebook":
      return (
        <div className={`${baseClasses} bg-blue-600`}>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </div>
      );
    default:
      return null;
  }
}

// Format badge component
function FormatBadge({ format }: { format: string }) {
  return (
    <div className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs font-medium text-white">
      {format === "static" ? "Static image" : "Carousel"}
    </div>
  );
}

// Status badge component
function StatusBadge({ status, roas }: { status: string; roas: number }) {
  // Low ROAS overrides status badge
  if (roas < 2) {
    return (
      <div className="px-2 py-1 bg-red-500 rounded-lg text-xs font-bold text-white">
        Low ROAS
      </div>
    );
  }

  const statusStyles: Record<string, string> = {
    published: "bg-emerald-500 text-white",
    live: "bg-emerald-500 text-white",
    processing: "bg-amber-500 text-white",
    ready: "bg-gray-500 text-white",
    inbox: "bg-gray-500 text-white",
    archived: "bg-gray-400 text-white",
  };

  const statusLabels: Record<string, string> = {
    published: "Live",
    live: "Live",
    processing: "Processing",
    ready: "Ready",
    inbox: "Ready",
    archived: "Archived",
  };

  return (
    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${statusStyles[status] || statusStyles.ready}`}>
      {statusLabels[status] || status}
    </div>
  );
}

// Ad Card component
function AdCard({
  ad,
  maxRoas,
  onPreview,
  onShare,
}: {
  ad: Ad;
  maxRoas: number;
  onPreview: () => void;
  onShare: () => void;
}) {
  const roasBarWidth = maxRoas > 0 ? (ad.roas / maxRoas) * 100 : 0;
  const roasBarColor =
    ad.roas >= 3 ? "bg-violet-500" : ad.roas >= 1.5 ? "bg-amber-500" : "bg-red-500";
  const roasTextColor =
    ad.roas >= 3 ? "text-emerald-600" : ad.roas < 2 ? "text-red-600" : "text-gray-900";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-violet-200 transition-all group">
      {/* Image Area - 4:5 aspect ratio */}
      <div className="relative aspect-[4/5] bg-gray-100">
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Top left: Format badge */}
        <div className="absolute top-3 left-3">
          <FormatBadge format={ad.format} />
        </div>

        {/* Top right: Platform icons */}
        <div className="absolute top-3 right-3 flex gap-1">
          {ad.platforms.map((platform) => (
            <PlatformIcon key={platform} platform={platform} />
          ))}
        </div>

        {/* Bottom right: Status badge */}
        <div className="absolute bottom-3 right-3">
          <StatusBadge status={ad.status} roas={ad.roas} />
        </div>
      </div>

      {/* Ad Info Section */}
      <div className="p-4">
        {/* Title */}
        <h4 className="font-semibold text-gray-900 mb-3 truncate" title={ad.title}>
          {ad.title}
        </h4>

        {/* Performance bar */}
        <div className="h-1 bg-gray-100 rounded-full mb-4 overflow-hidden">
          <div
            className={`h-full ${roasBarColor} rounded-full transition-all`}
            style={{ width: `${roasBarWidth}%` }}
          />
        </div>

        {/* 2x2 Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">ROAS</p>
            <p className={`text-sm font-bold ${roasTextColor}`}>{ad.roas.toFixed(1)}x</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Revenue</p>
            <p className="text-sm font-bold text-gray-900">${ad.revenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Clicks</p>
            <p className="text-sm font-bold text-gray-900">{ad.clicks.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">CTR</p>
            <p className="text-sm font-bold text-gray-900">{ad.ctr.toFixed(2)}%</p>
          </div>
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {/* Campaign name */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500 truncate flex-1 mr-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="truncate">{ad.campaign.name}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onPreview}
              className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
              title="Preview ad"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={onShare}
              className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
              title="Share ad"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ad Preview Modal
function AdPreviewModal({
  ad,
  onClose,
}: {
  ad: Ad | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (ad) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [ad, onClose]);

  if (!ad) return null;

  const roasColor = ad.roas >= 3 ? "text-emerald-600" : ad.roas < 2 ? "text-red-600" : "text-gray-900";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Ad Creative */}
        <div className="w-1/2 bg-gray-100 relative">
          {ad.imageUrl ? (
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Platforms */}
          <div className="absolute top-4 right-4 flex gap-1">
            {ad.platforms.map((platform) => (
              <PlatformIcon key={platform} platform={platform} />
            ))}
          </div>

          {/* Status */}
          <div className="absolute bottom-4 right-4">
            <StatusBadge status={ad.status} roas={ad.roas} />
          </div>
        </div>

        {/* Right: Ad Details */}
        <div className="w-1/2 p-6 overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Title & Campaign */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{ad.title}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {ad.campaign.name}
            </div>
          </div>

          {/* Ad Copy */}
          <div className="space-y-4 mb-6">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Headline</h4>
              <p className="text-gray-900 font-medium">{ad.headline}</p>
            </div>
            {ad.primaryText && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Primary Text</h4>
                <p className="text-gray-700">{ad.primaryText}</p>
              </div>
            )}
            {ad.description && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</h4>
                <p className="text-gray-600 text-sm">{ad.description}</p>
              </div>
            )}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Call to Action</h4>
              <span className="inline-block px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg">
                {ad.cta}
              </span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="border-t border-gray-100 pt-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Performance</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">ROAS</p>
                <p className={`text-2xl font-bold ${roasColor}`}>{ad.roas.toFixed(1)}x</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${ad.revenue.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Clicks</p>
                <p className="text-2xl font-bold text-gray-900">{ad.clicks.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">CTR</p>
                <p className="text-2xl font-bold text-gray-900">{ad.ctr.toFixed(2)}%</p>
              </div>
            </div>
          </div>

          {/* Format & Strategy */}
          <div className="border-t border-gray-100 pt-6 mt-6">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Format:</span>
                <span className="font-medium text-gray-900 capitalize">{ad.format === 'static' ? 'Static Image' : 'Carousel'}</span>
              </div>
              {ad.creativeStrategy && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Strategy:</span>
                  <span className="font-medium text-gray-900 capitalize">{ad.creativeStrategy.replace('_', ' ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<AdsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewAd, setPreviewAd] = useState<Ad | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [sortBy, setSortBy] = useState("best");

  // Fetch ads
  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/ads");
        const result = await response.json();
        if (result.success) {
          setData(result);
        } else {
          setError(result.error || "Failed to fetch ads");
        }
      } catch (e) {
        setError("Failed to fetch ads");
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCampaign !== "all") count++;
    if (selectedPlatform !== "all") count++;
    if (selectedFormat !== "all") count++;
    return count;
  }, [selectedCampaign, selectedPlatform, selectedFormat]);

  // Filter and sort ads
  const filteredAds = useMemo(() => {
    if (!data?.ads) return [];

    let result = data.ads.filter((ad) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!ad.title.toLowerCase().includes(query)) return false;
      }

      // Tab filter (status)
      if (activeTab !== "all") {
        const statusMap: Record<string, string[]> = {
          ready: ["ready", "inbox"],
          processing: ["processing", "generating"],
          published: ["published", "live"],
          archived: ["archived"],
        };
        const validStatuses = statusMap[activeTab] || [];
        if (!validStatuses.includes(ad.status)) return false;
      }

      // Campaign filter
      if (selectedCampaign !== "all") {
        if (ad.campaign.id !== selectedCampaign) return false;
      }

      // Platform filter
      if (selectedPlatform !== "all") {
        if (!ad.platforms.includes(selectedPlatform)) return false;
      }

      // Format filter
      if (selectedFormat !== "all") {
        if (ad.format !== selectedFormat) return false;
      }

      return true;
    });

    // Sort
    switch (sortBy) {
      case "best":
        result.sort((a, b) => b.roas - a.roas);
        break;
      case "worst":
        result.sort((a, b) => a.roas - b.roas);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "roas-high":
        result.sort((a, b) => b.roas - a.roas);
        break;
      case "revenue-high":
        result.sort((a, b) => b.revenue - a.revenue);
        break;
    }

    return result;
  }, [data?.ads, searchQuery, activeTab, selectedCampaign, selectedPlatform, selectedFormat, sortBy]);

  // Max ROAS for performance bar scaling
  const maxRoas = useMemo(() => {
    if (!filteredAds.length) return 0;
    return Math.max(...filteredAds.map((ad) => ad.roas));
  }, [filteredAds]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setActiveTab("all");
    setSelectedCampaign("all");
    setSelectedPlatform("all");
    setSelectedFormat("all");
    setSortBy("best");
  };

  // Handle generate ads click
  const handleGenerateAds = () => {
    navigate("/products");
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between">
            <div>
              <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-48 bg-gray-200 rounded-xl"></div>
              <div className="h-10 w-24 bg-gray-200 rounded-xl"></div>
              <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4">
                <div className="aspect-[4/5] bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 rounded mb-4"></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Top Bar */}
      <div className="flex items-start justify-between mb-6">
        {/* Left: Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ads</h1>
          <p className="text-gray-500">Manage and review your AI-generated ad creatives</p>
        </div>

        {/* Right: Search, Filters, Generate */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
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
              placeholder="Search ads..."
              className="pl-10 pr-4 py-2.5 w-56 rounded-xl text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative px-4 py-2.5 rounded-xl text-sm font-medium border transition flex items-center gap-2 ${
              showFilters
                ? "bg-violet-50 border-violet-200 text-violet-700"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-violet-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Generate Ads Button */}
          <button
            onClick={handleGenerateAds}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition shadow-lg shadow-violet-500/25 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate ads
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center justify-between mb-6">
        {/* Left: Tabs */}
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === tab.value
                  ? "bg-violet-600 text-white"
                  : "bg-transparent text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Count */}
        <span className="text-sm text-gray-500">{filteredAds.length} ads</span>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex items-center gap-4">
          {/* Campaign */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Campaign</label>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All campaigns</option>
              {data?.campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-px h-8 bg-gray-200" />

          {/* Platform */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {PLATFORM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-px h-8 bg-gray-200" />

          {/* Format */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Format</label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-px h-8 bg-gray-200" />

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Clear All */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Ads Grid or Empty State */}
      {filteredAds.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No ads found</h3>
          <p className="text-gray-500 mb-6">
            Try adjusting your filters or generate new ads for your products
          </p>
          <div className="flex items-center justify-center gap-3">
            {(searchQuery || activeTab !== "all" || activeFilterCount > 0) && (
              <button
                onClick={clearAllFilters}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                Clear filters
              </button>
            )}
            <button
              onClick={handleGenerateAds}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition shadow-lg shadow-violet-500/25 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate ads
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAds.map((ad) => (
            <AdCard
              key={ad.id}
              ad={ad}
              maxRoas={maxRoas}
              onPreview={() => setPreviewAd(ad)}
              onShare={() => {
                // TODO: Open share options
                console.log("Share ad:", ad.id);
              }}
            />
          ))}
        </div>
      )}

      {/* Ad Preview Modal */}
      <AdPreviewModal ad={previewAd} onClose={() => setPreviewAd(null)} />
    </div>
  );
}
