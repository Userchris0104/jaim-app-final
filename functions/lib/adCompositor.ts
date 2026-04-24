/**
 * Ad Compositor - Text Overlay Rendering System
 *
 * Generates text overlay specifications for ad images.
 * Since Cloudflare Workers don't have native canvas support,
 * this module outputs a CompositionSpec that can be:
 * 1. Rendered client-side via HTML canvas or CSS overlays
 * 2. Used by a downstream image service if needed
 *
 * WORKFLOW:
 * 1. Gemini generates the base image (no text)
 * 2. This module creates a CompositionSpec with text positions
 * 3. Frontend renders text on top of the image
 *
 * TEXT OVERLAY TYPES:
 * - Brand name: Small, refined, typically top-left
 * - Headline: Large, bold, primary message
 * - Subheadline: Medium, supporting text
 * - CTA: Call-to-action button or text
 * - Badge: Social proof or promo badge
 */

import type { TextOverlayConfig } from './fashionTemplates';

// ===========================================
// TYPES
// ===========================================

export interface CompositionSpec {
  // Base image (Gemini output)
  baseImageUrl: string;
  width: number;
  height: number;

  // Text layers (rendered in order)
  layers: TextLayer[];

  // Template styling
  theme: 'light-on-dark' | 'dark-on-light' | 'auto';

  // Brand colors for styling
  primaryColor: string;
  accentColor: string;
}

export interface TextLayer {
  id: string;
  type: 'brand' | 'headline' | 'subheadline' | 'cta' | 'badge' | 'price';
  text: string;

  // Position (percentage of image dimensions)
  position: {
    x: number;      // 0-100 percentage from left
    y: number;      // 0-100 percentage from top
    anchor: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  };

  // Typography
  style: {
    fontFamily: string;
    fontSize: number;        // in pixels at 1080px width
    fontWeight: 400 | 500 | 600 | 700 | 800 | 900;
    color: string;
    letterSpacing?: number;  // em units
    textTransform?: 'none' | 'uppercase' | 'lowercase';
    lineHeight?: number;     // multiplier
  };

  // Optional background/container
  background?: {
    color: string;
    padding: number;         // pixels
    borderRadius?: number;   // pixels
    opacity?: number;        // 0-1
  };

  // Max width as percentage of image width
  maxWidth?: number;
}

export interface CompositorInput {
  baseImageUrl: string;
  templateId: string;
  textConfig: TextOverlayConfig;

  // Text content
  brandName: string;
  headline: string;
  subheadline?: string;
  cta?: string;
  price?: string;
  badge?: string;

  // Brand styling
  primaryColor: string;
  accentColor: string;
}

// ===========================================
// FONT CONFIGURATIONS
// ===========================================

const FONTS = {
  'bold-sans': {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 700 as const,
    letterSpacing: -0.02,
    textTransform: 'none' as const
  },
  'elegant-serif': {
    fontFamily: 'Playfair Display, Georgia, serif',
    fontWeight: 500 as const,
    letterSpacing: 0,
    textTransform: 'none' as const
  },
  'condensed': {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 800 as const,
    letterSpacing: -0.02,
    textTransform: 'uppercase' as const
  },
  'magazine': {
    fontFamily: 'Playfair Display, Georgia, serif',
    fontWeight: 600 as const,
    letterSpacing: 0.05,
    textTransform: 'uppercase' as const
  }
};

// ===========================================
// POSITION CALCULATIONS
// ===========================================

function getBrandPosition(position: 'top-left' | 'top-right' | 'bottom-left'): TextLayer['position'] {
  switch (position) {
    case 'top-left':
      return { x: 5, y: 5, anchor: 'top-left' };
    case 'top-right':
      return { x: 95, y: 5, anchor: 'top-right' };
    case 'bottom-left':
      return { x: 5, y: 95, anchor: 'bottom-left' };
  }
}

function getHeadlinePosition(position: 'top' | 'center' | 'bottom'): TextLayer['position'] {
  switch (position) {
    case 'top':
      return { x: 50, y: 15, anchor: 'top-center' };
    case 'center':
      return { x: 50, y: 50, anchor: 'center' };
    case 'bottom':
      return { x: 50, y: 85, anchor: 'bottom-center' };
  }
}

function getCtaPosition(headlinePosition: 'top' | 'center' | 'bottom'): TextLayer['position'] {
  // CTA appears below or near headline
  switch (headlinePosition) {
    case 'top':
      return { x: 50, y: 28, anchor: 'top-center' };
    case 'center':
      return { x: 50, y: 62, anchor: 'center' };
    case 'bottom':
      return { x: 50, y: 92, anchor: 'bottom-center' };
  }
}

// ===========================================
// COLOR UTILITIES
// ===========================================

