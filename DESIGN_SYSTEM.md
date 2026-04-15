# JAIM Dashboard Design System

> Complete UI specification extracted from https://jaim-ads.pages.dev/dashboard
> Use this document to recreate the exact interface in the new project.

---

## Tech Stack

- **Framework:** React Router v7 (framework mode)
- **Styling:** Tailwind CSS v4+
- **Font:** Inter (Google Fonts)
- **Icons:** Custom SVG icons (inline)

---

## Colors

### Brand Colors (JAIM Violet Gradient)
```css
/* Primary gradient - used for CTAs, ROAS card, active states */
from-indigo-500 via-violet-500 to-purple-500
from-indigo-600 via-violet-600 to-purple-600 /* hover */

/* Sidebar gradient */
from-violet-600 via-indigo-600 to-purple-700

/* Alternative gradients */
from-indigo-600 to-violet-600
from-violet-500 to-indigo-600
```

### Semantic Colors
```css
/* Success/Active */
bg-emerald-500, text-emerald-600, bg-emerald-50

/* Warning */
bg-amber-500, text-amber-600, bg-amber-50, bg-amber-100

/* Error */
bg-red-500, text-red-600, bg-red-50

/* Info */
bg-blue-500, text-blue-600, bg-blue-50
```

### Neutral Palette
```css
/* Backgrounds */
bg-white                    /* Cards, modals */
bg-gray-50                  /* Page background, inputs */
bg-slate-50                 /* Subtle backgrounds */
bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50  /* Main content area */

/* Borders */
border-gray-100             /* Light borders */
border-gray-200             /* Default borders */
border-gray-300             /* Emphasized borders */

/* Text */
text-gray-900               /* Headings, primary text */
text-gray-700               /* Body text */
text-gray-500               /* Secondary text */
text-gray-400               /* Muted text, placeholders */
```

### Platform Colors
```css
/* TikTok */
from-gray-900 via-gray-800 to-black

/* Instagram */
from-purple-600 via-pink-500 to-orange-400

/* Facebook */
from-blue-600 to-blue-700
```

---

## Typography

### Font Family
```css
font-sans: "Inter", ui-sans-serif, system-ui, sans-serif
```

### Font Sizes
```css
text-xs     /* 12px - Labels, badges, meta text */
text-sm     /* 14px - Secondary text, buttons */
text-base   /* 16px - Body text */
text-lg     /* 18px - Section titles */
text-xl     /* 20px - Card titles */
text-2xl    /* 24px - Page titles */
text-3xl    /* 30px - Large numbers */
text-5xl    /* 48px - Hero metrics (ROAS) */
text-6xl    /* 60px - Huge metrics */
```

### Font Weights
```css
font-medium   /* 500 - Body, labels */
font-semibold /* 600 - Section titles, important text */
font-bold     /* 700 - Headings, metrics */
font-black    /* 900 - Hero numbers */
```

---

## Spacing System

```css
/* Padding */
p-2, p-3, p-4, p-5, p-6, p-8, p-10, p-12

/* Gaps */
gap-1, gap-2, gap-3, gap-4, gap-5, gap-6, gap-8

/* Margins */
mb-1, mb-2, mb-3, mb-4, mb-5, mb-6, mb-8
mt-1, mt-2, mt-3, mt-4, mt-6

/* Common patterns */
px-4 py-2     /* Small buttons */
px-5 py-4     /* Large inputs */
px-6 py-3     /* Medium buttons */
px-8 py-4     /* Large CTA buttons */
p-4, p-5, p-6 /* Card padding */
```

---

## Border Radius

```css
rounded-lg      /* 8px - Small elements, inputs */
rounded-xl      /* 12px - Buttons, small cards */
rounded-2xl     /* 16px - Cards, modals */
rounded-3xl     /* 24px - Hero cards, large elements */
rounded-full    /* Pills, badges, avatars */
```

---

## Shadows

```css
/* Standard */
shadow-sm       /* Subtle lift */
shadow-lg       /* Elevated cards */
shadow-xl       /* Modals, dropdowns */
shadow-2xl      /* Hero elements */

/* Colored shadows (brand) */
shadow-violet-500/25
shadow-violet-500/30
shadow-violet-500/40
shadow-violet-500/50
shadow-indigo-500/25
shadow-indigo-500/40

/* Other colored shadows */
shadow-emerald-500/30
shadow-emerald-500/50
shadow-blue-500/25
shadow-orange-500/25
```

