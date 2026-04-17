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

export default function StoreSelector({ isCollapsed }: { isCollapsed: boolean }) {
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
    navigate("/products");
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

  if (isLoading) {
    return (
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 rounded-2xl p-4 border border-gray-100 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gray-200" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No stores connected
  if (stores.length === 0) {
    return (
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleAddStore}
          className="w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 rounded-2xl p-4 border border-gray-100 hover:border-indigo-200 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            {!isCollapsed && (
              <div>
                <div className="font-semibold text-sm text-gray-900">Connect Store</div>
                <div className="text-xs text-gray-400">Add your Shopify store</div>
              </div>
            )}
          </div>
        </button>
      </div>
    );
  }

  // Show collapsed version
  if (isCollapsed) {
    return (
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-11 h-11 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-shadow"
          title={currentStore?.name || "Select Store"}
        >
          {currentStore ? getInitials(currentStore.name) : "?"}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-100" ref={dropdownRef}>
      {/* Current Store Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 rounded-2xl p-4 border border-gray-100 hover:border-indigo-200 transition-colors text-left"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
            {currentStore ? getInitials(currentStore.name) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">
              {currentStore?.name || "Select Store"}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {currentStore?.domain || "No store selected"}
            </div>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
            Connected
          </div>
          {stores.length > 1 && (
            <span className="px-2 py-1 bg-gradient-to-r from-slate-100 to-gray-100 text-gray-600 rounded-lg text-xs font-medium">
              {stores.length} stores
            </span>
          )}
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="mt-2 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => !store.isCurrent && switchStore(store.id)}
                disabled={store.isCurrent || isSwitching}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  store.isCurrent
                    ? "bg-indigo-50 cursor-default"
                    : "hover:bg-gray-50 cursor-pointer"
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
                  <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
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
                <div className="font-medium text-sm text-gray-900">Add Another Store</div>
                <div className="text-xs text-gray-400">Connect a new Shopify store</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
