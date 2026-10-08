// lib/home-safety/checklist.ts
// Shared checklist constant — safe to import in both server and client components

export const SAFETY_CHECKLIST: Record<string, { key: string; label: string }[]> = {
  'Living Areas': [
    { key: 'loose_rugs', label: 'Loose rugs and cords secured' },
    { key: 'night_lighting', label: 'Night lighting from bedroom to bathroom' },
    { key: 'phone_reachable', label: 'Phone reachable from the floor' },
    { key: 'emergency_numbers', label: 'Emergency numbers posted' },
  ],
  'Bathroom': [
    { key: 'grab_bars_toilet', label: 'Grab bars at toilet' },
    { key: 'grab_bars_shower', label: 'Grab bars at shower/tub' },
    { key: 'non_slip_mats', label: 'Non-slip bath mats' },
  ],
  'Stairs & Entrances': [
    { key: 'stair_rails_both', label: 'Stair rails on both sides' },
    { key: 'entry_lighting', label: 'Working lights at entrances and stairs' },
    { key: 'house_number_visible', label: 'House number visible from street' },
  ],
  'Safety Equipment': [
    { key: 'smoke_alarms', label: 'Smoke alarms present, tested, batteries good' },
    { key: 'co_alarms', label: 'CO alarms present and functioning' },
    { key: 'fire_extinguisher', label: 'Fire extinguisher accessible' },
    { key: 'medication_storage', label: 'Medications stored safely' },
  ],
  'Earthquake Preparedness': [
    { key: 'water_heater_strapped', label: 'Water heater strapped to wall' },
    { key: 'tall_furniture_anchored', label: 'Tall furniture/bookcases anchored' },
    { key: 'heavy_items_low', label: 'Heavy items stored low' },
    { key: 'gas_shutoff_known', label: 'Gas shut-off location known, wrench present' },
    { key: 'cabinet_latches', label: 'Cabinet latches installed' },
    { key: 'emergency_water_food', label: 'Emergency water and food supply (72 hrs)' },
    { key: 'flashlight_by_bed', label: 'Flashlight accessible by bed' },
    { key: 'evacuation_route', label: 'Evacuation route and meeting place agreed' },
  ],
  'Storage': [
    { key: 'reachable_storage', label: 'Frequently used items in reachable storage' },
  ],
}
