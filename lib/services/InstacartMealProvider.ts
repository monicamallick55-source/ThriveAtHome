// Placeholder — real implementation added in M17
import type { MealProvider, MealOrder } from '../interfaces/MealProvider'

export class InstacartMealProvider implements MealProvider {
  async placeMealOrder(_order: MealOrder): Promise<{ orderId: string }> {
    throw new Error('[InstacartMealProvider] Not yet implemented — add in M17')
  }
  async cancelMealOrder(_orderId: string): Promise<void> {
    throw new Error('[InstacartMealProvider] Not yet implemented — add in M17')
  }
  async getOrderStatus(_orderId: string): Promise<string> {
    throw new Error('[InstacartMealProvider] Not yet implemented — add in M17')
  }
}
