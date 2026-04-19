import { useState, useEffect, useMemo } from "react";

// Platform connection state interface
interface PlatformConnection {
  platform: "meta" | "tiktok";
  connected: boolean;
  accountName?: string;
  connectedAt?: string;
}

// Campaign interface
interface Campaign {
  id: string;
  name: string;
  platform: "meta" | "tiktok";
  objective: string;
  status: "active" | "paused" | "ended";
  startDate: string;
  endDate: string | null;
  spend: number;
  revenue: number;
  roas: number;
  clicks: number;
  ctr: number;
  impressions: number;
}

// Toast notification interface
interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warning";
}

// Filter options
const STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Ended", value: "ended" },
];

const PLATFORM_OPTIONS = [
  { label: "All platforms", value: "all" },
  { label: "Meta", value: "meta" },
  { label: "TikTok", value: "tiktok" },
];

const DATE_RANGE_OPTIONS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 14 days", value: "14" },
  { label: "Last 30 days", value: "30" },
  { label: "All time", value: "all" },
];

const SORT_OPTIONS = [
  { label: "Best performing", value: "best" },
  { label: "Worst performing", value: "worst" },
  { label: "Newest", value: "newest" },
  { label: "Highest spend", value: "spend" },
  { label: "Highest ROAS", value: "roas" },
];

// MOCK: Replace with real Meta/TikTok API data when platform connections are implemented
function generateMockCampaigns(storeId: string): Campaign[] {
  // Use storeId as seed for consistent random values
  const seed = storeId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seededRandom = (index: number, min: number, max: number) => {
    const x = Math.sin((seed + index) * 9999) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };

  const objectives = ["Conversions", "Traffic", "Brand Awareness", "Engagement", "Sales"];
  const campaignNames = [
    "Summer Sale 2024",
    "New Arrivals Launch",
    "Holiday Promo",
    "Flash Sale Weekend",
    "Brand Awareness Q2",
    "Retargeting - Cart Abandoners",
    "Lookalike Audience Test",
    "Product Launch - Spring Collection",
  ];

  const statuses: Array<"active" | "paused" | "ended"> = ["active", "paused", "ended"];
  const platforms: Array<"meta" | "tiktok"> = ["meta", "tiktok"];

  return campaignNames.map((name, i) => {
    const spend = Math.round(seededRandom(i * 10, 500, 15000) * 100) / 100;
    const roas = Math.round(seededRandom(i * 20, 0.5, 6.5) * 10) / 10;
    const revenue = Math.round(spend * roas * 100) / 100;
    const impressions = Math.floor(seededRandom(i * 30, 10000, 500000));
    const clicks = Math.floor(seededRandom(i * 40, 100, 10000));
    const ctr = Math.round((clicks / impressions) * 10000) / 100;

    const statusIndex = Math.floor(seededRandom(i * 50, 0, 3));
    const platformIndex = Math.floor(seededRandom(i * 60, 0, 2));
    const objectiveIndex = Math.floor(seededRandom(i * 70, 0, objectives.length));

    // Generate dates
    const daysAgo = Math.floor(seededRandom(i * 80, 1, 60));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    let endDate: string | null = null;
    if (statuses[statusIndex] === "ended") {
      const endDaysAgo = Math.floor(seededRandom(i * 90, 0, daysAgo - 1));
      const end = new Date();
      end.setDate(end.getDate() - endDaysAgo);
      endDate = end.toISOString().split("T")[0];
    }

    return {
      id: `camp_${seed}_${i}`,
      name,
      platform: platforms[platformIndex],
      objective: objectives[objectiveIndex],
      status: statuses[statusIndex],
      startDate: startDate.toISOString().split("T")[0],
      endDate,
      spend,
      revenue,
      roas,
      clicks,
      ctr,
      impressions,
    };
  });
}

