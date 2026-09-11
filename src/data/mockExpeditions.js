// Mock Expeditions and Destinations for LagaTour

export const BANGLADESH_PLACES_DATABASE = [
  {
    id: "place_dhaka",
    name: "Dhaka",
    district: "Dhaka",
    division: "Dhaka",
    lat: 23.8103,
    lng: 90.4125,
    category: "Capital Hub",
    image: "https://images.unsplash.com/photo-1584646098378-0874589d76b1?w=600",
    description: "The bustling historic capital city of Bangladesh, home to Lalbagh Fort and Ahsan Manzil."
  },
  {
    id: "place_sreemangal",
    name: "Sreemangal Lawachara & Tea Gardens",
    district: "Moulvibazar",
    division: "Sylhet",
    lat: 24.3065,
    lng: 91.7296,
    category: "Eco Sanctuary",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600",
    description: "The tea capital of Bangladesh featuring lush green estates, 7-layer tea, and Lawachara National Park."
  },
  {
    id: "place_ratargul",
    name: "Ratargul Swamp Forest",
    district: "Sylhet",
    division: "Sylhet",
    lat: 25.0016,
    lng: 91.9312,
    category: "Swamp Forest",
    image: "https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?w=600",
    description: "The only freshwater swamp forest in Bangladesh, navigated via wooden dinghy boats under submerged canopies."
  },
  {
    id: "place_tanguar_haor",
    name: "Tanguar Haor & Tahirpur",
    district: "Sunamganj",
    division: "Sylhet",
    lat: 25.1270,
    lng: 91.0740,
    category: "Wetlands & Houseboats",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
    description: "A Ramsar wetland wonderland famous for luxury wooden houseboats, transparent waters, and Shimul Bagan."
  },
  {
    id: "place_jaflong",
    name: "Jaflong & Lalakhal Blue River",
    district: "Sylhet",
    division: "Sylhet",
    lat: 25.1634,
    lng: 92.0175,
    category: "River & Hills",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600",
    description: "Scenic stone river beds at the foothills of Meghalaya and the emerald blue waters of Lalakhal canal."
  },
  {
    id: "place_chattogram",
    name: "Chattogram & Batali Hill",
    district: "Chattogram",
    division: "Chattogram",
    lat: 22.3569,
    lng: 91.7832,
    category: "Port City & Coast",
    image: "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=600",
    description: "Gateway to the eastern hills with Patenga beach, Foy's Lake, and panoramic Batali Hill sunsets."
  },
  {
    id: "place_coxsbazar",
    name: "Cox's Bazar & Inani Marine Drive",
    district: "Cox's Bazar",
    division: "Chattogram",
    lat: 21.4272,
    lng: 92.0058,
    category: "Sea Beach",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
    description: "The world's longest unbroken natural sandy sea beach stretching 120km along the Bay of Bengal."
  },
  {
    id: "place_saint_martin",
    name: "Saint Martin's Coral Island",
    district: "Cox's Bazar",
    division: "Chattogram",
    lat: 20.6274,
    lng: 92.3225,
    category: "Coral Island",
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600",
    description: "The only coral island in Bangladesh featuring crystal blue waters, coconut groves, and Chera Dwip."
  },
  {
    id: "place_bandarban",
    name: "Bandarban Nilgiri & Nafakhum Trek",
    district: "Bandarban",
    division: "Chattogram",
    lat: 22.1953,
    lng: 92.2184,
    category: "Hill Tracts & Waterfalls",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600",
    description: "High altitude clouds at Nilgiri, remote bamboo villages of Thanchi, and the roaring Nafakhum falls."
  },
  {
    id: "place_sajek",
    name: "Sajek Valley & Konglak Peak",
    district: "Rangamati",
    division: "Chattogram",
    lat: 23.3820,
    lng: 92.2938,
    category: "Cloud Valley",
    image: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=600",
    description: "Known as the Queen of Hills where you stay in wooden eco-cottages floating above a sea of white clouds."
  },
  {
    id: "place_sundarbans",
    name: "Sundarbans Mangrove Forest & Kotka",
    district: "Bagerhat",
    division: "Khulna",
    lat: 21.9497,
    lng: 89.1833,
    category: "UNESCO Mangrove",
    image: "https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?w=600",
    description: "The world's largest mangrove forest, home to the Royal Bengal Tiger, spotted deer, and river dolphins."
  },
  {
    id: "place_kuakata",
    name: "Kuakata Daughter of Sea",
    district: "Patuakhali",
    division: "Barishal",
    lat: 21.8167,
    lng: 90.1167,
    category: "Sunrise & Sunset Beach",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
    description: "Unique coastal beach in southern Bangladesh where you can watch both sunrise and sunset over the sea."
  }
];

