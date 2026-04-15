import { useParams, useNavigate, Link } from "react-router";
import { topAds, type Ad } from "./dashboard";

// Demo performance data for the chart
const performanceData = [
  { day: "Mon", impressions: 12400, clicks: 892, conversions: 34 },
  { day: "Tue", impressions: 14200, clicks: 1024, conversions: 41 },
  { day: "Wed", impressions: 13800, clicks: 956, conversions: 38 },
  { day: "Thu", impressions: 15600, clicks: 1180, conversions: 47 },
  { day: "Fri", impressions: 16800, clicks: 1340, conversions: 52 },
  { day: "Sat", impressions: 18200, clicks: 1456, conversions: 58 },
  { day: "Sun", impressions: 17400, clicks: 1392, conversions: 55 },
];

export default function AdDetailPage() {
  const { adId } = useParams();
  const navigate = useNavigate();

  // Find the ad by ID
  const ad = topAds.find((a) => a.id === Number(adId));

  if (!ad) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ad Not Found</h1>
          <p className="text-gray-500 mb-6">The ad you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Get similar ads (same platform or product)
  const similarAds = topAds.filter((a) => a.id !== ad.id).slice(0, 2);

  const maxImpressions = Math.max(...performanceData.map((d) => d.impressions));

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{ad.name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  ad.status === "LIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {ad.status}
                </span>
              </div>
              <p className="text-gray-500 text-sm">Ad #{ad.id} • Created {ad.createdAt}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm">
              Duplicate
            </button>
            <button className="px-4 py-2 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm">
              Edit
            </button>
            <button className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* Hero Section - 40/60 Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
          {/* Ad Preview - 40% */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="aspect-square relative bg-gradient-to-br from-gray-200 to-gray-300">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-9xl">👔</span>
              </div>
              {/* Type Badge */}
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg uppercase">
                {ad.type}
              </div>
              {/* Platform Badge */}
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
                {ad.platform === "Instagram" && (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0z"/>
                  </svg>
                )}
                {ad.platform === "Facebook" && (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                )}
                {ad.platform === "TikTok" && (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                )}
                {ad.platform}
              </div>
            </div>
          </div>

          {/* Key Metrics - 60% */}
          <div className="space-y-4">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500 font-medium uppercase">ROAS</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{ad.roas}</div>
                <div className="text-sm text-emerald-600 font-medium">{ad.roasChange} vs last week</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500 font-medium uppercase">Revenue</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{ad.revenue}</div>
                <div className="text-sm text-emerald-600 font-medium">{ad.revenueChange} vs last week</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500 font-medium uppercase">Clicks</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{ad.clicks}</div>
                <div className="text-sm text-emerald-600 font-medium">{ad.clicksChange} vs last week</div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500 font-medium uppercase">CTR</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{ad.ctr}</div>
                <div className="text-sm text-emerald-600 font-medium">{ad.ctrChange} vs last week</div>
              </div>
            </div>

            {/* Ad Details Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Ad Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 uppercase font-medium">Daily Budget</span>
                  <p className="text-gray-900 font-semibold">{ad.dailyBudget}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase font-medium">Target Audience</span>
                  <p className="text-gray-900 font-semibold">{ad.targetAudience}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase font-medium">Created</span>
                  <p className="text-gray-900 font-semibold">{ad.createdAt}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase font-medium">Last Updated</span>
                  <p className="text-gray-900 font-semibold">{ad.updatedAt}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">7-Day Performance</h3>
                <p className="text-xs text-gray-500">Impressions and engagement trends</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-violet-500"></span>
                <span className="text-xs text-gray-500">Impressions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                <span className="text-xs text-gray-500">Conversions</span>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-end justify-between gap-4 h-[160px]">
              {performanceData.map((d, i) => {
                const height = (d.impressions / maxImpressions) * 100;
                const conversionHeight = (d.conversions / 60) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col h-full">
                    <div className="flex-1 flex items-end justify-center gap-1">
                      <div
                        className="w-[45%] bg-gradient-to-t from-violet-500 to-violet-400 rounded-t-lg transition-all duration-200 hover:from-violet-400 hover:to-violet-300 cursor-pointer"
                        style={{ height: `${height}%` }}
                        title={`${d.impressions.toLocaleString()} impressions`}
                      />
                      <div
                        className="w-[45%] bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-200 hover:from-emerald-400 hover:to-emerald-300 cursor-pointer"
                        style={{ height: `${conversionHeight}%` }}
                        title={`${d.conversions} conversions`}
                      />
                    </div>
                    <div className="text-center pt-2">
                      <span className="text-[11px] text-gray-400">{d.day}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ad Copy Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Ad Copy</h3>
                <p className="text-xs text-gray-500">The text used in this ad</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <span className="text-xs text-gray-500 uppercase font-medium mb-2 block">Headline</span>
              <p className="text-xl font-semibold text-gray-900">{ad.headline}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase font-medium mb-2 block">Description</span>
              <p className="text-gray-700 leading-relaxed">{ad.description}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase font-medium mb-2 block">Call to Action</span>
              <span className="inline-flex px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg text-sm">
                {ad.cta}
              </span>
            </div>
          </div>
        </div>

        {/* Similar Ads */}
        {similarAds.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Similar Ads</h3>
                  <p className="text-xs text-gray-500">Other ads for related products</p>
                </div>
              </div>
              <Link to="/ads" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                View All Ads
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {similarAds.map((similarAd) => (
                  <Link
                    key={similarAd.id}
                    to={`/ads/${similarAd.id}`}
                    className="group flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all"
                  >
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
                      <span className="text-4xl">👔</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate mb-1 group-hover:text-violet-600 transition-colors">
                        {similarAd.name}
                      </h4>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-emerald-600 font-semibold">{similarAd.roas}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-600">{similarAd.revenue}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          similarAd.status === "LIVE" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {similarAd.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                          {similarAd.platform}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
