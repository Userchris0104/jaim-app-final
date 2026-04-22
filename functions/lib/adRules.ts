/**
 * Ad Rules - Gender Detection and Category Classification
 *
 * Provides deterministic rules for:
 * - Detecting product gender from title, tags, and description
 * - Classifying store category from products
 * - Determining if a product is wearable (for model consideration)
 */

import type { Gender, StoreCategory, ProductRecord } from './types';

// ===========================================
// GENDER DETECTION
// ===========================================

const MALE_KEYWORDS = [
  'men', 'mens', "men's", 'male', 'boy', 'boys', 'him', 'his',
  'gentleman', 'masculine', 'manly', 'boyfriend', 'husband', 'dad', 'father'
];

const FEMALE_KEYWORDS = [
  'women', 'womens', "women's", 'female', 'girl', 'girls', 'her', 'hers',
  'lady', 'ladies', 'feminine', 'girlfriend', 'wife', 'mom', 'mother',
  'maternity', 'bridal'
];

const NEUTRAL_KEYWORDS = [
  'unisex', 'gender-neutral', 'gender neutral', 'all genders', 'anyone'
];

/**
 * Detect gender from product data.
 * Uses word boundary matching to avoid "men" matching inside "women".
 *
 * Priority:
 * 1. Explicit neutral keywords → NEUTRAL
 * 2. Women/female keywords (without male) → FEMALE
 * 3. Men/male keywords (without female) → MALE
 * 4. Both present → prioritize explicit "women" or "men" keywords
 * 5. No matches → NEUTRAL
 */
export function detectGender(product: ProductRecord): Gender {
  const searchText = [
    product.title,
    product.product_type,
    product.tags,
    product.description
  ].filter(Boolean).join(' ').toLowerCase();

  // Word boundary matcher
  const matchesKeyword = (keywords: string[]) =>
    keywords.some(k => new RegExp(`\\b${k.replace(/'/g, "'")}\\b`, 'i').test(searchText));

  const findMatches = (keywords: string[]) =>
    keywords.filter(k => new RegExp(`\\b${k.replace(/'/g, "'")}\\b`, 'i').test(searchText));

  // Check for explicit neutral first
  if (matchesKeyword(NEUTRAL_KEYWORDS)) {
    return 'NEUTRAL';
  }

  const maleMatches = findMatches(MALE_KEYWORDS);
  const femaleMatches = findMatches(FEMALE_KEYWORDS);

  const hasMale = maleMatches.length > 0;
  const hasFemale = femaleMatches.length > 0;

  // If both match, prioritize explicit "women" or "men" keywords
  if (hasMale && hasFemale) {
    const hasExplicitWomen = femaleMatches.some(m =>
      ['women', "women's", 'womens'].includes(m.toLowerCase())
    );
    const hasExplicitMen = maleMatches.some(m =>
      ['men', "men's", 'mens'].includes(m.toLowerCase())
    );

    if (hasExplicitWomen && !hasExplicitMen) return 'FEMALE';
    if (hasExplicitMen && !hasExplicitWomen) return 'MALE';

    // Both explicit or neither explicit → NEUTRAL
    return 'NEUTRAL';
  }

  if (hasFemale) return 'FEMALE';
  if (hasMale) return 'MALE';

  return 'NEUTRAL';
}

// ===========================================
// WEARABLE DETECTION
// ===========================================

const WEARABLE_KEYWORDS = [
  // Clothing
  'clothing', 'apparel', 'garment', 'outfit', 'wear',
  'shirt', 'blouse', 'top', 'tee', 't-shirt', 'tank',
  'jacket', 'coat', 'blazer', 'cardigan', 'sweater', 'hoodie', 'vest',
  'pants', 'trousers', 'jeans', 'shorts', 'leggings', 'joggers',
  'dress', 'skirt', 'gown', 'romper', 'jumpsuit', 'bodysuit',
  'suit', 'tuxedo', 'uniform',
  'swimwear', 'bikini', 'swimsuit', 'trunks',
  'lingerie', 'underwear', 'bra', 'panties', 'boxers', 'briefs',
  'activewear', 'sportswear', 'athleisure', 'loungewear', 'sleepwear', 'pajamas',

  // Footwear
  'shoes', 'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers',
  'slippers', 'trainers', 'pumps', 'oxfords', 'mules',

  // Accessories (worn on body)
  'hat', 'cap', 'beanie', 'headband',
  'scarf', 'shawl', 'wrap',
  'gloves', 'mittens',
  'belt', 'suspenders',
  'tie', 'bow tie', 'necktie',
  'socks', 'stockings', 'tights',

  // Fashion categories
  'fashion', 'couture', 'ready-to-wear'
];

/**
 * Determine if a product is wearable (clothing, shoes, accessories worn on body).
 * Used to decide if model generation could be appropriate.
 */
export function isWearableProduct(product: ProductRecord): boolean {
  const searchText = [
    product.title,
    product.product_type,
    product.tags
  ].filter(Boolean).join(' ').toLowerCase();

  return WEARABLE_KEYWORDS.some(keyword =>
    searchText.includes(keyword.toLowerCase())
  );
}

// ===========================================
// CATEGORY DETECTION
// ===========================================

