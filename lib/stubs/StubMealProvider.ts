// Stub implementation — logs meal orders, no real deliveries. Replaced in M17 with InstacartMealProvider.
import type { MealProvider, MealOrder } from '../interfaces/MealProvider'

export class StubMealProvider implements MealProvider {
  async placeMealOrder(order: MealOrder): Promise<{ orderId: string }> {
    console.log(`[STUB][Meal] Would place order from ${order.providerName} for member: ${order.memberId}`)
    return { orderId: `stub-order-${Date.now()}` }
  }
  async cancelMealOrder(orderId: string): Promise<void> {
    console.log(`[STUB][Meal] Would cancel order: ${orderId}`)
  }
  async getOrderStatus(orderId: string): Promise<string> {
    console.log(`[STUB][Meal] Would get status for order: ${orderId}`)
    return 'confirmed'
  }
}