export const MOCK_COMPANIONS = [
  {
    id: "user_tanvir",
    name: "Tanvir Ahmed",
    username: "tanvir_tours",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=tanvir",
    league: "Legend",
    phone: "+8801711223344",
    role: "Route Navigator",
    isFollower: true,
    isFollowing: true,
    connectionType: "Mutual Connection",
    groupIds: ["group_sylhet_squad", "group_hilltracts_explorers"]
  },
  {
    id: "user_nafisa",
    name: "Nafisa Rahman",
    username: "nafisa_trek",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=nafisa",
    league: "Expert",
    phone: "+8801811556677",
    role: "Budget Lead",
    isFollower: true,
    isFollowing: true,
    connectionType: "Mutual Connection",
    groupIds: ["group_sylhet_squad", "group_coxsbazar_rally"]
  },
  {
    id: "user_ayman",
    name: "Ayman Sadiq",
    username: "ayman_travels",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=ayman",
    league: "Traveler",
    phone: "+8801911889900",
    role: "Photographer",
    isFollower: true,
    isFollowing: false,
    connectionType: "Follower",
    groupIds: ["group_hilltracts_explorers", "group_coxsbazar_rally"]
  },
  {
    id: "user_sadia",
    name: "Sadia Jahan",
    username: "sadia_haor",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=sadia",
    league: "Adventurer",
    phone: "+8801611334455",
    role: "Food & Gear Manager",
    isFollower: false,
    isFollowing: true,
    connectionType: "Following",
    groupIds: ["group_sylhet_squad", "group_coxsbazar_rally"]
  },
  {
    id: "user_rafiq",
    name: "Rafiqul Islam",
    username: "rafiq_explorer",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=rafiq",
    league: "Expert",
    phone: "+8801511667788",
    role: "Wilderness Guide",
    isFollower: true,
    isFollowing: true,
    connectionType: "Mutual Connection",
    groupIds: ["group_hilltracts_explorers"]
  },
  {
    id: "user_farhana",
    name: "Farhana Kabir",
    username: "farhana_wander",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=farhana",
    league: "Adventurer",
    phone: "+8801722889900",
    role: "First Aid & Gear",
    isFollower: false,
    isFollowing: true,
    connectionType: "Following",
    groupIds: ["group_hilltracts_explorers"]
  },
  {
    id: "user_mehedi",
    name: "Mehedi Hasan",
    username: "mehedi_rider",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=mehedi",
    league: "Explorer",
    phone: "+8801333445566",
    role: "Biker & Scout",
    isFollower: true,
    isFollowing: false,
    connectionType: "Follower",
    groupIds: ["group_coxsbazar_rally"]
  },
  {
    id: "user_stranger_1",
    name: "Unknown Wanderer",
    username: "unknown_user99",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=stranger",
    league: "Explorer",
    phone: "+8801999000000",
    role: "Public User",
    isFollower: false,
    isFollowing: false, // Not connected -> will be filtered out!
    connectionType: "Not Connected",
    groupIds: []
  }
];