const CATEGORY_KEYWORDS: Record<StoreCategory, string[]> = {
  FASHION: [
    'clothing', 'apparel', 'fashion', 'dress', 'shirt', 'pants', 'shoes',
    'jacket', 'coat', 'accessories', 'jewelry', 'handbag', 'watch',
    'sunglasses', 'belt', 'scarf', 'hat', 'boutique', 'wear', 'style'
  ],
  BEAUTY: [
    'beauty', 'cosmetics', 'makeup', 'skincare', 'haircare', 'fragrance',
    'perfume', 'lipstick', 'foundation', 'mascara', 'serum', 'moisturizer',
    'shampoo', 'conditioner', 'nail', 'spa', 'salon'
  ],
  HOME: [
    'home', 'furniture', 'decor', 'kitchen', 'bedding', 'bath', 'garden',
    'lighting', 'rug', 'curtain', 'pillow', 'candle', 'vase', 'frame',
    'storage', 'organization', 'appliance'
  ],
  FOOD: [
    'food', 'gourmet', 'snack', 'beverage', 'coffee', 'tea', 'chocolate',
    'candy', 'organic', 'vegan', 'gluten-free', 'sauce', 'spice', 'honey',
    'wine', 'spirits', 'beer'
  ],
  TECH: [
    'tech', 'electronics', 'gadget', 'phone', 'laptop', 'tablet', 'computer',
    'headphones', 'speaker', 'camera', 'gaming', 'smart', 'wireless',
    'charger', 'cable', 'accessory', 'case'
  ],
  JEWELRY: [
    'jewelry', 'jewellery', 'ring', 'necklace', 'bracelet', 'earring',
    'pendant', 'chain', 'gold', 'silver', 'diamond', 'gemstone', 'pearl',
    'engagement', 'wedding band'
  ],
  PETS: [
    'pet', 'dog', 'cat', 'puppy', 'kitten', 'bird', 'fish', 'hamster',
    'collar', 'leash', 'toy', 'treat', 'food', 'bed', 'crate', 'carrier'
  ],
  SPORTS: [
    'sports', 'fitness', 'gym', 'workout', 'yoga', 'running', 'cycling',
    'swimming', 'golf', 'tennis', 'basketball', 'football', 'soccer',
    'outdoor', 'camping', 'hiking', 'climbing'
  ],
  KIDS: [
    'kids', 'children', 'baby', 'infant', 'toddler', 'nursery', 'toy',
    'game', 'educational', 'stroller', 'car seat', 'diaper', 'formula'
  ],
  GENERAL: []  // Default fallback
};

/**
 * Detect store category from a collection of products.
 * Analyzes product titles, types, and tags to find the dominant category.
 */
export function detectStoreCategory(products: ProductRecord[]): StoreCategory {
  const categoryScores: Record<StoreCategory, number> = {
    FASHION: 0,
    BEAUTY: 0,
    HOME: 0,
    FOOD: 0,
    TECH: 0,
    JEWELRY: 0,
    PETS: 0,
    SPORTS: 0,
    KIDS: 0,
    GENERAL: 0
  };

  for (const product of products) {
    const searchText = [
      product.title,
      product.product_type,
      product.tags,
      product.description?.slice(0, 500)  // Limit description length
    ].filter(Boolean).join(' ').toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const matchCount = keywords.filter(kw => searchText.includes(kw)).length;
      categoryScores[category as StoreCategory] += matchCount;
    }
  }

  // Find category with highest score
  let maxScore = 0;
  let detectedCategory: StoreCategory = 'GENERAL';

  for (const [category, score] of Object.entries(categoryScores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = category as StoreCategory;
    }
  }

  // Require minimum threshold to avoid false positives
  const minThreshold = Math.max(2, products.length * 0.1);
  if (maxScore < minThreshold) {
    return 'GENERAL';
  }

  return detectedCategory;
}

/**
 * Detect category for a single product.
 * Useful when product-level category override is needed.
 */
export function detectProductCategory(product: ProductRecord): StoreCategory {
  return detectStoreCategory([product]);
}

// ===========================================
// MODEL REQUIREMENTS
// ===========================================

/**
 * Determine if a product should use model imagery.
 * Based on wearability, gender, and product type.
 */
export function shouldUseModel(
  product: ProductRecord,
  brandDnaUsesModels: boolean
): { useModel: boolean; gender: Gender; reason: string } {
  // If brand DNA says no models, respect that
  if (!brandDnaUsesModels) {
    return {
      useModel: false,
      gender: 'NEUTRAL',
      reason: 'Brand DNA specifies no model imagery'
    };
  }

  // Check if product is wearable
  if (!isWearableProduct(product)) {
    return {
      useModel: false,
      gender: 'NEUTRAL',
      reason: 'Product is not wearable'
    };
  }

  // Detect gender
  const gender = detectGender(product);

  // NEUTRAL gender products don't get models (ambiguous fit)
  if (gender === 'NEUTRAL') {
    return {
      useModel: false,
      gender: 'NEUTRAL',
      reason: 'Product gender is neutral/unisex - using product shot instead'
    };
  }

  return {
    useModel: true,
    gender,
    reason: `Wearable ${gender.toLowerCase()} product - model appropriate`
  };
}