function getContrastColor(theme: 'light-on-dark' | 'dark-on-light' | 'auto'): string {
  // For 'auto', default to light-on-dark (works better for most fashion images)
  if (theme === 'dark-on-light') {
    return '#1a1a1a';
  }
  return '#ffffff';
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ===========================================
// MAIN COMPOSITOR FUNCTION
// ===========================================

/**
 * Create a composition specification for text overlays.
 * This spec can be used by the frontend to render text on images.
 */
export function createCompositionSpec(input: CompositorInput): CompositionSpec {
  const {
    baseImageUrl,
    textConfig,
    brandName,
    headline,
    subheadline,
    cta,
    price,
    badge,
    primaryColor,
    accentColor
  } = input;

  const layers: TextLayer[] = [];
  const textColor = getContrastColor(textConfig.overlayTheme);
  const fontConfig = FONTS[textConfig.headlineStyle];

  // Layer 1: Brand name (always present)
  if (brandName) {
    layers.push({
      id: 'brand',
      type: 'brand',
      text: brandName,
      position: getBrandPosition(textConfig.brandPosition),
      style: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 14,
        fontWeight: 500,
        color: textColor,
        letterSpacing: 0.1,
        textTransform: 'uppercase'
      },
      maxWidth: 30
    });
  }

  // Layer 2: Headline (primary message)
  if (headline) {
    layers.push({
      id: 'headline',
      type: 'headline',
      text: headline,
      position: getHeadlinePosition(textConfig.headlinePosition),
      style: {
        fontFamily: fontConfig.fontFamily,
        fontSize: 48,
        fontWeight: fontConfig.fontWeight,
        color: textColor,
        letterSpacing: fontConfig.letterSpacing,
        textTransform: fontConfig.textTransform,
        lineHeight: 1.1
      },
      maxWidth: 85
    });
  }

  // Layer 3: Subheadline (if provided)
  if (subheadline) {
    const subPosition = { ...getHeadlinePosition(textConfig.headlinePosition) };
    // Offset below headline
    subPosition.y += textConfig.headlinePosition === 'bottom' ? -8 : 12;

    layers.push({
      id: 'subheadline',
      type: 'subheadline',
      text: subheadline,
      position: subPosition,
      style: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 18,
        fontWeight: 400,
        color: textColor,
        letterSpacing: 0,
        lineHeight: 1.4
      },
      maxWidth: 70
    });
  }

  // Layer 4: Badge (if provided - for social proof)
  if (badge) {
    layers.push({
      id: 'badge',
      type: 'badge',
      text: badge,
      position: { x: 95, y: 10, anchor: 'top-right' },
      style: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 12,
        fontWeight: 600,
        color: '#1a1a1a',
        letterSpacing: 0.02
      },
      background: {
        color: '#fbbf24', // Gold
        padding: 8,
        borderRadius: 4
      },
      maxWidth: 25
    });
  }

  // Layer 5: Price (if provided)
  if (price) {
    layers.push({
      id: 'price',
      type: 'price',
      text: price,
      position: { x: 50, y: textConfig.headlinePosition === 'bottom' ? 75 : 70, anchor: 'center' },
      style: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 24,
        fontWeight: 600,
        color: textColor,
        letterSpacing: -0.01
      },
      maxWidth: 30
    });
  }

  // Layer 6: CTA (call-to-action)
  if (cta) {
    const ctaLayer: TextLayer = {
      id: 'cta',
      type: 'cta',
      text: cta,
      position: getCtaPosition(textConfig.headlinePosition),
      style: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 14,
        fontWeight: 600,
        color: textConfig.ctaStyle === 'pill-button' ? '#ffffff' : textColor,
        letterSpacing: 0.02,
        textTransform: 'uppercase'
      },
      maxWidth: 40
    };

    // Add background for pill button style
    if (textConfig.ctaStyle === 'pill-button') {
      ctaLayer.background = {
        color: accentColor || primaryColor,
        padding: 12,
        borderRadius: 24
      };
    } else if (textConfig.ctaStyle === 'text-arrow') {
      ctaLayer.text = `${cta} →`;
    }

    layers.push(ctaLayer);
  }

  return {
    baseImageUrl,
    width: 1080,
    height: 1350, // 4:5 aspect ratio
    layers,
    theme: textConfig.overlayTheme,
    primaryColor,
    accentColor
  };
}

// ===========================================
// SIMPLIFIED OVERLAY FUNCTION
// ===========================================

/**
 * Create a simple composition spec with minimal inputs.
 * Uses sensible defaults for most fashion ads.
 */