export const MOCK_EXISTING_TOUR_GROUPS = [
  {
    id: "group_sylhet_squad",
    title: "Sylhet Haor & Water Expedition Group 🌊",
    destination: "Sylhet & Tanguar Haor",
    members: [
      MOCK_COMPANIONS[0], // Tanvir
      MOCK_COMPANIONS[1], // Nafisa
      MOCK_COMPANIONS[3]  // Sadia
    ]
  },
  {
    id: "group_hilltracts_explorers",
    title: "Bandarban & Sajek Trekkers Club ⛰️",
    destination: "Bandarban & Sajek",
    members: [
      MOCK_COMPANIONS[0], // Tanvir
      MOCK_COMPANIONS[4], // Rafiqul
      MOCK_COMPANIONS[5], // Farhana
      MOCK_COMPANIONS[2]  // Ayman
    ]
  },
  {
    id: "group_coxsbazar_rally",
    title: "Cox's Bazar Marine Drive Rally 🏖️",
    destination: "Cox's Bazar Beach",
    members: [
      MOCK_COMPANIONS[1], // Nafisa
      MOCK_COMPANIONS[2], // Ayman
      MOCK_COMPANIONS[3], // Sadia
      MOCK_COMPANIONS[6]  // Mehedi
    ]
  }
];

