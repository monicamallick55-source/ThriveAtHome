// Placeholder — real implementation added in M16
import type { GoodsProvider } from '../interfaces/GoodsProvider'

export class RealGoodsProvider implements GoodsProvider {
  async sendBirthdayCard(_recipientAddress: string, _message: string, _senderName: string): Promise<void> {
    throw new Error('[RealGoodsProvider] Not yet implemented — add in M16')
  }
  async orderPhotoBook(_memberId: string, _images: string[], _dedicationText: string): Promise<void> {
    throw new Error('[RealGoodsProvider] Not yet implemented — add in M16')
  }
  async sendFlowers(_recipientAddress: string, _occasionNote: string): Promise<void> {
    throw new Error('[RealGoodsProvider] Not yet implemented — add in M16')
  }
}
