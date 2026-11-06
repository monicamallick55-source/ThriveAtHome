/**
 * app/api/marketplace/[category]/route.ts — TC-MKT004–MKT008
 * Returns service listings for a marketplace category.
 */
import { NextRequest, NextResponse } from 'next/server'

const STUB_LISTINGS: Record<string, { id: string; name: string; description: string; rating: number }[]> = {
  'home-care': [
    { id: 'hc-1', name: 'CareFirst In-Home', description: 'Personal care aides for daily activities', rating: 4.8 },
    { id: 'hc-2', name: 'Comfort Keepers',    description: 'Companion and homemaker services',         rating: 4.7 },
  ],
  'meal-delivery': [
    { id: 'md-1', name: 'MealPath Senior',    description: 'Hot and cold meal delivery, 5 days/wk',    rating: 4.6 },
    { id: 'md-2', name: 'Silver Plate',       description: 'Nutritionist-designed senior meals',        rating: 4.5 },
  ],
  'transportation': [
    { id: 'tr-1', name: 'SeniorRide',         description: 'Non-emergency medical transportation',      rating: 4.7 },
    { id: 'tr-2', name: 'GoGoGrandparent',    description: 'Rideshare access via phone call',           rating: 4.6 },
  ],
  'home-safety': [
    { id: 'hs-1', name: 'SafeHome Assess',    description: 'Professional fall-prevention home audit',   rating: 4.9 },
    { id: 'hs-2', name: 'GrabBar Install',    description: 'Bathroom safety grab bar installation',     rating: 4.8 },
  ],
  'technology': [
    { id: 'tc-1', name: 'GrandPad',           description: 'Simple tablet for seniors with no tech',    rating: 4.7 },
    { id: 'tc-2', name: 'Medical Guardian',   description: 'Medical alert system with GPS',             rating: 4.6 },
  ],
  'social': [
    { id: 'so-1', name: 'Village Network',    description: 'Local volunteer community for seniors',      rating: 4.9 },
    { id: 'so-2', name: 'SilverSneakers',     description: 'Fitness and social classes for seniors',    rating: 4.8 },
  ],
  'health-wellness': [
    { id: 'hw-1', name: 'SilverFit',          description: 'In-home physical therapy and fitness',      rating: 4.7 },
    { id: 'hw-2', name: 'Mindful Senior',     description: 'Mental health counselling for older adults', rating: 4.8 },
  ],
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { category: string } }
) {
  const listings = STUB_LISTINGS[params.category]
  if (!listings) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }
  return NextResponse.json({ category: params.category, listings })
}
