import { useState, useMemo, useEffect } from "react";

// TODO: Persist autopilot settings to database
// via POST /api/autopilot/settings when ready

type GrowthMode = "passive" | "moderate" | "aggressive";
type Platform = "tiktok" | "instagram" | "facebook";

interface ActivityItem {
  id: string;
  status: "in_progress" | "complete" | "pending";
  timestamp: string;
  description: string;
  visible: boolean;
}

export default function AutopilotPage() {
  // Autopilot state
  const [autopilotOn, setAutopilotOn] = useState(false);
  const [growthMode, setGrowthMode] = useState<GrowthMode>("moderate");
  const [monthlyBudget, setMonthlyBudget] = useState(500);
  const [platforms, setPlatforms] = useState<Platform[]>([
    "tiktok",
    "instagram",
    "facebook",
  ]);
  const [settings, setSettings] = useState({
    budgetReallocation: true,
    creativeRefresh: true,
    weeklySummary: true,
  });

  // Toast state
  const [showToast, setShowToast] = useState(false);

  // Activity feed
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);

  // Readiness check state
  // MOCK: Replace with real count from
  // SELECT COUNT(*) FROM generated_ads WHERE store_id = ? AND status = 'published'
  const [publishedAdsCount] = useState(7);

  // MOCK: Replace with real calculation from
  // DATEDIFF(NOW(), stores.connected_at)
  const [daysActive] = useState(22);

  const autopilotReady = publishedAdsCount >= 10 && daysActive >= 30;

  // Toggle autopilot
  const toggleAutopilot = () => {
    if (!autopilotReady && !autopilotOn) return; // Can't enable if not ready

    const newState = !autopilotOn;
    setAutopilotOn(newState);

    if (newState) {
      // Start with empty array, items will appear staggered
      setActivityItems([]);

      // Item 1 appears immediately
      setTimeout(() => {
        setActivityItems([
          {
            id: "1",
            status: "in_progress",
            timestamp: "Just now",
            description: "Analysing your top products for ad generation",
            visible: true,
          },
        ]);
      }, 100);

      // Item 2 appears after 1.5 seconds
      setTimeout(() => {
        setActivityItems((prev) => [
          { ...prev[0], status: "complete" },
          {
            id: "2",
            status: "in_progress",
            timestamp: "Just now",
            description: "Reading your brand style profile",
            visible: true,
          },
        ]);
      }, 1500);

      // Item 3 appears after 3 seconds
      setTimeout(() => {
        setActivityItems((prev) => [
          prev[0],
          { ...prev[1], status: "complete" },
          {
            id: "3",
            status: "in_progress",
            timestamp: "Just now",
            description: "Selecting optimal platforms based on your ROAS history",
            visible: true,
          },
        ]);
      }, 3000);

      // Item 4 appears after 5 seconds
      setTimeout(() => {
        setActivityItems((prev) => [
          prev[0],
          prev[1],
          { ...prev[2], status: "complete" },
          {
            id: "4",
            status: "complete",
            timestamp: "Just now",
            description: "Autopilot ready — first ads will be generated within 24 hours based on your top products",
            visible: true,
          },
        ]);
      }, 5000);
    } else {
      // Clear activity when disabled
      setActivityItems([]);
    }
  };

  // Toggle platform selection
  const togglePlatform = (platform: Platform) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  // Save settings handler
  const handleSaveSettings = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // Conservative prediction estimates - fixed ranges per mode
  const estimatedAdsRange = useMemo(() => {
    if (growthMode === "passive") return "4–8 ads per month";
    if (growthMode === "moderate") return "8–14 ads per month";
    return "14–20 ads per month";
  }, [growthMode]);

  const platformDistribution = useMemo(() => {
    if (platforms.length === 3) return "Auto-optimised";
    if (platforms.length === 1) {
      const names: Record<Platform, string> = {
        tiktok: "TikTok",
        instagram: "Instagram",
        facebook: "Facebook",
      };
      return `${names[platforms[0]]} focused`;
    }
    return "Multi-platform";
  }, [platforms]);

  // Growth mode options
  const growthModes = [
    {
      id: "passive" as GrowthMode,
      icon: "🌱",
      iconBg: "#e0f2fe",
      name: "Passive",
      description: "Conservative spend, low risk, slow steady growth",
    },
    {
      id: "moderate" as GrowthMode,
      icon: "⚡",
      iconBg: "#eeedfe",
      name: "Moderate",
      description: "Balanced approach — tests and scales what works",
    },
    {
      id: "aggressive" as GrowthMode,
      icon: "🚀",
      iconBg: "#fee2e2",
      name: "Aggressive",
      description: "Maximum spend on what's working, rapid scaling",
    },
  ];

  // Safety nets data (without Pause on loss - moved to hero)
  const safetyNets = [
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: "#dcfce7",
      iconColor: "#16a34a",
      title: "Budget cap",
      description: "Never exceeds your monthly limit",
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      iconBg: "#fef3c7",
      iconColor: "#d97706",
      title: "Weekly report",
      description: "Email summary of all AI actions",
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      iconBg: "#fee2e2",
      iconColor: "#dc2626",
      title: "Kill switch",
      description: "Disable autopilot instantly anytime",
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      iconBg: "#dbeafe",
      iconColor: "#2563eb",
      title: "Audit log",
      description: "Full history of every AI decision",
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      iconBg: "#dcfce7",
      iconColor: "#16a34a",
      title: "Product safety",
      description: "Never alters your product images",
    },
  ];

  // Platform icons
  const PlatformIcon = ({ platform, size = 32 }: { platform: Platform; size?: number }) => {
    if (platform === "tiktok") {
      return (
        <div
          className="rounded-lg flex items-center justify-center text-white"
          style={{ width: size, height: size, backgroundColor: "#000000" }}
        >
          <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
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
            background: "linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
          }}
        >
          <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </div>
      );
    }
    if (platform === "facebook") {
      return (
        <div
          className="rounded-lg flex items-center justify-center text-white"
          style={{ width: size, height: size, backgroundColor: "#1877F2" }}
        >
          <svg width={size * 0.45} height={size * 0.55} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8">
      {/* TOP BAR */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Autopilot</h1>
          <p className="text-gray-500">
            Set your growth strategy and let JAIM run your ads automatically
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            autopilotOn
              ? "bg-emerald-100 text-emerald-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              autopilotOn ? "bg-emerald-500" : "bg-gray-400"
            }`}
          />
          {autopilotOn ? "Autopilot on" : "Autopilot off"}
        </div>
      </div>

      {/* STATUS BANNER */}
      {autopilotOn ? (
        <div className="rounded-2xl p-5 mb-4 flex items-center justify-between bg-violet-600">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Autopilot is running</h2>
              <p className="text-white/70 text-sm">
                JAIM is managing your campaigns automatically based on your growth mode and budget settings.
              </p>
            </div>
          </div>
          <button
            onClick={toggleAutopilot}
            className="px-5 py-2.5 border-2 border-white text-white rounded-xl font-medium hover:bg-white/10 transition"
          >
            Disable Autopilot
          </button>
        </div>
      ) : (
        <div
          className="rounded-2xl p-5 mb-4 flex items-center justify-between"
          style={{ backgroundColor: "#f8f7ff", border: "0.5px solid #e0e0fe" }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI co-pilot active</h2>
              <p className="text-gray-500 text-sm">
                JAIM is helping you — suggesting ads and reports. Enable Autopilot to let it run fully automatically.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={toggleAutopilot}
              disabled={!autopilotReady}
              className={`px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 ${
                autopilotReady
                  ? "bg-violet-600 text-white hover:bg-violet-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {!autopilotReady && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              Enable Autopilot
            </button>
            {!autopilotReady && (
              <div className="text-right">
                <p className="text-[11px] text-gray-400 mb-2 max-w-[220px]">
                  Autopilot unlocks when you have 10+ published ads and 30 days of performance data
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {publishedAdsCount >= 10 ? (
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${Math.min((publishedAdsCount / 10) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                    <span className="text-[10px] text-gray-500">
                      Published ads: {publishedAdsCount} / 10
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {daysActive >= 30 ? (
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full"
                          style={{ width: `${Math.min((daysActive / 30) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                    <span className="text-[10px] text-gray-500">
                      Days active: {daysActive} / 30
                    </span>
                  </div>
                </div>
              </div>
            )}
            {autopilotReady && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-emerald-600 font-medium">Ready for autopilot</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CO-PILOT MODE EXPLANATION - Only shown when autopilot is OFF */}
      {!autopilotOn && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">What you have right now — AI co-pilot mode</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 mb-0.5">Ad suggestions</div>
                <div className="text-xs text-gray-500 leading-snug">AI recommends ads based on your products and performance</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 mb-0.5">Performance reports</div>
                <div className="text-xs text-gray-500 leading-snug">Weekly AI analysis of what's working and what to improve</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 mb-0.5">You stay in control</div>
                <div className="text-xs text-gray-500 leading-snug">Review and approve every ad before it goes live</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE ON LOSS HERO FEATURE */}
      <div
        className="rounded-xl p-4 mb-6 flex items-center justify-between"
        style={{ backgroundColor: "#fef9c3", border: "1px solid #854d0e" }}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-200 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-amber-900">Automatic loss protection — always on</div>
            <div className="text-sm text-amber-800/80">
              If your ROAS drops below 1.5x for 3 consecutive days, JAIM pauses all autopilot spending immediately and notifies you. This rule cannot be disabled.
            </div>
          </div>
        </div>
        <div
          className="px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
          style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
        >
          Always active
        </div>
      </div>

      {/* TWO COLUMN LAYOUT - Growth Mode & Settings */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* LEFT CARD — Growth mode */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Growth mode</h3>
          <p className="text-sm text-gray-500 mb-5">
            How aggressively should JAIM grow your ads?
          </p>

          <div className="space-y-3">
            {growthModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setGrowthMode(mode.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-[1.5px] transition ${
                  growthMode === mode.id
                    ? "border-violet-600 bg-[#faf9ff]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: mode.iconBg }}
                >
                  {mode.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{mode.name}</div>
                  <div className="text-xs text-gray-500">{mode.description}</div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    growthMode === mode.id
                      ? "border-violet-600 bg-violet-600"
                      : "border-gray-300"
                  }`}
                >
                  {growthMode === mode.id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT CARD — Autopilot settings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Autopilot settings</h3>
          <p className="text-sm text-gray-500 mb-5">
            Configure how the AI runs your campaigns
          </p>

          <div className="space-y-0">
            {/* Full autopilot mode */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div>
                <div className="font-medium text-gray-900 text-sm">Full autopilot mode</div>
                <div className="text-xs text-gray-500">AI publishes ads without your approval</div>
              </div>
              <button
                onClick={autopilotReady ? toggleAutopilot : undefined}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  autopilotOn ? "bg-violet-600" : "bg-gray-200"
                } ${!autopilotReady && !autopilotOn ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    autopilotOn ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Auto budget reallocation */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div>
                <div className="font-medium text-gray-900 text-sm">Auto budget reallocation</div>
                <div className="text-xs text-gray-500">Shift spend to best performing ads</div>
              </div>
              <button
                onClick={() =>
                  setSettings((s) => ({ ...s, budgetReallocation: !s.budgetReallocation }))
                }
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  settings.budgetReallocation ? "bg-violet-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    settings.budgetReallocation ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Creative refresh */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div>
                <div className="font-medium text-gray-900 text-sm">Creative refresh</div>
                <div className="text-xs text-gray-500">Generate new ads when fatigue detected</div>
              </div>
              <button
                onClick={() =>
                  setSettings((s) => ({ ...s, creativeRefresh: !s.creativeRefresh }))
                }
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  settings.creativeRefresh ? "bg-violet-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    settings.creativeRefresh ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Weekly AI summary email */}
            <div className="flex items-center justify-between py-4">
              <div>
                <div className="font-medium text-gray-900 text-sm">Weekly AI summary email</div>
                <div className="text-xs text-gray-500">Get a report of what the AI did and why</div>
              </div>
              <button
                onClick={() =>
                  setSettings((s) => ({ ...s, weeklySummary: !s.weeklySummary }))
                }
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  settings.weeklySummary ? "bg-violet-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    settings.weeklySummary ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND TWO COLUMN LAYOUT - Budget & Safety */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* LEFT CARD — Monthly budget cap + Platforms */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Monthly budget cap</h3>
          <p className="text-sm text-gray-500 mb-4">
            Maximum JAIM can spend per month — required for autopilot
          </p>

          {/* Budget input */}
          <div className="relative mb-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              $
            </span>
            <input
              type="number"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(Number(e.target.value) || 0)}
              className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <p className="text-[11px] text-gray-400 mb-6">
            JAIM will never exceed this amount. You can change it anytime.
          </p>

          {/* Platform selector */}
          <div className="mb-4">
            <h4 className="text-[13px] font-semibold text-gray-900 mb-3">Platforms to run on</h4>
            <div className="grid grid-cols-3 gap-3">
              {(["tiktok", "instagram", "facebook"] as Platform[]).map((platform) => {
                const isSelected = platforms.includes(platform);
                const names: Record<Platform, string> = {
                  tiktok: "TikTok",
                  instagram: "Instagram",
                  facebook: "Facebook",
                };
                return (
                  <button
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-[1.5px] transition ${
                      isSelected
                        ? "border-violet-600 bg-[#faf9ff]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <PlatformIcon platform={platform} size={32} />
                    <span className="text-[11px] font-semibold text-gray-700">
                      {names[platform]}
                    </span>
                    <div
                      className={`w-3 h-3 rounded-full border-2 ${
                        isSelected
                          ? "border-violet-600 bg-violet-600"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mb-5">
            Leave all selected and JAIM will choose the best platform automatically
          </p>

          {/* Save settings button */}
          <button
            onClick={handleSaveSettings}
            className="w-full py-2.5 bg-violet-600 text-white rounded-[10px] text-[13px] font-semibold hover:bg-violet-700 transition"
          >
            Save settings
          </button>
        </div>

        {/* RIGHT CARD — Safety nets (5 cards, without pause on loss) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Safety nets</h3>
          <p className="text-sm text-gray-500 mb-5">
            Built-in protections even in full autopilot
          </p>

          <div className="grid grid-cols-3 gap-3">
            {safetyNets.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-4"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: item.iconBg, color: item.iconColor }}
                >
                  {item.icon}
                </div>
                <div className="text-[13px] font-semibold text-gray-900 mb-1">{item.title}</div>
                <div className="text-xs text-gray-500 leading-snug">{item.description}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {safetyNets.slice(3, 5).map((item, index) => (
              <div
                key={index + 3}
                className="bg-gray-50 rounded-xl p-4"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: item.iconBg, color: item.iconColor }}
                >
                  {item.icon}
                </div>
                <div className="text-[13px] font-semibold text-gray-900 mb-1">{item.title}</div>
                <div className="text-xs text-gray-500 leading-snug">{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PREDICTION PREVIEW SECTION */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-1">What will happen with your settings</h3>
        <p className="text-sm text-gray-500 mb-5">
          Estimated impact based on your store's performance history
        </p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Ads generated */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-xl font-bold text-gray-900 mb-0.5">{estimatedAdsRange}</div>
            <div className="text-xs text-gray-500">Generated per month</div>
          </div>

          {/* Budget distribution */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-1 mb-3">
              {platforms.slice(0, 3).map((platform) => (
                <PlatformIcon key={platform} platform={platform} size={24} />
              ))}
            </div>
            <div className="text-xl font-bold text-gray-900 mb-0.5">{platformDistribution}</div>
            <div className="text-xs text-gray-500">Across your selected platforms</div>
          </div>

          {/* Projected ROAS */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="text-xl font-bold text-gray-900 mb-0.5">
              {publishedAdsCount >= 10 ? "Based on your history" : "Available after 10+ ads"}
            </div>
            <div className="text-xs text-gray-500">Projected ROAS</div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-gray-100 rounded-lg p-3 text-center">
          <p className="text-[11px] text-gray-500">
            These are estimates based on typical results. Actual performance depends on your products, market, and timing. JAIM never guarantees specific returns.
          </p>
        </div>
      </div>

      {/* ACTIVITY FEED SECTION */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-1">Recent autopilot activity</h3>
        <p className="text-sm text-gray-500 mb-5">What the AI has done on your behalf</p>

        {activityItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No autopilot activity yet</p>
            <p className="text-sm text-gray-400">Enable autopilot to get started</p>
          </div>
        ) : (
          <div className="space-y-0">
            {activityItems.filter(item => item.visible).map((item, index) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 py-3 animate-fade-in ${
                  index < activityItems.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 transition-colors duration-300 ${
                    item.status === "in_progress"
                      ? "bg-violet-500"
                      : item.status === "complete"
                      ? "bg-emerald-500"
                      : "bg-gray-300"
                  }`}
                />
                <div>
                  <span className="text-[11px] text-gray-400">{item.timestamp}</span>
                  <span className="text-[11px] text-gray-400"> — </span>
                  <span className="text-[13px] text-gray-700">{item.description}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ONBOARDING NUDGE - Only shown when threshold not met */}
      {!autopilotReady && (
        <div
          className="rounded-2xl p-5 flex items-center justify-between"
          style={{ backgroundColor: "#f5f3ff" }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-200 flex items-center justify-center">
              <svg className="w-6 h-6 text-violet-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-violet-900">Getting closer to autopilot</h3>
              <p className="text-sm text-violet-700/80">
                Keep publishing ads through the Ads page. Each approved ad builds the data JAIM needs to run autonomously.
              </p>
            </div>
          </div>
          <a
            href="/ads"
            className="px-5 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition flex-shrink-0"
          >
            Go to Ads →
          </a>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-lg text-sm animate-slide-up">
          Settings saved successfully
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
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
