// Interface for sending physical gifts and cards to members and their families.

export interface GoodsProvider {
  sendBirthdayCard(recipientAddress: string, message: string, senderName: string): Promise<void>
  orderPhotoBook(memberId: string, images: string[], dedicationText: string): Promise<void>
  sendFlowers(recipientAddress: string, occasionNote: string): Promise<void>
}
