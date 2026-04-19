import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";

// ============================================================================
// TYPES
// ============================================================================

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
  isCurrent?: boolean;
}

type Section =
  | "profile"
  | "plan"
  | "stores"
  | "platforms"
  | "brand"
  | "budget"
  | "notifications"
  | "danger";

// ============================================================================
// NAVIGATION CONFIG
// ============================================================================

interface NavItem {
  id: Section;
  name: string;
  icon: string;
  badge?: string;
  danger?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Account",
    items: [
      { id: "profile", name: "Profile", icon: "person" },
      { id: "plan", name: "Plan & billing", icon: "star" },
    ],
  },
  {
    label: "Connections",
    items: [
      { id: "stores", name: "Connected stores", icon: "bag" },
      { id: "platforms", name: "Ad platforms", icon: "monitor" },
    ],
  },
  {
    label: "AI & Ads",
    items: [
      { id: "brand", name: "Brand style", icon: "sparkle", badge: "AI-powered" },
      { id: "budget", name: "Budget defaults", icon: "dollar" },
      { id: "notifications", name: "Notifications", icon: "bell" },
    ],
  },
  {
    label: "Advanced",
    items: [
      { id: "danger", name: "Danger zone", icon: "warning", danger: true },
    ],
  },
];

// ============================================================================
// ICONS
// ============================================================================

