import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";

// Types
interface Product {
  id: string;
  title: string;
  productType?: string;
  imageUrl?: string;
}

interface Ad {
  id: string;
  title: string;
  headline: string;
  campaign: { id: string; name: string };
}

interface Campaign {
  id: string;
  name: string;
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

// MOCK: Structured mock data by platform - Replace with real API data when available
const mockData = {
  platforms: {
    tiktok: {
      spend: 1200,
      revenue: 6480,
      roas: 5.4,
      clicks: 12400,
      conversions: 82,
      ctr: 4.8,
      impressions: 42000,
      cpa: 7.40,
      badge: '+12%',
      dailyRevenue: [935, 853, 1199, 579, 1138, 967, 1133],
      ads: [
        {
          id: 'ad_tiktok_1',
          title: "Classic Men's Shirt — Organic",
          category: 'Shirts',
          campaign: 'Summer 2026',
          roas: 5.2,
          revenue: 983,
          ctr: 4.8,
          clicks: 2847,
          platform: 'tiktok',
          imageUrl: 'https://picsum.photos/seed/tiktok1/400/500',
          platforms: ['tiktok'],
          status: 'live',
          headline: "Stay warm, stay stylish this season",
          description: "Premium quality. Perfect for any occasion.",
          cta: "Shop now",
          dailyBudget: "$85 / day",
          revenueHistory: [120, 145, 180, 130, 160, 140, 108],
        },
        {
          id: 'ad_tiktok_2',
          title: "Grey Jacquard Overshirt",
          category: 'Jackets',
          campaign: 'New Arrivals',
          roas: 4.1,
          revenue: 720,
          ctr: 3.6,
          clicks: 1923,
          platform: 'tiktok',
          imageUrl: 'https://picsum.photos/seed/tiktok2/400/500',
          platforms: ['tiktok'],
          status: 'live',
          headline: "Discover your new favorite look",
          description: "Shop the latest trends before they sell out.",
          cta: "Learn more",
          dailyBudget: "$65 / day",
          revenueHistory: [95, 110, 125, 90, 105, 100, 95],
        },
      ],
    },
    instagram: {
      spend: 980,
      revenue: 4704,
      roas: 4.8,
      clicks: 9200,
      conversions: 58,
      ctr: 3.9,
      impressions: 28000,
      cpa: 9.20,
      badge: '+8%',
      dailyRevenue: [620, 580, 710, 490, 680, 640, 590],
      ads: [
        {
          id: 'ad_instagram_1',
          title: "Women's Jacquard Overshirt",
          category: 'Jackets',
          campaign: "Mother's Day",
          roas: 4.7,
          revenue: 1183,
          ctr: 3.9,
          clicks: 2156,
          platform: 'instagram',
          imageUrl: 'https://picsum.photos/seed/insta1/400/500',
          platforms: ['instagram'],
          status: 'live',
          headline: "Elevate your everyday style",
          description: "Crafted with care. Built to last.",
          cta: "Shop now",
          dailyBudget: "$120 / day",
          revenueHistory: [150, 175, 200, 160, 185, 170, 143],
        },
        {
          id: 'ad_instagram_2',
          title: "Rings Diamond Collection",
          category: 'Accessories',
          campaign: "Mother's Day",
          roas: 4.2,
          revenue: 890,
          ctr: 3.2,
          clicks: 1645,
          platform: 'instagram',
          imageUrl: 'https://picsum.photos/seed/insta2/400/500',
          platforms: ['instagram'],
          status: 'live',
          headline: "Make every moment sparkle",
          description: "Premium quality. Unbeatable value.",
          cta: "Get yours",
          dailyBudget: "$95 / day",
          revenueHistory: [110, 130, 145, 115, 135, 125, 130],
        },
      ],
    },
    facebook: {
      spend: 1520,
      revenue: 6384,
      roas: 4.2,
      clicks: 11100,
      conversions: 62,
      ctr: 4.2,
      impressions: 38000,
      cpa: 11.40,
      badge: '+5%',
      dailyRevenue: [880, 790, 1020, 710, 980, 940, 790],
      ads: [
        {
          id: 'ad_facebook_1',
          title: "Men's 2-Way Zipper Jacket",
          category: 'Jackets',
          campaign: 'Summer 2026',
          roas: 4.2,
          revenue: 890,
          ctr: 3.2,
          clicks: 1834,
          platform: 'facebook',
          imageUrl: 'https://picsum.photos/seed/fb1/400/500',
          platforms: ['facebook'],
          status: 'live',
          headline: "Adventure awaits",
          description: "Built for the bold. Made to last.",
          cta: "Shop now",
          dailyBudget: "$110 / day",
          revenueHistory: [115, 135, 150, 120, 140, 130, 100],
        },
        {
          id: 'ad_facebook_2',
          title: "Oversized Women's Shirt",
          category: 'Shirts',
          campaign: 'New Arrivals',
          roas: 3.1,
          revenue: 480,
          ctr: 2.4,
          clicks: 1256,
          platform: 'facebook',
          imageUrl: 'https://picsum.photos/seed/fb2/400/500',
          platforms: ['facebook'],
          status: 'live',
          headline: "Comfort meets style",
          description: "Your new everyday essential.",
          cta: "Learn more",
          dailyBudget: "$55 / day",
          revenueHistory: [60, 75, 85, 65, 70, 68, 57],
        },
      ],
    },
  },
  categories: {
    Shirts: { platforms: ['tiktok', 'facebook'] },
    Jackets: { platforms: ['tiktok', 'instagram', 'facebook'] },
    Accessories: { platforms: ['instagram'] },
  },
  campaigns: {
    'Summer 2026': { platforms: ['tiktok', 'facebook'] },
    'New Arrivals': { platforms: ['tiktok', 'facebook'] },
    "Mother's Day": { platforms: ['instagram'] },
  },
};

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

