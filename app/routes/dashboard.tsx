import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

// Demo data for different time ranges
const revenueDataByRange = {
  "7": [
    { date: "Apr 13", revenue: 2800, spend: 520 },
    { date: "Apr 14", revenue: 3100, spend: 580 },
    { date: "Apr 15", revenue: 2950, spend: 540 },
    { date: "Apr 16", revenue: 3400, spend: 620 },
    { date: "Apr 17", revenue: 3200, spend: 590 },
    { date: "Apr 18", revenue: 3650, spend: 650 },
    { date: "Apr 19", revenue: 3800, spend: 680 },
  ],
  "14": [
    { date: "Apr 6", revenue: 2100, spend: 400 },
    { date: "Apr 8", revenue: 2450, spend: 460 },
    { date: "Apr 10", revenue: 2300, spend: 430 },
    { date: "Apr 12", revenue: 2800, spend: 520 },
    { date: "Apr 14", revenue: 3100, spend: 580 },
    { date: "Apr 16", revenue: 3400, spend: 620 },
    { date: "Apr 19", revenue: 3800, spend: 680 },
  ],
  "30": [
    { date: "Mar 20", revenue: 1600, spend: 320 },
    { date: "Mar 25", revenue: 1850, spend: 360 },
    { date: "Mar 30", revenue: 2100, spend: 400 },
    { date: "Apr 5", revenue: 2400, spend: 450 },
    { date: "Apr 10", revenue: 2750, spend: 510 },
    { date: "Apr 15", revenue: 3200, spend: 590 },
    { date: "Apr 19", revenue: 3800, spend: 680 },
  ],
};

export const topAds = [
  {
    id: 1,
    name: "Women's Jacquard Overshirt – Green",
    roas: "4.2x",
    roasChange: "+12%",
    revenue: "$983",
    revenueChange: "+8%",
    clicks: "2,847",
    clicksChange: "+15%",
    ctr: "3.2%",
    ctrChange: "+0.4%",
    type: "STATIC_IMAGE",
    status: "LIVE",
    image: "/fashion-1.jpg",
    platform: "Instagram",
    headline: "Elevate Your Style",
    description: "Discover the perfect blend of comfort and sophistication with our Women's Jacquard Overshirt. Premium fabric, timeless design.",
    cta: "Shop Now",
    targetAudience: "Women 25-44, Fashion enthusiasts",
    dailyBudget: "$50",
    createdAt: "Jan 12, 2026",
    updatedAt: "Jan 18, 2026",
    productId: 1
  },
  {
    id: 2,
    name: "Rings-diamond",
    roas: "4.7x",
    roasChange: "+18%",
    revenue: "$1,183",
    revenueChange: "+22%",
    clicks: "1,923",
    clicksChange: "+10%",
    ctr: "4.1%",
    ctrChange: "+0.6%",
    type: "STATIC_IMAGE",
    status: "LIVE",
    image: "/jewelry-1.png",
    platform: "Facebook",
    headline: "Timeless Elegance",
    description: "Make every moment sparkle with our exquisite diamond ring collection. Crafted with precision, designed for forever.",
    cta: "Discover More",
    targetAudience: "Women 28-55, Jewelry lovers",
    dailyBudget: "$75",
    createdAt: "Jan 10, 2026",
    updatedAt: "Jan 19, 2026",
    productId: 2
  },
  {
    id: 3,
    name: "Rings-diamond",
    roas: "5.2x",
    roasChange: "+24%",
    revenue: "$1,383",
    revenueChange: "+31%",
    clicks: "3,412",
    clicksChange: "+28%",
    ctr: "5.8%",
    ctrChange: "+1.2%",
    type: "STATIC_IMAGE",
    status: "LIVE",
    image: "/jewelry-2.png",
    platform: "TikTok",
    headline: "Shine Bright",
    description: "The perfect ring for the perfect moment. Our diamond collection brings luxury within reach.",
    cta: "Shop Collection",
    targetAudience: "Women 22-38, Trend-conscious",
    dailyBudget: "$60",
    createdAt: "Jan 8, 2026",
    updatedAt: "Jan 20, 2026",
    productId: 2
  },
];

export type Ad = typeof topAds[number];