function NavIcon({ icon, className = "" }: { icon: string; className?: string }) {
  const baseClass = `w-5 h-5 ${className}`;

  switch (icon) {
    case "person":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      );
    case "star":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      );
    case "bag":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      );
    case "monitor":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
        </svg>
      );
    case "sparkle":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      );
    case "dollar":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "bell":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      );
    case "warning":
      return (
        <svg className={baseClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      );
    default:
      return null;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Active section state
  const [activeSection, setActiveSection] = useState<Section>("profile");

  // Read section from URL on mount
  useEffect(() => {
    const section = searchParams.get("section");
    if (section && ["profile", "plan", "stores", "platforms", "brand", "budget", "notifications", "danger"].includes(section)) {
      setActiveSection(section as Section);
    }
  }, [searchParams]);

  // -------------------------------------------------------------------------
  // PROFILE STATE (mock - no user table exists)
  // -------------------------------------------------------------------------
  // TODO: Connect to real API when user/profile endpoint exists
  const [profileData, setProfileData] = useState({
    firstName: "Demo",
    lastName: "User",
    email: "demo@example.com",
    password: "",
  });

  // -------------------------------------------------------------------------
  // PLAN & BILLING STATE
  // -------------------------------------------------------------------------
  const [currency, setCurrency] = useState<"eur" | "dkk">("eur");
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // TODO: Connect to Stripe webhook to update plan status when payment confirmed
  // TODO: Read current plan from store settings when billing system exists
  const [currentPlan] = useState<string | null>(null); // null = no plan yet

  const prices = {
    starter: {
      eur: { monthly: 50, yearly: 40 },
      dkk: { monthly: 369, yearly: 295 },
    },
    pro: {
      eur: { monthly: 109, yearly: 87 },
      dkk: { monthly: 799, yearly: 639 },
    },
  };

  const symbols = { eur: "€", dkk: "kr" };

  const getPrice = (plan: "starter" | "pro") =>
    prices[plan][currency][yearly ? "yearly" : "monthly"];

  const getSymbol = () => symbols[currency];

  const handleStartTrial = (plan: string) => {
    // TODO: Redirect to Stripe checkout with plan_id and trial_period_days: 7
    alert(`Starting your 7-day free trial — redirecting to checkout...`);
  };

  const handleContactSales = () => {
    // TODO: Open Calendly or contact form when sales flow is built
    alert("Opening sales enquiry...");
  };

  // -------------------------------------------------------------------------
  // CONNECTED STORES STATE
  // -------------------------------------------------------------------------
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Connect Shopify modal state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [shopInput, setShopInput] = useState("");

  // -------------------------------------------------------------------------
  // AD PLATFORMS STATE (mock - no real OAuth yet)
  // -------------------------------------------------------------------------
  // TODO: Connect to real API when platform OAuth exists
  const [platforms, setPlatforms] = useState({
    meta: { connected: false },
    tiktok: { connected: false },
  });

  // -------------------------------------------------------------------------
  // BRAND STYLE STATE
  // -------------------------------------------------------------------------
  const [brandImages, setBrandImages] = useState<string[]>([]);
  const [brandProfile, setBrandProfile] = useState<BrandStyleProfile | null>(null);
  const [includeShopifyImages, setIncludeShopifyImages] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [brandSuccess, setBrandSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // BUDGET DEFAULTS STATE (mock - not persisted)
  // -------------------------------------------------------------------------
  // TODO: Connect to real API when settings endpoint exists
  const [budgetSettings, setBudgetSettings] = useState({
    dailyBudget: 50,
    monthlyBudget: 1500,
    minRoas: 2.0,
  });

  // -------------------------------------------------------------------------
  // NOTIFICATIONS STATE (mock - not persisted)
  // -------------------------------------------------------------------------
  // TODO: Connect to real API when notifications endpoint exists
  const [notifications, setNotifications] = useState({
    weeklySummary: true,
    newAdGenerated: true,
    lowRoasAlert: true,
    autopilotDigest: false,
    budgetCapWarning: true,
    seasonalSuggestions: true,
  });

  // -------------------------------------------------------------------------
  // DANGER ZONE STATE
  // -------------------------------------------------------------------------
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);
  const [dangerLoading, setDangerLoading] = useState(false);

  // -------------------------------------------------------------------------
  // EFFECTS
  // -------------------------------------------------------------------------

  useEffect(() => {
    fetchStoreConnection();
    fetchBrandStyle();
  }, []);

  // Check for ?connect=true param
  useEffect(() => {
    if (searchParams.get("connect") === "true") {
      setShowConnectModal(true);
      setActiveSection("stores");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // -------------------------------------------------------------------------
  // STORE HANDLERS
  // -------------------------------------------------------------------------

  const fetchStoreConnection = async () => {
    try {
      setStoreLoading(true);
      const response = await fetch("/api/stores");
      const data = await response.json();
      if (data.success && data.stores) {
        setStores(data.stores);
        setCurrentStore(data.stores.find((s: Store) => s.isCurrent) || null);
      } else {
        setStores([]);
        setCurrentStore(null);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      setStores([]);
      setCurrentStore(null);
    } finally {
      setStoreLoading(false);
    }
  };

  const handleConnect = () => {
    if (!shopInput.trim()) return;
    let shop = shopInput.trim();
    shop = shop.replace("https://", "").replace("http://", "");
    shop = shop.replace("/admin", "").replace("/", "");
    if (!shop.includes(".myshopify.com")) {
      shop = `${shop}.myshopify.com`;
    }
    window.location.href = `/auth/shopify?shop=${encodeURIComponent(shop)}`;
  };

  const handleDisconnectStore = async (storeId: string) => {
    setDisconnecting(storeId);
    try {
      const response = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect", storeId }),
      });
      if (response.ok) {
        await fetchStoreConnection();
        await fetchBrandStyle();
      }
    } catch (error) {
      console.error("Error disconnecting store:", error);
    } finally {
      setDisconnecting(null);
    }
  };

  // -------------------------------------------------------------------------
  // BRAND STYLE HANDLERS
  // -------------------------------------------------------------------------

  const fetchBrandStyle = async () => {
    try {
      const response = await fetch("/api/brand-style");
      const data = await response.json();
      if (data.success) {
        setBrandImages(data.referenceImages || []);
        setBrandProfile(data.profile);
      }
    } catch (error) {
      console.error("Error fetching brand style:", error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setBrandError("Invalid file type. Only JPG, PNG, WEBP allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setBrandError("File too large. Maximum 5MB.");
      return;
    }
    if (brandImages.length >= 5) {
      setBrandError("Maximum 5 images allowed. Remove one first.");
      return;
    }

    setUploading(true);
    setBrandError(null);

    try {
      const formData = new FormData();
      formData.append("action", "upload");
      formData.append("file", file);

      const response = await fetch("/api/brand-style", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      setBrandImages(data.images);
      setBrandSuccess("Image uploaded");
      setTimeout(() => setBrandSuccess(null), 3000);
    } catch (error: any) {
      setBrandError(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = async (key: string) => {
    try {
      const formData = new FormData();
      formData.append("action", "remove");
      formData.append("key", key);

      const response = await fetch("/api/brand-style", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setBrandImages(data.images);
      }
    } catch (error) {
      console.error("Error removing image:", error);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setBrandError(null);

    try {
      const formData = new FormData();
      formData.append("action", "analyze");
      formData.append("includeShopifyImages", includeShopifyImages.toString());

      const response = await fetch("/api/brand-style", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Analysis failed");
      }

      setBrandProfile(data.profile);
      setBrandSuccess("Brand style analyzed successfully!");
      setTimeout(() => setBrandSuccess(null), 5000);
    } catch (error: any) {
      setBrandError(error.message || "Failed to analyze brand style");
    } finally {
      setAnalyzing(false);
    }
  };

  const getImageUrl = (key: string) => {
    return `/api/brand-style/image?key=${encodeURIComponent(key)}`;
  };

  // -------------------------------------------------------------------------
  // DANGER ZONE HANDLERS
  // -------------------------------------------------------------------------

  const handleClearHistory = async () => {
    setDangerLoading(true);
    try {
      // Delete all generated ads for current store
      // This uses the existing products endpoint disconnect logic pattern
      // but we only clear ads, not the store itself
      const response = await fetch("/api/ads", {
        method: "DELETE",
      });
      if (response.ok) {
        setShowConfirmModal(null);
        // Show success feedback
        alert("Ad history cleared successfully");
      }
    } catch (error) {
      console.error("Error clearing history:", error);
      alert("Failed to clear ad history");
    } finally {
      setDangerLoading(false);
    }
  };

  const handleExportData = () => {
    // TODO: Implement CSV export when endpoint exists
    alert("Export functionality coming soon");
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion when user system exists
    alert("Account deletion requires user authentication system");
  };

  // -------------------------------------------------------------------------
  // RENDER HELPERS
  // -------------------------------------------------------------------------

  const getInitials = () => {
    const first = profileData.firstName?.[0] || "";
    const last = profileData.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Navigation Sidebar */}
      <aside
        className="sticky top-0 h-screen bg-gray-100 border-r border-gray-200 p-4 flex-shrink-0 overflow-y-auto"
        style={{ width: 200 }}
      >
        <nav className="space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p
                className="text-[10px] uppercase text-gray-400 font-semibold mb-2"
                style={{ letterSpacing: "0.06em" }}
              >
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeSection === item.id
                          ? "bg-white text-violet-600 font-medium shadow-sm"
                          : item.danger
                          ? "text-red-600 hover:bg-white hover:text-red-700"
                          : "text-gray-600 hover:bg-white hover:text-gray-900"
                      }`}
                    >
                      <NavIcon
                        icon={item.icon}
                        className={
                          activeSection === item.id
                            ? "text-violet-600"
                            : item.danger
                            ? "text-red-500"
                            : "text-gray-400"
                        }
                      />
                      <span className="flex-1 text-left">{item.name}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-violet-100 text-violet-700 rounded">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 p-8" style={{ marginLeft: 20 }}>
        <div className="max-w-3xl">
          {/* ============================================================= */}
          {/* SECTION: Profile */}
          {/* ============================================================= */}
          {activeSection === "profile" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
              <p className="text-sm text-gray-500 mb-6">Your account information</p>

              {/* Avatar Row */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-lg">
                    {getInitials()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {profileData.firstName} {profileData.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{profileData.email}</p>
                  </div>
                </div>
                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  Change photo
                </button>
              </div>

              {/* Name Inputs */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    First name
                  </label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, firstName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, lastName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              {/* Password Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={profileData.password}
                  onChange={(e) =>
                    setProfileData({ ...profileData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end">
                <button className="px-5 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition">
                  Save changes
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION: Plan & Billing */}
          {/* ============================================================= */}
          {activeSection === "plan" && (
            <div className="space-y-8">
              {/* Trial Banner */}
              <div
                className="rounded-xl p-5 flex items-center justify-between"
                style={{ backgroundColor: "#7c3aed" }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                  >
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-bold text-[13px]">
                      Try JAIM free for 7 days — no credit card required
                    </p>
                    <p className="text-white/70 text-[11px]">
                      Full access to any plan. Cancel anytime. Your ads keep running if
                      you upgrade.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleStartTrial("starter")}
                  className="px-4 py-2 bg-white text-violet-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex-shrink-0"
                >
                  Start free trial
                </button>
              </div>

              {/* Currency + Billing Toggle Row */}
              <div className="flex items-center justify-center gap-8">
                {/* Currency Toggle */}
                <div className="flex items-center border border-gray-200 rounded-full p-0.5 bg-white">
                  <button
                    onClick={() => setCurrency("eur")}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                      currency === "eur"
                        ? "bg-violet-600 text-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    EUR €
                  </button>
                  <button
                    onClick={() => setCurrency("dkk")}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                      currency === "dkk"
                        ? "bg-violet-600 text-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    DKK kr
                  </button>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm ${
                      !yearly ? "text-gray-900 font-medium" : "text-gray-500"
                    }`}
                  >
                    Monthly
                  </span>
                  <button
                    onClick={() => setYearly(!yearly)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                      yearly ? "bg-violet-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                        yearly ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-sm ${
                      yearly ? "text-gray-900 font-medium" : "text-gray-500"
                    }`}
                  >
                    Yearly
                  </span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded">
                    Save 20%
                  </span>
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-3 gap-5">
                {/* Starter Card */}
                <div className="relative bg-white rounded-2xl border border-gray-200 p-5 flex flex-col pt-8">
                  {/* Badge */}
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-semibold"
                    style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}
                  >
                    7 days free
                  </div>

                  {/* Current Plan Indicator - fixed height */}
                  <div style={{ height: 16 }}>
                    {currentPlan === "starter" && (
                      <p className="text-[10px] text-violet-600 font-semibold">
                        Your current plan
                      </p>
                    )}
                  </div>

                  {/* Plan Name */}
                  <p className="text-[11px] uppercase text-gray-400 font-semibold tracking-wide mt-1">
                    Starter
                  </p>

                  {/* Price - fixed height */}
                  <div className="mt-2 mb-1" style={{ height: 40 }}>
                    <span className="text-3xl font-bold text-gray-900">
                      {currency === "eur" ? getSymbol() : ""}
                      {getPrice("starter")}
                      {currency === "dkk" ? ` ${getSymbol()}` : ""}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">
                      / {yearly ? "year" : "month"}
                    </span>
                  </div>

                  {/* Trial Note - fixed height */}
                  <div className="flex items-center gap-1.5 text-[11px] text-green-600 mb-3" style={{ height: 18 }}>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    7-day free trial included
                  </div>

                  {/* Tagline - fixed height */}
                  <p className="text-[13px] font-bold text-gray-900" style={{ height: 20 }}>
                    Start running real AI ads
                  </p>

                  {/* Description - fixed height */}
                  <p
                    className="text-[11px] text-gray-500 mt-1 mb-6"
                    style={{ height: 48 }}
                  >
                    For solo merchants ready to publish their first AI-generated ads
                    and see real results.
                  </p>

                  {/* CTA Button */}
                  <button
                    onClick={() =>
                      currentPlan === "starter"
                        ? alert("Managing plan...")
                        : handleStartTrial("starter")
                    }
                    className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white transition"
                    style={{ backgroundColor: "#16a34a" }}
                  >
                    {currentPlan === "starter" ? "Manage plan" : "Start free trial"}
                  </button>

                  {/* Features */}
                  <div className="mt-5">
                    <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wide mb-2">
                      What's included
                    </p>
                    <ul className="space-y-1.5">
                      {[
                        "15 AI-generated ads / month",
                        "1 connected store",
                        "Publish to Meta + TikTok",
                        "Brand style analysis",
                        "AI co-pilot suggestions",
                        "Basic analytics",
                        "Seasonal campaigns",
                      ].map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-[11px] text-gray-700">
                          <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div className="border-t border-gray-100 my-3" />

                    <ul className="space-y-1.5">
                      {["Autopilot mode", "Multiple stores", "Advanced analytics"].map(
                        (f, i) => (
                          <li key={i} className="flex items-center gap-2 text-[11px] text-gray-400">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            {f}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>

                {/* Pro Card (Most Popular) */}
                <div
                  className="relative bg-white rounded-2xl p-5 flex flex-col pt-8"
                  style={{ border: "2px solid #7c3aed" }}
                >
                  {/* Badge */}
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-semibold text-white"
                    style={{ backgroundColor: "#7c3aed" }}
                  >
                    Most popular
                  </div>

                  {/* Current Plan Indicator - fixed height */}
                  <div style={{ height: 16 }}>
                    {currentPlan === "pro" && (
                      <p className="text-[10px] text-violet-600 font-semibold">
                        Your current plan
                      </p>
                    )}
                  </div>

                  {/* Plan Name */}
                  <p className="text-[11px] uppercase text-gray-400 font-semibold tracking-wide mt-1">
                    Pro
                  </p>

                  {/* Price - fixed height */}
                  <div className="mt-2 mb-1" style={{ height: 40 }}>
                    <span className="text-3xl font-bold text-gray-900">
                      {currency === "eur" ? getSymbol() : ""}
                      {getPrice("pro")}
                      {currency === "dkk" ? ` ${getSymbol()}` : ""}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">
                      / {yearly ? "year" : "month"}
                    </span>
                  </div>

                  {/* Trial Note - fixed height */}
                  <div className="flex items-center gap-1.5 text-[11px] text-green-600 mb-3" style={{ height: 18 }}>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    7-day free trial included
                  </div>

                  {/* Tagline - fixed height */}
                  <p className="text-[13px] font-bold text-gray-900" style={{ height: 20 }}>
                    Let JAIM run your ads
                  </p>

                  {/* Description - fixed height */}
                  <p
                    className="text-[11px] text-gray-500 mt-1 mb-6"
                    style={{ height: 48 }}
                  >
                    For serious merchants ready to scale with full AI automation and
                    unlimited ad generation.
                  </p>

                  {/* CTA Button */}
                  <button
                    onClick={() =>
                      currentPlan === "pro"
                        ? alert("Managing plan...")
                        : handleStartTrial("pro")
                    }
                    className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white transition hover:opacity-90"
                    style={{ backgroundColor: "#7c3aed" }}
                  >
                    {currentPlan === "pro" ? "Manage plan" : "Start free trial"}
                  </button>

                  {/* Features */}
                  <div className="mt-5">
                    <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wide mb-2">
                      Everything in Starter, plus
                    </p>
                    <ul className="space-y-1.5">
                      {[
                        "Unlimited ads per month",
                        "Up to 3 connected stores",
                        "Full autopilot mode",
                        "Growth mode strategy",
                        "All image generation providers",
                        "Advanced analytics + AI insights",
                        "Weekly performance reports",
                        "Priority support",
                      ].map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-[11px] text-gray-700">
                          <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Enterprise Card */}
                <div className="relative bg-white rounded-2xl border border-gray-200 p-5 flex flex-col pt-8">
                  {/* Current Plan Indicator - fixed height */}
                  <div style={{ height: 16 }}>
                    {currentPlan === "enterprise" && (
                      <p className="text-[10px] text-violet-600 font-semibold">
                        Your current plan
                      </p>
                    )}
                  </div>

                  {/* Plan Name */}
                  <p className="text-[11px] uppercase text-gray-400 font-semibold tracking-wide mt-1">
                    Enterprise
                  </p>

                  {/* Price - fixed height */}
                  <div className="mt-2 mb-1" style={{ height: 40 }}>
                    <span className="text-3xl font-bold text-gray-900">Custom</span>
                  </div>

                  {/* Trial Note Spacer - fixed height */}
                  <div className="mb-3" style={{ height: 18 }} />

                  {/* Tagline - fixed height */}
                  <p className="text-[13px] font-bold text-gray-900" style={{ height: 20 }}>
                    Let JAIM run your agency
                  </p>

                  {/* Description - fixed height */}
                  <p
                    className="text-[11px] text-gray-500 mt-1 mb-6"
                    style={{ height: 48 }}
                  >
                    For agencies and large brands managing multiple stores at scale
                    with white-label options and a dedicated account manager.
                  </p>

                  {/* CTA Button */}
                  <button
                    onClick={handleContactSales}
                    className="w-full py-2.5 rounded-lg text-[13px] font-medium transition hover:bg-violet-50"
                    style={{
                      backgroundColor: "transparent",
                      color: "#7c3aed",
                      border: "1.5px solid #7c3aed",
                    }}
                  >
                    Contact sales
                  </button>

                  {/* Features */}
                  <div className="mt-5">
                    <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wide mb-2">
                      Everything in Pro, plus
                    </p>
                    <ul className="space-y-1.5">
                      {[
                        "Unlimited stores",
                        "White-label dashboard",
                        "Team member access",
                        "Dedicated account manager",
                        "Custom API integrations",
                        "SLA guarantee",
                        "Custom onboarding",
                        "Priority 24/7 support",
                      ].map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-[11px] text-gray-700">
                          <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Feature Comparison Table */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-5">
                  Full feature comparison
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 pr-4 font-medium text-gray-500 w-1/3">
                          Feature
                        </th>
                        <th className="text-center py-3 px-2 font-medium text-gray-500">
                          Starter
                        </th>
                        <th
                          className="text-center py-3 px-2 font-medium rounded-t-lg"
                          style={{ backgroundColor: "#faf9ff", color: "#7c3aed" }}
                        >
                          Pro
                        </th>
                        <th className="text-center py-3 px-2 font-medium text-gray-500">
                          Enterprise
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Category: Ads & generation */}
                      <tr>
                        <td
                          colSpan={4}
                          className="py-2 text-[10px] uppercase text-gray-400 font-semibold tracking-wide bg-gray-50"
                        >
                          Ads & generation
                        </td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">AI ads per month</td>
                        <td className="py-2.5 px-2 text-center text-gray-700">15</td>
                        <td className="py-2.5 px-2 text-center font-medium" style={{ backgroundColor: "#faf9ff", color: "#7c3aed" }}>Unlimited</td>
                        <td className="py-2.5 px-2 text-center text-gray-700">Unlimited</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">Publish to platforms</td>
                        <td className="py-2.5 px-2 text-center text-green-500">✓</td>
                        <td className="py-2.5 px-2 text-center text-green-500" style={{ backgroundColor: "#faf9ff" }}>✓</td>
                        <td className="py-2.5 px-2 text-center text-green-500">✓</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">Image providers</td>
                        <td className="py-2.5 px-2 text-center text-gray-700">Bria only</td>
                        <td className="py-2.5 px-2 text-center font-medium" style={{ backgroundColor: "#faf9ff", color: "#7c3aed" }}>All</td>
                        <td className="py-2.5 px-2 text-center text-gray-700">All</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">Ad formats</td>
                        <td className="py-2.5 px-2 text-center text-gray-700">Static</td>
                        <td className="py-2.5 px-2 text-center font-medium" style={{ backgroundColor: "#faf9ff", color: "#7c3aed" }}>Static + Carousel</td>
                        <td className="py-2.5 px-2 text-center text-gray-700">All</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">Seasonal campaigns</td>
                        <td className="py-2.5 px-2 text-center text-green-500">✓</td>
                        <td className="py-2.5 px-2 text-center text-green-500" style={{ backgroundColor: "#faf9ff" }}>✓</td>
                        <td className="py-2.5 px-2 text-center text-green-500">✓</td>
                      </tr>

                      {/* Category: Stores & accounts */}
                      <tr>
                        <td
                          colSpan={4}
                          className="py-2 text-[10px] uppercase text-gray-400 font-semibold tracking-wide bg-gray-50"
                        >
                          Stores & accounts
                        </td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">Connected stores</td>
                        <td className="py-2.5 px-2 text-center text-gray-700">1</td>
                        <td className="py-2.5 px-2 text-center font-medium" style={{ backgroundColor: "#faf9ff", color: "#7c3aed" }}>3</td>
                        <td className="py-2.5 px-2 text-center text-gray-700">Unlimited</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">Team members</td>
                        <td className="py-2.5 px-2 text-center text-gray-300">—</td>
                        <td className="py-2.5 px-2 text-center text-gray-300" style={{ backgroundColor: "#faf9ff" }}>—</td>
                        <td className="py-2.5 px-2 text-center font-medium" style={{ color: "#7c3aed" }}>✓</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">White-label</td>
                        <td className="py-2.5 px-2 text-center text-gray-300">—</td>
                        <td className="py-2.5 px-2 text-center text-gray-300" style={{ backgroundColor: "#faf9ff" }}>—</td>
                        <td className="py-2.5 px-2 text-center font-medium" style={{ color: "#7c3aed" }}>✓</td>
                      </tr>

                      {/* Category: AI & automation */}
                      <tr>
                        <td
                          colSpan={4}
                          className="py-2 text-[10px] uppercase text-gray-400 font-semibold tracking-wide bg-gray-50"
                        >
                          AI & automation
                        </td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">Brand style analysis</td>
                        <td className="py-2.5 px-2 text-center text-green-500">✓</td>
                        <td className="py-2.5 px-2 text-center text-green-500" style={{ backgroundColor: "#faf9ff" }}>✓</td>
                        <td className="py-2.5 px-2 text-center text-green-500">✓</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">AI co-pilot mode</td>
                        <td className="py-2.5 px-2 text-center text-green-500">✓</td>
                        <td className="py-2.5 px-2 text-center text-green-500" style={{ backgroundColor: "#faf9ff" }}>✓</td>
                        <td className="py-2.5 px-2 text-center text-green-500">✓</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">Full autopilot mode</td>
                        <td className="py-2.5 px-2 text-center text-gray-300">—</td>
                        <td className="py-2.5 px-2 text-center font-medium" style={{ backgroundColor: "#faf9ff", color: "#7c3aed" }}>✓</td>
                        <td className="py-2.5 px-2 text-center text-green-500">✓</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">Growth mode</td>
                        <td className="py-2.5 px-2 text-center text-gray-300">—</td>
                        <td className="py-2.5 px-2 text-center font-medium" style={{ backgroundColor: "#faf9ff", color: "#7c3aed" }}>✓</td>
                        <td className="py-2.5 px-2 text-center text-green-500">✓</td>
                      </tr>

                      {/* Category: Analytics */}
                      <tr>
                        <td
                          colSpan={4}
                          className="py-2 text-[10px] uppercase text-gray-400 font-semibold tracking-wide bg-gray-50"
                        >
                          Analytics
                        </td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">Dashboard + basic</td>
                        <td className="py-2.5 px-2 text-center text-green-500">✓</td>
                        <td className="py-2.5 px-2 text-center text-green-500" style={{ backgroundColor: "#faf9ff" }}>✓</td>
                        <td className="py-2.5 px-2 text-center text-green-500">✓</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">Advanced + AI insights</td>
                        <td className="py-2.5 px-2 text-center text-gray-300">—</td>
                        <td className="py-2.5 px-2 text-center font-medium" style={{ backgroundColor: "#faf9ff", color: "#7c3aed" }}>✓</td>
                        <td className="py-2.5 px-2 text-center text-green-500">✓</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">Weekly email reports</td>
                        <td className="py-2.5 px-2 text-center text-gray-300">—</td>
                        <td className="py-2.5 px-2 text-center font-medium" style={{ backgroundColor: "#faf9ff", color: "#7c3aed" }}>✓</td>
                        <td className="py-2.5 px-2 text-center text-green-500">✓</td>
                      </tr>

                      {/* Category: Support */}
                      <tr>
                        <td
                          colSpan={4}
                          className="py-2 text-[10px] uppercase text-gray-400 font-semibold tracking-wide bg-gray-50"
                        >
                          Support
                        </td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">Support level</td>
                        <td className="py-2.5 px-2 text-center text-gray-700">Email</td>
                        <td className="py-2.5 px-2 text-center font-medium" style={{ backgroundColor: "#faf9ff", color: "#7c3aed" }}>Priority email</td>
                        <td className="py-2.5 px-2 text-center text-gray-700">Dedicated manager</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 text-gray-700">SLA guarantee</td>
                        <td className="py-2.5 px-2 text-center text-gray-300">—</td>
                        <td className="py-2.5 px-2 text-center text-gray-300" style={{ backgroundColor: "#faf9ff" }}>—</td>
                        <td className="py-2.5 px-2 text-center font-medium" style={{ color: "#7c3aed" }}>✓</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 text-gray-700">Free trial</td>
                        <td className="py-2.5 px-2 text-center text-green-600 font-medium">7 days</td>
                        <td className="py-2.5 px-2 text-center text-green-600 font-medium" style={{ backgroundColor: "#faf9ff" }}>7 days</td>
                        <td className="py-2.5 px-2 text-center text-gray-700">Custom</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FAQ Section */}
              <div>
                <h3 className="font-bold text-[14px] text-gray-900 mb-4">
                  Common questions
                </h3>

                <div className="space-y-2">
                  {[
                    {
                      q: "Do I need a credit card for the free trial?",
                      a: "No credit card required to start your 7-day trial. You only enter payment details if you decide to continue after the trial ends.",
                    },
                    {
                      q: "What happens when my trial ends?",
                      a: "If you don't upgrade, your account pauses. Your store stays connected and your data is preserved — you just can't generate or publish new ads until you subscribe. Any ads already running continue to run.",
                    },
                    {
                      q: "What's the difference between Starter and Pro?",
                      a: "Starter gives you 15 ads per month, 1 store, and AI co-pilot mode where you approve everything. Pro gives you unlimited ads, up to 3 stores, full autopilot mode, advanced analytics, and all image generation providers.",
                    },
                    {
                      q: "Does the subscription include ad spend?",
                      a: "No — your JAIM subscription covers the platform and AI generation. Ad spend is separate and paid directly to Meta and TikTok. JAIM manages how that budget is spent on your behalf.",
                    },
                    {
                      q: "Can I switch between Starter and Pro?",
                      a: "Yes — upgrade or downgrade anytime. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period.",
                    },
                    {
                      q: "Who is Enterprise for?",
                      a: "Enterprise is for marketing agencies managing multiple client stores, and large ecommerce brands needing white-label dashboards, team access, custom integrations, and a dedicated account manager. Pricing is tailored to your needs.",
                    },
                  ].map((faq, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between p-4 text-left"
                      >
                        <span className="text-[12px] font-bold text-gray-900">
                          {faq.q}
                        </span>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                            openFaq === i ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-200 ${
                          openFaq === i ? "max-h-40" : "max-h-0"
                        }`}
                      >
                        <p className="px-4 pb-4 text-[11px] text-gray-500 leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION: Connected Stores */}
          {/* ============================================================= */}
          {activeSection === "stores" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Connected stores</h2>
              <p className="text-sm text-gray-500 mb-6">
                Manage your Shopify store connections
              </p>

              {storeLoading ? (
                <div className="p-4 bg-gray-50 rounded-xl animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-48" />
                    </div>
                  </div>
                </div>
              ) : stores.length === 0 ? (
                <div className="p-8 bg-gray-50 rounded-xl text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3">
                    <NavIcon icon="bag" className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">No stores connected</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Connect your Shopify store to start generating ads
                  </p>
                  <button
                    onClick={() => setShowConnectModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Connect Shopify Store
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {stores.map((store) => (
                    <div
                      key={store.id}
                      className={`flex items-center justify-between p-4 rounded-xl transition ${
                        store.isCurrent
                          ? "bg-violet-50 border border-violet-100"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                            store.isCurrent
                              ? "bg-violet-600"
                              : "bg-emerald-500"
                          }`}
                        >
                          {store.name
                            ?.split(/[\s-]+/)
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase() || "ST"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {store.name || "Shopify Store"}
                            </span>
                            {store.isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold">
                                Current
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-medium">
                              Connected
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {store.domain}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href="/products"
                          className="px-3 py-1.5 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                        >
                          Manage
                        </a>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to disconnect this store? All products and ads for this store will be deleted."
                              )
                            ) {
                              handleDisconnectStore(store.id);
                            }
                          }}
                          disabled={disconnecting === store.id}
                          className="px-3 py-1.5 border border-red-200 bg-white text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition disabled:opacity-50"
                        >
                          {disconnecting === store.id ? (
                            <svg
                              className="w-4 h-4 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            "Disconnect"
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {stores.length > 0 && (
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="mt-4 text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Connect another store
                </button>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION: Ad Platforms */}
          {/* ============================================================= */}
          {activeSection === "platforms" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Ad platforms</h2>
              <p className="text-sm text-gray-500 mb-6">
                Connect your advertising accounts to publish ads directly from JAIM
              </p>

              <div className="space-y-3">
                {/* Meta Ads */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#1877F2" }}
                    >
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Meta Ads</p>
                      <p className="text-xs text-gray-500">Facebook & Instagram</p>
                    </div>
                  </div>
                  {platforms.meta.connected ? (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                        Connected
                      </span>
                      <button
                        onClick={() =>
                          setPlatforms({ ...platforms, meta: { connected: false } })
                        }
                        className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => alert("Meta Ads connection coming soon")}
                      className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition"
                    >
                      Connect
                    </button>
                  )}
                </div>

                {/* TikTok Ads */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">TikTok Ads</p>
                      <p className="text-xs text-gray-500">TikTok for Business</p>
                    </div>
                  </div>
                  {platforms.tiktok.connected ? (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                        Connected
                      </span>
                      <button
                        onClick={() =>
                          setPlatforms({ ...platforms, tiktok: { connected: false } })
                        }
                        className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => alert("TikTok Ads connection coming soon")}
                      className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION: Brand Style */}
          {/* ============================================================= */}
          {activeSection === "brand" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Brand style</h2>
                  <p className="text-sm text-gray-500">
                    Upload images from your social accounts. Combined with your Shopify
                    products, JAIM will match your visual identity in every ad.
                  </p>
                </div>
                <span className="px-2 py-1 text-[10px] font-semibold bg-violet-100 text-violet-700 rounded">
                  AI-powered
                </span>
              </div>

              {/* Error/Success Messages */}
              {brandError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {brandError}
                </div>
              )}
              {brandSuccess && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {brandSuccess}
                </div>
              )}

              {/* Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`mt-6 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  uploading
                    ? "border-violet-300 bg-violet-50"
                    : "border-gray-200 hover:border-violet-400 hover:bg-violet-50/50"
                }`}
                style={{ borderRadius: 10 }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-8 h-8 text-violet-500 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span className="text-sm text-violet-600 font-medium">
                      Uploading...
                    </span>
                  </div>
                ) : (
                  <>
                    <svg
                      className="w-10 h-10 text-gray-400 mx-auto mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm text-gray-600 font-medium">
                      Drag and drop or click to upload
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG, WEBP only · Max 5 images · 5MB each
                    </p>
                  </>
                )}
              </div>

              {/* Thumbnail Row */}
              <div className="mt-4 flex flex-wrap gap-3">
                {brandImages.map((key, index) => (
                  <div key={key} className="relative group">
                    <div
                      className="w-[60px] h-[60px] rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
                      style={{ borderRadius: 8 }}
                    >
                      <img
                        src={getImageUrl(key)}
                        alt={`Brand image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>';
                        }}
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(key);
                      }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                {brandImages.length < 5 &&
                  Array.from({ length: 5 - brandImages.length }).map((_, i) => (
                    <button
                      key={`empty-${i}`}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-[60px] h-[60px] rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-violet-400 hover:text-violet-500 transition-colors"
                      style={{ borderRadius: 8 }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  ))}
              </div>

              {/* Shopify Toggle */}
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
                disabled={analyzing || brandImages.length === 0}
                className={`mt-6 w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  analyzing || brandImages.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-violet-600 text-white hover:bg-violet-700"
                }`}
              >
                {analyzing ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Analysing brand style...
                  </>
                ) : (
                  <>
                    <NavIcon icon="sparkle" className="w-5 h-5" />
                    Analyse brand style
                  </>
                )}
              </button>

              {/* Brand Style Profile Summary */}
              {brandProfile && (
                <div
                  className="mt-6 p-5 rounded-xl"
                  style={{ backgroundColor: "#f8f7ff", border: "1px solid #e0e0fe" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Brand style profile</h4>
                    <button
                      onClick={() => {
                        setBrandProfile(null);
                        handleAnalyze();
                      }}
                      className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                    >
                      Re-analyse
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Visual Tone
                      </p>
                      <p className="text-gray-900 font-medium">
                        {brandProfile.visualTone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Content Style
                      </p>
                      <p className="text-gray-900 font-medium">
                        {brandProfile.contentStyle}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Mood
                      </p>
                      <p className="text-gray-900 font-medium">{brandProfile.mood}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Color Palette
                      </p>
                      <div className="flex gap-1.5 mt-1">
                        {brandProfile.colors.slice(0, 5).map((color, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded border border-gray-200"
                            style={{ backgroundColor: color.hex }}
                            title={`${color.label}: ${color.hex}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION: Budget Defaults */}
          {/* ============================================================= */}
          {activeSection === "budget" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Budget defaults</h2>
              <p className="text-sm text-gray-500 mb-6">
                Default limits applied to all new campaigns. You can override these per
                campaign.
              </p>

              <div className="space-y-4">
                {/* Daily Budget */}
                <div className="flex items-center gap-3">
                  <label
                    className="text-sm font-medium text-gray-700"
                    style={{ minWidth: 140 }}
                  >
                    Daily budget limit
                  </label>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      value={budgetSettings.dailyBudget}
                      onChange={(e) =>
                        setBudgetSettings({
                          ...budgetSettings,
                          dailyBudget: Number(e.target.value),
                        })
                      }
                      className="w-24 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <span className="text-sm text-gray-500">per day</span>
                  </div>
                </div>

                {/* Monthly Budget */}
                <div className="flex items-center gap-3">
                  <label
                    className="text-sm font-medium text-gray-700"
                    style={{ minWidth: 140 }}
                  >
                    Monthly budget cap
                  </label>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      value={budgetSettings.monthlyBudget}
                      onChange={(e) =>
                        setBudgetSettings({
                          ...budgetSettings,
                          monthlyBudget: Number(e.target.value),
                        })
                      }
                      className="w-24 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <span className="text-sm text-gray-500">per month</span>
                  </div>
                </div>

                {/* Minimum ROAS */}
                <div className="flex items-center gap-3">
                  <label
                    className="text-sm font-medium text-gray-700"
                    style={{ minWidth: 140 }}
                  >
                    Minimum ROAS target
                  </label>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.1"
                      value={budgetSettings.minRoas}
                      onChange={(e) =>
                        setBudgetSettings({
                          ...budgetSettings,
                          minRoas: Number(e.target.value),
                        })
                      }
                      className="w-24 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <span className="text-sm text-gray-500">× return</span>
                  </div>
                </div>
              </div>

              {/* Warning Box */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-sm text-amber-800">
                    If ROAS drops below your minimum target, JAIM will pause autopilot
                    spending and notify you.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button className="px-5 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition">
                  Save budget settings
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION: Notifications */}
          {/* ============================================================= */}
          {activeSection === "notifications" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500 mb-6">
                Choose what JAIM keeps you updated about
              </p>

              <div className="space-y-4">
                {[
                  {
                    key: "weeklySummary",
                    title: "Weekly performance summary",
                    desc: "Every Monday — your ads results from last week",
                  },
                  {
                    key: "newAdGenerated",
                    title: "New ad generated",
                    desc: "When JAIM creates a new ad ready for your review",
                  },
                  {
                    key: "lowRoasAlert",
                    title: "Low ROAS alert",
                    desc: "When an ad drops below your minimum ROAS target",
                  },
                  {
                    key: "autopilotDigest",
                    title: "Autopilot activity digest",
                    desc: "Daily summary of what autopilot did on your behalf",
                  },
                  {
                    key: "budgetCapWarning",
                    title: "Budget cap warning",
                    desc: "When you're approaching your monthly budget limit",
                  },
                  {
                    key: "seasonalSuggestions",
                    title: "Seasonal campaign suggestions",
                    desc: "45 days before major seasonal events relevant to your store",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications({
                          ...notifications,
                          [item.key]:
                            !notifications[item.key as keyof typeof notifications],
                        })
                      }
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        notifications[item.key as keyof typeof notifications]
                          ? "bg-violet-600"
                          : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                          notifications[item.key as keyof typeof notifications]
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button className="px-5 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition">
                  Save preferences
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION: Danger Zone */}
          {/* ============================================================= */}
          {activeSection === "danger" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-red-600">Danger zone</h2>
              <p className="text-sm text-gray-500 mb-6">
                These actions are irreversible. Please be certain before proceeding.
              </p>

              <div className="divide-y divide-gray-100">
                {/* Export Data */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-gray-900">Export all data</p>
                    <p className="text-sm text-gray-500">
                      Download all your ads, campaigns, and analytics data as a CSV
                    </p>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Export
                  </button>
                </div>

                {/* Clear History */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-gray-900">Clear ad history</p>
                    <p className="text-sm text-gray-500">
                      Permanently delete all generated ads and their performance data
                    </p>
                  </div>
                  <button
                    onClick={() => setShowConfirmModal("clear")}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                  >
                    Clear history
                  </button>
                </div>

                {/* Delete Account */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-gray-900">Delete account</p>
                    <p className="text-sm text-gray-500">
                      Permanently delete your JAIM account and all associated data
                    </p>
                  </div>
                  <button
                    onClick={() => setShowConfirmModal("delete")}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                  >
                    Delete account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ================================================================= */}
      {/* MODALS */}
      {/* ================================================================= */}

      {/* Connect Shopify Modal */}
      {showConnectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowConnectModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Connect a Shopify store
              </h2>
              <button
                onClick={() => setShowConnectModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-gray-500 mb-6">
              Enter your Shopify store domain to connect and start generating ads.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your store domain
              </label>
              <input
                type="text"
                value={shopInput}
                onChange={(e) => setShopInput(e.target.value)}
                placeholder="yourstore.myshopify.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConnectModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={!shopInput.trim()}
                className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              You'll be redirected to Shopify to authorize JAIM
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowConfirmModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Are you sure?</h2>

            {showConfirmModal === "clear" && (
              <p className="text-gray-600 mb-6">
                This will permanently delete all generated ads and their performance
                data. This action cannot be undone.
              </p>
            )}

            {showConfirmModal === "delete" && (
              <p className="text-gray-600 mb-6">
                This will permanently delete your JAIM account, all connected stores,
                generated ads, and all associated data. This action cannot be undone.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showConfirmModal === "clear") {
                    handleClearHistory();
                  } else if (showConfirmModal === "delete") {
                    handleDeleteAccount();
                    setShowConfirmModal(null);
                  }
                }}
                disabled={dangerLoading}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {dangerLoading ? (
                  <svg
                    className="w-5 h-5 animate-spin mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : showConfirmModal === "clear" ? (
                  "Yes, clear history"
                ) : (
                  "Yes, delete account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