---

## Layout Structure

### Page Layout
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌──────────┐  ┌─────────────────────────────────┐  │
│  │          │  │         Top Header Bar          │  │
│  │          │  ├─────────────────────────────────┤  │
│  │ Sidebar  │  │                                 │  │
│  │  (w-64)  │  │         Main Content            │  │
│  │          │  │           (p-8)                 │  │
│  │          │  │                                 │  │
│  │          │  │                                 │  │
│  └──────────┘  └─────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Sidebar
- Width: `w-64` (expanded) / `w-20` (collapsed)
- Background: `bg-gradient-to-b from-white to-slate-50/50`
- Border: `border-r border-gray-100`
- Contains: Logo, Navigation, Upgrade CTA, Store Info, Collapse toggle

### Header
- Height: Sticky, `py-5 px-8`
- Background: `bg-white/80 backdrop-blur-xl`
- Border: `border-b border-gray-100`
- Contains: Page title, greeting, stats pill, notifications, store badge

### Content Area
- Padding: `p-8`
- Background: `bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50`

---

## Component Specifications

### 1. Navigation Item (Sidebar)
```jsx
<button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
  isActive
    ? "bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 text-indigo-700 shadow-sm border border-indigo-100/50"
    : "hover:bg-gray-50/80 text-gray-500 hover:text-gray-900"
}`}>
  <span className={isActive ? "text-indigo-600" : "text-gray-400"}>
    {icon}
  </span>
  <span className={`font-medium ${isActive ? "text-indigo-700" : ""}`}>
    {label}
  </span>
  {isActive && (
    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
  )}
</button>
```

### 2. Metric Card (Dashboard)
```jsx
<div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 group relative overflow-hidden">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
    <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">+24%</span>
  </div>
  <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
  <div className="text-gray-400 text-xs">{subtitle}</div>
</div>
```

### 3. ROAS Hero Card
```jsx
<div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-3xl p-8 shadow-xl shadow-violet-500/30 relative overflow-hidden group hover:shadow-violet-500/50 hover:scale-[1.01] transition-all duration-500">
  {/* Animated background pattern */}
  <div className="absolute inset-0 opacity-10">
    <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700" />
    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl transform -translate-x-5 translate-y-5" />
  </div>

  <div className="relative z-10">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
        {icon}
      </div>
      <span className="text-white/90 text-sm font-semibold uppercase tracking-wide">Return on Ad Spend</span>
    </div>

    <div className="flex items-baseline gap-2 mb-2">
      <span className="text-6xl font-black text-white tracking-tight">5.2</span>
      <span className="text-3xl font-bold text-white/80">x</span>
    </div>

    <div className="flex items-center gap-3 mb-4">
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-semibold">
        <UpArrowIcon />
        +18%
      </span>
      <span className="text-white/70 text-sm">vs last week</span>
    </div>

    <div className="pt-4 border-t border-white/20">
      <p className="text-white/90 text-base font-medium">
        In plain English: <span className="text-white font-bold">1€ spent generates 5.2€</span>
      </p>
    </div>
  </div>