const ugcCreators = [
  { id: 1, initials: "SC", name: "Sarah Chen", niche: "Skincare & Beauty", match: 98, followers: "245K", specialty: "Authentic reviews", price: "$350/video", color: "from-violet-500 to-purple-600" },
  { id: 2, initials: "ER", name: "Emma Rose", niche: "Clean Beauty", match: 94, followers: "189K", specialty: "Tutorial style", price: "$280/video", color: "from-pink-500 to-rose-600" },
  { id: 3, initials: "MJ", name: "Mia Johnson", niche: "Wellness", match: 91, followers: "312K", specialty: "Lifestyle content", price: "$420/video", color: "from-amber-500 to-orange-600" },
];

const aiAdIdeas = [
  { id: 1, name: "Women's Jacquard Overshirt – Green", type: "UGC", priority: "High", strategy: "Create 'morning routine' UGC", score: 94, insight: "Morning content +34% engagement", roasRange: "4.2x - 5.1x", image: "/fashion-1.jpg" },
  { id: 2, name: "Women's Dark Denim Jacket", type: "Photo", priority: "High", strategy: "Before/after comparison", score: 89, insight: "2.1x higher CTR potential", roasRange: "3.8x - 4.5x", image: "/fashion-2.jpg" },
  { id: 3, name: "Twill Suit Pant – Brown", type: "Spotlight", priority: "Medium", strategy: "Texture closeup spotlight", score: 82, insight: "Trending format this week", roasRange: "3.5x - 4.2x", image: "/fashion-3.jpg" },
  { id: 4, name: "Bundle: Full Set", type: "UGC", priority: "Medium", strategy: "Multi-product showcase", score: 87, insight: "Bundles +45% AOV", roasRange: "4.8x - 5.6x", image: "/fashion-1.jpg" },
];

