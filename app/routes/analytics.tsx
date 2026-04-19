import { useState, useEffect, useMemo } from "react";

// Types
interface Product {
  id: string;
  title: string;
  productType?: string;
  imageUrl?: string;
}

interface FilteredData {
  revenue: number;
  spend: number;
  impressions: number;
  conversions: number;
  cpa: number;
  roas: number;
  ctr: number;
  clicks: number;
  dailyData: { day: string; value: number }[];
  platformData: {
    platform: string;
    spend: number;
    revenue: number;
    roas: number;
    percentage: number;
  }[];
  topAds: TopAd[];
}

interface TopAd {
  id: string;
  title: string;
  category: string;
  campaign: string;
  imageUrl: string;
  platforms: string[];
  status: string;
  roas: number;
  revenue: number;
  ctr: number;
  clicks: number;
  // MOCK: Replace with real ad detail API call GET /api/ads/:adId when available
  headline: string;
  description: string;
  cta: string;
  dailyBudget: string;
  revenueHistory: number[];
}

// MOCK: Replace with real analytics API data when available
// Seeded mock data generator for consistent values
function seedRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
}

// MOCK: Replace with real analytics API data filtered by filter type when available
function getMockDataForFilters(
  activeProduct: string,
  activeCategory: string,
  activePlatform: string,
  timeRange: string,
  products: Product[]
): FilteredData {
  // Create seed from filter state
  const seed = `${activeProduct}-${activeCategory}-${activePlatform}-${timeRange}`;
  const random = seedRandom(seed);

  // Base values that change based on filters
  let baseRevenue = 6240;
  let baseImpressions = 79200;
  let baseConversions = 146;
  let baseCpa = 8.22;
  let baseRoas = 5.2;

  // Adjust based on product filter
  if (activeProduct) {
    const product = products.find(p => p.id === activeProduct);
    if (product?.title.includes("Classic Men's Shirt")) {
      baseRevenue = 1840;
      baseImpressions = 22400;
      baseConversions = 38;
      baseCpa = 7.10;
      baseRoas = 4.9;
    } else if (product?.title.includes("Jacquard") || product?.title.includes("Overshirt")) {
      baseRevenue = 2100;
      baseImpressions = 18600;
      baseConversions = 42;
      baseCpa = 9.20;
      baseRoas = 5.1;
    } else {
      // Generic product adjustment
      baseRevenue = Math.floor(800 + random() * 2000);
      baseImpressions = Math.floor(10000 + random() * 30000);
      baseConversions = Math.floor(20 + random() * 60);
      baseCpa = 6 + random() * 5;
      baseRoas = 3.5 + random() * 2.5;
    }
  }

  // Adjust based on category filter
  if (activeCategory) {
    if (activeCategory.toLowerCase().includes("shirt")) {
      baseRevenue = 2840;
      baseImpressions = 34200;
      baseConversions = 58;
      baseCpa = 7.80;
      baseRoas = 4.6;
    } else if (activeCategory.toLowerCase().includes("jacket")) {
      baseRevenue = 3100;
      baseImpressions = 28400;
      baseConversions = 62;
      baseCpa = 9.80;
      baseRoas = 4.2;
    } else {
      baseRevenue = Math.floor(1500 + random() * 2500);
      baseImpressions = Math.floor(20000 + random() * 25000);
      baseConversions = Math.floor(35 + random() * 50);
      baseCpa = 7 + random() * 4;
      baseRoas = 3.8 + random() * 2;
    }
  }

  // Adjust based on platform filter
  if (activePlatform) {
    if (activePlatform === "tiktok") {
      baseRevenue = 6480;
      baseImpressions = 42000;
      baseConversions = 82;
      baseCpa = 7.40;
      baseRoas = 5.4;
    } else if (activePlatform === "instagram") {
      baseRevenue = 4200;
      baseImpressions = 31000;
      baseConversions = 56;
      baseCpa = 8.90;
      baseRoas = 4.7;
    } else if (activePlatform === "facebook") {
      baseRevenue = 3800;
      baseImpressions = 28000;
      baseConversions = 48;
      baseCpa = 9.20;
      baseRoas = 4.1;
    }
  }

  // Adjust based on time range
  const timeMultiplier = timeRange === "7" ? 0.25 : timeRange === "90" ? 3.2 : 1;
  baseRevenue = Math.floor(baseRevenue * timeMultiplier);
  baseImpressions = Math.floor(baseImpressions * timeMultiplier);
  baseConversions = Math.floor(baseConversions * timeMultiplier);

  const spend = Math.floor(baseRevenue / baseRoas);
  const ctr = (baseConversions / baseImpressions) * 100 * (8 + random() * 4);
  const clicks = Math.floor(baseImpressions * (ctr / 100));

  // Generate daily data
  const days = timeRange === "7" ? 7 : timeRange === "90" ? 14 : 7;
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dailyData = Array.from({ length: days }, (_, i) => ({
    day: dayLabels[i % 7],
    value: Math.floor((baseRevenue / days) * (0.6 + random() * 0.8)),
  })).slice(0, 7);

  // Platform breakdown
  const platforms = [
    { platform: "tiktok", color: "#000000" },
    { platform: "instagram", color: "#E4405F" },
    { platform: "facebook", color: "#1877F2" },
  ];

  const platformData = platforms.map((p, i) => {
    const pRoas = 3.5 + random() * 3;
    const pRevenue = Math.floor(baseRevenue * (0.2 + random() * 0.4));
    const pSpend = Math.floor(pRevenue / pRoas);
    return {
      platform: p.platform,
      spend: pSpend,
      revenue: pRevenue,
      roas: Math.round(pRoas * 10) / 10,
      percentage: 0,
    };
  });

  // Calculate percentages relative to best
  const maxRevenue = Math.max(...platformData.map(p => p.revenue));
  platformData.forEach(p => {
    p.percentage = Math.round((p.revenue / maxRevenue) * 100);
  });

  // Sort by revenue descending
  platformData.sort((a, b) => b.revenue - a.revenue);

  // Top performing ads
  const adTitles = [
    "Summer Collection Feature",
    "New Arrival Spotlight",
    "Best Seller Showcase",
  ];
  const campaigns = ["Summer Sale 2024", "New Arrivals", "Brand Awareness"];
  const categories = activeCategory || "Apparel";
  const headlines = [
    "Stay warm, stay stylish this season",
    "Discover your new favorite look",
    "Premium quality. Unbeatable value.",
  ];
  const descriptions = [
    "Premium quality. Perfect for any occasion.",
    "Shop the latest trends before they sell out.",
    "Crafted with care. Built to last.",
  ];
  const ctas = ["Shop now", "Learn more", "Get yours"];
  const budgets = ["$85 / day", "$120 / day", "$65 / day"];

  const topAds: TopAd[] = adTitles.map((title, i) => {
    const adRoas = 4 + random() * 3;
    const adRevenue = Math.floor(800 + random() * 2000);
    const adCtr = Math.round((2 + random() * 4) * 100) / 100;
    // Generate 7 days of revenue history for sparkline
    const revenueHistory = Array.from({ length: 7 }, () =>
      Math.floor((adRevenue / 7) * (0.5 + random() * 1))
    );
    return {
      id: `ad_${seed}_${i}`,
      title: activeProduct
        ? products.find(p => p.id === activeProduct)?.title || title
        : title,
      category: categories,
      campaign: campaigns[i % campaigns.length],
      imageUrl: products[i]?.imageUrl || `https://picsum.photos/seed/${seed}${i}/400/500`,
      platforms: i === 0 ? ["tiktok", "instagram", "facebook"] :
                 i === 1 ? ["tiktok", "instagram"] : ["facebook"],
      status: "live",
      roas: Math.round(adRoas * 10) / 10,
      revenue: adRevenue,
      ctr: adCtr,
      clicks: Math.floor(adRevenue * (0.8 + random() * 0.4)),
      // MOCK: Replace with real ad detail API call GET /api/ads/:adId when available
      headline: headlines[i],
      description: descriptions[i],
      cta: ctas[i],
      dailyBudget: budgets[i],
      revenueHistory,
    };
  });

  // Sort by ROAS descending
  topAds.sort((a, b) => b.roas - a.roas);

  return {
    revenue: baseRevenue,
    spend,
    impressions: baseImpressions,
    conversions: baseConversions,
    cpa: Math.round(baseCpa * 100) / 100,
    roas: Math.round(baseRoas * 10) / 10,
    ctr: Math.round(ctr * 100) / 100,
    clicks,
    dailyData,
    platformData,
    topAds,
  };
}

