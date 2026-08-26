// Mock Database for TourSphere / Laga Tour

export const MOCK_USERS = [
  {
    id: "user_1",
    name: "Aria Jahan",
    username: "aria_travels",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    points: 2450,
    league: "Expert", // Explorer, Adventurer, Traveler, Expert, Legend
    bio: "Adventure seeker. Mapping the world one coffee at a time ☕🏕️",
    followers: 1240,
    following: 480,
    stats: { trips: 14, saved: 29, cities: 18 }
  },
  {
    id: "user_2",
    name: "Nabil Ahmed",
    username: "nabil_wanderer",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    points: 4800,
    league: "Legend",
    bio: "Full-time explorer, photographer, and budget backpacker. 📸🏔️",
    followers: 5300,
    following: 340,
    stats: { trips: 42, saved: 110, cities: 35 }
  },
  {
    id: "user_3",
    name: "Sadia Rahman",
    username: "sadia_expeditions",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    points: 850,
    league: "Adventurer",
    bio: "Nature lover & weekend trekker. 🎒🌲",
    followers: 320,
    following: 190,
    stats: { trips: 5, saved: 12, cities: 6 }
  },
  {
    id: "user_4",
    name: "Rashed Karim",
    username: "rashed_backpacks",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150",
    points: 120,
    league: "Explorer",
    bio: "Novice traveler. Dreaming of St. Martin's 🌊⛵",
    followers: 45,
    following: 110,
    stats: { trips: 1, saved: 3, cities: 2 }
  }
];

