// Stub implementation — logs goods orders, no real shipments. Replaced in M16 with RealGoodsProvider.
import type { GoodsProvider } from '../interfaces/GoodsProvider'

export class StubGoodsProvider implements GoodsProvider {
  async sendBirthdayCard(recipientAddress: string, message: string, senderName: string): Promise<void> {
    console.log(`[STUB][Goods] Would send birthday card from ${senderName} to ${recipientAddress.substring(0, 20)}...`)
    console.log(`[STUB][Goods] Message: "${message.substring(0, 60)}..."`)
  }
  async orderPhotoBook(memberId: string, images: string[], _dedicationText: string): Promise<void> {
    console.log(`[STUB][Goods] Would order photo book for member: ${memberId} with ${images.length} images`)
  }
  async sendFlowers(recipientAddress: string, occasionNote: string): Promise<void> {
    console.log(`[STUB][Goods] Would send flowers to ${recipientAddress.substring(0, 20)}...: ${occasionNote.substring(0, 60)}`)
  }
}
