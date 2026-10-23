export interface ChecklistItem { text: string; note?: string }
export interface ChecklistSection { title: string; items: ChecklistItem[] }
export interface Checklist { slug: string; title: string; description: string; category: string; sections: ChecklistSection[]; relatedLinks?: { label: string; url: string }[] }
export const CHECKLIST_CATEGORIES = [
  { slug: 'home-safety', label: 'Home Safety', icon: '🏠' },
  { slug: 'legal-financial', label: 'Legal & Financial', icon: '⚖️' },
  { slug: 'caregiver', label: 'Caregiver Support', icon: '🤝' },
  { slug: 'smart-home-tech', label: 'Smart Home Tech', icon: '📱' },
  { slug: 'planning-daily-living', label: 'Planning & Daily Living', icon: '📋' },
  { slug: 'wellness-lifestyle', label: 'Wellness & Lifestyle', icon: '💚' },
  { slug: 'moving-downsizing', label: 'Moving & Downsizing', icon: '📦' },
]
export const CHECKLISTS: Checklist[] = [
  { slug:'senior-home-safety-checklist', title:'Senior Home Safety Checklist', description:'A room-by-room checklist to identify and fix the most common home hazards for older adults.', category:'home-safety', sections:[
    { title:'Entryways & Exterior', items:[{text:'Walkways clear of ice, leaves, and debris'},{text:'Porch and entry lighting adequate',note:'Motion-sensor lights are ideal'},{text:'Steps have sturdy handrails on both sides'},{text:'Threshold raised less than ½ inch'}]},
    { title:'Living Room & Hallways', items:[{text:'All rugs have non-slip backing or are removed'},{text:'Electrical cords tucked away, not crossing walkways'},{text:'Clear 36-inch pathway through all rooms'},{text:'Nightlights in all hallways'}]},
    { title:'Bathroom', items:[{text:'Grab bars installed next to toilet and in shower/tub',note:'Must be wall-stud anchored'},{text:'Non-slip mat in tub or shower'},{text:'Water heater set to 120°F to prevent scalding'},{text:'Shower chair or bench available if needed'}]},
    { title:'Kitchen', items:[{text:'Frequently used items stored at counter height'},{text:'Fire extinguisher visible and accessible'},{text:'Smoke detector on ceiling, tested within 6 months'}]},
    { title:'Bedroom', items:[{text:'Nightlight or lamp reachable from bed without standing'},{text:'Phone or call device within reach of bed'},{text:'Medical alert device worn or on nightstand'}]},
  ], relatedLinks:[{label:'Find a CAPS home modification specialist',url:'https://www.nahb.org/caps'},{label:'Fall prevention tips from CDC',url:'https://www.cdc.gov/falls'}]},
  { slug:'bathroom-safety-checklist', title:'Bathroom Safety Checklist', description:'The bathroom is the most dangerous room in the house for falls. Essential modifications.', category:'home-safety', sections:[
    { title:'Grab Bars', items:[{text:'Grab bar next to toilet'},{text:'Grab bar inside shower or tub'},{text:'All grab bars anchored into studs',note:'Support 250 lbs minimum'},{text:'Bars at 33–36 inch height from floor'}]},
    { title:'Floor & Surfaces', items:[{text:'Non-slip mat inside tub/shower'},{text:'Non-slip bath rug outside tub/shower'}]},
    { title:'Temperature', items:[{text:'Water heater set to 120°F max'},{text:'Anti-scald device on shower valve'}]},
    { title:'Seating', items:[{text:'Shower bench or chair available'},{text:'Raised toilet seat if needed'}]},
  ]},
  { slug:'fall-prevention-checklist', title:'Fall Prevention Checklist', description:'Falls are the leading cause of injury in adults 65+. Home environment and personal risk factors.', category:'home-safety', sections:[
    { title:'Home Environment', items:[{text:'All area rugs secured or removed'},{text:'Lighting adequate in all rooms and stairways'},{text:'Stairways have handrails on both sides'},{text:'Pet toys and cords cleared from floors'}]},
    { title:'Medication Review', items:[{text:'Doctor reviewed all medications for fall risk',note:'Blood pressure, sleep, and anti-anxiety meds are common culprits'},{text:'No medications causing dizziness or blurred vision'}]},
    { title:'Physical Health', items:[{text:'Vision checked within past year'},{text:'Balance exercises done regularly',note:'Tai chi shown to reduce falls'},{text:'Footwear is supportive with non-slip soles'}]},
    { title:'Emergency Preparedness', items:[{text:'Medical alert device worn'},{text:'Phone accessible throughout the home'},{text:'Emergency contacts posted visibly'}]},
  ]},
  { slug:'emergency-preparedness-checklist', title:'Senior Emergency Preparedness Checklist', description:'Prepare for power outages, severe weather, and medical emergencies before they happen.', category:'home-safety', sections:[
    { title:'Emergency Supplies (72-hour kit)', items:[{text:'3-day supply of water (1 gallon/person/day)'},{text:'3-day supply of non-perishable food'},{text:'7-day supply of all prescription medications',note:'Ask doctor for extra supply'},{text:'Flashlight and extra batteries'},{text:'First aid kit'},{text:'Cash (ATMs may not work during outages)'}]},
    { title:'Medical Equipment', items:[{text:'Extra batteries for hearing aids'},{text:'Backup power plan for oxygen concentrators or CPAP'},{text:'Contact info for medical equipment suppliers'}]},
    { title:'Emergency Contacts', items:[{text:'Local emergency number saved in phone'},{text:'Neighbor or nearby friend to check in'},{text:'Family contact list printed (not just in phone)'},{text:'Local emergency shelter locations known'}]},
  ]},
  { slug:'how-to-hire-a-handyman', title:'How to Hire a Senior-Friendly Handyman', description:'Finding, vetting, and hiring a contractor for home repairs and modifications.', category:'home-safety', sections:[
    { title:'Finding Candidates', items:[{text:'Ask your Area Agency on Aging for vetted contractor list'},{text:'Check CAPS directory at nahb.org'},{text:'Ask neighbors or faith community for referrals'}]},
    { title:'Vetting', items:[{text:'Verify contractor license with state licensing board'},{text:'Confirm general liability insurance'},{text:'Get at least 3 written quotes for any job over $500'},{text:'Ask for references from similar jobs'}]},
    { title:'The Contract', items:[{text:'Get everything in writing before work starts'},{text:'Payment schedule tied to milestones (never pay 100% upfront)'},{text:'Warranty terms stated in writing'}]},
    { title:'Red Flags', items:[{text:'Demands full payment upfront'},{text:'No physical address or license number'},{text:'Pressures you to decide same day'},{text:'Only accepts cash'}]},
  ]},
  { slug:'caregiver-burnout-checklist', title:'Caregiver Burnout Checklist', description:'Signs of burnout and steps to protect your own health while caring for a loved one.', category:'caregiver', sections:[
    { title:'Signs of Burnout (check all that apply)', items:[{text:'I feel exhausted most of the time'},{text:'I feel hopeless or trapped'},{text:'I have less patience than I used to'},{text:'I feel isolated and alone in this role'},{text:'My own health has gotten worse'}]},
    { title:'Immediate Steps', items:[{text:'Tell your doctor how you are feeling'},{text:'Accept help when offered'},{text:'Take one complete day off per week if possible'},{text:'Join a caregiver support group',note:'AARP and local AAA have free groups'}]},
    { title:'Longer-Term Relief', items:[{text:'Explore adult day programs for your loved one'},{text:'Apply for caregiver support through your local AAA'},{text:'Talk to a therapist familiar with caregiver issues'},{text:'Look into paid in-home care to share the load'}]},
  ], relatedLinks:[{label:'AARP Caregiver Resources',url:'https://www.aarp.org/caregiving/'},{label:'Caregiver Action Network',url:'https://www.caregiveraction.org'}]},
  { slug:'how-to-hire-a-caregiver', title:'How to Hire a Home Caregiver', description:'Finding, interviewing, and hiring an in-home caregiver — through an agency or independently.', category:'caregiver', sections:[
    { title:'Define the Role', items:[{text:'List daily tasks needed (bathing, dressing, meals, medication reminders)'},{text:'Decide on hours and schedule'},{text:'Set your budget (agency vs. independent hire cost differs significantly)'}]},
    { title:'Agency Route', items:[{text:'Ask your AAA for a vetted agency list'},{text:'Ask if agency does background checks on all aides'},{text:'Ask how agency handles sick day coverage'},{text:'Get fee schedule and care agreement in writing'}]},
    { title:'Independent Hire', items:[{text:'Post on Care.com or local networks'},{text:'Conduct background and reference checks yourself'},{text:'Create a written work agreement with duties, hours, and pay'}]},
    { title:'Interview Questions', items:[{text:'Tell me about your experience with seniors with similar needs'},{text:'How would you handle an emergency?'},{text:'What would you do if my parent refused care?'}]},
  ]},
  { slug:'estate-planning', title:'Senior Estate Planning Checklist', description:'Essential legal documents every adult should have in place.', category:'legal-financial', sections:[
    { title:'Core Legal Documents', items:[{text:'Will or Trust in place and up to date'},{text:'Durable Power of Attorney for finances signed'},{text:'Healthcare Power of Attorney signed'},{text:'Advance Directive / Living Will completed'},{text:'All documents notarized per your state requirements'}]},
    { title:'Financial Organization', items:[{text:'All accounts and assets listed in one place'},{text:'Beneficiary designations on retirement accounts are current'},{text:'Digital accounts and passwords documented securely'}]},
    { title:'Sharing With Family', items:[{text:'Family meeting held to share wishes and document locations'},{text:'Funeral and burial wishes documented'},{text:'Attorney of record contact info shared'}]},
  ], relatedLinks:[{label:'Find a free elder law attorney via your AAA',url:'https://eldercare.acl.gov'},{label:'State advance directive forms',url:'https://www.caringinfo.org/planning/advance-directives/by-state/'}]},
  { slug:'financial-assistance', title:'Financial Assistance for Seniors Checklist', description:'Programs that help low- and moderate-income seniors with food, utilities, medications, and housing.', category:'legal-financial', sections:[
    { title:'Food', items:[{text:'Applied for SNAP — many eligible seniors have not applied'},{text:'Receiving Meals on Wheels if needed'},{text:'Using local food bank or senior nutrition program'}]},
    { title:'Medications', items:[{text:'Enrolled in Extra Help (Low Income Subsidy for Medicare Part D)',note:'Can save $1,000+/year on prescriptions'},{text:'Using GoodRx or similar discount card for non-covered medications'}]},
    { title:'Utilities & Housing', items:[{text:'Applied for LIHEAP (Low Income Home Energy Assistance)'},{text:'Asked utility company about senior discount'},{text:'Applied for property tax exemption for seniors'}]},
    { title:'Check Your Benefits', items:[{text:'Completed BenefitsCheckUp.org screening'},{text:'Talked to local AAA benefits counselor'},{text:'Enrolled in Medicare Savings Program if income-eligible',note:'Pays Part B premium ($174+/month)'}]},
  ], relatedLinks:[{label:'BenefitsCheckUp',url:'https://www.benefitscheckup.org'},{label:'Extra Help for prescription costs',url:'https://www.ssa.gov/medicare/part-d-extra-help'}]},
  { slug:'senior-nutrition-wellness-checklist', title:'Senior Nutrition & Wellness Checklist', description:'Common nutrition issues in adults 65+ and simple steps to stay healthy at home.', category:'wellness-lifestyle', sections:[
    { title:'Daily Nutrition', items:[{text:'Eating 3 balanced meals per day'},{text:'Getting adequate protein (meat, fish, eggs, beans, dairy)'},{text:'Staying hydrated',note:'Aim for 6–8 glasses daily — older adults often do not feel thirst'},{text:'Calcium and Vitamin D from food or supplements'}]},
    { title:'Warning Signs of Malnutrition', items:[{text:'Unintentional weight loss (more than 5% in 6 months)'},{text:'Reduced appetite lasting more than a week'},{text:'Trouble chewing or swallowing'}]},
    { title:'Physical Activity', items:[{text:'150 minutes of moderate activity per week',note:'Walking counts'},{text:'Strength exercises at least 2 days/week'},{text:'Balance exercises to prevent falls (tai chi, yoga)'}]},
  ]},
  { slug:'transportation-for-seniors', title:'Transportation Options for Seniors Checklist', description:'When driving stops being safe, these are the alternatives available to seniors.', category:'planning-daily-living', sections:[
    { title:'When Driving Becomes a Concern', items:[{text:'AARP DriveAware self-assessment completed'},{text:'Doctor consulted if health conditions affect driving'}]},
    { title:'Alternative Transportation', items:[{text:'Local senior transit or paratransit service identified'},{text:'Ride-share apps set up (Uber, Lyft)'},{text:'GoGoGrandparent account set up (phone-based Uber/Lyft)'},{text:'Grocery delivery service set up'},{text:'Volunteer driver program through local AAA identified'}]},
  ], relatedLinks:[{label:'GoGoGrandparent',url:'https://gogograndparent.com'}]},
  { slug:'medical-alert-systems', title:'Medical Alert System Buyer\'s Checklist', description:'What to look for before choosing a medical alert device for yourself or an aging parent.', category:'smart-home-tech', sections:[
    { title:'Decide on Features', items:[{text:'In-home only OR on-the-go GPS tracking'},{text:'Fall detection (auto-calls if fall detected)'},{text:'Waterproof (essential — most falls happen in the bathroom)'},{text:'Caregiver app for family to track status'}]},
    { title:'Evaluate the Company', items:[{text:'No long-term contract required'},{text:'Monitoring center US-based and available 24/7'},{text:'Free trial or 30-day return policy offered'},{text:'Medicare Advantage or insurance coverage verified'}]},
  ]},
  { slug:'decluttering-services', title:'Decluttering & Downsizing Services Checklist', description:'Help sorting a lifetime of belongings — whether staying put or preparing for a move.', category:'moving-downsizing', sections:[
    { title:'Before You Start', items:[{text:'Set clear goals: safety-focused, moving prep, or full estate sort'},{text:'Involve the senior — their pace, their decisions'},{text:'Identify sentimental items to preserve early'}]},
    { title:'Professional Services', items:[{text:'Senior move manager identified (NASMM.org directory)'},{text:'Estate sale company for valuable items'},{text:'1-800-GOT-JUNK or similar for donation runs'}]},
  ], relatedLinks:[{label:'Find a Senior Move Manager (NASMM)',url:'https://www.nasmm.org/find-a-member/'}]},
  { slug:'move-checklist', title:'Senior Relocation Checklist', description:'Moving to a new home or retirement community — everything to plan and do.', category:'moving-downsizing', sections:[
    { title:'3+ Months Before Move', items:[{text:'Senior move manager or moving company selected'},{text:'New home assessed for accessibility or needed modifications'},{text:'Decluttering and sorting complete'}]},
    { title:'1 Month Before', items:[{text:'Change of address filed with USPS'},{text:'Medicare, Social Security, insurance companies notified'},{text:'Doctors, pharmacy, and healthcare providers updated'},{text:'Utilities scheduled for transfer or cancellation'}]},
    { title:'After the Move', items:[{text:'New pharmacy identified and prescriptions transferred'},{text:'Home safety modifications completed at new home'},{text:'Local AAA and senior center in new area identified'}]},
  ]},
  { slug:'daily-care-checklist', title:'Daily Care Checklist for Aging Parents', description:'A daily monitoring checklist for family caregivers to ensure a parent\'s basic needs are met.', category:'caregiver', sections:[
    { title:'Physical Health', items:[{text:'Medications taken at correct times and doses'},{text:'Eating at least 2 nutritious meals'},{text:'Drinking adequate fluids'},{text:'No new pain, swelling, or physical complaints'}]},
    { title:'Cognitive & Emotional', items:[{text:'No signs of increased confusion or unusual behavior',note:'Sudden confusion can signal UTI or other medical issue'},{text:'Mood appears stable'},{text:'Social contact — spoke to someone today'}]},
    { title:'Home & Safety', items:[{text:'Home free of tripping hazards'},{text:'Stove off, no fire hazards'},{text:'Medical alert device worn'}]},
  ]},
]
export function getChecklistBySlug(slug: string) { return CHECKLISTS.find(c => c.slug === slug) }
export function getChecklistsByCategory(category: string) { return CHECKLISTS.filter(c => c.category === category) }