// Platform icon component
function PlatformIcon({ platform, size = "md" }: { platform: "meta" | "tiktok"; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "w-6 h-6" : "w-10 h-10";
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";

  if (platform === "meta") {
    return (
      <div className={`${sizeClasses} rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold ${size === "sm" ? "text-sm" : "text-lg"}`}>
        M
      </div>
    );
  }

  return (
    <div className={`${sizeClasses} rounded-lg bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-white`}>
      <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
      </svg>
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: "active" | "paused" | "ended" }) {
  const styles = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    ended: "bg-gray-100 text-gray-600",
  };

  const labels = {
    active: "Active",
    paused: "Paused",
    ended: "Ended",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// Toast component
function ToastNotification({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-lg animate-slide-up">
      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm font-medium">{toast.message}</span>
      <button onClick={onDismiss} className="ml-2 text-gray-400 hover:text-white">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Campaign Detail Modal
function CampaignDetailModal({
  campaign,
  onClose,
}: {
  campaign: Campaign | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (campaign) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [campaign, onClose]);

  if (!campaign) return null;

  const roasColor = campaign.roas >= 3 ? "text-emerald-600" : campaign.roas < 2 ? "text-red-600" : "text-gray-900";
  const dateRange = campaign.endDate
    ? `${campaign.startDate} - ${campaign.endDate}`
    : `Started ${campaign.startDate}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <PlatformIcon platform={campaign.platform} />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{campaign.name}</h2>
                <p className="text-sm text-gray-500">{campaign.objective} · {dateRange}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-4">
            <StatusBadge status={campaign.status} />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="p-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Spend</p>
              <p className="text-2xl font-bold text-gray-900">${campaign.spend.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${campaign.revenue.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">ROAS</p>
              <p className={`text-2xl font-bold ${roasColor}`}>{campaign.roas.toFixed(1)}x</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Impressions</p>
              <p className="text-2xl font-bold text-gray-900">{campaign.impressions.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Clicks</p>
              <p className="text-2xl font-bold text-gray-900">{campaign.clicks.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">CTR</p>
              <p className="text-2xl font-bold text-gray-900">{campaign.ctr.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* Campaign Details */}
        <div className="p-6 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Platform</p>
              <p className="font-medium text-gray-900">{campaign.platform === "meta" ? "Meta Ads" : "TikTok Ads"}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Objective</p>
              <p className="font-medium text-gray-900">{campaign.objective}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Start Date</p>
              <p className="font-medium text-gray-900">{campaign.startDate}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">End Date</p>
              <p className="font-medium text-gray-900">{campaign.endDate || "Ongoing"}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-100 flex items-center gap-3">
          {campaign.status !== "ended" && (
            <button className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">
              {campaign.status === "paused" ? "Resume Campaign" : "Pause Campaign"}
            </button>
          )}
          <button className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition">
            Edit Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

// Campaign card/row component
function CampaignRow({
  campaign,
  maxRoas,
  onView,
  onTogglePause,
}: {
  campaign: Campaign;
  maxRoas: number;
  onView: () => void;
  onTogglePause: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const roasBarWidth = maxRoas > 0 ? (campaign.roas / maxRoas) * 100 : 0;
  const roasColor = campaign.roas >= 3 ? "text-emerald-600" : campaign.roas < 2 ? "text-red-600" : "text-gray-900";

  // Format date range
  const dateRange = campaign.endDate
    ? `${campaign.startDate} - ${campaign.endDate}`
    : `Started ${campaign.startDate}`;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-violet-200 transition-all">
      <div className="flex items-center gap-4">
        {/* Platform Icon */}
        <PlatformIcon platform={campaign.platform} />

        {/* Campaign Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 truncate">{campaign.name}</h4>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-gray-500">
            {campaign.objective} · {dateRange}
          </p>
        </div>

        {/* Stats */}
        <div className="hidden lg:grid grid-cols-5 gap-6 text-center">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Spend</p>
            <p className="text-sm font-semibold text-gray-900">${campaign.spend.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Revenue</p>
            <p className="text-sm font-semibold text-gray-900">${campaign.revenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">ROAS</p>
            <p className={`text-sm font-semibold ${roasColor}`}>{campaign.roas.toFixed(1)}x</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Clicks</p>
            <p className="text-sm font-semibold text-gray-900">{campaign.clicks.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">CTR</p>
            <p className="text-sm font-semibold text-gray-900">{campaign.ctr.toFixed(2)}%</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="px-3 py-1.5 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition"
          >
            View
          </button>
          {campaign.status !== "ended" && (
            <button
              onClick={onTogglePause}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              {campaign.status === "paused" ? "Resume" : "Pause"}
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                  <button className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50">
                    Edit
                  </button>
                  <button className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50">
                    Duplicate
                  </button>
                  <button className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50">
                    Archive
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Performance bar */}
      <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-500 rounded-full transition-all"
          style={{ width: `${roasBarWidth}%` }}
        />
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Campaign detail modal state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Dev preview toggle state
  const [previewMode, setPreviewMode] = useState<"disconnected" | "connected">("connected");

  // Mock platform connections - in production this would come from API
  const [platformConnections, setPlatformConnections] = useState<PlatformConnection[]>([
    { platform: "meta", connected: false },
    { platform: "tiktok", connected: false },
  ]);

  // For connected state preview, simulate connections
  const effectiveConnections = useMemo(() => {
    if (previewMode === "connected") {
      return [
        { platform: "meta" as const, connected: true, accountName: "My Business Account", connectedAt: "2024-01-15" },
        { platform: "tiktok" as const, connected: true, accountName: "TikTok Business", connectedAt: "2024-02-01" },
      ];
    }
    return platformConnections;
  }, [previewMode, platformConnections]);

  const isAnyConnected = effectiveConnections.some((p) => p.connected);

  // Mock campaigns - seeded by a demo store ID
  const mockCampaigns = useMemo(() => {
    if (previewMode === "connected") {
      return generateMockCampaigns("demo-store-123");
    }
    return [];
  }, [previewMode]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("30");
  const [sortBy, setSortBy] = useState("best");

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedPlatform !== "all") count++;
    if (selectedStatus !== "all") count++;
    if (selectedDateRange !== "30") count++;
    return count;
  }, [selectedPlatform, selectedStatus, selectedDateRange]);

  // Filter and sort campaigns
  const filteredCampaigns = useMemo(() => {
    let result = [...mockCampaigns];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(query));
    }

    // Platform filter
    if (selectedPlatform !== "all") {
      result = result.filter((c) => c.platform === selectedPlatform);
    }

    // Status filter
    if (selectedStatus !== "all") {
      result = result.filter((c) => c.status === selectedStatus);
    }

    // Date range filter
    if (selectedDateRange !== "all") {
      const days = parseInt(selectedDateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter((c) => new Date(c.startDate) >= cutoff);
    }

    // Sort
    switch (sortBy) {
      case "best":
        result.sort((a, b) => b.roas - a.roas);
        break;
      case "worst":
        result.sort((a, b) => a.roas - b.roas);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        break;
      case "spend":
        result.sort((a, b) => b.spend - a.spend);
        break;
      case "roas":
        result.sort((a, b) => b.roas - a.roas);
        break;
    }

    return result;
  }, [mockCampaigns, searchQuery, selectedPlatform, selectedStatus, selectedDateRange, sortBy]);

  // Max ROAS for performance bar
  const maxRoas = useMemo(() => {
    if (!filteredCampaigns.length) return 0;
    return Math.max(...filteredCampaigns.map((c) => c.roas));
  }, [filteredCampaigns]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalSpend = filteredCampaigns.reduce((sum, c) => sum + c.spend, 0);
    const totalRevenue = filteredCampaigns.reduce((sum, c) => sum + c.revenue, 0);
    const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    return { totalSpend, totalRevenue, avgRoas };
  }, [filteredCampaigns]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedPlatform("all");
    setSelectedStatus("all");
    setSelectedDateRange("30");
    setSortBy("best");
  };

  // Show toast
  const showToast = (message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type: "info" }]);
  };

  // Dismiss toast
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Handle connect button
  const handleConnect = (platform: "meta" | "tiktok") => {
    const platformName = platform === "meta" ? "Meta Ads" : "TikTok Ads";
    showToast(`${platformName} connection coming soon`);
  };

  // Handle campaign actions
  const handleViewCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
  };

  const handleTogglePause = (campaignId: string) => {
    showToast("Campaign pause/resume coming soon");
  };

  const handleCreateCampaign = () => {
    showToast("Campaign creation coming soon");
  };

  // Check if we're in development
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="p-8">
      {/* Dev Preview Toggle */}
      {isDev && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span className="font-medium">Dev Preview Mode</span>
          </div>
          <div className="flex items-center gap-1 bg-amber-100 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode("disconnected")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                previewMode === "disconnected"
                  ? "bg-white text-amber-900 shadow-sm"
                  : "text-amber-700 hover:text-amber-900"
              }`}
            >
              Disconnected
            </button>
            <button
              onClick={() => setPreviewMode("connected")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                previewMode === "connected"
                  ? "bg-white text-amber-900 shadow-sm"
                  : "text-amber-700 hover:text-amber-900"
              }`}
            >
              Connected
            </button>
          </div>
        </div>
      )}

      {/* STATE 1: DISCONNECTED - Show platform cards and empty state */}
      {!isAnyConnected && (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-500">Manage your Meta and TikTok advertising campaigns.</p>
          </div>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Meta */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xl font-bold">
                  M
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
              <button
                onClick={() => handleConnect("meta")}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Connect Meta
              </button>
            </div>

            {/* TikTok */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-white">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
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
              <button
                onClick={() => handleConnect("tiktok")}
                className="w-full py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
              >
                Connect TikTok
              </button>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-500">Connect your ad accounts to start creating campaigns.</p>
          </div>
        </>
      )}

      {/* STATE 2: CONNECTED - Show full campaign management UI */}
      {isAnyConnected && (
        <>
          {/* Top Bar */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
              <p className="text-gray-500">Manage your advertising campaigns across platforms</p>
            </div>

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
                  placeholder="Search campaigns..."
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

              {/* Create Campaign Button */}
              <button
                onClick={handleCreateCampaign}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition shadow-lg shadow-violet-500/25 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create campaign
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex items-center gap-4">
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

              {/* Status */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-px h-8 bg-gray-200" />

              {/* Date Range */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">Date range</label>
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {DATE_RANGE_OPTIONS.map((opt) => (
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

          {/* Platform Connection Status Bar */}
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              {effectiveConnections.map((conn) => (
                <div key={conn.platform} className="flex items-center gap-2">
                  <PlatformIcon platform={conn.platform} size="sm" />
                  <span className="text-sm font-medium text-gray-700">
                    {conn.platform === "meta" ? "Meta Ads" : "TikTok Ads"}
                  </span>
                  {conn.connected ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                      Not connected
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button className="text-sm text-violet-600 hover:text-violet-700 font-medium">
              Manage connections
            </button>
          </div>

          {/* Summary Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500 mb-1">Total Spend</p>
              <p className="text-2xl font-bold text-gray-900">
                ${summaryStats.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${summaryStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500 mb-1">Average ROAS</p>
              <p className={`text-2xl font-bold ${summaryStats.avgRoas >= 3 ? "text-emerald-600" : summaryStats.avgRoas < 2 ? "text-red-600" : "text-gray-900"}`}>
                {summaryStats.avgRoas.toFixed(2)}x
              </p>
            </div>
          </div>

          {/* Campaign count */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">{filteredCampaigns.length} campaigns</span>
          </div>

          {/* Campaign List or Empty State */}
          {filteredCampaigns.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns found</h3>
              {searchQuery || activeFilterCount > 0 ? (
                <>
                  <p className="text-gray-500 mb-6">Try adjusting your filters</p>
                  <button
                    onClick={clearAllFilters}
                    className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-6">Create your first campaign</p>
                  <button
                    onClick={handleCreateCampaign}
                    className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition shadow-lg shadow-violet-500/25 flex items-center gap-2 mx-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create campaign
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCampaigns.map((campaign) => (
                <CampaignRow
                  key={campaign.id}
                  campaign={campaign}
                  maxRoas={maxRoas}
                  onView={() => handleViewCampaign(campaign)}
                  onTogglePause={() => handleTogglePause(campaign.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Campaign Detail Modal */}
      <CampaignDetailModal
        campaign={selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
      />

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            toast={toast}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>

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
    </div>
  );
}
