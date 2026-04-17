import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";

interface Store {
  id: string;
  name: string;
  domain: string;
  email: string | null;
  currency: string;
  connectedAt: string | null;
  isCurrent: boolean;
}

interface StoresResponse {
  success: boolean;
  stores: Store[];
  currentStoreId: string | null;
  totalStores: number;
}

export default function TopNavBar() {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch stores on mount
  useEffect(() => {
    fetchStores();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchStores() {
    try {
      const response = await fetch("/api/stores");
      if (response.ok) {
        const data: StoresResponse = await response.json();
        setStores(data.stores);
        setCurrentStore(data.stores.find(s => s.isCurrent) || null);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function switchStore(storeId: string) {
    if (isSwitching) return;
    setIsSwitching(true);

    try {
      const response = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch", storeId }),
      });

      if (response.ok) {
        // Refetch stores to update current
        await fetchStores();
        setIsOpen(false);
        // Reload current page to refresh data for new store
        window.location.reload();
      }
    } catch (error) {
      console.error("Error switching store:", error);
    } finally {
      setIsSwitching(false);
    }
  }

  function handleAddStore() {
    setIsOpen(false);
    navigate("/settings?connect=true");
  }

  // Get store initials for avatar
  function getInitials(name: string): string {
    return name
      .split(/[\s-]+/)
      .slice(0, 2)
      .map(word => word[0])
      .join("")
      .toUpperCase();
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="px-8 py-4 flex items-center justify-between">
        {/* Left side - can be used for breadcrumbs or page title */}
        <div />

        {/* Right side - Store Switcher */}
        <div className="flex items-center gap-3">
          {/* Store Switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-violet-200 transition-all"
            >
              {isLoading ? (
                <>
                  <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" />
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                </>
              ) : currentStore ? (
                <>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                    {getInitials(currentStore.name)}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {currentStore.name}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-500">Add Store</span>
                </>
              )}
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
              <div className="absolute top-full right-0 w-72 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden">
                {stores.length > 0 ? (
                  <>
                    <div className="p-2 border-b border-gray-100">
                      <p className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Your Stores
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {stores.map((store) => (
                        <button
                          key={store.id}
                          onClick={() => !store.isCurrent && switchStore(store.id)}
                          disabled={store.isCurrent || isSwitching}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            store.isCurrent
                              ? "bg-indigo-50"
                              : "hover:bg-gray-50"
                          } ${isSwitching ? "opacity-50" : ""}`}
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                              store.isCurrent
                                ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {getInitials(store.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">{store.name}</div>
                            <div className="text-xs text-gray-400 truncate">{store.domain}</div>
                          </div>
                          {store.isCurrent && (
                            <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-gray-500 mb-2">No stores connected</p>
                  </div>
                )}

                {/* Add Store Button */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={handleAddStore}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">Add another store</div>
                      <div className="text-xs text-gray-400">Connect a new Shopify store</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