const platforms = [
  { name: "TikTok", icon: "tiktok", color: "bg-black", progressColor: "bg-gray-900", trend: "+12%", roas: "5.4x", spent: "$1,200", revenue: "$6,480", clicks: "12,400", sales: "156", ctr: "4.8%" },
  { name: "Instagram", icon: "instagram", color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400", progressColor: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400", trend: "+8%", roas: "4.8x", spent: "$980", revenue: "$4,704", clicks: "8,320", sales: "98", ctr: "3.2%" },
  { name: "Facebook", icon: "facebook", color: "bg-blue-600", progressColor: "bg-blue-500", trend: "+5%", roas: "4.2x", spent: "$1,520", revenue: "$6,384", clicks: "9,840", sales: "112", ctr: "2.9%" },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Decorative wave sparkline component - shows trend direction
function WaveSparkline({ color, id, trend = "up" }: { color: string; id: string; trend?: "up" | "moderate" }) {
  // Strong upward trend (+24% revenue) - starts lower, ends higher
  const strongUpPath = "M 0 32 C 25 30, 40 28, 60 26 C 80 24, 95 22, 115 20 C 135 18, 155 14, 175 10 C 190 7, 195 5, 200 4";
  const strongUpFill = "M 0 32 C 25 30, 40 28, 60 26 C 80 24, 95 22, 115 20 C 135 18, 155 14, 175 10 C 190 7, 195 5, 200 4 L 200 40 L 0 40 Z";

  // Moderate upward trend (+12% conversions) - gentler slope
  const moderateUpPath = "M 0 28 C 30 27, 50 25, 80 24 C 110 23, 130 21, 160 19 C 180 17, 190 15, 200 13";
  const moderateUpFill = "M 0 28 C 30 27, 50 25, 80 24 C 110 23, 130 21, 160 19 C 180 17, 190 15, 200 13 L 200 40 L 0 40 Z";

  const linePath = trend === "up" ? strongUpPath : moderateUpPath;
  const fillPath = trend === "up" ? strongUpFill : moderateUpFill;

  return (
    <svg viewBox="0 0 200 40" className="w-full h-10 block" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`waveGradient-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Gradient fill area */}
      <path d={fillPath} fill={`url(#waveGradient-${id})`} />
      {/* Wave line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Ad Preview Modal
function AdModal({ ad, onClose, onViewReport }: { ad: Ad | null; onClose: () => void; onViewReport: (adId: number) => void }) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-[480px] w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Ad Image */}
        <div className="aspect-square relative bg-gradient-to-br from-gray-200 to-gray-300">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl">👔</span>
          </div>
          {/* Type Badge */}
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg uppercase">
            {ad.type}
          </div>
          {/* Live Badge */}
          <div className="absolute top-4 right-14 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            LIVE
          </div>
        </div>

        {/* Ad Info */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{ad.name}</h3>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">ROAS</div>
              <div className="text-lg font-bold text-emerald-600">{ad.roas}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">Revenue</div>
              <div className="text-lg font-bold text-gray-900">{ad.revenue}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">Platform</div>
              <div className="text-lg font-bold text-gray-900">{ad.platform}</div>
            </div>
          </div>

          {/* View Full Report Button */}
          <button
            onClick={() => onViewReport(ad.id)}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            View Full Report
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<"7" | "14" | "30">("14");
  const [chartType, setChartType] = useState<"revenue" | "spend">("revenue");
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock notification data
  const notifications = [
    {
      id: 1,
      type: "success" as const,
      title: "Campaign performing well",
      message: "Summer Sale 2024 hit 6.2x ROAS",
      time: "2 min ago",
      read: false,
    },
    {
      id: 2,
      type: "warning" as const,
      title: "Budget running low",
      message: "New Arrivals campaign at 85% budget",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      type: "info" as const,
      title: "New ad generated",
      message: "AI created 3 new ads for review",
      time: "3 hours ago",
      read: false,
    },
  ];

  const handleViewReport = (adId: number) => {
    setSelectedAd(null);
    navigate(`/analytics?ad=${adId}`);
  };

  const revenueData = revenueDataByRange[timeRange];
  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const totalSpend = revenueData.reduce((sum, d) => sum + d.spend, 0);
  const chartRoas = (totalRevenue / totalSpend).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Main Content */}
      <div className="p-8 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getGreeting()} 👋</h1>
            <p className="text-gray-500 text-sm">Here's how your ads are performing today</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live Ads Pill */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-gray-700">12 ads live</span>
            </div>

            {/* Revenue Today Pill */}
            <div className="hidden md:flex items-center px-4 py-2 bg-amber-50 rounded-full border border-amber-200">
              <span className="text-sm font-medium text-amber-700">+$847 today</span>
            </div>

            {/* Notification */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2.5 rounded-xl bg-white border transition-all ${
                  showNotifications
                    ? "border-violet-300 shadow-md ring-2 ring-violet-100"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />

                  {/* Dropdown Panel */}
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <button className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                        Mark all read
                      </button>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notification.read ? "bg-violet-50/30" : ""
                          }`}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              notification.type === "success"
                                ? "bg-emerald-100"
                                : notification.type === "warning"
                                ? "bg-amber-100"
                                : "bg-violet-100"
                            }`}>
                              {notification.type === "success" && (
                                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {notification.type === "warning" && (
                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              )}
                              {notification.type === "info" && (
                                <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {notification.message}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate("/settings?section=notifications");
                        }}
                        className="w-full text-center text-sm text-violet-600 hover:text-violet-700 font-medium"
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Top Row: ROAS + Metrics */}
        <div className="grid grid-cols-12 gap-6">
          {/* ROAS Hero Card */}
          <div className="col-span-12 lg:col-span-5">
            <div
              onClick={() => navigate("/analytics")}
              className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-3xl p-8 shadow-xl shadow-violet-500/20 relative overflow-hidden h-full cursor-pointer hover:shadow-2xl hover:shadow-violet-500/30 transition-all">
              {/* Animated background */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl transform translate-x-10 -translate-y-10" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="text-white/90 text-sm font-semibold uppercase tracking-wide">Return on Ad Spend</span>
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-7xl font-black text-white tracking-tight">5.2</span>
                  <span className="text-3xl font-bold text-white/70">x</span>
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    +18%
                  </span>
                  <span className="text-white/70 text-sm">vs last week</span>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <p className="text-white/80 text-base">
                    In plain English: <span className="text-white font-semibold">1€ spent generates 5.2€</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="col-span-12 lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Revenue Card */}
            <div
              onClick={() => navigate("/analytics")}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col cursor-pointer">
              <div className="p-5 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Revenue</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">+24%</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">$21.840</div>
                <div className="text-gray-400 text-xs">$4.200 ad spend</div>
              </div>
              <WaveSparkline color="#7c3aed" id="revenue" trend="up" />
            </div>

            {/* Conversions Card */}
            <div
              onClick={() => navigate("/analytics")}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col cursor-pointer">
              <div className="p-5 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Conversions</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">+12%</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">428</div>
                <div className="text-gray-400 text-xs">$9.8 cost per acquisition</div>
              </div>
              <WaveSparkline color="#f59e0b" id="conversions" trend="moderate" />
            </div>

            {/* Active Ads Card */}
            <div
              onClick={() => navigate("/ads?status=published")}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Active Ads</span>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">106</div>
              <div className="text-xs">
                <span className="text-gray-400">24 total</span>
                <span className="text-gray-300 mx-1">•</span>
                <span className="text-emerald-600 font-medium">All performing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-6">
          {/* Revenue Over Time */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Revenue Over Time</h3>
                    <p className="text-xs text-gray-500">Track your ad performance trends</p>
                  </div>
                </div>
                {/* Time Range Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  {(["7", "14", "30"] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        timeRange === range
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {range} Days
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart Content */}
            <div className="px-5 pt-4 pb-3 flex flex-col flex-1">
              {/* Stats Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-8">
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Total Revenue</div>
                    <div className="text-xl font-bold text-gray-900">${totalRevenue.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Ad Spend</div>
                    <div className="text-xl font-bold text-gray-900">${totalSpend.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">ROAS</div>
                    <div className="text-xl font-bold text-violet-600">{chartRoas}x</div>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-violet-500 to-violet-400"></span>
                  <span className="text-xs text-gray-500">Revenue</span>
                </div>
              </div>

              {/* Bar Chart - fills remaining space */}
              <div className="flex-1 flex items-end justify-between gap-3 min-h-[120px]">
                {revenueData.map((d, i) => {
                  const revenueHeight = (d.revenue / maxRevenue) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col h-full">
                      {/* Bar - grows from bottom */}
                      <div className="flex-1 flex items-end justify-center">
                        <div
                          className="w-full max-w-[40px] bg-gradient-to-t from-violet-500 to-violet-400 rounded-t-lg transition-all duration-200 hover:from-violet-400 hover:to-violet-300 cursor-pointer"
                          style={{ height: `${revenueHeight}%` }}
                        />
                      </div>
                      {/* Date Label */}
                      <div className="text-center pt-2">
                        <span className="text-[11px] text-gray-400">{d.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Platform Performance */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Platform Performance</h3>
                    <p className="text-xs text-gray-500">Compare your ad channels</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  All Profitable
                </span>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {platforms.map((platform) => (
                <div key={platform.name}>
                  <div
                    onClick={() => setExpandedPlatform(expandedPlatform === platform.name ? null : platform.name)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-4 mb-2">
                      {/* Platform Icon */}
                      <div className={`w-12 h-12 rounded-xl ${platform.color} flex items-center justify-center shadow-lg`}>
                        {platform.name === "TikTok" && (
                          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                          </svg>
                        )}
                        {platform.name === "Instagram" && (
                          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                          </svg>
                        )}
                        {platform.name === "Facebook" && (
                          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{platform.name}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{platform.trend}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-gray-900">{platform.roas}</span>
                            <span className="text-xs text-gray-400">ROAS</span>
                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedPlatform === platform.name ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                          <div
                            className={`h-full rounded-full ${platform.progressColor}`}
                            style={{ width: `${(parseFloat(platform.roas) / 6) * 100}%` }}
                          />
                        </div>

                        <div className="text-xs text-gray-500">
                          {platform.spent} spent <span className="text-gray-300 mx-1">•</span> {platform.revenue} revenue
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedPlatform === platform.name && (
                    <div className="ml-16 mt-3 grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">{platform.clicks}</div>
                        <div className="text-xs text-gray-500 uppercase">Clicks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">{platform.sales}</div>
                        <div className="text-xs text-gray-500 uppercase">Sales</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">{platform.ctr}</div>
                        <div className="text-xs text-gray-500 uppercase">CTR</div>
                      </div>
                      <div className="col-span-3 text-center pt-2 border-t border-gray-200">
                        <button
                          onClick={() => navigate(`/analytics?platform=${platform.name.toLowerCase()}`)}
                          className="text-violet-600 text-sm font-medium hover:text-violet-700 flex items-center gap-1 mx-auto"
                        >
                          View Full Report
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Best Performing */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">Best performing:</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-black flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">TikTok at 5.4x ROAS</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Ads */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Top Performing Ads</h3>
                <p className="text-xs text-gray-500">Your best performers this week</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/ads?sort=best")}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topAds.map((ad) => (
                <div
                  key={ad.id}
                  onClick={() => setSelectedAd(ad)}
                  className="group relative rounded-2xl overflow-hidden border border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all cursor-pointer bg-gray-50"
                >
                  {/* Image */}
                  <div className="aspect-square relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-6xl">👔</span>
                    </div>
                    {/* Type Badge */}
                    <div className="absolute top-3 left-3 px-2 py-1 bg-violet-600 text-white text-[10px] font-bold rounded uppercase">
                      {ad.type}
                    </div>
                    {/* Live Badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                      LIVE
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4 bg-white">
                    <h4 className="font-medium text-gray-900 text-sm mb-2 truncate">{ad.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-600 font-semibold text-sm flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        {ad.roas}
                      </span>
                      <span className="text-gray-900 font-semibold text-sm">{ad.revenue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Find Your Perfect UGC Creator */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Find Your Perfect UGC Creator</h3>
                <p className="text-xs text-gray-500">AI-matched creators based on your brand</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors">
              Browse All Creators
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ugcCreators.map((creator) => (
                <div key={creator.id} className="p-4 rounded-xl border border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${creator.color} flex items-center justify-center text-white font-bold`}>
                        {creator.initials}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{creator.name}</h4>
                        <p className="text-xs text-gray-500">{creator.niche}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      creator.match >= 95 ? 'bg-emerald-100 text-emerald-700' :
                      creator.match >= 90 ? 'bg-violet-100 text-violet-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {creator.match}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <span>{creator.followers}</span>
                    <span className="text-gray-300">•</span>
                    <span>{creator.specialty}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-violet-600 font-semibold">{creator.price}</span>
                    <button className="px-3 py-1.5 text-xs font-medium text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors">
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Ad Ideas */}
        <div className="bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">AI Ad Ideas</h3>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">4 new suggestions</span>
                </div>
                <p className="text-xs text-gray-400">Personalized recommendations based on your performance data</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {aiAdIdeas.map((idea) => (
                <div key={idea.id} className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-violet-500/50 transition-all group">
                  {/* Image */}
                  <div className="aspect-[4/5] relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <span className="text-5xl">👔</span>
                    </div>
                    {/* Type Badge */}
                    <div className={`absolute top-3 left-3 px-2 py-1 text-white text-[10px] font-bold rounded ${
                      idea.type === "UGC" ? "bg-violet-600" :
                      idea.type === "Photo" ? "bg-blue-600" :
                      "bg-amber-600"
                    }`}>
                      {idea.type}
                    </div>
                    {/* Priority Badge */}
                    <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded ${
                      idea.priority === "High" ? "bg-orange-500 text-white" : "bg-gray-500 text-white"
                    }`}>
                      {idea.priority === "High" && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                        </svg>
                      )}
                      {idea.priority}
                    </div>
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h4 className="font-semibold text-white text-sm mb-0.5 truncate">{idea.name}</h4>
                      <p className="text-xs text-gray-400 truncate">{idea.strategy}</p>
                    </div>
                  </div>
                  {/* Details */}
                  <div className="p-3 space-y-3">
                    {/* Score bar */}
                    <div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                          style={{ width: `${idea.score}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">{idea.insight}</span>
                        <span className="text-xs text-white font-medium">{idea.score}%</span>
                      </div>
                    </div>
                    {/* ROAS */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Est. ROAS</span>
                      <span className="text-sm font-semibold text-white">{idea.roasRange}</span>
                    </div>
                    {/* Generate button */}
                    <button className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Generate Ad
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Activity Banner */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm whitespace-nowrap">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="font-medium text-gray-700">Live Activity</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex gap-8 animate-marquee">
                <span className="text-sm text-gray-500 whitespace-nowrap flex items-center gap-2">
                  <span className="text-emerald-500">↑</span> New conversion from Instagram • 2m ago
                </span>
                <span className="text-sm text-gray-500 whitespace-nowrap flex items-center gap-2">
                  <span className="text-violet-500">✦</span> Ad "Summer Glow" reached 10k impressions • 5m ago
                </span>
                <span className="text-sm text-gray-500 whitespace-nowrap flex items-center gap-2">
                  <span className="text-blue-500">→</span> Campaign budget 80% spent • 12m ago
                </span>
                <span className="text-sm text-gray-500 whitespace-nowrap flex items-center gap-2">
                  <span className="text-emerald-500">↑</span> ROAS improved +0.3x today • 15m ago
                </span>
                <span className="text-sm text-gray-500 whitespace-nowrap flex items-center gap-2">
                  <span className="text-amber-500">★</span> New top performer: "Vitamin C Drops" • 18m ago
                </span>
                <span className="text-sm text-gray-500 whitespace-nowrap flex items-center gap-2">
                  <span className="text-emerald-500">↑</span> New conversion from Instagram • 2m ago
                </span>
                <span className="text-sm text-gray-500 whitespace-nowrap flex items-center gap-2">
                  <span className="text-violet-500">✦</span> Ad "Summer Glow" reached 10k impressions • 5m ago
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Preview Modal */}
      <AdModal ad={selectedAd} onClose={() => setSelectedAd(null)} onViewReport={handleViewReport} />
    </div>
  );
}
