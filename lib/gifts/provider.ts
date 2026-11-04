/**
 * lib/gifts/provider.ts — G7.3 Goods Provider (stub)
 *
 * Wraps fulfillment partner API calls.
 * All partners are 'stub' until LLC is formed and contracts signed.
 */

import { CatalogItem } from './catalog'

export type PlaceOrderParams = {
  recipientName: string
  recipientEmail?: string
  giftOrderId: string
  catalogItemId: string
  personalization?: string | null
  quantity?: number
}

export type PlaceOrderResult = {
  success: boolean
  estimatedDelivery?: string
  trackingNumber?: string
  carrier?: string
  error?: string
}

export interface GoodsProvider {
  placeOrder(params: PlaceOrderParams): Promise<PlaceOrderResult>
}

class StubGoodsProvider implements GoodsProvider {
  async placeOrder(params: PlaceOrderParams): Promise<PlaceOrderResult> {
    console.info('[GoodsProvider] STUB placeOrder', params)
    // Simulate success with fake tracking
    return {
      success: true,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      trackingNumber: `STUB-${params.giftOrderId.slice(0, 8).toUpperCase()}`,
      carrier: 'USPS',
    }
  }
}

export const goodsProvider: GoodsProvider = new StubGoodsProvider()