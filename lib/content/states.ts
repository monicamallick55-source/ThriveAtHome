export interface StateResource { name: string; url: string; phone?: string; description: string; category: 'aaa'|'medicaid'|'housing'|'legal'|'transportation'|'food'|'caregiver'|'mental-health' }
export interface StateData { slug: string; name: string; abbr: string; population65Plus: string; medicaidName: string; aaaWebsite: string; aaaPhone: string; resources: StateResource[] }
export const STATE_SLUGS = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new-hampshire','new-jersey','new-mexico','new-york','north-carolina','north-dakota','ohio','oklahoma','oregon','pennsylvania','rhode-island','south-carolina','south-dakota','tennessee','texas','utah','vermont','virginia','washington','west-virginia','wisconsin','wyoming']
export const STATES: StateData[] = [
  { slug:'california',name:'California',abbr:'CA',population65Plus:'6.4 million',medicaidName:'Medi-Cal',aaaWebsite:'https://aging.ca.gov',aaaPhone:'1-800-510-2020',resources:[
    {name:'California Department of Aging',url:'https://aging.ca.gov',phone:'1-916-419-7500',description:'Primary state agency for senior programs.',category:'aaa'},
    {name:'HICAP Medicare Counseling',url:'https://aging.ca.gov/HICAP/',phone:'1-800-434-0222',description:'Free, unbiased Medicare counseling.',category:'aaa'},
    {name:'Medi-Cal',url:'https://www.dhcs.ca.gov/medi-cal',phone:'1-800-541-5555',description:'Low-income health coverage including long-term care.',category:'medicaid'},
    {name:'IHSS In-Home Supportive Services',url:'https://www.cdss.ca.gov/in-home-supportive-services',description:'Pays for a caregiver to help low-income seniors stay home.',category:'caregiver'},
    {name:'CalFresh SNAP for Seniors',url:'https://www.cdss.ca.gov/calfresh',phone:'1-877-847-3663',description:'Food assistance — many eligible seniors do not apply.',category:'food'},
    {name:'CA Legal Services for Seniors',url:'https://aging.ca.gov/Legal_Services/',description:'Free legal help for seniors 60+ via local providers.',category:'legal'},
  ]},
  { slug:'florida',name:'Florida',abbr:'FL',population65Plus:'5.2 million',medicaidName:'Florida Medicaid',aaaWebsite:'https://elderaffairs.org',aaaPhone:'1-800-963-5337',resources:[
    {name:'Florida Department of Elder Affairs',url:'https://elderaffairs.org',phone:'1-850-414-2000',description:'Primary state agency for all Florida senior programs.',category:'aaa'},
    {name:'SHINE Medicare Counseling',url:'https://elderaffairs.org/shine/',phone:'1-800-963-5337',description:'Free Medicare counseling from trained Florida volunteers.',category:'aaa'},
    {name:'Florida Medicaid HCBS Waiver',url:'https://ahca.myflorida.com/medicaid',phone:'1-888-419-3456',description:'Home-based services to help seniors avoid nursing facilities.',category:'medicaid'},
    {name:'Florida Legal Aid for Seniors',url:'https://www.floridalegal.org',phone:'1-866-413-5323',description:'Free civil legal assistance for Floridians 60+.',category:'legal'},
    {name:'Florida Food Assistance SNAP',url:'https://www.myflfamilies.com/food-assistance',phone:'1-866-762-2237',description:'Monthly food assistance — apply online or by phone.',category:'food'},
  ]},
  { slug:'texas',name:'Texas',abbr:'TX',population65Plus:'4.1 million',medicaidName:'STAR+PLUS',aaaWebsite:'https://www.hhs.texas.gov',aaaPhone:'1-800-252-9240',resources:[
    {name:'Texas Health & Human Services',url:'https://www.hhs.texas.gov',phone:'1-877-787-8999',description:'All senior programs, benefits enrollment, and referrals.',category:'aaa'},
    {name:'Texas STAR+PLUS Medicaid',url:'https://www.hhs.texas.gov/star-plus',phone:'1-800-252-8263',description:'Managed care for long-term home and community-based services.',category:'medicaid'},
    {name:'Texas SHIP Counseling',url:'https://www.hhs.texas.gov/ship',phone:'1-800-252-9240',description:'Free, unbiased Medicare counseling across Texas.',category:'aaa'},
    {name:'Texas Legal Services Center',url:'https://www.tlsc.org',phone:'1-888-988-9996',description:'Free legal help for Texas seniors.',category:'legal'},
    {name:'Texas Food Assistance SNAP',url:'https://www.yourtexasbenefits.com',phone:'1-877-541-7905',description:'Apply for food assistance at YourTexasBenefits.com.',category:'food'},
  ]},
  { slug:'new-york',name:'New York',abbr:'NY',population65Plus:'3.5 million',medicaidName:'New York Medicaid',aaaWebsite:'https://aging.ny.gov',aaaPhone:'1-800-342-9871',resources:[
    {name:'NY State Office for the Aging',url:'https://aging.ny.gov',phone:'1-800-342-9871',description:'All senior services in New York State.',category:'aaa'},
    {name:'New York Medicaid MLTC',url:'https://www.health.ny.gov/health_care/medicaid/program/longterm/mltc.htm',phone:'1-800-541-2831',description:'Managed Long Term Care — home and community care.',category:'medicaid'},
    {name:'NY HIICAP Medicare Counseling',url:'https://aging.ny.gov/health-insurance-information-counseling',phone:'1-800-701-0501',description:'Free Medicare counseling from trained New York counselors.',category:'aaa'},
    {name:'New York Legal Assistance Group',url:'https://www.nylag.org',phone:'1-212-613-5000',description:'Free civil legal services for low-income New Yorkers.',category:'legal'},
  ]},
  { slug:'pennsylvania',name:'Pennsylvania',abbr:'PA',population65Plus:'2.6 million',medicaidName:'Pennsylvania MA',aaaWebsite:'https://www.aging.pa.gov',aaaPhone:'1-800-753-8827',resources:[
    {name:'PA Department of Aging',url:'https://www.aging.pa.gov',phone:'1-800-753-8827',description:'All senior programs in Pennsylvania.',category:'aaa'},
    {name:'PA APPRISE Medicare Counseling',url:'https://www.aging.pa.gov/aging-services/APPRISE/Pages/default.aspx',phone:'1-800-783-7067',description:'Free Medicare counseling across Pennsylvania.',category:'aaa'},
    {name:'PA Legal Aid Network',url:'https://palegalaid.net',phone:'1-800-322-7572',description:'Free legal services for low-income Pennsylvanians.',category:'legal'},
  ]},
  { slug:'ohio',name:'Ohio',abbr:'OH',population65Plus:'2.3 million',medicaidName:'PASSPORT',aaaWebsite:'https://aging.ohio.gov',aaaPhone:'1-800-282-1206',resources:[
    {name:'Ohio Department of Aging',url:'https://aging.ohio.gov',phone:'1-800-282-1206',description:'PASSPORT waiver, HEAP, Senior Community Services.',category:'aaa'},
    {name:'Ohio PASSPORT Waiver',url:'https://medicaid.ohio.gov/passport',phone:'1-800-324-8680',description:'Home and community-based services via Ohio Medicaid.',category:'medicaid'},
    {name:'Ohio OSHIIP Medicare Counseling',url:'https://insurance.ohio.gov/consumer/oshiip',phone:'1-800-686-1578',description:'Free Ohio Senior Health Insurance Information Program.',category:'aaa'},
  ]},
  { slug:'illinois',name:'Illinois',abbr:'IL',population65Plus:'2.1 million',medicaidName:'MMAI',aaaWebsite:'https://www2.illinois.gov/aging',aaaPhone:'1-800-252-8966',resources:[
    {name:'Illinois Department on Aging',url:'https://www2.illinois.gov/aging',phone:'1-800-252-8966',description:'Community Care Program and all Illinois senior programs.',category:'aaa'},
    {name:'Illinois SHIP Medicare Counseling',url:'https://www2.illinois.gov/aging/ship',phone:'1-800-548-9034',description:'Free Medicare counseling from trained Illinois counselors.',category:'aaa'},
    {name:'Illinois Legal Aid Online',url:'https://www.illinoislegalaid.org',description:'Free legal help for low-income Illinoisans.',category:'legal'},
  ]},
  { slug:'michigan',name:'Michigan',abbr:'MI',population65Plus:'1.9 million',medicaidName:'MI Choice',aaaWebsite:'https://www.michigan.gov/mdhhs/adult-services',aaaPhone:'1-800-292-2550',resources:[
    {name:'Michigan MDHHS Aging Services',url:'https://www.michigan.gov/mdhhs/adult-services',phone:'1-800-292-2550',description:'All senior services in Michigan.',category:'aaa'},
    {name:'MI Choice Waiver',url:'https://www.michigan.gov/mdhhs/mi-choice',phone:'1-888-900-0503',description:'Home and community-based services via Michigan Medicaid.',category:'medicaid'},
    {name:'Michigan MMAP Medicare Counseling',url:'https://www.michigan.gov/mmap',phone:'1-800-803-7174',description:'Free Medicare Medicaid Assistance Program counseling.',category:'aaa'},
  ]},
  { slug:'georgia',name:'Georgia',abbr:'GA',population65Plus:'1.6 million',medicaidName:'SOURCE',aaaWebsite:'https://aging.georgia.gov',aaaPhone:'1-866-552-4464',resources:[
    {name:'Georgia Division of Aging Services',url:'https://aging.georgia.gov',phone:'1-866-552-4464',description:'All Georgia senior programs.',category:'aaa'},
    {name:'GaShip Medicare Counseling',url:'https://aging.georgia.gov/programs/gaship',phone:'1-866-552-4464',description:'Free Medicare counseling across Georgia.',category:'aaa'},
    {name:'Georgia Legal Aid',url:'https://www.georgialegalaids.org',phone:'1-404-524-5811',description:'Free civil legal services for Georgians.',category:'legal'},
  ]},
  { slug:'north-carolina',name:'North Carolina',abbr:'NC',population65Plus:'1.8 million',medicaidName:'CAP/DA',aaaWebsite:'https://www.ncdhhs.gov/divisions/aging-and-adult-services',aaaPhone:'1-800-662-7030',resources:[
    {name:'NC Division of Aging & Adult Services',url:'https://www.ncdhhs.gov/divisions/aging-and-adult-services',phone:'1-919-855-3400',description:'All NC senior programs.',category:'aaa'},
    {name:'NC CAP/DA Waiver',url:'https://medicaid.ncdhhs.gov',phone:'1-800-662-7030',description:'Community Alternatives Program for home-based Medicaid services.',category:'medicaid'},
    {name:'NC SHIIP Medicare Counseling',url:'https://www.ncdoi.gov/consumers/get-insurance-help/shiip-seniorseniors-health-insurance-information-program',phone:'1-855-408-1212',description:'Free NC Senior Health Insurance Information Program.',category:'aaa'},
    {name:'Legal Aid of NC',url:'https://www.legalaidnc.org',phone:'1-866-219-5262',description:'Free civil legal services for low-income NC residents.',category:'legal'},
  ]},
  { slug:'arizona',name:'Arizona',abbr:'AZ',population65Plus:'1.5 million',medicaidName:'AHCCCS',aaaWebsite:'https://des.az.gov/services/aging-and-adult',aaaPhone:'1-602-542-4446',resources:[
    {name:'AZ Aging & Adult Services',url:'https://des.az.gov/services/aging-and-adult',phone:'1-602-542-4446',description:'All Arizona senior programs.',category:'aaa'},
    {name:'ALTCS Arizona Medicaid LTC',url:'https://www.azahcccs.gov/altcs',phone:'1-888-621-6880',description:'Arizona Long Term Care System for home and community-based services.',category:'medicaid'},
    {name:'Southern AZ Legal Aid',url:'https://www.sazlegalaid.org',phone:'1-800-640-9465',description:'Free legal help for low-income Arizonans.',category:'legal'},
  ]},
  { slug:'washington',name:'Washington',abbr:'WA',population65Plus:'1.4 million',medicaidName:'Apple Health',aaaWebsite:'https://www.dshs.wa.gov/altsa',aaaPhone:'1-800-422-3263',resources:[
    {name:'WA Aging & Long-Term Support',url:'https://www.dshs.wa.gov/altsa',phone:'1-800-422-3263',description:'Washington State aging services.',category:'aaa'},
    {name:'WA SHIBA Medicare Counseling',url:'https://www.insurance.wa.gov/shiba',phone:'1-800-562-6900',description:'Free Statewide Health Insurance Benefits Advisors counseling.',category:'aaa'},
    {name:'Northwest Justice Project',url:'https://www.nwjustice.org',phone:'1-888-201-1014',description:'Free civil legal help for low-income Washington residents.',category:'legal'},
  ]},
  { slug:'virginia',name:'Virginia',abbr:'VA',population65Plus:'1.4 million',medicaidName:'CCC Plus',aaaWebsite:'https://www.vda.virginia.gov',aaaPhone:'1-800-552-3402',resources:[
    {name:'Virginia Department for Aging',url:'https://www.vda.virginia.gov',phone:'1-800-552-3402',description:'All Virginia senior programs.',category:'aaa'},
    {name:'CCC Plus Waiver',url:'https://www.dmas.virginia.gov/ccc-plus',phone:'1-833-256-1557',description:'Commonwealth Coordinated Care Plus home and community-based services.',category:'medicaid'},
    {name:'Virginia Legal Aid',url:'https://www.valegalaid.org',phone:'1-866-534-5243',description:'Free civil legal help for low-income Virginians.',category:'legal'},
  ]},
  { slug:'massachusetts',name:'Massachusetts',abbr:'MA',population65Plus:'1.2 million',medicaidName:'MassHealth',aaaWebsite:'https://www.mass.gov/orgs/executive-office-of-elder-affairs',aaaPhone:'1-800-243-4636',resources:[
    {name:'MA Executive Office of Elder Affairs',url:'https://www.mass.gov/orgs/executive-office-of-elder-affairs',phone:'1-800-243-4636',description:'All Massachusetts senior programs.',category:'aaa'},
    {name:'MA SHINE Medicare Counseling',url:'https://www.mass.gov/shine',phone:'1-800-243-4636',description:'Free Serving the Health Insurance Needs of Everyone counseling.',category:'aaa'},
    {name:'MA Legal Aid',url:'https://www.mlri.org',phone:'1-617-603-1700',description:'Free legal help for Massachusetts seniors.',category:'legal'},
  ]},
  { slug:'colorado',name:'Colorado',abbr:'CO',population65Plus:'0.9 million',medicaidName:'HCBS-EBD',aaaWebsite:'https://cdhs.colorado.gov/older-adults',aaaPhone:'1-888-311-7211',resources:[
    {name:'CO Division of Aging & Adult Services',url:'https://cdhs.colorado.gov/older-adults',phone:'1-888-311-7211',description:'All Colorado senior programs.',category:'aaa'},
    {name:'HCBS-EBD Waiver',url:'https://hcpf.colorado.gov/elderly-blind-disabled',phone:'1-800-221-3943',description:'Home and Community Based Services for Elderly, Blind, and Disabled.',category:'medicaid'},
    {name:'Colorado Legal Services',url:'https://www.coloradolegalservices.org',description:'Free civil legal help for low-income Coloradans.',category:'legal'},
  ]},
]
const STUB=[{slug:'alabama',name:'Alabama',abbr:'AL'},{slug:'alaska',name:'Alaska',abbr:'AK'},{slug:'arkansas',name:'Arkansas',abbr:'AR'},{slug:'connecticut',name:'Connecticut',abbr:'CT'},{slug:'delaware',name:'Delaware',abbr:'DE'},{slug:'hawaii',name:'Hawaii',abbr:'HI'},{slug:'idaho',name:'Idaho',abbr:'ID'},{slug:'indiana',name:'Indiana',abbr:'IN'},{slug:'iowa',name:'Iowa',abbr:'IA'},{slug:'kansas',name:'Kansas',abbr:'KS'},{slug:'kentucky',name:'Kentucky',abbr:'KY'},{slug:'louisiana',name:'Louisiana',abbr:'LA'},{slug:'maine',name:'Maine',abbr:'ME'},{slug:'maryland',name:'Maryland',abbr:'MD'},{slug:'minnesota',name:'Minnesota',abbr:'MN'},{slug:'mississippi',name:'Mississippi',abbr:'MS'},{slug:'missouri',name:'Missouri',abbr:'MO'},{slug:'montana',name:'Montana',abbr:'MT'},{slug:'nebraska',name:'Nebraska',abbr:'NE'},{slug:'nevada',name:'Nevada',abbr:'NV'},{slug:'new-hampshire',name:'New Hampshire',abbr:'NH'},{slug:'new-jersey',name:'New Jersey',abbr:'NJ'},{slug:'new-mexico',name:'New Mexico',abbr:'NM'},{slug:'north-dakota',name:'North Dakota',abbr:'ND'},{slug:'oklahoma',name:'Oklahoma',abbr:'OK'},{slug:'oregon',name:'Oregon',abbr:'OR'},{slug:'rhode-island',name:'Rhode Island',abbr:'RI'},{slug:'south-carolina',name:'South Carolina',abbr:'SC'},{slug:'south-dakota',name:'South Dakota',abbr:'SD'},{slug:'tennessee',name:'Tennessee',abbr:'TN'},{slug:'utah',name:'Utah',abbr:'UT'},{slug:'vermont',name:'Vermont',abbr:'VT'},{slug:'west-virginia',name:'West Virginia',abbr:'WV'},{slug:'wisconsin',name:'Wisconsin',abbr:'WI'},{slug:'wyoming',name:'Wyoming',abbr:'WY'}]
STUB.forEach(s=>STATES.push({slug:s.slug,name:s.name,abbr:s.abbr,population65Plus:'',medicaidName:`${s.name} Medicaid`,aaaWebsite:'https://eldercare.acl.gov/Public/About/Agencies/Search.aspx',aaaPhone:'1-800-677-1116',resources:[{name:`${s.name} Area Agency on Aging`,url:'https://eldercare.acl.gov/Public/About/Agencies/Search.aspx',phone:'1-800-677-1116',description:`Find your local ${s.name} Area Agency on Aging via the Eldercare Locator.`,category:'aaa'},{name:`${s.name} Medicaid`,url:'https://www.medicaid.gov/about-us/contact-us/contact-state-page.html',description:'Home and community-based care waivers.',category:'medicaid'},{name:'Medicare SHIP Counseling',url:'https://www.shiphelp.org',phone:'1-877-839-2675',description:`Free Medicare counseling — find your ${s.name} SHIP counselor.`,category:'aaa'},{name:'Legal Aid Referral',url:'https://www.lawhelp.org',description:'Find free civil legal help via LawHelp.org.',category:'legal'},{name:'SNAP Food Assistance',url:'https://www.fns.usda.gov/snap/state-directory',description:`Apply for monthly food assistance through ${s.name}'s SNAP program.`,category:'food'}]}))
export function getStateBySlug(slug:string){return STATES.find(s=>s.slug===slug)}
export function getStateByAbbr(abbr:string){return STATES.find(s=>s.abbr.toUpperCase()===abbr.toUpperCase())}
export const CATEGORY_LABELS:Record<string,string>={aaa:'Area Agency on Aging',medicaid:'Medicaid & Long-Term Care',housing:'Housing & Utilities',legal:'Legal Aid',transportation:'Transportation',food:'Food Assistance',caregiver:'Caregiver Support','mental-health':'Mental Health'}
