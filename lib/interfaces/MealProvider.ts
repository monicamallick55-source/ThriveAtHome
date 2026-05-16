// Interface for ordering and managing meal deliveries for members.

export interface MealOrder {
  memberId: string
  providerName: string
  items: string[]
  deliveryDate: string
  deliveryAddress: string
  dietaryRestrictions: string[]
}

export interface MealProvider {
  placeMealOrder(order: MealOrder): Promise<{ orderId: string }>
  cancelMealOrder(orderId: string): Promise<void>
  getOrderStatus(orderId: string): Promise<string>
}
