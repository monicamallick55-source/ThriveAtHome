export interface CityPage {
  city: string
  state: string
  stateCode: string
  slug: string
  population: string
  seniorPct: string
}

export const CITY_PAGES: CityPage[] = [
  { city: 'New York', state: 'New York', stateCode: 'NY', slug: 'new-york', population: '8.3M', seniorPct: '14%' },
  { city: 'Los Angeles', state: 'California', stateCode: 'CA', slug: 'los-angeles', population: '3.9M', seniorPct: '13%' },
  { city: 'Chicago', state: 'Illinois', stateCode: 'IL', slug: 'chicago', population: '2.7M', seniorPct: '13%' },
  { city: 'Houston', state: 'Texas', stateCode: 'TX', slug: 'houston', population: '2.3M', seniorPct: '11%' },
  { city: 'Phoenix', state: 'Arizona', stateCode: 'AZ', slug: 'phoenix', population: '1.6M', seniorPct: '14%' },
  { city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA', slug: 'philadelphia', population: '1.6M', seniorPct: '15%' },
  { city: 'San Antonio', state: 'Texas', stateCode: 'TX', slug: 'san-antonio', population: '1.4M', seniorPct: '12%' },
  { city: 'San Diego', state: 'California', stateCode: 'CA', slug: 'san-diego', population: '1.4M', seniorPct: '14%' },
  { city: 'Dallas', state: 'Texas', stateCode: 'TX', slug: 'dallas', population: '1.3M', seniorPct: '11%' },
  { city: 'Jacksonville', state: 'Florida', stateCode: 'FL', slug: 'jacksonville', population: '949K', seniorPct: '16%' },
  { city: 'Austin', state: 'Texas', stateCode: 'TX', slug: 'austin', population: '978K', seniorPct: '10%' },
  { city: 'Fort Worth', state: 'Texas', stateCode: 'TX', slug: 'fort-worth', population: '918K', seniorPct: '11%' },
  { city: 'Columbus', state: 'Ohio', stateCode: 'OH', slug: 'columbus', population: '905K', seniorPct: '12%' },
  { city: 'Charlotte', state: 'North Carolina', stateCode: 'NC', slug: 'charlotte', population: '874K', seniorPct: '12%' },
  { city: 'Indianapolis', state: 'Indiana', stateCode: 'IN', slug: 'indianapolis', population: '887K', seniorPct: '13%' },
  { city: 'San Francisco', state: 'California', stateCode: 'CA', slug: 'san-francisco', population: '874K', seniorPct: '16%' },
  { city: 'Seattle', state: 'Washington', stateCode: 'WA', slug: 'seattle', population: '737K', seniorPct: '13%' },
  { city: 'Denver', state: 'Colorado', stateCode: 'CO', slug: 'denver', population: '715K', seniorPct: '13%' },
  { city: 'Nashville', state: 'Tennessee', stateCode: 'TN', slug: 'nashville', population: '689K', seniorPct: '13%' },
  { city: 'Oklahoma City', state: 'Oklahoma', stateCode: 'OK', slug: 'oklahoma-city', population: '681K', seniorPct: '13%' },
  { city: 'El Paso', state: 'Texas', stateCode: 'TX', slug: 'el-paso', population: '678K', seniorPct: '13%' },
  { city: 'Washington', state: 'District of Columbia', stateCode: 'DC', slug: 'washington', population: '689K', seniorPct: '12%' },
  { city: 'Las Vegas', state: 'Nevada', stateCode: 'NV', slug: 'las-vegas', population: '641K', seniorPct: '14%' },
  { city: 'Louisville', state: 'Kentucky', stateCode: 'KY', slug: 'louisville', population: '633K', seniorPct: '15%' },
  { city: 'Memphis', state: 'Tennessee', stateCode: 'TN', slug: 'memphis', population: '628K', seniorPct: '13%' },
  { city: 'Portland', state: 'Oregon', stateCode: 'OR', slug: 'portland', population: '652K', seniorPct: '14%' },
  { city: 'Baltimore', state: 'Maryland', stateCode: 'MD', slug: 'baltimore', population: '585K', seniorPct: '15%' },
  { city: 'Milwaukee', state: 'Wisconsin', stateCode: 'WI', slug: 'milwaukee', population: '577K', seniorPct: '13%' },
  { city: 'Albuquerque', state: 'New Mexico', stateCode: 'NM', slug: 'albuquerque', population: '564K', seniorPct: '15%' },
  { city: 'Tucson', state: 'Arizona', stateCode: 'AZ', slug: 'tucson', population: '542K', seniorPct: '16%' },
  { city: 'Fresno', state: 'California', stateCode: 'CA', slug: 'fresno', population: '542K', seniorPct: '12%' },
  { city: 'Sacramento', state: 'California', stateCode: 'CA', slug: 'sacramento', population: '524K', seniorPct: '13%' },
  { city: 'Mesa', state: 'Arizona', stateCode: 'AZ', slug: 'mesa', population: '511K', seniorPct: '16%' },
  { city: 'Kansas City', state: 'Missouri', stateCode: 'MO', slug: 'kansas-city', population: '508K', seniorPct: '14%' },
  { city: 'Atlanta', state: 'Georgia', stateCode: 'GA', slug: 'atlanta', population: '498K', seniorPct: '12%' },
  { city: 'Omaha', state: 'Nebraska', stateCode: 'NE', slug: 'omaha', population: '486K', seniorPct: '14%' },
  { city: 'Colorado Springs', state: 'Colorado', stateCode: 'CO', slug: 'colorado-springs', population: '478K', seniorPct: '14%' },
  { city: 'Raleigh', state: 'North Carolina', stateCode: 'NC', slug: 'raleigh', population: '467K', seniorPct: '11%' },
  { city: 'Long Beach', state: 'California', stateCode: 'CA', slug: 'long-beach', population: '466K', seniorPct: '13%' },
  { city: 'Virginia Beach', state: 'Virginia', stateCode: 'VA', slug: 'virginia-beach', population: '459K', seniorPct: '14%' },
  { city: 'Minneapolis', state: 'Minnesota', stateCode: 'MN', slug: 'minneapolis', population: '429K', seniorPct: '12%' },
  { city: 'Tampa', state: 'Florida', stateCode: 'FL', slug: 'tampa', population: '399K', seniorPct: '15%' },
  { city: 'New Orleans', state: 'Louisiana', stateCode: 'LA', slug: 'new-orleans', population: '383K', seniorPct: '14%' },
  { city: 'Arlington', state: 'Texas', stateCode: 'TX', slug: 'arlington', population: '394K', seniorPct: '11%' },
  { city: 'Bakersfield', state: 'California', stateCode: 'CA', slug: 'bakersfield', population: '380K', seniorPct: '12%' },
  { city: 'Honolulu', state: 'Hawaii', stateCode: 'HI', slug: 'honolulu', population: '350K', seniorPct: '18%' },
  { city: 'Anaheim', state: 'California', stateCode: 'CA', slug: 'anaheim', population: '346K', seniorPct: '13%' },
  { city: 'Aurora', state: 'Colorado', stateCode: 'CO', slug: 'aurora', population: '366K', seniorPct: '12%' },
  { city: 'Santa Ana', state: 'California', stateCode: 'CA', slug: 'santa-ana', population: '310K', seniorPct: '11%' },
  { city: 'Corpus Christi', state: 'Texas', stateCode: 'TX', slug: 'corpus-christi', population: '316K', seniorPct: '14%' },
]

export function getCityBySlug(stateCode: string, citySlug: string): CityPage | undefined {
  return CITY_PAGES.find(
    (c) => c.stateCode.toLowerCase() === stateCode.toLowerCase() && c.slug === citySlug
  )
}

export function getCitiesByState(stateCode: string): CityPage[] {
  return CITY_PAGES.filter((c: any) => c.stateCode.toLowerCase() === stateCode.toLowerCase())
}
