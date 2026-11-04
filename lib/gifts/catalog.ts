// lib/gifts/catalog.ts
export interface CatalogItem {
  id: string
  kind: 'note' | 'card' | 'flowers' | 'food' | 'book' | 'gift_card' | 'basket'
  title: string
  description: string
  price_cents: number
  platform_fee_pct: number // 0 for notes, 0 for cards (flat fee), 15 for goods
  flat_fee_cents: number   // 499 for cards, 0 otherwise
  partner: string
  requires_address: boolean
  requires_email: boolean
  image_emoji: string
}

export const GIFT_CATALOG: CatalogItem[] = [
  // Notes (free)
  { id: 'note-email', kind: 'note', title: 'Personal Note', description: 'A heartfelt message delivered by email with a shareable link', price_cents: 0, platform_fee_pct: 0, flat_fee_cents: 0, partner: 'stub', requires_address: false, requires_email: true, image_emoji: '💌' },

  // Cards ($4.99 flat, printed + mailed)
  { id: 'card-birthday', kind: 'card', title: 'Birthday Card', description: 'Printed birthday card mailed with your message', price_cents: 499, platform_fee_pct: 0, flat_fee_cents: 499, partner: 'stub', requires_address: true, requires_email: false, image_emoji: '🎂' },
  { id: 'card-thinking', kind: 'card', title: 'Thinking of You Card', description: 'Printed card mailed with your personal message', price_cents: 499, platform_fee_pct: 0, flat_fee_cents: 499, partner: 'stub', requires_address: true, requires_email: false, image_emoji: '💛' },
  { id: 'card-anniversary', kind: 'card', title: 'Anniversary Card', description: 'Printed anniversary card mailed with your message', price_cents: 499, platform_fee_pct: 0, flat_fee_cents: 499, partner: 'stub', requires_address: true, requires_email: false, image_emoji: '💍' },

  // Flowers
  { id: 'flowers-classic', kind: 'flowers', title: 'Classic Bouquet', description: 'Cheerful mixed flowers delivered to their door', price_cents: 5999, platform_fee_pct: 15, flat_fee_cents: 0, partner: 'stub', requires_address: true, requires_email: false, image_emoji: '🌷' },
  { id: 'flowers-garden', kind: 'flowers', title: 'Garden Arrangement', description: 'Lush garden-style arrangement with seasonal blooms', price_cents: 7999, platform_fee_pct: 15, flat_fee_cents: 0, partner: 'stub', requires_address: true, requires_email: false, image_emoji: '🌸' },

  // Food
  { id: 'food-cookies', kind: 'food', title: 'Cookie Gift Tin', description: 'Assorted gourmet cookies in a keepsake tin', price_cents: 3999, platform_fee_pct: 15, flat_fee_cents: 0, partner: 'stub', requires_address: true, requires_email: false, image_emoji: '🍪' },
  { id: 'food-choc', kind: 'food', title: 'Chocolate Box', description: 'Artisan chocolates — something sweet to celebrate', price_cents: 4499, platform_fee_pct: 15, flat_fee_cents: 0, partner: 'stub', requires_address: true, requires_email: false, image_emoji: '🍫' },

  // Books
  { id: 'book-memoir', kind: 'book', title: 'Bestselling Memoir', description: 'Curated bestseller — we pick a highly-rated memoir', price_cents: 2499, platform_fee_pct: 15, flat_fee_cents: 0, partner: 'stub', requires_address: true, requires_email: false, image_emoji: '📖' },

  // Gift cards (always trigger approval gate if recipient unknown)
  { id: 'gc-amazon', kind: 'gift_card', title: 'Amazon Gift Card', description: 'Digital Amazon gift card emailed to recipient', price_cents: 2500, platform_fee_pct: 0, flat_fee_cents: 0, partner: 'stub', requires_address: false, requires_email: true, image_emoji: '🎁' },
  { id: 'gc-starbucks', kind: 'gift_card', title: 'Starbucks Gift Card', description: 'Digital Starbucks gift card emailed to recipient', price_cents: 2500, platform_fee_pct: 0, flat_fee_cents: 0, partner: 'stub', requires_address: false, requires_email: true, image_emoji: '☕' },

  // Baskets
  { id: 'basket-comfort', kind: 'basket', title: 'Comfort & Care Basket', description: 'Tea, snacks, cozy socks, and a hand-written card', price_cents: 8999, platform_fee_pct: 15, flat_fee_cents: 0, partner: 'stub', requires_address: true, requires_email: false, image_emoji: '🧺' },
]

export function calculateOrderTotals(item: CatalogItem, quantity = 1) {
  const subtotal = item.price_cents * quantity
  const platform_fee = item.flat_fee_cents > 0
    ? item.flat_fee_cents
    : Math.round(subtotal * item.platform_fee_pct / 100)
  return {
    subtotal_cents: subtotal,
    platform_fee_cents: platform_fee,
    total_cents: subtotal + platform_fee,
  }
}

export function requiresFamilyApproval(item: CatalogItem, totalCents: number, recipientInFamily: boolean): boolean {
  if (item.kind === 'gift_card' && !recipientInFamily) return true
  if (totalCents > 7500) return true  // over $75
  return false
}