export function createSimpleOverlay(
  baseImageUrl: string,
  brandName: string,
  headline: string,
  options?: {
    cta?: string;
    theme?: 'light-on-dark' | 'dark-on-light';
    primaryColor?: string;
    accentColor?: string;
  }
): CompositionSpec {
  const theme = options?.theme || 'light-on-dark';
  const textColor = theme === 'dark-on-light' ? '#1a1a1a' : '#ffffff';

  return {
    baseImageUrl,
    width: 1080,
    height: 1350,
    layers: [
      {
        id: 'brand',
        type: 'brand',
        text: brandName,
        position: { x: 5, y: 5, anchor: 'top-left' },
        style: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          fontWeight: 500,
          color: textColor,
          letterSpacing: 0.1,
          textTransform: 'uppercase'
        },
        maxWidth: 30
      },
      {
        id: 'headline',
        type: 'headline',
        text: headline,
        position: { x: 50, y: 85, anchor: 'bottom-center' },
        style: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 42,
          fontWeight: 700,
          color: textColor,
          letterSpacing: -0.02,
          lineHeight: 1.1
        },
        maxWidth: 85
      },
      ...(options?.cta ? [{
        id: 'cta',
        type: 'cta' as const,
        text: options.cta,
        position: { x: 50, y: 93, anchor: 'bottom-center' as const },
        style: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          fontWeight: 600 as const,
          color: '#ffffff',
          letterSpacing: 0.02,
          textTransform: 'uppercase' as const
        },
        background: {
          color: options.accentColor || options.primaryColor || '#1a1a1a',
          padding: 12,
          borderRadius: 24
        },
        maxWidth: 40
      }] : [])
    ],
    theme,
    primaryColor: options?.primaryColor || '#1a1a1a',
    accentColor: options?.accentColor || '#1a1a1a'
  };
}

// ===========================================
// CSS GENERATION FOR FRONTEND
// ===========================================

/**
 * Generate CSS styles for a text layer.
 * Can be used by frontend to render overlays.
 */
export function layerToCSS(layer: TextLayer, imageWidth: number, imageHeight: number): Record<string, string> {
  const scale = imageWidth / 1080; // Scale based on reference width

  const styles: Record<string, string> = {
    position: 'absolute',
    fontFamily: layer.style.fontFamily,
    fontSize: `${Math.round(layer.style.fontSize * scale)}px`,
    fontWeight: layer.style.fontWeight.toString(),
    color: layer.style.color,
    letterSpacing: layer.style.letterSpacing ? `${layer.style.letterSpacing}em` : 'normal',
    textTransform: layer.style.textTransform || 'none',
    lineHeight: layer.style.lineHeight?.toString() || '1.2',
    maxWidth: layer.maxWidth ? `${layer.maxWidth}%` : 'none',
    textAlign: 'center',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  };

  // Position based on anchor
  const { x, y, anchor } = layer.position;

  switch (anchor) {
    case 'top-left':
      styles.left = `${x}%`;
      styles.top = `${y}%`;
      styles.transform = 'none';
      styles.textAlign = 'left';
      break;
    case 'top-center':
      styles.left = `${x}%`;
      styles.top = `${y}%`;
      styles.transform = 'translateX(-50%)';
      break;
    case 'top-right':
      styles.right = `${100 - x}%`;
      styles.top = `${y}%`;
      styles.transform = 'none';
      styles.textAlign = 'right';
      break;
    case 'center':
      styles.left = `${x}%`;
      styles.top = `${y}%`;
      styles.transform = 'translate(-50%, -50%)';
      break;
    case 'bottom-left':
      styles.left = `${x}%`;
      styles.bottom = `${100 - y}%`;
      styles.transform = 'none';
      styles.textAlign = 'left';
      break;
    case 'bottom-center':
      styles.left = `${x}%`;
      styles.bottom = `${100 - y}%`;
      styles.transform = 'translateX(-50%)';
      break;
    case 'bottom-right':
      styles.right = `${100 - x}%`;
      styles.bottom = `${100 - y}%`;
      styles.transform = 'none';
      styles.textAlign = 'right';
      break;
  }

  // Background styles
  if (layer.background) {
    styles.backgroundColor = layer.background.opacity
      ? hexToRgba(layer.background.color, layer.background.opacity)
      : layer.background.color;
    styles.padding = `${Math.round(layer.background.padding * scale)}px`;
    if (layer.background.borderRadius) {
      styles.borderRadius = `${Math.round(layer.background.borderRadius * scale)}px`;
    }
  }

  return styles;
}

// ===========================================
// REACT COMPONENT PROPS GENERATOR
// ===========================================

/**
 * Convert CompositionSpec to props for a React overlay component.
 * The frontend can use this to render text layers.
 */
export function specToReactProps(spec: CompositionSpec): {
  baseImageUrl: string;
  layers: Array<{
    id: string;
    text: string;
    className: string;
    style: Record<string, string>;
  }>;
} {
  return {
    baseImageUrl: spec.baseImageUrl,
    layers: spec.layers.map(layer => ({
      id: layer.id,
      text: layer.text,
      className: `ad-text ad-text--${layer.type}`,
      style: layerToCSS(layer, spec.width, spec.height)
    }))
  };
}