</div>
```

### 4. Product Card
```jsx
<div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all cursor-pointer group shadow-sm">
  <div className="aspect-square bg-gray-50 relative overflow-hidden">
    <img src={imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
    {/* Hover overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-violet-600/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
      <span className="text-white font-medium text-sm flex items-center gap-1">
        <EyeIcon />
        View Details
      </span>
    </div>
  </div>
  <div className="p-5">
    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{title}</h3>
    <p className="text-gray-500 text-sm mb-2">{productType}</p>
    <span className="font-bold text-lg text-gray-900">${price}</span>
  </div>
</div>
```

### 5. Primary Button (CTA)
```jsx
<button className="w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600 transition-all shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] flex items-center justify-center gap-3">
  {icon}
  {label}
</button>
```

### 6. Secondary Button
```jsx
<button className="px-4 py-2 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-200 transition flex items-center gap-2">
  {icon}
  {label}
</button>
```

### 7. Ghost Button
```jsx
<button className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-2">
  {label}
  <ChevronRightIcon />
</button>
```

### 8. Status Badge
```jsx
// Live status
<span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-xs font-semibold shadow-lg">
  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
  LIVE
</span>

// Processing status
<span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-semibold">
  Processing
</span>

// Percentage change
<span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
  +24%
</span>
```

### 9. Input Field
```jsx
<input
  type="text"
  placeholder="placeholder text"
  className="w-full px-5 py-4 rounded-2xl bg-gray-50/80 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-gray-300"
/>
```

### 10. Modal / Dialog
```jsx
<div className="fixed inset-0 z-50 overflow-y-auto">
  {/* Backdrop */}
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

  {/* Modal */}
  <div className="flex min-h-full items-center justify-center p-4">
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition"
      >
        <XIcon className="w-5 h-5 text-gray-600" />
      </button>

      {/* Content */}
      {children}
    </div>
  </div>
</div>
```

### 11. Chart Card
```jsx
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500">
  {/* Header */}
  <div className="p-5 border-b border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
          <ChartIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Chart Title</h3>
          <p className="text-xs text-gray-500">Subtitle text</p>
        </div>
      </div>
      {/* Time range selector */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {ranges.map(range => (
          <button
            key={range}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeRange === range
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  </div>

  {/* Chart content */}
  <div className="p-5">
    {/* Chart goes here */}
  </div>
</div>
```

### 12. Platform Performance Card
```jsx
<div className={`rounded-xl border transition-all duration-300 cursor-pointer ${
  isExpanded
    ? 'border-violet-200 bg-gradient-to-br from-violet-50/50 to-indigo-50/50 shadow-lg'
    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
}`}>
  <div className="p-4 flex items-center gap-4">
    {/* Platform icon */}
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platformColor} flex items-center justify-center text-white shadow-lg transition-transform duration-300 ${isExpanded ? 'scale-110' : ''}`}>
      {platformIcon}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{name}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">
            +{trend}%
          </span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">{roas}x</div>
          <div className="text-[10px] text-gray-400">ROAS</div>
        </div>
      </div>

      {/* ROAS bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${platformColor}`}
          style={{ width: `${roasPercent}%` }}
        />
      </div>
    </div>

    {/* Expand indicator */}
    <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
  </div>
</div>
```

### 13. Store Badge (Header)
```jsx
<div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-violet-200 transition-all cursor-pointer group">
  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
    {initials}
  </div>
  <span className="text-sm font-medium text-gray-700">{storeName}</span>
  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
</div>
```

### 14. Store Info Card (Sidebar)
```jsx
<div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 rounded-2xl p-4 border border-gray-100 hover:border-indigo-100 transition-all hover:shadow-md">
  <div className="flex items-center gap-3 mb-3">
    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
      {initials}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-sm text-gray-900 truncate">{shopName}</div>
      <div className="text-xs text-gray-400 truncate">{domain}</div>
    </div>
  </div>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
      Connected
    </div>
    <span className="px-2 py-1 bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700 rounded-lg text-xs font-semibold">
      Starter
    </span>
  </div>
</div>
```

### 15. Notification Badge
```jsx
<button className="relative p-2.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
  <BellIcon className="w-5 h-5 text-gray-500" />
  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
    3
  </span>
</button>
```

### 16. Live Activity Ticker
```jsx
<div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-2xl p-4 border border-gray-100">
  <div className="flex items-center gap-4 overflow-hidden">
    <div className="flex items-center gap-2 text-gray-500 text-sm whitespace-nowrap">
      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
      <span className="font-medium text-gray-700">Live Activity</span>
    </div>
    <div className="flex-1 overflow-hidden">
      <div className="flex gap-8 animate-marquee">
        {/* Activity items */}
      </div>
    </div>
  </div>
</div>
```

---

## Animations

### CSS Animations (app.css)
```css
/* Marquee animation */
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee 30s linear infinite;
}
.animate-marquee:hover {
  animation-play-state: paused;
}

/* Hover lift effect */
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
}

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Glass morphism */
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Glow effects */
.glow-emerald {
  box-shadow: 0 0 40px -10px rgba(16, 185, 129, 0.4);
}
.glow-violet {
  box-shadow: 0 0 40px -10px rgba(139, 92, 246, 0.4);
}
```

### Tailwind Animations
```css
animate-pulse        /* Pulsing effect for status indicators */
animate-spin         /* Loading spinners */
transition-all       /* General transitions */
duration-200         /* Fast transitions */
duration-300         /* Standard transitions */
duration-500         /* Slow transitions */
duration-700         /* Very slow transitions */
```

### Hover States
```css
hover:scale-[1.01]   /* Subtle scale */
hover:scale-[1.02]   /* Button scale */
hover:scale-105      /* Image scale */
hover:scale-110      /* Icon scale */
hover:-translate-y-1 /* Lift effect */
```

---

## Icons (SVG)

All icons are inline SVG with these common patterns:

```jsx
// Outline icon (most common)
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5 or 2} d="..." />
</svg>

