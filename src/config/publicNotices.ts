export interface PublicNoticeSite {
  id: string
  name: string
  state: string
  stateCode: string
  domain: string
  searchUrl: string
  // ASP.NET WebForms - all use the same usalegalnotice.com platform
  platform: 'usalegalnotice'
  noticeTypes: string[]
  counties: string[]
}

export const PUBLIC_NOTICE_SITES: PublicNoticeSite[] = [
  {
    id: 'al',
    name: 'Alabama Public Notices',
    state: 'Alabama',
    stateCode: 'AL',
    domain: 'www.alabamapublicnotices.com',
    searchUrl: 'https://www.alabamapublicnotices.com/Search.aspx',
    platform: 'usalegalnotice',
    noticeTypes: ['Foreclosures', 'Probate Notices', 'Tax Sales', 'Public Sales', 'Orders'],
    counties: [
      'Autauga', 'Baldwin', 'Barbour', 'Bibb', 'Blount', 'Bullock', 'Butler', 'Calhoun',
      'Chambers', 'Cherokee', 'Chilton', 'Choctaw', 'Clarke', 'Clay', 'Cleburne', 'Coffee',
      'Colbert', 'Conecuh', 'Coosa', 'Covington', 'Crenshaw', 'Cullman', 'Dale', 'Dallas',
      'DeKalb', 'Elmore', 'Escambia', 'Etowah', 'Fayette', 'Franklin', 'Geneva', 'Greene',
      'Hale', 'Henry', 'Houston', 'Jackson', 'Jefferson', 'Lamar', 'Lauderdale', 'Lawrence',
      'Lee', 'Limestone', 'Lowndes', 'Macon', 'Madison', 'Marengo', 'Marion', 'Marshall',
      'Mobile', 'Monroe', 'Montgomery', 'Morgan', 'Perry', 'Pickens', 'Pike', 'Randolph',
      'Russell', 'Shelby', 'St. Clair', 'Sumter', 'Talladega', 'Tallapoosa', 'Tuscaloosa',
      'Walker', 'Washington', 'Wilcox', 'Winston'
    ]
  },
  {
    id: 'tn',
    name: 'Tennessee Public Notices',
    state: 'Tennessee',
    stateCode: 'TN',
    domain: 'www.tnpublicnotice.com',
    searchUrl: 'https://www.tnpublicnotice.com/Search.aspx',
    platform: 'usalegalnotice',
    noticeTypes: ['Foreclosures', 'Probate Notices', 'Tax Sales', 'Delinquent Taxes', 'Public Sales', 'Orders'],
    counties: [
      'Anderson', 'Bedford', 'Benton', 'Bledsoe', 'Blount', 'Bradley', 'Campbell', 'Cannon',
      'Carroll', 'Carter', 'Cheatham', 'Chester', 'Claiborne', 'Clay', 'Cocke', 'Coffee',
      'Crockett', 'Cumberland', 'Davidson', 'Decatur', 'DeKalb', 'Dickson', 'Dyer', 'Fayette',
      'Fentress', 'Franklin', 'Gibson', 'Giles', 'Grainger', 'Greene', 'Grundy', 'Hamblen',
      'Hamilton', 'Hancock', 'Hardeman', 'Hardin', 'Hawkins', 'Haywood', 'Henderson', 'Henry',
      'Hickman', 'Houston', 'Humphreys', 'Jackson', 'Jefferson', 'Johnson', 'Knox', 'Lake',
      'Lauderdale', 'Lawrence', 'Lewis', 'Lincoln', 'Loudon', 'Macon', 'Madison', 'Marion',
      'Marshall', 'Maury', 'McMinn', 'McNairy', 'Meigs', 'Monroe', 'Montgomery', 'Moore',
      'Morgan', 'Obion', 'Overton', 'Perry', 'Pickett', 'Polk', 'Putnam', 'Rhea', 'Roane',
      'Robertson', 'Rutherford', 'Scott', 'Sequatchie', 'Sevier', 'Shelby', 'Smith', 'Stewart',
      'Sullivan', 'Sumner', 'Tipton', 'Trousdale', 'Unicoi', 'Union', 'Van Buren', 'Warren',
      'Washington', 'Wayne', 'Weakley', 'White', 'Williamson', 'Wilson'
    ]
  },
  {
    id: 'ga',
    name: 'Georgia Public Notices',
    state: 'Georgia',
    stateCode: 'GA',
    domain: 'www.georgiapublicnotice.com',
    searchUrl: 'https://www.georgiapublicnotice.com/Search.aspx',
    platform: 'usalegalnotice',
    noticeTypes: ['Foreclosures', 'Probate Notices', 'Tax Sales', 'Public Sales', 'Orders'],
    counties: [
      'Appling', 'Atkinson', 'Bacon', 'Baker', 'Baldwin', 'Banks', 'Barrow', 'Bartow',
      'Ben Hill', 'Berrien', 'Bibb', 'Bleckley', 'Brantley', 'Brooks', 'Bryan', 'Bulloch',
      'Burke', 'Butts', 'Calhoun', 'Camden', 'Candler', 'Carroll', 'Catoosa', 'Charlton',
      'Chatham', 'Chattahoochee', 'Chattooga', 'Cherokee', 'Clarke', 'Clay', 'Clayton',
      'Clinch', 'Cobb', 'Coffee', 'Colquitt', 'Columbia', 'Cook', 'Coweta', 'Crawford',
      'Crisp', 'Dade', 'Dawson', 'Decatur', 'DeKalb', 'Dodge', 'Dooly', 'Dougherty',
      'Douglas', 'Early', 'Echols', 'Effingham', 'Elbert', 'Emanuel', 'Evans', 'Fannin',
      'Fayette', 'Floyd', 'Forsyth', 'Franklin', 'Fulton', 'Gilmer', 'Glascock', 'Glynn',
      'Gordon', 'Grady', 'Greene', 'Gwinnett', 'Habersham', 'Hall', 'Hancock', 'Haralson',
      'Harris', 'Hart', 'Heard', 'Henry', 'Houston', 'Irwin', 'Jackson', 'Jasper', 'Jeff Davis',
      'Jefferson', 'Jenkins', 'Johnson', 'Jones', 'Lamar', 'Lanier', 'Laurens', 'Lee',
      'Liberty', 'Lincoln', 'Long', 'Lowndes', 'Lumpkin', 'Macon', 'Madison', 'Marion',
      'McDuffie', 'McIntosh', 'Meriwether', 'Miller', 'Mitchell', 'Monroe', 'Montgomery',
      'Morgan', 'Murray', 'Muscogee', 'Newton', 'Oconee', 'Oglethorpe', 'Paulding', 'Peach',
      'Pickens', 'Pierce', 'Pike', 'Polk', 'Pulaski', 'Putnam', 'Quitman', 'Rabun', 'Randolph',
      'Richmond', 'Rockdale', 'Schley', 'Screven', 'Seminole', 'Spalding', 'Stephens', 'Stewart',
      'Sumter', 'Talbot', 'Taliaferro', 'Tattnall', 'Taylor', 'Telfair', 'Terrell', 'Thomas',
      'Tift', 'Toombs', 'Towns', 'Treutlen', 'Troup', 'Turner', 'Twiggs', 'Union', 'Upson',
      'Walker', 'Walton', 'Ware', 'Warren', 'Washington', 'Wayne', 'Webster', 'Wheeler',
      'White', 'Whitfield', 'Wilcox', 'Wilkes', 'Wilkinson', 'Worth'
    ]
  }
]

export function getSiteById(id: string): PublicNoticeSite | undefined {
  return PUBLIC_NOTICE_SITES.find(site => site.id === id)
}

export function getSitesByState(stateCode: string): PublicNoticeSite[] {
  return PUBLIC_NOTICE_SITES.filter(site => site.stateCode === stateCode)
}