export const MOCK_DESTINATIONS = [
  {
    id: "dest_1",
    name: "Cox's Bazar Beach",
    lat: 21.4272,
    lng: 91.9702,
    image: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800",
    description: "The world's longest natural sandy beach, running 120 km. Popular for sunsets and surfing.",
    caption: "Must-try grilled coral fish at Laboni beach, sunset quad biking & Marine Drive auto rides!",
    rating: 4.8,
    category: "Beach",
    visitedCount: 1420,
    unsafeCount: 0,
    comments: [
      { id: "pc_1", user: "aria_travels", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", text: "The evening beach lights at Laboni are incredible! Highly recommend visiting after 6 PM.", time: "2 days ago" },
      { id: "pc_2", user: "nabil_wanderer", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150", text: "Inani beach is super quiet compared to the main town beach.", time: "Yesterday" }
    ]
  },
  {
    id: "dest_2",
    name: "Sajek Valley",
    lat: 23.3816,
    lng: 92.2938,
    image: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=800",
    description: "An escape into the clouds surrounded by green hills, valleys, and ethnic communities.",
    caption: "Wake up early for morning cloud waves, bamboo-cooked chicken, and Konglak Para peak trek!",
    rating: 4.9,
    category: "Hills",
    visitedCount: 950,
    unsafeCount: 0,
    comments: [
      { id: "pc_3", user: "sadia_expeditions", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150", text: "Zero network on most SIM cards, but the valley view is unreal!", time: "3 days ago" }
    ]
  },
  {
    id: "dest_3",
    name: "Sreemangal Tea Gardens",
    lat: 24.3065,
    lng: 91.7295,
    image: "https://images.unsplash.com/photo-1597843798940-02c349a5b3a4?w=800",
    description: "The tea capital of Bangladesh, featuring lush terraced estates, rain forests, and wildlife sanctuaries.",
    caption: "Sample the famous 7-layer tea at Nilkantha cabin & spot hoolock gibbons in Lawachara forest!",
    rating: 4.7,
    category: "Nature",
    visitedCount: 680,
    unsafeCount: 0,
    comments: [
      { id: "pc_4", user: "rashed_backpacks", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150", text: "Renting a bicycle for tea garden rides is the best way to explore.", time: "4 days ago" }
    ]
  },
  {
    id: "dest_4",
    name: "Saint Martin's Island",
    lat: 20.6278,
    lng: 92.3233,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    description: "The only coral island in Bangladesh, featuring clear blue water, coconut trees, and delicious seafood.",
    caption: "Chera Dwip boat trip at low tide, fresh green coconut water & beach campfire barbecues!",
    rating: 4.9,
    category: "Island",
    visitedCount: 1100,
    unsafeCount: 1,
    comments: [
      { id: "pc_5", user: "aria_travels", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", text: "Watch out for sharp coral rocks on Chera Dwip. Wear good sandals!", time: "5 days ago" }
    ]
  },
  {
    id: "dest_5",
    name: "Sylhet Ratargul Forest",
    lat: 25.0583,
    lng: 92.0194,
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800",
    description: "The only freshwater swamp forest in Bangladesh, navigated via wooden canoes through submersed trees.",
    caption: "Canoe boat ride through submerged Millettia trees & watchtower panoramic photography!",
    rating: 4.6,
    category: "Forest",
    visitedCount: 520,
    unsafeCount: 3,
    comments: [
      { id: "pc_6", user: "nabil_wanderer", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150", text: "Water level is very high during monsoon. Always wear life jackets!", time: "1 week ago" }
    ]
  }
];

export const MOCK_TOUR_PLANS = [
  {
    id: "plan_1",
    title: "Dhaka ➔ Chittagong ➔ Cox's Bazar Expedition",
    destinationId: "dest_1",
    destinationName: "Cox's Bazar Beach",
    startingLocation: "Dhaka",
    transportation: "Bus & Aeroplane",
    accommodation: "Hotel Peninsula & Sayeman Resort",
    placesVisited: ["Chittagong City", "Patenga Beach", "Cox's Bazar Beach", "Inani Beach"],
    duration: 4, // Days
    totalBudget: 22000, // BDT
    legs: [
      {
        id: "leg_1",
        from: "Dhaka",
        placeName: "Chittagong",
        transportMode: "Bus",
        transportCost: 1200,
        accommodation: "Hotel Peninsula",
        accommodationCost: 3500,
        otherCosts: 1800,
        stayDuration: "1 Day",
        activities: "Visited Batali Hill, Foy's Lake, Patenga Beach sunset"
      },
      {
        id: "leg_2",
        from: "Chittagong",
        placeName: "Cox's Bazar",
        transportMode: "Aeroplane",
        transportCost: 4500,
        accommodation: "Sayeman Beach Resort",
        accommodationCost: 7000,
        otherCosts: 2800,
        stayDuration: "2 Days",
        activities: "Laboni Beach evening, Inani Beach drive, seafood dinner"
      },
      {
        id: "leg_3",
        from: "Cox's Bazar",
        placeName: "Dhaka",
        transportMode: "Bus",
        transportCost: 1200,
        accommodation: "Overnight Bus Journey",
        accommodationCost: 0,
        otherCosts: 0,
        stayDuration: "1 Night",
        activities: "Return bus ride to Dhaka"
      }
    ],
    expenseBreakdown: [
      { category: "Transport", amount: 6900 },
      { category: "Accommodation", amount: 10500 },
      { category: "Food & Seafood", amount: 3100 },
      { category: "Activities & Sightseeing", amount: 1500 }
    ],
    travelTips: "Taking the flight from Chittagong to Cox's Bazar saves 4 hours of road traffic! Book hotel at least 5 days early.",
    photos: [
      "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=500",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500"
    ],
    rating: 4.9,
    ratingsCount: 32,
    budgetAccuracy: 4.9,
    experienceRating: 4.9,
    author: MOCK_USERS[0],
    travelType: "Couple", // Solo, Friends, Family, Couple
    season: "Winter",
    likes: 124,
    comments: [
      { user: "nabil_wanderer", text: "Awesome multi-city route! Taking the flight from Chittagong is a game changer." },
      { user: "sadia_expeditions", text: "How much was the Peninsula hotel per night?" }
    ]
  },
  {
    id: "plan_2",
    title: "Adventure & Camping in Sajek Valley",
    destinationId: "dest_2",
    destinationName: "Sajek Valley",
    startingLocation: "Chittagong",
    transportation: "Chander Gari (4WD Jeep)",
    accommodation: "Sajek Resort & Tent Camping",
    placesVisited: ["Khagrachari", "Konglak Para", "Sajek Valley"],
    duration: 4,
    totalBudget: 8500,
    legs: [
      {
        id: "leg_2_1",
        from: "Chittagong",
        placeName: "Khagrachari",
        transportMode: "Bus",
        transportCost: 800,
        accommodation: "Hotel System",
        accommodationCost: 1200,
        otherCosts: 1000,
        stayDuration: "1 Day",
        activities: "Alutila Cave exploration & Risang waterfall"
      },
      {
        id: "leg_2_2",
        from: "Khagrachari",
        placeName: "Sajek Valley",
        transportMode: "Jeep",
        transportCost: 2200,
        accommodation: "Sajek Eco Cottage",
        accommodationCost: 2300,
        otherCosts: 1000,
        stayDuration: "2 Days",
        activities: "Konglak Para peak, Helipad sunset & cloud watching"
      }
    ],
    expenseBreakdown: [
      { category: "Transport", amount: 3000 },
      { category: "Accommodation", amount: 3500 },
      { category: "Food", amount: 1200 },
      { category: "Activities", amount: 800 }
    ],
    travelTips: "Be prepared for zero mobile networks on certain operators. Carry cash because there are no ATMs in Sajek.",
    photos: [
      "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=500",
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=500"
    ],
    rating: 4.9,
    ratingsCount: 41,
    budgetAccuracy: 4.7,
    experienceRating: 5.0,
    author: MOCK_USERS[1],
    travelType: "Friends",
    season: "Monsoon",
    likes: 156,
    comments: [
      { user: "aria_travels", text: "Sajek in monsoon is heaven! The clouds literally touch you." }
    ]
  },
  {
    id: "plan_3",
    title: "Tea Estates & Rain Forest Weekend Tour",
    destinationId: "dest_3",
    destinationName: "Sreemangal Tea Gardens",
    startingLocation: "Dhaka",
    transportation: "Parabat Express Train",
    accommodation: "Grand Sultan Tea Resort & Eco Cottage",
    placesVisited: ["Sreemangal", "Lawachara Forest"],
    duration: 2,
    totalBudget: 12000,
    legs: [
      {
        id: "leg_3_1",
        from: "Dhaka",
        placeName: "Sreemangal",
        transportMode: "Train",
        transportCost: 1200,
        accommodation: "Grand Sultan Tea Resort",
        accommodationCost: 6800,
        otherCosts: 2000,
        stayDuration: "1 Night",
        activities: "Nilkantha 7-layer tea, Lawachara forest trail, Madhabpur Lake"
      },
      {
        id: "leg_3_2",
        from: "Sreemangal",
        placeName: "Dhaka",
        transportMode: "Train",
        transportCost: 1000,
        accommodation: "Return Journey",
        accommodationCost: 0,
        otherCosts: 1000,
        stayDuration: "1 Day",
        activities: "Shopping tea leaves & souvenirs"
      }
    ],
    expenseBreakdown: [
      { category: "Transport", amount: 2200 },
      { category: "Accommodation", amount: 6800 },
      { category: "Food", amount: 2000 },
      { category: "Activities", amount: 1000 }
    ],
    travelTips: "Try the famous 7-layer tea at Nilkantha. Hire a registered local guide for trekking inside Lawachara forest.",
    photos: [
      "https://images.unsplash.com/photo-1597843798940-02c349a5b3a4?w=500",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=500"
    ],
    rating: 4.6,
    ratingsCount: 15,
    budgetAccuracy: 4.5,
    experienceRating: 4.7,
    author: MOCK_USERS[2],
    travelType: "Family",
    season: "Autumn",
    likes: 42,
    comments: []
  }
];

export const MOCK_POSTS = [
  {
    id: "post_1",
    author: MOCK_USERS[0],
    image: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800",
    caption: "Sunset at Cox's Bazar marine drive is magic. 🌅 Blue waves crashing against green hills, a dream route for any traveler! #oceanvibes #coxsbazar #traveldiary",
    destination: "Cox's Bazar Beach",
    likes: 215,
    comments: [
      { id: "c1", user: "nabil_wanderer", text: "Stunning shot! The lighting is perfect." },
      { id: "c2", user: "sadia_expeditions", text: "Can't wait to visit next week!" }
    ],
    hasLiked: false,
    hasSaved: true,
    time: "2 hours ago"
  },
  {
    id: "post_2",
    author: MOCK_USERS[1],
    image: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=800",
    caption: "Woke up above the clouds today in Sajek Valley. ☁️🏕️ The morning breeze and lush green mountain peaks are absolutely worth the bumpy Chander Gari ride!",
    destination: "Sajek Valley",
    likes: 487,
    comments: [
      { id: "c3", user: "aria_travels", text: "Take me back there! 🥺" },
      { id: "c4", user: "rashed_backpacks", text: "Which cottage has this view?" }
    ],
    hasLiked: true,
    hasSaved: false,
    time: "1 day ago"
  }
];

export const MOCK_GROUP_TOURS = [
  {
    id: "group_1",
    title: "St. Martin's Weekend Expedition 🌊",
    destination: "Saint Martin's Island",
    travelDate: "2026-11-15",
    estimatedBudget: 9500, // per member
    maxMembers: 10,
    transportation: "Bus & Ship",
    accommodation: "Coral View Resort",
    organizer: MOCK_USERS[1], // Nabil
    members: [MOCK_USERS[1], MOCK_USERS[0], MOCK_USERS[2]], // Nabil, Aria, Sadia
    requests: [
      { id: "req_1", user: MOCK_USERS[3], status: "pending" } // Rashed
    ],
    itinerary: [
      { day: "Day 1", plan: "Depart Dhaka at night. Reach Teknaf in the morning and board the Keari ship. Check in, lunch, and sunset at West Beach." },
      { day: "Day 2", plan: "Cycling tour around the island. Visit Chera Dwip via engine boat. Beach barbecue dinner." },
      { day: "Day 3", plan: "Souvenir shopping, local lunch, board the 3:00 PM return ship to Teknaf, and head back to Dhaka." }
    ],
    checklist: [
      { id: "chk_1", task: "Book ship tickets in advance", completed: true, assignedTo: "Nabil Ahmed" },
      { id: "chk_2", task: "Confirm hotel booking details", completed: true, assignedTo: "Nabil Ahmed" },
      { id: "chk_3", task: "Buy campfire barbecue wood/coal", completed: false, assignedTo: "Aria Jahan" },
      { id: "chk_4", task: "Prepare medicine kit", completed: false, assignedTo: "Sadia Rahman" }
    ],
    expenses: [
      { id: "exp_1", title: "Resort Deposit", amount: 15000, paidBy: "Nabil Ahmed", date: "2026-08-01" },
      { id: "exp_2", title: "Ship Tickets", amount: 9000, paidBy: "Nabil Ahmed", date: "2026-08-03" },
      { id: "exp_3", title: "Common First Aid Kit", amount: 1200, paidBy: "Sadia Rahman", date: "2026-08-05" }
    ],
    messages: [
      { id: "gm_1", sender: MOCK_USERS[1], text: "Hey team! I booked the Keari Cruise ship tickets. We are set for Nov 15!", time: "Aug 5, 2:30 PM" },
      { id: "gm_2", sender: MOCK_USERS[0], text: "Awesome! I will handle the food arrangements and the BBQ coordination.", time: "Aug 5, 2:45 PM" },
      { id: "gm_3", sender: MOCK_USERS[2], text: "Should we rent cycles there or book a tour auto?", time: "Aug 5, 3:01 PM" }
    ]
  },
  {
    id: "group_2",
    title: "Sajek Cloud Peak Camping 🏕️",
    destination: "Sajek Valley",
    travelDate: "2026-12-05",
    estimatedBudget: 7500,
    maxMembers: 8,
    transportation: "Chander Gari 4WD Jeep",
    accommodation: "Sajek Eco Cottage & Tent",
    organizer: MOCK_USERS[3], // Rashed Karim
    members: [MOCK_USERS[3], MOCK_USERS[2]], // Rashed, Sadia
    requests: [],
    itinerary: [
      { day: "Day 1", plan: "Meet at Khagrachari town. Ride Chander Gari jeep under military escort up to Sajek." },
      { day: "Day 2", plan: "Sunrise at Konglak Para peak. Helipad campfire & stargazing at night." },
      { day: "Day 3", plan: "Visit Alutila mysterious cave & Risang waterfall on return route to Khagrachari." }
    ],
    checklist: [
      { id: "chk_201", task: "Book Chander Gari 4WD Jeep", completed: true, assignedTo: "Rashed Karim" },
      { id: "chk_202", task: "Reserve Eco Cottage rooms", completed: true, assignedTo: "Sadia Rahman" }
    ],
    expenses: [
      { id: "exp_201", title: "Jeep Rental Deposit", amount: 6000, paidBy: "Rashed Karim", date: "2026-08-04" }
    ],
    messages: [
      { id: "gm_201", sender: MOCK_USERS[3], text: "The morning clouds in Sajek will be breathtaking! Excited for the trek.", time: "Aug 6, 11:00 AM" }
    ]
  },
  {
    id: "group_3",
    title: "Sreemangal Rainforest & Tea Tour 🍃",
    destination: "Sreemangal Tea Gardens",
    travelDate: "2026-11-28",
    estimatedBudget: 6000,
    maxMembers: 6,
    transportation: "Parabat Express Train",
    accommodation: "Tea Resort & Eco Lodge",
    organizer: MOCK_USERS[2], // Sadia Rahman
    members: [MOCK_USERS[2]], // Sadia
    requests: [],
    itinerary: [
      { day: "Day 1", plan: "Morning train from Kamalapur. Check in at Eco Lodge, afternoon tea tasting & bicycle ride." },
      { day: "Day 2", plan: "Guided Lawachara Rainforest trail. Visit Madhabpur Lake and try 7-layer tea." }
    ],
    checklist: [
      { id: "chk_301", task: "Buy Parabat Express train tickets", completed: false, assignedTo: "Sadia Rahman" }
    ],
    expenses: [],
    messages: []
  }
];

export const MOCK_CHATS = [
  {
    id: "chat_1",
    user: MOCK_USERS[1], // Chatting with Nabil
    messages: [
      { id: "m1", senderId: "user_2", text: "Hey Aria! Are you free for the St. Martin's trip in November?", time: "Yesterday, 10:15 AM" },
      { id: "m2", senderId: "user_1", text: "Yes Nabil! I just checked my calendar and joined the group. Super excited!", time: "Yesterday, 10:45 AM" },
      { id: "m3", senderId: "user_2", text: "Great! Let's update the checklist. I assigned barbecue prep to you.", time: "Yesterday, 11:00 AM" },
      { id: "m4", senderId: "user_1", text: "On it! Will look up some good options.", time: "Yesterday, 11:12 AM" }
    ]
  },
  {
    id: "chat_2",
    user: MOCK_USERS[2], // Chatting with Sadia
    messages: [
      { id: "m5", senderId: "user_3", text: "Hi Aria, did you check the Sreemangal itinerary? Is Lawachara trek safe for kids?", time: "Aug 6, 4:10 PM" },
      { id: "m6", senderId: "user_1", text: "Yes, it is very safe. The main trail is fully paved. Just make sure to use mosquito repellent!", time: "Aug 6, 4:32 PM" }
    ]
  }
];

export const MOCK_NOTIFICATIONS = [
  {
    id: "notif_1",
    type: "like", // like, comment, join_request, follow, update
    title: "Nabil Ahmed liked your post.",
    body: "Post: Sunset at Cox's Bazar marine drive is magic...",
    time: "5 minutes ago",
    unread: true,
    user: MOCK_USERS[1]
  },
  {
    id: "notif_2",
    type: "comment",
    title: "Sadia Rahman commented on your post.",
    body: '"Did you take the marine drive auto-rickshaw?"',
    time: "20 minutes ago",
    unread: true,
    user: MOCK_USERS[2]
  },
  {
    id: "notif_3",
    type: "join_request",
    title: "Rashed Karim requested to join St. Martin's Expedition.",
    body: "Group: St. Martin's Weekend Expedition 🌊",
    time: "1 hour ago",
    unread: true,
    user: MOCK_USERS[3]
  },
  {
    id: "notif_4",
    type: "follow",
    title: "Sadia Rahman started following you.",
    body: "Follow back to view each other's custom tour maps.",
    time: "2 days ago",
    unread: false,
    user: MOCK_USERS[2]
  }
];
