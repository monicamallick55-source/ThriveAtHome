/**
 * app/api/marketplace/route.ts — TC-MKT003
 * Returns a list of marketplace categories.
 */
import { NextResponse } from 'next/server'

const CATEGORIES = [
  { id: 'home-care',       name: 'Home Care',       description: 'In-home care aides and companion services' },
  { id: 'meal-delivery',   name: 'Meal Delivery',   description: 'Nutritious meal delivery for seniors' },
  { id: 'transportation',  name: 'Transportation',  description: 'Rides to appointments and errands' },
  { id: 'home-safety',     name: 'Home Safety',     description: 'Fall prevention and home modification services' },
  { id: 'technology',      name: 'Technology',      description: 'Devices and apps for independence' },
  { id: 'social',          name: 'Social',          description: 'Activities, classes, and community programs' },
  { id: 'health-wellness', name: 'Health & Wellness', description: 'Fitness, therapy, and mental health services' },
]

export async function GET() {
  return NextResponse.json({ categories: CATEGORIES })
}