// Ad Report Slide-over Panel
function AdReportPanel({
  ad,
  isOpen,
  onClose,
  rank,
}: {
  ad: TopAd | null;
  isOpen: boolean;
  onClose: () => void;
  rank: number;
}) {
  const [isClosing, setIsClosing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !ad) return null;

  const maxRevenue = Math.max(...ad.revenueHistory);
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Generate sparkline path
  const sparklinePath = () => {
    const width = 100;
    const height = 60;
    const padding = 4;
    const points = ad.revenueHistory.map((val, i) => {
      const x = padding + (i / (ad.revenueHistory.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val / maxRevenue) * (height - padding * 2));
      return { x, y };
    });

    // Create smooth bezier curve
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return path;
  };

  // Create fill path for gradient
  const fillPath = () => {
    const width = 100;
    const height = 60;
    const basePath = sparklinePath();
    return `${basePath} L 96 60 L 4 60 Z`;
  };

  // Platform icon component
  const PlatformIcon = ({ platform, size = 20 }: { platform: string; size?: number }) => {
    if (platform === "tiktok") {
      return (
        <div
          className="rounded flex items-center justify-center text-white"
          style={{ width: size, height: size, backgroundColor: "#000000" }}
        >
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        </div>
      );
    }
    if (platform === "instagram") {
      return (
        <div
          className="rounded flex items-center justify-center text-white"
          style={{
            width: size,
            height: size,
            background: "linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)"
          }}
        >
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </div>
      );
    }
    if (platform === "facebook") {
      return (
        <div
          className="rounded flex items-center justify-center text-white"
          style={{ width: size, height: size, backgroundColor: "#1877F2" }}
        >
          <svg width={size * 0.5} height={size * 0.6} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
      );
    }
    return null;
  };

  // Toast for share
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href + `/ads/${ad.id}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col transition-all duration-200 ease-out ${
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Ad preview & performance</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[320px]">{ad.title}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* SECTION 1 — Ad Creative Preview */}
          <div>
            <div className="relative aspect-[4/5] rounded-[10px] overflow-hidden bg-gray-100">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${ad.id}/400/500`;
                }}
              />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                Static image
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                ad.status === "live"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {ad.status === "live" ? "Live" : "Draft"}
              </span>
              <div className="flex items-center gap-1 ml-auto">
                {ad.platforms.map((platform) => (
                  <PlatformIcon key={platform} platform={platform} size={20} />
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2 — Performance Stats */}
          <div>
            <h3 className="text-[13px] font-bold text-gray-900 mb-3">Performance</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 mb-1">ROAS</div>
                <div className={`text-base font-bold ${
                  ad.roas >= 3 ? "text-emerald-600" : ad.roas < 2 ? "text-red-600" : "text-gray-900"
                }`}>
                  {ad.roas}x
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[10px] text-emerald-600">+12%</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 mb-1">Revenue</div>
                <div className="text-base font-bold text-gray-900">
                  ${ad.revenue.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[10px] text-emerald-600">+8%</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 mb-1">Clicks</div>
                <div className="text-base font-bold text-gray-900">
                  {ad.clicks.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[10px] text-emerald-600">+15%</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-[10px] text-gray-500 mb-1">CTR</div>
                <div className="text-base font-bold text-gray-900">
                  {ad.ctr}%
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-red-500 rotate-180" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[10px] text-red-600">-3%</span>
                </div>
              </div>
            </div>

            {/* Performance bar */}
            <div className="mt-3">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-600 rounded-full"
                  style={{ width: `${Math.min(ad.roas / 7 * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-gray-500">Performance score</span>
                <span className="text-[10px] text-violet-600 font-medium">#{rank} this period</span>
              </div>
            </div>
          </div>

          {/* SECTION 3 — Sparkline Chart */}
          <div>
            <h3 className="text-[13px] font-bold text-gray-900 mb-3">Revenue over time</h3>
            <div className="h-[80px] relative">
              <svg viewBox="0 0 100 60" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={fillPath()}
                  fill="url(#sparklineGradient)"
                />
                <path
                  d={sparklinePath()}
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
            <div className="flex justify-between mt-1">
              {dayLabels.map((day) => (
                <span key={day} className="text-[10px] text-gray-400">{day}</span>
              ))}
            </div>
          </div>

          {/* SECTION 4 — Ad Details */}
          <div>
            <h3 className="text-[13px] font-bold text-gray-900 mb-3">Ad details</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <div className="text-[9px] uppercase text-gray-400 tracking-wide">Headline</div>
                <div className="text-xs text-gray-900 mt-0.5">{ad.headline}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase text-gray-400 tracking-wide">Description</div>
                <div className="text-xs text-gray-900 mt-0.5">{ad.description}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase text-gray-400 tracking-wide">CTA</div>
                <div className="text-xs text-gray-900 mt-0.5">{ad.cta}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase text-gray-400 tracking-wide">Platform</div>
                <div className="text-xs text-gray-900 mt-0.5 capitalize">{ad.platforms.join(", ")}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase text-gray-400 tracking-wide">Campaign</div>
                <div className="text-xs text-gray-900 mt-0.5">{ad.campaign}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase text-gray-400 tracking-wide">Daily budget</div>
                <div className="text-xs text-gray-900 mt-0.5">{ad.dailyBudget}</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5 — Actions */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <a
            href={`/ads/${ad.id}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition"
          >
            View full ad page →
          </a>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            Share ad report
          </button>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[60] px-4 py-3 bg-gray-900 text-white rounded-xl shadow-lg text-sm animate-slide-up">
          Link copied to clipboard
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

export default function AnalyticsPage() {
  // Filter panel state
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activePlatform, setActivePlatform] = useState("");
  const [activeStatus, setActiveStatus] = useState("");
  const [timeRange, setTimeRange] = useState("30");
  const [activeMetric, setActiveMetric] = useState("revenue");

  // Ad report panel state
  const [selectedAd, setSelectedAd] = useState<TopAd | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedAdRank, setSelectedAdRank] = useState(1);

  const openPanel = (ad: TopAd, rank: number) => {
    setSelectedAd(ad);
    setSelectedAdRank(rank);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedAd(null), 150);
  };

  // Products data
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (response.ok) {
          const data = await response.json();
          if (data.products) {
            setProducts(data.products);
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Get unique categories (productTypes)
  const categories = useMemo(() => {
    const types = new Set(products.map(p => p.productType).filter(Boolean));
    return Array.from(types) as string[];
  }, [products]);

  // Active filter count for badge
  const filterCount = useMemo(() => {
    return [activeProduct, activeCategory, activePlatform, activeStatus].filter(Boolean).length;
  }, [activeProduct, activeCategory, activePlatform, activeStatus]);

  // Filtered data based on current filters
  const filteredData = useMemo(() => {
    return getMockDataForFilters(
      activeProduct,
      activeCategory,
      activePlatform,
      timeRange,
      products
    );
  }, [activeProduct, activeCategory, activePlatform, timeRange, products]);

  // Handle product filter (clears category)
  const handleProductChange = (productId: string) => {
    setActiveProduct(productId);
    if (productId) setActiveCategory("");
  };

  // Handle category filter (clears product)
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (category) setActiveProduct("");
  };

  // Clear all filters
  const clearAllFilters = () => {
    setActiveProduct("");
    setActiveCategory("");
    setActivePlatform("");
    setActiveStatus("");
  };

  // Get filter label for display
  const getFilterLabel = (type: string, value: string): string => {
    if (type === "product") {
      return products.find(p => p.id === value)?.title || value;
    }
    if (type === "platform") {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    return value;
  };

  // Get subtitle text based on filters
  const getSubtitleText = (): string => {
    const parts: string[] = [];
    if (activeProduct) {
      const product = products.find(p => p.id === activeProduct);
      parts.push(product?.title || "Selected product");
    } else if (activeCategory) {
      parts.push(activeCategory);
    } else {
      parts.push("All products");
    }
    parts.push(`Last ${timeRange} days`);
    return parts.join(" · ");
  };

  // ROAS status
  const getRoasStatus = (roas: number) => {
    if (roas >= 4) return {
      bg: "bg-violet-50",
      border: "border-violet-200",
      title: "Great performance this period",
      icon: "text-violet-600"
    };
    if (roas >= 2) return {
      bg: "bg-blue-50",
      border: "border-blue-200",
      title: "Profitable performance this period",
      icon: "text-blue-600"
    };
    return {
      bg: "bg-amber-50",
      border: "border-amber-200",
      title: "Performance needs attention",
      icon: "text-amber-600"
    };
  };

  const roasStatus = getRoasStatus(filteredData.roas);

  // Chart metric data based on active metric
  const getChartData = () => {
    const multipliers: Record<string, number> = {
      revenue: 1,
      clicks: 0.1,
      sales: 0.02,
      roas: 0.8,
    };
    return filteredData.dailyData.map(d => ({
      ...d,
      value: Math.floor(d.value * (multipliers[activeMetric] || 1)),
    }));
  };

  const chartData = getChartData();
  const maxChartValue = Math.max(...chartData.map(d => d.value));
  const chartTotal = chartData.reduce((sum, d) => sum + d.value, 0);
  const bestDay = chartData.reduce((best, d) => d.value > best.value ? d : best, chartData[0]);

  // Platform colors
  const platformColors: Record<string, string> = {
    tiktok: "#000000",
    instagram: "#E4405F",
    facebook: "#1877F2",
  };

  // Platform icons
  const PlatformIcon = ({ platform, size = 28 }: { platform: string; size?: number }) => {
    if (platform === "tiktok") {
      return (
        <div
          className="rounded-lg flex items-center justify-center text-white font-bold"
          style={{ width: size, height: size, backgroundColor: "#000000" }}
        >
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        </div>
      );
    }
    if (platform === "instagram") {
      return (
        <div
          className="rounded-lg flex items-center justify-center text-white"
          style={{
            width: size,
            height: size,
            background: "linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)"
          }}
        >
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </div>
      );
    }
    if (platform === "facebook") {
      return (
        <div
          className="rounded-lg flex items-center justify-center text-white font-bold"
          style={{ width: size, height: size, backgroundColor: "#1877F2" }}
        >
          <svg width={size * 0.5} height={size * 0.6} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* TOP BAR */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">How your ads are performing</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filters Button */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${
              filterOpen
                ? "bg-violet-50 border-violet-200 text-violet-700"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-medium text-sm">Filters</span>
            {filterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>

          {/* Time Range Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {[
              { value: "7", label: "7 days" },
              { value: "30", label: "30 days" },
              { value: "90", label: "90 days" },
            ].map((period) => (
              <button
                key={period.value}
                onClick={() => setTimeRange(period.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  timeRange === period.value
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FILTER PANEL */}
      {filterOpen && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Product Dropdown */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
              <select
                value={activeProduct}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">All products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Divider */}
            {categories.length >= 2 && (
              <>
                <div className="h-10 w-px bg-gray-200" />

                {/* Category Dropdown */}
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                  <select
                    value={activeCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">All categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Divider */}
            <div className="h-10 w-px bg-gray-200" />

            {/* Platform Dropdown */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Platform</label>
              <select
                value={activePlatform}
                onChange={(e) => setActivePlatform(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">All platforms</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>

            {/* Divider */}
            <div className="h-10 w-px bg-gray-200" />

            {/* Status Dropdown */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={activeStatus}
                onChange={(e) => setActiveStatus(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">All</option>
                <option value="active">Active only</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Clear All */}
            {filterCount > 0 && (
              <>
                <div className="h-10 w-px bg-gray-200" />
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium whitespace-nowrap"
                >
                  Clear all
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ACTIVE FILTER BAR */}
      {filterCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 border border-violet-200 rounded-xl mb-6">
          <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm text-violet-700">Showing data for:</span>
          <div className="flex items-center gap-2 flex-1">
            {activeProduct && (
              <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                {getFilterLabel("product", activeProduct)}
              </span>
            )}
            {activeCategory && (
              <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                {activeCategory}
              </span>
            )}
            {activePlatform && (
              <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                {getFilterLabel("platform", activePlatform)}
              </span>
            )}
            {activeStatus && (
              <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                {activeStatus === "active" ? "Active only" : "Completed"}
              </span>
            )}
          </div>
          <button
            onClick={clearAllFilters}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            Clear all →
          </button>
        </div>
      )}

      {/* SECTION 1 — HERO STAT CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Card 1 - Revenue (Accent) */}
        <div className="bg-violet-600 rounded-2xl p-5 text-white">
          <div className="text-violet-200 text-sm mb-1">Money made from ads</div>
          <div className="text-3xl font-bold mb-1">
            ${filteredData.revenue.toLocaleString()}
          </div>
          <div className="text-violet-200 text-sm mb-2">
            You spent ${filteredData.spend.toLocaleString()} on ads
          </div>
          <span className="inline-flex px-2 py-1 bg-white/20 rounded-full text-sm font-medium">
            +${(filteredData.revenue - filteredData.spend).toLocaleString()} profit
          </span>
        </div>

        {/* Card 2 - Impressions */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="text-gray-500 text-sm mb-1">People who saw your ads</div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {filteredData.impressions.toLocaleString()}
          </div>
          <div className="text-gray-400 text-sm mb-2">
            Times your ads appeared on screen
          </div>
          <span className="inline-flex px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium">
            +12% vs last period
          </span>
        </div>

        {/* Card 3 - Conversions */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="text-gray-500 text-sm mb-1">People who bought</div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {filteredData.conversions.toLocaleString()}
          </div>
          <div className="text-gray-400 text-sm mb-2">
            Made a purchase from your ads
          </div>
          <span className="inline-flex px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium">
            +8% vs last period
          </span>
        </div>

        {/* Card 4 - CPA */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="text-gray-500 text-sm mb-1">Cost per sale</div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            ${filteredData.cpa.toFixed(2)}
          </div>
          <div className="text-gray-400 text-sm mb-2">
            What each customer costs
          </div>
          <span className="inline-flex px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium">
            -5% cheaper than before
          </span>
        </div>
      </div>

      {/* SECTION 2 — ROAS BANNER */}
      <div className={`${roasStatus.bg} ${roasStatus.border} border rounded-xl p-4 mb-6 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center ${roasStatus.icon}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{roasStatus.title}</div>
            <div className="text-sm text-gray-600">
              For every $1 spent on ads, you're making ${filteredData.roas.toFixed(1)} back
              {activeProduct || activeCategory ? ` on ${activeProduct ? getFilterLabel("product", activeProduct) : activeCategory}` : ""}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-violet-600">{filteredData.roas}x</div>
          <div className="text-sm text-gray-500">Return on ad spend</div>
        </div>
      </div>

      {/* SECTION 3 — TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-5 gap-6 mb-6">
        {/* LEFT COLUMN - Daily Performance (3fr) */}
        <div className="col-span-3 bg-white rounded-2xl border border-gray-100 p-6 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Daily performance</h3>
              <p className="text-sm text-gray-500">{getSubtitleText()}</p>
            </div>
            <div className="flex bg-gray-50 rounded-lg p-1">
              {["revenue", "clicks", "sales", "roas"].map((metric) => (
                <button
                  key={metric}
                  onClick={() => setActiveMetric(metric)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition ${
                    activeMetric === metric
                      ? "bg-violet-50 text-violet-700 border border-violet-200"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          {(() => {
            // MOCK: Replace with real analytics API data when available
            const revenueData = [
              { day: "Mon", value: 935 },
              { day: "Tue", value: 853 },
              { day: "Wed", value: 1199 },
              { day: "Thu", value: 579 },
              { day: "Fri", value: 1138 },
              { day: "Sat", value: 967 },
              { day: "Sun", value: 1133 },
            ];
            const maxValue = Math.max(...revenueData.map(d => d.value));

            return (
              <div className="flex-1 min-h-[200px] flex items-end justify-between gap-3 mb-4">
                {revenueData.map((d, i) => {
                  const height = (d.value / maxValue) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <span className="text-[11px] text-gray-400 mb-1">
                        ${d.value.toLocaleString()}
                      </span>
                      <div
                        className="w-full"
                        style={{
                          height: `${height}%`,
                          backgroundColor: "rgba(124, 58, 237, 0.85)",
                          borderRadius: "6px 6px 0 0",
                        }}
                      />
                      <span className="text-[11px] text-gray-400 mt-2">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Chart Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-violet-600" />
              <span className="text-gray-600">
                Weekly total: ${chartTotal.toLocaleString()} · Best day: {bestDay.day} — ${bestDay.value.toLocaleString()}
              </span>
            </div>
            <button className="text-sm text-violet-600 hover:text-violet-700 font-medium">
              View detailed report →
            </button>
          </div>

          {/* 4-column Stat Row */}
          <div className="grid grid-cols-4 gap-3 mt-3">
            <div className="text-center">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="text-lg font-bold text-gray-900">{(filteredData.impressions / 1000).toFixed(1)}k</div>
              <div className="text-[10px] text-gray-500">Store visits</div>
            </div>

            <div className="text-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="text-lg font-bold text-gray-900">{filteredData.conversions}</div>
              <div className="text-[10px] text-gray-500">Orders placed</div>
            </div>

            <div className="text-center">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <div className="text-lg font-bold text-gray-900">{filteredData.ctr.toFixed(1)}%</div>
              <div className="text-[10px] text-gray-500">Click through rate</div>
            </div>

            <div className="text-center">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-lg font-bold text-gray-900">${filteredData.cpa.toFixed(2)}</div>
              <div className="text-[10px] text-gray-500">Cost per sale</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (2fr) */}
        <div className="col-span-2 flex flex-col gap-6">
          {/* Platform Breakdown Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Platform breakdown</h3>
                <p className="text-sm text-gray-500">Performance by ad platform</p>
              </div>
              <span className="text-sm text-emerald-600 font-medium">All profitable →</span>
            </div>

            <div className="space-y-4">
              {filteredData.platformData.map((platform) => (
                <div key={platform.platform} className="flex items-center gap-3">
                  <PlatformIcon platform={platform.platform} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 capitalize">{platform.platform}</span>
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-xs font-medium">
                        +{Math.floor(10 + platform.roas * 3)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${platform.percentage}%`,
                          backgroundColor: platformColors[platform.platform],
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-400">
                      ${platform.spend.toLocaleString()} spent · ${platform.revenue.toLocaleString()} revenue
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{platform.roas}x</div>
                    <div className="text-[9px] text-gray-400">ROAS</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">What this means for you</h3>
                <p className="text-sm text-gray-500">AI-generated insights</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  Your ads are generating a <span className="font-medium text-gray-900">{filteredData.roas}x return</span> — for every $1 spent, you're making ${filteredData.roas.toFixed(2)} back
                  {activeProduct ? ` on ${getFilterLabel("product", activeProduct)}` : activeCategory ? ` in ${activeCategory}` : ""}.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  Consider increasing your daily budget by 20% to capture more of this profitable traffic.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  Your click-through rate is <span className="font-medium text-gray-900">{filteredData.ctr.toFixed(1)}%</span> — {filteredData.ctr > 3 ? "above" : "slightly below"} industry average.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900 capitalize">{filteredData.platformData[0]?.platform || "TikTok"}</span> is your best performer with {filteredData.platformData[0]?.roas || 5.2}x ROAS — consider shifting more budget there.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4 — TOP PERFORMING ADS */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900">Top performing ads</h3>
            <p className="text-sm text-gray-500">
              {activeProduct || activeCategory
                ? `${activeProduct ? getFilterLabel("product", activeProduct) : activeCategory} · Best ROAS this period`
                : "Your best ads this period"}
            </p>
          </div>
          <a
            href="/ads"
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            View all ads →
          </a>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {filteredData.topAds.map((ad, index) => {
            const maxRoas = Math.max(...filteredData.topAds.map(a => a.roas));
            const roasPercentage = (ad.roas / maxRoas) * 100;

            return (
              <div key={ad.id} className="bg-gray-50 rounded-xl overflow-hidden">
                {/* Image Area */}
                <div className="relative aspect-[4/5] bg-gray-200">
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${ad.id}/400/500`;
                    }}
                  />

                  {/* Rank Badge */}
                  <div
                    className={`absolute top-3 left-3 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? "bg-yellow-100 text-yellow-800"
                        : index === 1
                        ? "bg-slate-100 text-slate-600"
                        : "bg-pink-100 text-pink-800"
                    }`}
                  >
                    #{index + 1}
                  </div>

                  {/* Platform Icons */}
                  <div className="absolute top-3 right-3 flex gap-1">
                    {ad.platforms.map((platform) => (
                      <PlatformIcon key={platform} platform={platform} size={24} />
                    ))}
                  </div>

                  {/* Status Badge */}
                  <div className="absolute bottom-3 right-3">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-medium capitalize">
                      {ad.status}
                    </span>
                  </div>
                </div>

                {/* Ad Info */}
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 truncate mb-1">{ad.title}</h4>
                  <p className="text-[10px] text-gray-400 mb-3">
                    {ad.category} · {ad.campaign}
                  </p>

                  {/* Performance Bar */}
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-violet-600 rounded-full"
                      style={{ width: `${roasPercentage}%` }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className={`text-sm font-bold ${ad.roas >= 3 ? "text-emerald-600" : "text-gray-900"}`}>
                        {ad.roas}x
                      </div>
                      <div className="text-[10px] text-gray-400">ROAS</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        ${ad.revenue.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-400">Revenue</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {ad.ctr}%
                      </div>
                      <div className="text-[10px] text-gray-400">CTR</div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">{ad.campaign}</span>
                  <button
                    onClick={() => openPanel(ad, index + 1)}
                    className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                  >
                    View report →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ad Report Slide-over Panel */}
      <AdReportPanel
        ad={selectedAd}
        isOpen={panelOpen}
        onClose={closePanel}
        rank={selectedAdRank}
      />
    </div>
  );
}