// Filled icon
<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
  <path d="..." />
</svg>
```

### Common Icon Sizes
- `w-3 h-3` - Tiny (in badges)
- `w-4 h-4` - Small (in buttons)
- `w-5 h-5` - Standard (navigation, actions)
- `w-6 h-6` - Large (feature icons)
- `w-8 h-8` - XL (card headers)

---

## Trust Indicators (Login Screen)

```jsx
<div className="flex items-center justify-center gap-6 text-xs text-gray-400">
  <span className="flex items-center gap-1.5">
    <CheckCircleIcon className="w-4 h-4 text-violet-500" />
    Secure OAuth
  </span>
  <span className="flex items-center gap-1.5">
    <CheckCircleIcon className="w-4 h-4 text-violet-500" />
    No credit card
  </span>
  <span className="flex items-center gap-1.5">
    <CheckCircleIcon className="w-4 h-4 text-violet-500" />
    Free trial
  </span>
</div>
```

---

## Empty States

```jsx
<div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
  <div className="text-5xl mb-4">📦</div>
  <p className="text-gray-500 mb-2">No products synced yet</p>
  <p className="text-gray-400 text-sm">Click "Sync Products" to import from Shopify</p>
</div>
```

---

## Grid Layouts

### Dashboard Metrics Grid
```jsx
<div className="grid grid-cols-12 gap-4">
  {/* ROAS card - 5 columns */}
  <div className="col-span-12 md:col-span-5">...</div>

  {/* Other metrics - 7 columns */}
  <div className="col-span-12 md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
    ...
  </div>
</div>
```

### Two Column Charts
```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Chart 1 */}
  {/* Chart 2 */}
</div>
```

### Product Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Product cards */}
</div>
```

### Thumbnail Grid
```jsx
<div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
  {/* Thumbnail items */}
</div>
```

---

## Navigation Sections

```javascript
const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "products", label: "Products" },
  { id: "ads", label: "Ads" },
  { id: "campaigns", label: "Campaigns" },
  { id: "analytics", label: "Analytics" },
  { id: "autopilot", label: "Autopilot" },
  { id: "settings", label: "Settings" },
];
```

---

## Key UX Patterns

1. **Greeting based on time of day**
   - "Good morning" (before 12pm)
   - "Good afternoon" (12pm - 6pm)
   - "Good evening" (after 6pm)

2. **Plain language metrics**
   - "In plain English: 1€ spent generates 5.2€"
   - "For Every $1 You Spend"
   - "Money Made from Ads"

3. **Progressive disclosure**
   - Collapsed sidebar option
   - Expandable platform cards
   - Modal for detailed views

4. **Real-time indicators**
   - Pulsing green dots for "live" status
   - Live activity ticker
   - Processing spinners

5. **Micro-interactions**
   - Scale on hover (`hover:scale-[1.02]`)
   - Color transitions
   - Shadow changes
   - Icon animations

---

## Files to Create

1. `app/app.css` - Global styles and animations
2. `app/root.tsx` - Root layout with Inter font
3. `app/routes/dashboard.tsx` - Main dashboard
4. `tailwind.config.js` - Tailwind configuration

---

## Dependencies

```json
{
  "dependencies": {
    "react": "^19.x",
    "react-router": "^7.x",
    "@remix-run/cloudflare": "^2.x"
  },
  "devDependencies": {
    "tailwindcss": "^4.x",
    "@tailwindcss/vite": "^4.x"
  }
}
```