          {/* SECTION 5 — AI Insights */}
          <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-violet-200 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-violet-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-[13px] font-bold text-violet-900">Why this ad is working</h3>
            </div>
            <div className="space-y-2.5">
              {/* MOCK: Replace with real AI-generated insights from API when available */}
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                <p className="text-xs text-violet-800 leading-relaxed">
                  <span className="font-medium">Strong visual appeal</span> — The product image stands out in feeds with clear, high-contrast visuals that stop scrollers.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                <p className="text-xs text-violet-800 leading-relaxed">
                  <span className="font-medium">Compelling headline</span> — "{ad.headline}" creates urgency and speaks directly to customer desires.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                <p className="text-xs text-violet-800 leading-relaxed">
                  <span className="font-medium">Right audience targeting</span> — This ad resonates with {ad.platforms.length > 1 ? `${ad.platforms.slice(0, -1).join(", ")} and ${ad.platforms.slice(-1)}` : ad.platforms[0]} users who are {ad.roas >= 4 ? "highly" : "actively"} engaged with similar products.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                <p className="text-xs text-violet-800 leading-relaxed">
                  <span className="font-medium">{ad.roas >= 4 ? "Excellent" : ad.roas >= 3 ? "Strong" : "Good"} conversion rate</span> — At {ad.ctr}% CTR and {ad.roas}x ROAS, this ad converts browsers into buyers {ad.roas >= 4 ? "exceptionally well" : "effectively"}.
                </p>
              </div>
              {ad.roas >= 4 && (
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    <span className="font-medium">Top performer</span> — Consider increasing budget by 20-30% to scale this winning ad.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 6 — Actions */}
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

// Detailed Report Modal Component
function DetailedReportModal({
  isOpen,
  onClose,
  data,
  timeRange,
  activeMetric,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: FilteredData;
  timeRange: string;
  activeMetric: string;
}) {
  const [isClosing, setIsClosing] = useState(false);

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

  // Prevent body scroll when modal is open
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

  if (!isOpen) return null;

  const timeRangeLabel = timeRange === "7" ? "7 days" : timeRange === "90" ? "90 days" : "30 days";
  const profit = data.revenue - data.spend;
  const profitMargin = data.spend > 0 ? ((profit / data.revenue) * 100).toFixed(1) : "0";

  // MOCK: Daily breakdown data - Replace with real API data when available
  const dailyBreakdown = [
    { day: "Monday", revenue: 935, spend: 180, roas: 5.2, conversions: 21, clicks: 342 },
    { day: "Tuesday", revenue: 853, spend: 165, roas: 5.2, conversions: 19, clicks: 289 },
    { day: "Wednesday", revenue: 1199, spend: 220, roas: 5.5, conversions: 28, clicks: 456 },
    { day: "Thursday", revenue: 579, spend: 145, roas: 4.0, conversions: 13, clicks: 198 },
    { day: "Friday", revenue: 1138, spend: 195, roas: 5.8, conversions: 26, clicks: 412 },
    { day: "Saturday", revenue: 967, spend: 175, roas: 5.5, conversions: 22, clicks: 378 },
    { day: "Sunday", revenue: 1133, spend: 190, roas: 6.0, conversions: 24, clicks: 401 },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col transition-all duration-200 ease-out ${
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Performance Report</h2>
            <p className="text-sm text-gray-500 mt-0.5">Detailed analytics for the last {timeRangeLabel}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Executive Summary */}
          <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-violet-900 mb-2">Executive Summary</h3>
            <p className="text-sm text-violet-800 leading-relaxed">
              Over the last {timeRangeLabel}, your ad campaigns generated <span className="font-bold">${data.revenue.toLocaleString()}</span> in revenue
              from a <span className="font-bold">${data.spend.toLocaleString()}</span> ad spend, resulting in
              a <span className="font-bold">{data.roas}x ROAS</span> and <span className="font-bold">${profit.toLocaleString()}</span> profit
              ({profitMargin}% margin). You acquired <span className="font-bold">{data.conversions}</span> customers
              at an average cost of <span className="font-bold">${data.cpa.toFixed(2)}</span> per acquisition.
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Metrics</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                <div className="text-xs text-violet-600 mb-1">Revenue</div>
                <div className="text-xl font-bold text-violet-900">${data.revenue.toLocaleString()}</div>
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-emerald-600">+12%</span>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">ROAS</div>
                <div className={`text-xl font-bold ${data.roas >= 3 ? "text-emerald-600" : data.roas < 2 ? "text-red-600" : "text-gray-900"}`}>
                  {data.roas}x
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-emerald-600">+8%</span>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Impressions</div>
                <div className="text-xl font-bold text-gray-900">{(data.impressions / 1000).toFixed(1)}k</div>
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-emerald-600">+15%</span>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Conversions</div>
                <div className="text-xl font-bold text-gray-900">{data.conversions}</div>
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-emerald-600">+10%</span>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">CTR</div>
                <div className="text-xl font-bold text-gray-900">{data.ctr.toFixed(2)}%</div>
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-red-500 rotate-180" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-red-600">-2%</span>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">CPA</div>
                <div className="text-xl font-bold text-gray-900">${data.cpa.toFixed(2)}</div>
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-emerald-600">-5%</span>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Clicks</div>
                <div className="text-xl font-bold text-gray-900">{data.clicks.toLocaleString()}</div>
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-emerald-600">+18%</span>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">Ad Spend</div>
                <div className="text-xl font-bold text-gray-900">${data.spend.toLocaleString()}</div>
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-amber-600">+6%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Breakdown Table */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Daily Breakdown</h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Spend</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ROAS</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Conv.</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dailyBreakdown.map((day, i) => (
                    <tr key={day.day} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="px-4 py-3 font-medium text-gray-900">{day.day}</td>
                      <td className="px-4 py-3 text-right text-gray-900">${day.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-600">${day.spend}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={day.roas >= 5 ? "text-emerald-600 font-medium" : "text-gray-900"}>
                          {day.roas}x
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">{day.conversions}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{day.clicks}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-violet-50">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-violet-900">Total</td>
                    <td className="px-4 py-3 text-right font-semibold text-violet-900">
                      ${dailyBreakdown.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-violet-900">
                      ${dailyBreakdown.reduce((sum, d) => sum + d.spend, 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-violet-900">{data.roas}x</td>
                    <td className="px-4 py-3 text-right font-semibold text-violet-900">
                      {dailyBreakdown.reduce((sum, d) => sum + d.conversions, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-violet-900">
                      {dailyBreakdown.reduce((sum, d) => sum + d.clicks, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Platform Performance Comparison */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Platform Comparison</h3>
            <div className="grid grid-cols-3 gap-3">
              {data.platformData.map((platform) => {
                const platformProfit = platform.revenue - platform.spend;
                return (
                  <div key={platform.platform} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{
                          backgroundColor: platform.platform === "tiktok" ? "#000" :
                                         platform.platform === "instagram" ? "#E4405F" : "#1877F2"
                        }}
                      >
                        <span className="text-xs font-bold uppercase">{platform.platform[0]}</span>
                      </div>
                      <span className="font-medium text-gray-900 capitalize">{platform.platform}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Revenue</span>
                        <span className="text-xs font-medium text-gray-900">${platform.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Spend</span>
                        <span className="text-xs font-medium text-gray-600">${platform.spend.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">ROAS</span>
                        <span className={`text-xs font-medium ${platform.roas >= 4 ? "text-emerald-600" : "text-gray-900"}`}>
                          {platform.roas}x
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Profit</span>
                        <span className={`text-xs font-medium ${platformProfit > 0 ? "text-emerald-600" : "text-red-600"}`}>
                          ${platformProfit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Recommendations
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span>
                  <strong>{data.platformData[0]?.platform || "TikTok"}</strong> is outperforming other platforms.
                  Consider shifting 15-20% of budget from lower-performing channels.
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm text-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span>
                  <strong>Wednesday</strong> shows the highest conversion rate. Schedule key campaigns to launch mid-week.
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm text-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span>
                  Your CTR is slightly below average. Consider A/B testing new creative variations to improve engagement.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => {
              // MOCK: Export functionality
              alert("Report export coming soon!");
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}

export default function AnalyticsPage() {
  // URL params
  const [searchParams] = useSearchParams();

  // Filter panel state
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activePlatform, setActivePlatform] = useState("");

  // Read filters from URL on mount
  useEffect(() => {
    const platform = searchParams.get("platform");
    if (platform && ["tiktok", "instagram", "facebook"].includes(platform)) {
      setActivePlatform(platform);
    }
    const ad = searchParams.get("ad");
    if (ad) {
      setActiveAd(ad);
    }
    const campaign = searchParams.get("campaign");
    if (campaign) {
      setActiveCampaign(campaign);
    }
  }, [searchParams]);
  const [activeStatus, setActiveStatus] = useState("");
  const [activeAd, setActiveAd] = useState("");
  const [activeCampaign, setActiveCampaign] = useState("");
  const [timeRange, setTimeRange] = useState("30");
  const [activeMetric, setActiveMetric] = useState("revenue");

  // Ad report panel state
  const [selectedAd, setSelectedAd] = useState<TopAd | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedAdRank, setSelectedAdRank] = useState(1);

  // Detailed report modal state
  const [detailedReportOpen, setDetailedReportOpen] = useState(false);

  const openPanel = (ad: TopAd, rank: number) => {
    setSelectedAd(ad);
    setSelectedAdRank(rank);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelectedAd(null), 150);
  };

  // Products and Ads data
  const [products, setProducts] = useState<Product[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products and ads on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products and ads in parallel
        const [productsRes, adsRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/ads"),
        ]);

        if (productsRes.ok) {
          const data = await productsRes.json();
          if (data.products) {
            setProducts(data.products);
          }
        }

        if (adsRes.ok) {
          const data = await adsRes.json();
          if (data.ads) {
            setAds(data.ads.map((ad: any) => ({
              id: ad.id,
              title: ad.title || ad.headline || "Untitled Ad",
              headline: ad.headline || "",
              campaign: ad.campaign || { id: "unknown", name: "Unknown Campaign" },
            })));
          }
          if (data.campaigns) {
            setCampaigns(data.campaigns);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get unique categories (productTypes)
  const categories = useMemo(() => {
    const types = new Set(products.map(p => p.productType).filter(Boolean));
    return Array.from(types) as string[];
  }, [products]);

  // Get unique campaigns from ads (fallback if campaigns not returned by API)
  const uniqueCampaigns = useMemo(() => {
    if (campaigns.length > 0) return campaigns;
    const campaignMap = new Map<string, Campaign>();
    ads.forEach(ad => {
      if (ad.campaign && !campaignMap.has(ad.campaign.id)) {
        campaignMap.set(ad.campaign.id, ad.campaign);
      }
    });
    return Array.from(campaignMap.values());
  }, [ads, campaigns]);

  // Active filter count for badge
  const filterCount = useMemo(() => {
    return [activeProduct, activeCategory, activePlatform, activeStatus, activeAd, activeCampaign].filter(Boolean).length;
  }, [activeProduct, activeCategory, activePlatform, activeStatus, activeAd, activeCampaign]);

  // Filtered data based on current filters
  const filteredData = useMemo((): FilteredData => {
    // Step 1: Determine which platforms to include
    let activePlatforms: string[] = ['tiktok', 'instagram', 'facebook'];

    if (activePlatform && activePlatform !== '') {
      activePlatforms = [activePlatform];
    }
    if (activeCategory && mockData.categories[activeCategory as keyof typeof mockData.categories]) {
      const categoryPlatforms = mockData.categories[activeCategory as keyof typeof mockData.categories].platforms;
      activePlatforms = activePlatforms.filter(p => categoryPlatforms.includes(p));
    }
    if (activeCampaign) {
      const campaignName = uniqueCampaigns.find(c => c.id === activeCampaign)?.name || '';
      if (campaignName && mockData.campaigns[campaignName as keyof typeof mockData.campaigns]) {
        const campaignPlatforms = mockData.campaigns[campaignName as keyof typeof mockData.campaigns].platforms;
        activePlatforms = activePlatforms.filter(p => campaignPlatforms.includes(p));
      }
    }

    // Handle no matching platforms
    if (activePlatforms.length === 0) {
      return {
        revenue: 0,
        spend: 0,
        impressions: 0,
        conversions: 0,
        cpa: 0,
        roas: 0,
        ctr: 0,
        clicks: 0,
        dailyData: Array(7).fill(0).map((_, i) => ({
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
          value: 0,
        })),
        platformData: [],
        topAds: [],
      };
    }

    // Step 2: Aggregate stats across active platforms
    let totalSpend = 0, totalRevenue = 0, totalClicks = 0, totalConversions = 0, totalImpressions = 0;
    const dailyRevenue: number[] = [0, 0, 0, 0, 0, 0, 0];

    activePlatforms.forEach(platform => {
      const platformData = mockData.platforms[platform as keyof typeof mockData.platforms];
      if (platformData) {
        totalSpend += platformData.spend;
        totalRevenue += platformData.revenue;
        totalClicks += platformData.clicks;
        totalConversions += platformData.conversions;
        totalImpressions += platformData.impressions;
        platformData.dailyRevenue.forEach((val, i) => {
          dailyRevenue[i] += val;
        });
      }
    });

    // Step 3: Calculate derived metrics
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;

    // Step 4: Build daily chart data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyData = days.map((day, i) => ({
      day,
      value: dailyRevenue[i],
    }));

    // Step 5: Build platform breakdown (only active platforms)
    const platformData = activePlatforms.map(platform => {
      const data = mockData.platforms[platform as keyof typeof mockData.platforms];
      return {
        platform,
        spend: data.spend,
        revenue: data.revenue,
        roas: data.roas,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
      };
    });

    // Step 6: Get all ads from active platforms and filter
    let allAds: TopAd[] = [];
    activePlatforms.forEach(platform => {
      const platformAds = mockData.platforms[platform as keyof typeof mockData.platforms]?.ads || [];
      allAds = allAds.concat(platformAds);
    });

    // Apply additional filters
    if (activeCategory) {
      allAds = allAds.filter(ad => ad.category === activeCategory);
    }
    if (activeCampaign) {
      const campaignName = uniqueCampaigns.find(c => c.id === activeCampaign)?.name || '';
      allAds = allAds.filter(ad => ad.campaign === campaignName);
    }
    if (activeAd) {
      allAds = allAds.filter(ad => ad.id === activeAd);
    }

    // Sort by ROAS descending
    allAds.sort((a, b) => b.roas - a.roas);

    return {
      revenue: totalRevenue,
      spend: totalSpend,
      impressions: totalImpressions,
      conversions: totalConversions,
      cpa,
      roas,
      ctr,
      clicks: totalClicks,
      dailyData,
      platformData,
      topAds: allAds,
    };
  }, [activeProduct, activeCategory, activePlatform, activeAd, activeCampaign, timeRange, products, ads, uniqueCampaigns]);

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
    setActiveAd("");
    setActiveCampaign("");
  };

  // Get filter label for display
  const getFilterLabel = (type: string, value: string): string => {
    if (type === "product") {
      return products.find(p => p.id === value)?.title || value;
    }
    if (type === "platform") {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (type === "ad") {
      const ad = ads.find(a => a.id === value);
      return ad?.title || ad?.headline || value;
    }
    if (type === "campaign") {
      return uniqueCampaigns.find(c => c.id === value)?.name || value;
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

  // ROAS status with time range
  const getTimeRangeLabel = () => {
    if (timeRange === "7") return "last 7 days";
    if (timeRange === "90") return "last 90 days";
    return "last 30 days";
  };

  const getRoasStatus = (roas: number) => {
    const period = getTimeRangeLabel();
    if (roas >= 4) return {
      bg: "bg-violet-50",
      border: "border-violet-200",
      title: `Great performance over the ${period}`,
      icon: "text-violet-600"
    };
    if (roas >= 2) return {
      bg: "bg-blue-50",
      border: "border-blue-200",
      title: `Profitable performance over the ${period}`,
      icon: "text-blue-600"
    };
    return {
      bg: "bg-amber-50",
      border: "border-amber-200",
      title: `Performance needs attention (${period})`,
      icon: "text-amber-600"
    };
  };

  // Get context string for ROAS banner based on active filters
  const getRoasContext = () => {
    const parts: string[] = [];
    if (activeAd) {
      parts.push(`for "${getFilterLabel("ad", activeAd)}"`);
    } else if (activeCampaign) {
      parts.push(`in ${getFilterLabel("campaign", activeCampaign)}`);
    } else if (activeProduct) {
      parts.push(`on ${getFilterLabel("product", activeProduct)}`);
    } else if (activeCategory) {
      parts.push(`in ${activeCategory}`);
    }
    if (activePlatform) {
      parts.push(`on ${getFilterLabel("platform", activePlatform)}`);
    }
    return parts.length > 0 ? ` ${parts.join(" ")}` : "";
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

            {/* Divider */}
            <div className="h-10 w-px bg-gray-200" />

            {/* Ad Dropdown */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Ad</label>
              <select
                value={activeAd}
                onChange={(e) => setActiveAd(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">All ads</option>
                {ads.map((ad) => (
                  <option key={ad.id} value={ad.id}>
                    {ad.title || ad.headline || "Untitled Ad"}
                  </option>
                ))}
              </select>
            </div>

            {/* Divider */}
            <div className="h-10 w-px bg-gray-200" />

            {/* Campaign Dropdown */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Campaign</label>
              <select
                value={activeCampaign}
                onChange={(e) => setActiveCampaign(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">All campaigns</option>
                {uniqueCampaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
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
            {activeAd && (
              <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                Ad: {getFilterLabel("ad", activeAd)}
              </span>
            )}
            {activeCampaign && (
              <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                {getFilterLabel("campaign", activeCampaign)}
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
              For every $1 spent on ads, you're making ${filteredData.roas.toFixed(1)} back{getRoasContext()}
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
            const metricData: Record<string, { day: string; value: number }[]> = {
              revenue: [
                { day: "Mon", value: 935 },
                { day: "Tue", value: 853 },
                { day: "Wed", value: 1199 },
                { day: "Thu", value: 579 },
                { day: "Fri", value: 1138 },
                { day: "Sat", value: 967 },
                { day: "Sun", value: 1133 },
              ],
              clicks: [
                { day: "Mon", value: 342 },
                { day: "Tue", value: 289 },
                { day: "Wed", value: 456 },
                { day: "Thu", value: 198 },
                { day: "Fri", value: 412 },
                { day: "Sat", value: 378 },
                { day: "Sun", value: 401 },
              ],
              sales: [
                { day: "Mon", value: 28 },
                { day: "Tue", value: 24 },
                { day: "Wed", value: 38 },
                { day: "Thu", value: 15 },
                { day: "Fri", value: 35 },
                { day: "Sat", value: 31 },
                { day: "Sun", value: 33 },
              ],
              roas: [
                { day: "Mon", value: 4.2 },
                { day: "Tue", value: 3.8 },
                { day: "Wed", value: 5.4 },
                { day: "Thu", value: 2.9 },
                { day: "Fri", value: 5.1 },
                { day: "Sat", value: 4.6 },
                { day: "Sun", value: 4.9 },
              ],
            };

            const currentData = metricData[activeMetric] || metricData.revenue;
            const maxValue = Math.max(...currentData.map(d => d.value));

            const formatValue = (value: number) => {
              if (activeMetric === "revenue") return `$${value.toLocaleString()}`;
              if (activeMetric === "sales") return value.toString();
              if (activeMetric === "clicks") return value.toLocaleString();
              if (activeMetric === "roas") return `${value.toFixed(1)}x`;
              return value.toString();
            };

            return (
              <div className="flex-1 min-h-[200px] flex flex-col mb-4">
                {/* Value labels row */}
                <div className="flex justify-between gap-3 mb-1">
                  {currentData.map((d, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-[11px] text-gray-400">{formatValue(d.value)}</span>
                    </div>
                  ))}
                </div>
                {/* Bars container - fixed height for percentage to work */}
                <div className="flex-1 flex items-end justify-between gap-3">
                  {currentData.map((d, i) => {
                    const heightPercent = (d.value / maxValue) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1"
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: "rgba(124, 58, 237, 0.85)",
                          borderRadius: "6px 6px 0 0",
                        }}
                      />
                    );
                  })}
                </div>
                {/* Day labels row */}
                <div className="flex justify-between gap-3 mt-2">
                  {currentData.map((d, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-[11px] text-gray-400">{d.day}</span>
                    </div>
                  ))}
                </div>
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
            <button
              onClick={() => setDetailedReportOpen(true)}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
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
              {filteredData.platformData.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">No platforms match your filters</p>
                  <button
                    onClick={clearAllFilters}
                    className="mt-2 text-sm text-violet-600 hover:text-violet-700 font-medium"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                filteredData.platformData.map((platform) => (
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
                ))
              )}
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">What this means for you</h3>
                <p className="text-sm text-gray-500">AI-generated insights{activePlatform || activeCategory || activeCampaign ? " for your selection" : ""}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>

            {filteredData.platformData.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No data available for the selected filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    {activePlatform ? (
                      <>Your <span className="font-medium text-gray-900 capitalize">{activePlatform}</span> ads are generating a <span className="font-medium text-gray-900">{filteredData.roas.toFixed(1)}x return</span> — for every $1 spent, you're making ${filteredData.roas.toFixed(2)} back.</>
                    ) : activeCategory ? (
                      <>Your <span className="font-medium text-gray-900">{activeCategory}</span> ads are generating a <span className="font-medium text-gray-900">{filteredData.roas.toFixed(1)}x return</span> — for every $1 spent, you're making ${filteredData.roas.toFixed(2)} back.</>
                    ) : (
                      <>Your ads are generating a <span className="font-medium text-gray-900">{filteredData.roas.toFixed(1)}x return</span> — for every $1 spent, you're making ${filteredData.roas.toFixed(2)} back.</>
                    )}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    {filteredData.roas >= 4 ? (
                      <>Consider increasing your daily budget by 20% to capture more of this profitable traffic.</>
                    ) : filteredData.roas >= 2 ? (
                      <>Performance is solid. Test new creative variations to potentially improve further.</>
                    ) : (
                      <>Consider optimizing your ad creative or targeting to improve returns.</>
                    )}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    Your click-through rate is <span className="font-medium text-gray-900">{filteredData.ctr.toFixed(1)}%</span> — {filteredData.ctr > 3 ? "above" : "slightly below"} industry average.
                  </p>
                </div>
                {filteredData.platformData.length > 1 && (
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900 capitalize">{filteredData.platformData[0]?.platform}</span> is your best performer with {filteredData.platformData[0]?.roas}x ROAS — consider shifting more budget there.
                    </p>
                  </div>
                )}
                {filteredData.platformData.length === 1 && (
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600">
                      Total spend on <span className="font-medium text-gray-900 capitalize">{filteredData.platformData[0]?.platform}</span>: ${filteredData.spend.toLocaleString()} with ${filteredData.revenue.toLocaleString()} in revenue.
                    </p>
                  </div>
                )}
              </div>
            )}
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

        {filteredData.topAds.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h4 className="text-gray-900 font-medium mb-1">No ads match your filters</h4>
            <p className="text-sm text-gray-500 mb-4">Try adjusting your filters to see more ads</p>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filteredData.topAds.slice(0, 3).map((ad, index) => {
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
        )}
      </div>

      {/* Ad Report Slide-over Panel */}
      <AdReportPanel
        ad={selectedAd}
        isOpen={panelOpen}
        onClose={closePanel}
        rank={selectedAdRank}
      />

      {/* Detailed Report Modal */}
      <DetailedReportModal
        isOpen={detailedReportOpen}
        onClose={() => setDetailedReportOpen(false)}
        data={filteredData}
        timeRange={timeRange}
        activeMetric={activeMetric}
      />
    </div>
  );
}
