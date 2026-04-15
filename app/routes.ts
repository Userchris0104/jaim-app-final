import { type RouteConfig, index, route, layout, prefix } from "@react-router/dev/routes";

export default [
  // Redirect root to dashboard
  index("routes/home.tsx"),

  // App routes with shared layout
  layout("routes/_layout.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
    route("products", "routes/products.tsx"),
    route("ads", "routes/ads.tsx"),
    route("ads/:adId", "routes/ad-detail.tsx"),
    route("campaigns", "routes/campaigns.tsx"),
    route("analytics", "routes/analytics.tsx"),
    route("autopilot", "routes/autopilot.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