export const INITIAL_MOCK_EXPEDITIONS = [
  {
    id: "exp_sylhet_haor_2026",
    title: "Sylhet Rainforest & Tanguar Haor Houseboat Live Expedition",
    description: "A multi-stop monsoon expedition through the lush tea gardens of Sreemangal, cruising on traditional wooden houseboats in Sunamganj, and exploring Ratargul swamp forest.",
    startingLocation: "Dhaka",
    destination: "Sylhet",
    startDate: "2026-09-10",
    endDate: "2026-09-14",
    targetBudget: 28000,
    spentBudget: 16400,
    status: "ongoing", // 'planned' | 'ongoing' | 'completed'
    travelType: "Friends",
    season: "Monsoon",
    coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    author: {
      id: "admin_root",
      name: "Nur Tamim",
      username: "nurtamim",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=nurtamim",
      league: "Legend",
      points: 4250
    },
    companions: [
      MOCK_COMPANIONS[0],
      MOCK_COMPANIONS[1],
      MOCK_COMPANIONS[3]
    ],
    stops: [
      {
        id: "stop_1",
        order: 1,
        placeName: "Dhaka Kamalapur Station",
        location: "Kamalapur, Dhaka",
        lat: 23.7317,
        lng: 90.4253,
        transportMode: "Train",
        transportDetails: "Parabat Express AC Chair",
        transportCost: 1200,
        accommodationType: "None (Day Departure)",
        accommodationDetails: "Early morning 6:30 AM departure",
        accommodationCost: 0,
        stayDuration: "Departed",
        notes: "Started journey with the full squad. Train departed right on schedule at 06:40 AM.",
        status: "checked_in", // 'pending' | 'checked_in' | 'skipped'
        isSpontaneous: false,
        checkInTime: "2026-09-10T06:35:00.000Z",
        checkInGps: { lat: 23.7320, lng: 90.4255 },
        checkInNote: "Squad assembled with all camping and camera gear!",
        photos: ["https://images.unsplash.com/photo-1584646098378-0874589d76b1?w=500"]
      },
      {
        id: "stop_2",
        order: 2,
        placeName: "Sreemangal Lawachara Rainforest",
        location: "Moulvibazar, Sylhet",
        lat: 24.3065,
        lng: 91.7296,
        transportMode: "CNG Auto",
        transportDetails: "Reserved Local CNG to eco cottages",
        transportCost: 450,
        accommodationType: "Eco Resort",
        accommodationDetails: "Grand Sultan & Rain Forest Resort Eco Villa",
        accommodationCost: 6500,
        stayDuration: "1 Night",
        notes: "Trek through the canopy trail, enjoy fresh pineapple, and taste authentic 7-layer tea.",
        status: "checked_in",
        isSpontaneous: false,
        checkInTime: "2026-09-10T13:15:00.000Z",
        checkInGps: { lat: 24.3068, lng: 91.7299 },
        checkInNote: "Checked in at the eco-cottage. Air is incredibly fresh and misty!",
        photos: ["https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=500"]
      },
      {
        id: "stop_spont_1",
        order: 3,
        placeName: "Madhabpur Lake Hidden Tea Trail",
        location: "Kamalganj, Sreemangal",
        lat: 24.2780,
        lng: 91.8020,
        transportMode: "Jeep / Chander Gari",
        transportDetails: "Open 4x4 Jeep trail",
        transportCost: 600,
        accommodationType: "Eco Cottage",
        accommodationDetails: "Local tea planter guest cottage",
        accommodationCost: 1000,
        stayDuration: "Half Day",
        notes: "Spontaneous detour recommended by a local tea worker. Unreal reflections of blue water lilies surrounded by terraced hills!",
        status: "checked_in",
        isSpontaneous: true,
        discoveryBadge: "Hidden Water Lily Lake",
        checkInTime: "2026-09-11T09:30:00.000Z",
        checkInGps: { lat: 24.2782, lng: 91.8024 },
        checkInNote: "A secret lotus lake in the valley that wasn't on our original map!",
        photos: ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500"]
      },
      {
        id: "stop_3",
        order: 4,
        placeName: "Tanguar Haor & Tahirpur",
        location: "Sunamganj, Sylhet",
        lat: 25.1270,
        lng: 91.0740,
        transportMode: "Boat / Launch",
        transportDetails: "Traditional Premium Wooden Houseboat",
        transportCost: 2200,
        accommodationType: "Houseboat",
        accommodationDetails: "Dual-deck Premium Houseboat with solar power",
        accommodationCost: 5500,
        stayDuration: "1 Night",
        notes: "Boarding the houseboat at Tahirpur ghat, sailing across Watch Tower, Niladri Lake, and Shimul Bagan.",
        status: "checked_in",
        isSpontaneous: false,
        checkInTime: "2026-09-11T16:00:00.000Z",
        checkInGps: { lat: 25.1272, lng: 91.0743 },
        checkInNote: "Anchored in open waters under the monsoon rain clouds. Fresh haor fish BBQ cooking right now!",
        photos: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500"]
      },
      {
        id: "stop_4",
        order: 5,
        placeName: "Ratargul Freshwater Swamp Forest",
        location: "Gowainghat, Sylhet",
        lat: 25.0016,
        lng: 91.9312,
        transportMode: "Microbus",
        transportDetails: "AC HiAce van from Sunamganj to Ratargul",
        transportCost: 1500,
        accommodationType: "Hotel",
        accommodationDetails: "Hotel Noorjahan Grand Sylhet",
        accommodationCost: 3500,
        stayDuration: "1 Day",
        notes: "Explore the Amazon of Bengal in non-motorized wooden canoes through water submerged trees.",
        status: "pending",
        isSpontaneous: false
      },
      {
        id: "stop_5",
        order: 6,
        placeName: "Jaflong Zero Point & Lalakhal",
        location: "Jaflong, Sylhet",
        lat: 25.1634,
        lng: 92.0175,
        transportMode: "Speedboat",
        transportDetails: "Lalakhal Emerald Blue Water Speedboat",
        transportCost: 1200,
        accommodationType: "Eco Resort",
        accommodationDetails: "Nazimgarh Wilderness Resort",
        accommodationCost: 4000,
        stayDuration: "1 Day",
        notes: "Final grand stop taking in the crystal emerald blue waters of Lalakhal and tea hillocks.",
        status: "pending",
        isSpontaneous: false
      }
    ],
    expenses: [
      { id: "exp_1", stopId: "stop_1", category: "Transport", amount: 1200, note: "Dhaka to Sreemangal Train tickets", timestamp: "2026-09-10 06:45" },
      { id: "exp_2", stopId: "stop_2", category: "Accommodation", amount: 6500, note: "Eco Resort booking deposit", timestamp: "2026-09-10 13:30" },
      { id: "exp_3", stopId: "stop_2", category: "Food", amount: 1250, note: "7-layer tea & local duck lunch", timestamp: "2026-09-10 14:45" },
      { id: "exp_4", stopId: "stop_spont_1", category: "Transport", amount: 600, note: "Local 4x4 Jeep trail ride", timestamp: "2026-09-11 09:45" },
      { id: "exp_5", stopId: "stop_3", category: "Accommodation", amount: 5500, note: "Houseboat rental group split", timestamp: "2026-09-11 16:30" },
      { id: "exp_6", stopId: "stop_3", category: "Food", amount: 1350, note: "Haor fish barbecue dinner & supplies", timestamp: "2026-09-11 20:00" }
    ],
    currentGps: { lat: 25.1270, lng: 91.0740, lastUpdated: "Just now" },
    isPublished: true,
    socialPostId: "post_exp_sylhet",
    likes: 48,
    comments: [
      { id: "c1", user: "tanvir_tours", text: "The houseboat evening was legendary! Can't wait for Ratargul tomorrow." },
      { id: "c2", user: "ayman_travels", text: "That spontaneous tea lake was the best detour ever 🔥" }
    ]
  },
  {
    id: "exp_bandarban_trek_2026",
    title: "Bandarban Nilgiri Clouds & Nafakhum River Trek",
    description: "High altitude adventure through Nilgiri hilltops, bamboo boat rides down the Sangu river, and trekking to Nafakhum waterfall with outdoor camping under the stars.",
    startingLocation: "Dhaka",
    destination: "Bandarban",
    startDate: "2026-10-05",
    endDate: "2026-10-10",
    targetBudget: 32000,
    spentBudget: 0,
    status: "planned",
    travelType: "Friends",
    season: "Autumn",
    coverImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
    author: {
      id: "admin_root",
      name: "Nur Tamim",
      username: "nurtamim",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=nurtamim",
      league: "Legend",
      points: 4250
    },
    companions: [
      MOCK_COMPANIONS[0],
      MOCK_COMPANIONS[4]
    ],
    stops: [
      {
        id: "stop_b1",
        order: 1,
        placeName: "Dhaka to Chattogram Transit",
        location: "Sayedabad, Dhaka",
        lat: 23.7147,
        lng: 90.4262,
        transportMode: "Bus",
        transportDetails: "Saintmartin Travels AC Sleeper",
        transportCost: 1600,
        accommodationType: "Overnight Transit",
        accommodationDetails: "Overnight sleeper bus",
        accommodationCost: 0,
        stayDuration: "Overnight",
        notes: "Night bus departure to avoid day traffic.",
        status: "pending",
        isSpontaneous: false
      },
      {
        id: "stop_b2",
        order: 2,
        placeName: "Bandarban Sadar & Meghla",
        location: "Bandarban Sadar",
        lat: 22.1953,
        lng: 92.2184,
        transportMode: "Jeep / Chander Gari",
        transportDetails: "4x4 Open Top Jeep",
        transportCost: 2500,
        accommodationType: "Eco Resort",
        accommodationDetails: "Hillside Resort & Eco Cottage",
        accommodationCost: 4500,
        stayDuration: "1 Night",
        notes: "Obtaining army guide permissions and exploring Golden Temple.",
        status: "pending",
        isSpontaneous: false
      },
      {
        id: "stop_b3",
        order: 3,
        placeName: "Nilgiri Cloud Station",
        location: "Nilgiri, Bandarban",
        lat: 22.0125,
        lng: 92.3361,
        transportMode: "Jeep / Chander Gari",
        transportDetails: "High incline mountain climb",
        transportCost: 2000,
        accommodationType: "Hotel",
        accommodationDetails: "Army Nilgiri Hilltop Cottage",
        accommodationCost: 7500,
        stayDuration: "1 Night",
        notes: "Experience waking up above a sea of floating clouds at 2,400 feet.",
        status: "pending",
        isSpontaneous: false
      },
      {
        id: "stop_b4",
        order: 4,
        placeName: "Thanchi & Remakri",
        location: "Thanchi, Bandarban",
        lat: 21.7865,
        lng: 92.4286,
        transportMode: "Boat / Launch",
        transportDetails: "Narrow wooden engine boat on Sangu River",
        transportCost: 3000,
        accommodationType: "Home Stay",
        accommodationDetails: "Traditional Marma Bamboo Homestay",
        accommodationCost: 1500,
        stayDuration: "1 Night",
        notes: "Cruising between gigantic stone gorges of King Fisher cliffs.",
        status: "pending",
        isSpontaneous: false
      },
      {
        id: "stop_b5",
        order: 5,
        placeName: "Nafakhum Waterfall & Trail",
        location: "Remakri, Bandarban",
        lat: 21.6820,
        lng: 92.5120,
        transportMode: "Trekking / Walk",
        transportDetails: "3-hour riverbed wilderness trek",
        transportCost: 800,
        accommodationType: "Camping",
        accommodationDetails: "Waterproof Riverside Camping Tents",
        accommodationCost: 1200,
        stayDuration: "1 Night",
        notes: "The Niagara of Bangladesh. Camp beside the roaring falls under clear starry skies.",
        status: "pending",
        isSpontaneous: false
      }
    ],
    expenses: [],
    currentGps: { lat: 23.7147, lng: 90.4262, lastUpdated: "Not Started" },
    isPublished: false,
    likes: 19,
    comments: []
  },
  {
    id: "exp_sajek_clouds_completed",
    title: "Sajek Valley Cloud Kingdom & Alutila Cave Discovery",
    description: "An unforgettable completed journey to the Queen of Hills in Sajek, trekking into the mysterious dark Alutila subterranean cave and relaxing in wooden mountain eco-lodges.",
    startingLocation: "Dhaka",
    destination: "Sajek Valley",
    startDate: "2026-08-12",
    endDate: "2026-08-15",
    targetBudget: 22000,
    spentBudget: 20450,
    status: "completed",
    travelType: "Couple",
    season: "Monsoon",
    coverImage: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800",
    author: {
      id: "admin_root",
      name: "Nur Tamim",
      username: "nurtamim",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=nurtamim",
      league: "Legend",
      points: 4250
    },
    companions: [
      MOCK_COMPANIONS[2]
    ],
    stops: [
      {
        id: "stop_s1",
        order: 1,
        placeName: "Dhaka to Khagrachari",
        location: "Khagrachari Sadar",
        lat: 23.1118,
        lng: 91.9847,
        transportMode: "Bus",
        transportDetails: "Shanti Paribahan AC",
        transportCost: 1800,
        accommodationType: "Hotel",
        accommodationDetails: "Hotel Guha",
        accommodationCost: 2000,
        stayDuration: "1 Night",
        notes: "Arrived in the morning, enjoyed traditional tribal bamboo shoot lunch.",
        status: "checked_in",
        isSpontaneous: false,
        checkInTime: "2026-08-12T07:30:00.000Z",
        checkInGps: { lat: 23.1120, lng: 91.9850 }
      },
      {
        id: "stop_s2",
        order: 2,
        placeName: "Alutila Mysterious Dark Cave",
        location: "Matiranga, Khagrachari",
        lat: 23.0850,
        lng: 91.9540,
        transportMode: "Jeep / Chander Gari",
        transportDetails: "Local Chander Gari",
        transportCost: 1200,
        accommodationType: "None",
        accommodationDetails: "Day Cave Excursion",
        accommodationCost: 0,
        stayDuration: "Half Day",
        notes: "Passed through the 100-meter dark cave holding flaming bamboo torches!",
        status: "checked_in",
        isSpontaneous: false,
        checkInTime: "2026-08-12T14:15:00.000Z",
        checkInGps: { lat: 23.0855, lng: 91.9545 }
      },
      {
        id: "stop_s_spont",
        order: 3,
        placeName: "Risang Secret Waterfall Gorge",
        location: "Khagrachari Hills",
        lat: 23.1420,
        lng: 91.9680,
        transportMode: "Trekking / Walk",
        transportDetails: "Steep staircase trail",
        transportCost: 200,
        accommodationType: "None",
        accommodationDetails: "Hidden natural water slide",
        accommodationCost: 0,
        stayDuration: "2 Hours",
        notes: "Unplanned stop. Slid down the natural stone water slide surrounded by deep jungle.",
        status: "checked_in",
        isSpontaneous: true,
        discoveryBadge: "Natural Rock Water Slide",
        checkInTime: "2026-08-13T10:00:00.000Z",
        checkInGps: { lat: 23.1425, lng: 91.9685 }
      },
      {
        id: "stop_s3",
        order: 4,
        placeName: "Sajek Valley Helipad & Konglak Peak",
        location: "Sajek, Rangamati",
        lat: 23.3820,
        lng: 92.2938,
        transportMode: "Jeep / Chander Gari",
        transportDetails: "Army Escort Chander Gari",
        transportCost: 3500,
        accommodationType: "Eco Resort",
        accommodationDetails: "Meghpunji & Runmoy Wooden Eco Resort",
        accommodationCost: 8500,
        stayDuration: "2 Nights",
        notes: "Enjoyed breathtaking sunset at Konglak Peak with cloud rivers passing under our balcony.",
        status: "checked_in",
        isSpontaneous: false,
        checkInTime: "2026-08-13T16:45:00.000Z",
        checkInGps: { lat: 23.3825, lng: 92.2942 }
      }
    ],
    expenses: [
      { id: "e1", stopId: "stop_s1", category: "Transport", amount: 1800, note: "Dhaka to Khagrachari bus", timestamp: "2026-08-12 07:00" },
      { id: "e2", stopId: "stop_s1", category: "Accommodation", amount: 2000, note: "Transit hotel stay", timestamp: "2026-08-12 08:00" },
      { id: "e3", stopId: "stop_s1", category: "Food", amount: 950, note: "System Restaurant tribal lunch", timestamp: "2026-08-12 13:00" },
      { id: "e4", stopId: "stop_s2", category: "Activities", amount: 500, note: "Alutila cave entry & torches", timestamp: "2026-08-12 14:30" },
      { id: "e5", stopId: "stop_s3", category: "Transport", amount: 3500, note: "Chander Gari army escort roundtrip", timestamp: "2026-08-13 12:00" },
      { id: "e6", stopId: "stop_s3", category: "Accommodation", amount: 8500, note: "Meghpunji Eco Resort 2 nights", timestamp: "2026-08-13 17:00" },
      { id: "e7", stopId: "stop_s3", category: "Food", amount: 3200, note: "Bamboo chicken barbecue & meals", timestamp: "2026-08-14 20:00" }
    ],
    currentGps: { lat: 23.3820, lng: 92.2938, lastUpdated: "Completed" },
    isPublished: true,
    socialPostId: "post_exp_sajek",
    aiScore: {
      totalPoints: 360,
      budgetDisciplineScore: 93,
      explorationBonus: 90,
      paceEfficiency: 88,
      spontaneousBonus: 89,
      reviewSummary: "Exemplary expedition! Maintained budget discipline within 93% accuracy while discovering hidden rock waterslides in the Khagrachari jungle.",
      badges: ["Cloud Walker", "Budget Maestro", "Cave Pioneer"]
    },
    likes: 85,
    comments: [
      { id: "cs1", user: "nafisa_trek", text: "Those clouds at Meghpunji look ethereal! Amazing budget management too." }
    ]
  }
];
