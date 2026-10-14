// lib/gifts/catalog.ts
// G7.3 — Curated gift catalog for senior-to-family gift sending

export interface GiftItem {
  id: string
  type: string  // gift_orders.gift_type enum value
  label: string
  description: string
  amountCents: number | null  // null = free (just a card message)
  emoji: string
  category: 'card' | 'flowers' | 'food' | 'experience' | 'keepsake'
  digitalDelivery: boolean
}

export const GIFT_CATALOG: GiftItem[] = [
  {
    id: 'greeting_card_free',
    type: 'greeting_card',
    label: 'Heartfelt card message',
    description: 'Send a warm written message delivered to your family member\'s inbox.',
    amountCents: null,
    emoji: '💌',
    category: 'card',
    digitalDelivery: true,
  },
  {
    id: 'greeting_card_physical',
    type: 'greeting_card',
    label: 'Physical greeting card',
    description: 'A beautiful card printed and mailed to your family member.',
    amountCents: 999,
    emoji: '✉️',
    category: 'card',
    digitalDelivery: false,
  },
  {
    id: 'flower_bouquet_classic',
    type: 'flower_bouquet',
    label: 'Classic flower bouquet',
    description: 'A seasonal arrangement of fresh flowers delivered to their door.',
    amountCents: 4999,
    emoji: '💐',
    category: 'flowers',
    digitalDelivery: false,
  },
  {
    id: 'flower_bouquet_premium',
    type: 'flower_bouquet',
    label: 'Premium bouquet with vase',
    description: 'An elegant arrangement with a keepsake vase, delivered same-day when possible.',
    amountCents: 7999,
    emoji: '🌸',
    category: 'flowers',
    digitalDelivery: false,
  },
  {
    id: 'gift_basket_sweet',
    type: 'gift_basket',
    label: 'Sweet treats basket',
    description: 'Chocolates, cookies, and treats in a reusable basket.',
    amountCents: 5999,
    emoji: '🧺',
    category: 'food',
    digitalDelivery: false,
  },
  {
    id: 'gift_basket_gourmet',
    type: 'gift_basket',
    label: 'Gourmet food basket',
    description: 'Artisan cheeses, crackers, nuts, and preserves.',
    amountCents: 8999,
    emoji: '🍇',
    category: 'food',
    digitalDelivery: false,
  },
  {
    id: 'meal_delivery',
    type: 'meal_delivery',
    label: 'Home-cooked meal delivery',
    description: 'A chef-prepared meal delivered fresh for a family dinner.',
    amountCents: 9999,
    emoji: '🍱',
    category: 'food',
    digitalDelivery: false,
  },
  {
    id: 'photo_book',
    type: 'photo_book',
    label: 'Family photo book',
    description: 'A printed 20-page photo book — upload your own photos and we handle the rest.',
    amountCents: 3999,
    emoji: '📸',
    category: 'keepsake',
    digitalDelivery: false,
  },
  {
    id: 'donation_in_honor',
    type: 'donation_in_honor',
    label: 'Donation in their honor',
    description: 'We make a $25 donation to a cause they love in their name.',
    amountCents: 2500,
    emoji: '💝',
    category: 'experience',
    digitalDelivery: true,
  },
  {
    id: 'amazon_gift_card_25',
    type: 'amazon_gift_card',
    label: 'Amazon gift card — $25',
    description: 'Sent digitally to their email so they can choose exactly what they want.',
    amountCents: 2500,
    emoji: '🛍️',
    category: 'experience',
    digitalDelivery: true,
  },
  {
    id: 'book',
    type: 'book',
    label: 'Book they\'ll love',
    description: 'Tell us their interests and we\'ll pick a best-selling title and ship it to them.',
    amountCents: 1999,
    emoji: '📚',
    category: 'keepsake',
    digitalDelivery: false,
  },
  {
    id: 'plant',
    type: 'plant',
    label: 'Live succulent or plant',
    description: 'A low-maintenance plant that\'ll brighten their home for years.',
    amountCents: 3499,
    emoji: '🪴',
    category: 'keepsake',
    digitalDelivery: false,
  },
]

export function getGiftById(id: string): GiftItem | undefined {
  return GIFT_CATALOG.find((g) => g.id === id)
}

export function getGiftsByCategory(category: GiftItem['category']): GiftItem[] {
  return GIFT_CATALOG.filter((g) => g.category === category)
}
