import { query } from "../config/db.js";
import { calculateLeague } from "../utils/leagueHelper.js";

// Helper to provide a guaranteed valid avatar URL
function getSafeAvatar(url, seed) {
  if (url && typeof url === "string" && url.trim().length > 0 && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:image/"))) {
    return url;
  }
  const s = encodeURIComponent(seed || "traveler");
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${s}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLERS FOR RANKINGS & LEADERBOARDS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/rankings/overview
 * Returns summary stats, top 3 champions in all categories, and current user's personal rank
 */
export async function getRankingsOverview(req, res) {
  try {
    const { userId } = req.query;

    // 1. Top 3 Travelers (Community score excluding root system admin)
    const topTravelersRaw = await query(`
      SELECT 
        u.user_id AS id,
        u.username,
        u.first_name,
        u.last_name,
        u.profile_picture_url AS avatar,
        u.bio,
        u.country,
        u.city,
        u.league_points AS points,
        u.followers_count AS followers,
        u.following_count AS following,
        u.total_trips_shared,
        (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.user_id AND p.is_public = 1) AS posts_count,
        (SELECT COUNT(*) FROM places pl WHERE pl.created_by = u.user_id) AS places_count,
        (SELECT COUNT(*) FROM tour_plans tp WHERE tp.user_id = u.user_id AND tp.is_public = 1) AS plans_count,
        (SELECT COUNT(*) FROM expedition_groups eg WHERE eg.organizer_id = u.user_id) AS expeditions_count
      FROM users u
      WHERE u.account_status = 'active' AND u.user_id != 'admin_root'
      ORDER BY u.league_points DESC, u.followers_count DESC
      LIMIT 3
    `);

    const topTravelers = topTravelersRaw.map((u, idx) => ({
      ...u,
      rank: idx + 1,
      name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username,
      avatar: getSafeAvatar(u.avatar, u.username || u.id),
      league: calculateLeague(u.points),
      stats: {
        trips: u.total_trips_shared || 0,
        posts: u.posts_count || 0,
        places: u.places_count || 0,
        plans: u.plans_count || 0,
        expeditions: u.expeditions_count || 0,
        cities: Math.max(1, Math.min(64, Math.floor((u.total_trips_shared || 1) * 1.5)))
      }
    }));

    // 2. Top 3 Master Guides (Most active place contributors and expedition leaders)
    const topGuidesRaw = await query(`
      SELECT 
        u.user_id AS id,
        u.username,
        u.first_name,
        u.last_name,
        u.profile_picture_url AS avatar,
        u.bio,
        u.city,
        u.league_points AS points,
        u.followers_count AS followers,
        COUNT(DISTINCT pl.place_id) AS verified_places,
        COUNT(DISTINCT eg.group_id) AS expeditions_led,
        COUNT(DISTINCT tp.tour_plan_id) AS tour_plans_authored,
        COALESCE(AVG(pr.place_rating), 5.0) AS avg_guide_rating,
        (
          (COUNT(DISTINCT pl.place_id) * 100) +
          (COUNT(DISTINCT eg.group_id) * 150) +
          (COUNT(DISTINCT tp.tour_plan_id) * 120) +
          (u.league_points * 0.5)
        ) AS guide_score
      FROM users u
      LEFT JOIN places pl ON pl.created_by = u.user_id
      LEFT JOIN expedition_groups eg ON eg.organizer_id = u.user_id
      LEFT JOIN tour_plans tp ON tp.user_id = u.user_id AND tp.is_public = 1
      LEFT JOIN place_ratings pr ON pr.place_id = pl.place_id
      WHERE u.account_status = 'active' AND u.user_id != 'admin_root'
      GROUP BY u.user_id
      ORDER BY guide_score DESC, verified_places DESC
      LIMIT 3
    `);

    const topGuides = topGuidesRaw.map((g, idx) => ({
      ...g,
      rank: idx + 1,
      name: [g.first_name, g.last_name].filter(Boolean).join(" ") || g.username,
      avatar: getSafeAvatar(g.avatar, g.username || g.id),
      league: calculateLeague(g.points),
      guideScore: Math.round(g.guide_score || 0),
      avgRating: parseFloat(Number(g.avg_guide_rating || 5.0).toFixed(4)),
      specialty: g.city ? `${g.city} & Regional Travel` : "Bangladesh Backcountry Guide"
    }));

    // 3. Top 3 Tour Plans (Highest rated & most saved itineraries)
    const topPlansRaw = await query(`
      SELECT 
        tp.tour_plan_id AS id,
        tp.title,
        tp.description,
        tp.destination,
        tp.starting_location AS startingLocation,
        tp.duration_days AS durationDays,
        tp.transportation,
        tp.accommodation_type AS accommodationType,
        tp.total_budget AS totalBudget,
        tp.travel_type AS travelType,
        tp.season,
        tp.rating_avg AS rating,
        tp.rating_count AS ratingCount,
        tp.likes_count AS likes,
        tp.views_count AS views,
        tp.saves_count AS saves,
        u.user_id AS author_id,
        u.username AS author_username,
        u.first_name AS author_first_name,
        u.last_name AS author_last_name,
        u.profile_picture_url AS author_avatar
      FROM tour_plans tp
      LEFT JOIN users u ON tp.user_id = u.user_id
      WHERE tp.is_public = 1
      ORDER BY tp.rating_avg DESC, tp.likes_count DESC, tp.saves_count DESC
      LIMIT 3
    `);

    const topPlans = topPlansRaw.map((p, idx) => ({
      id: p.id,
      rank: idx + 1,
      title: p.title,
      description: p.description || "",
      destination: p.destination,
      startingLocation: p.startingLocation,
      durationDays: p.durationDays || 3,
      transportation: p.transportation,
      totalBudget: p.totalBudget || 7500,
      travelType: p.travelType || "Solo",
      season: p.season || "Winter",
      rating: parseFloat(Number(p.rating || 4.8).toFixed(4)),
      ratingCount: p.ratingCount || 1,
      likes: p.likes || 0,
      views: p.views || 0,
      saves: p.saves || 0,
      author: {
        id: p.author_id,
        username: p.author_username,
        name: [p.author_first_name, p.author_last_name].filter(Boolean).join(" ") || p.author_username,
        avatar: getSafeAvatar(p.author_avatar, p.author_username || p.author_id)
      }
    }));

    // 4. Platform Summary Counts
    const [statsRaw] = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE account_status = 'active' AND user_id != 'admin_root') AS total_travelers,
        (SELECT COUNT(*) FROM places WHERE is_public = 1) AS total_places,
        (SELECT COUNT(*) FROM tour_plans WHERE is_public = 1) AS total_plans,
        (SELECT COUNT(*) FROM posts WHERE is_public = 1) AS total_posts,
        (SELECT COUNT(*) FROM expedition_groups) AS total_expeditions
    `);

    // 5. Current User Rank (if requested)
    let currentUserRank = null;
    if (userId) {
      const [userRow] = await query(`SELECT user_id, league_points FROM users WHERE user_id = ?`, [userId]);
      if (userRow) {
        const [higherUsers] = await query(
          `SELECT COUNT(*) AS count FROM users WHERE league_points > ? AND account_status = 'active' AND user_id != 'admin_root'`,
          [userRow.league_points]
        );
        currentUserRank = {
          rank: (higherUsers?.count || 0) + 1,
          points: userRow.league_points,
          league: calculateLeague(userRow.league_points)
        };
      }
    }

    res.json({
      success: true,
      stats: {
        totalTravelers: statsRaw?.total_travelers || 0,
        totalPlaces: statsRaw?.total_places || 0,
        totalPlans: statsRaw?.total_plans || 0,
        totalPosts: statsRaw?.total_posts || 0,
        totalExpeditions: statsRaw?.total_expeditions || 0
      },
      topTravelers,
      topGuides,
      topPlans,
      currentUserRank
    });
  } catch (error) {
    console.error("Error in getRankingsOverview:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/rankings/travelers
 * Full leaderboard of travelers with filters and pagination
 */
export async function getRankedTravelers(req, res) {
  try {
    const { 
      league = "All", 
      search = "", 
      sortBy = "points",
      limit = 50, 
      offset = 0 
    } = req.query;

    const lim = Math.min(parseInt(limit, 10) || 50, 100);
    const off = Math.max(parseInt(offset, 10) || 0, 0);

    const conditions = ["u.account_status = 'active'", "u.user_id != 'admin_root'"];
    const params = [];

    if (search.trim()) {
      const s = `%${search.trim()}%`;
      conditions.push("(u.username LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.city LIKE ?)");
      params.push(s, s, s, s);
    }

    let orderClause = "u.league_points DESC, u.followers_count DESC";
    if (sortBy === "trips") {
      orderClause = "u.total_trips_shared DESC, u.league_points DESC";
    } else if (sortBy === "followers") {
      orderClause = "u.followers_count DESC, u.league_points DESC";
    } else if (sortBy === "places") {
      orderClause = "places_count DESC, u.league_points DESC";
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await query(`
      SELECT 
        u.user_id AS id,
        u.username,
        u.first_name,
        u.last_name,
        u.profile_picture_url AS avatar,
        u.bio,
        u.country,
        u.city,
        u.preferred_travel_type AS travelType,
        u.league_points AS points,
        u.followers_count AS followers,
        u.following_count AS following,
        u.total_trips_shared,
        u.is_verified,
        (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.user_id AND p.is_public = 1) AS posts_count,
        (SELECT COUNT(*) FROM places pl WHERE pl.created_by = u.user_id) AS places_count,
        (SELECT COUNT(*) FROM tour_plans tp WHERE tp.user_id = u.user_id AND tp.is_public = 1) AS plans_count,
        (SELECT COUNT(*) FROM expedition_groups eg WHERE eg.organizer_id = u.user_id) AS expeditions_count
      FROM users u
      ${whereSql}
      ORDER BY ${orderClause}
      LIMIT ? OFFSET ?
    `, [...params, lim, off]);

    const formatted = rows.map((u) => {
      const calculatedLeague = calculateLeague(u.points);
      const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username;
      return {
        id: u.id,
        user_id: u.id,
        name,
        username: u.username,
        avatar: getSafeAvatar(u.avatar, u.username || u.id),
        bio: u.bio || "",
        country: u.country || "Bangladesh",
        city: u.city || "Dhaka",
        travelType: u.travelType || "Solo",
        points: u.points || 0,
        league: calculatedLeague,
        followers: u.followers || 0,
        following: u.following || 0,
        isVerified: Boolean(u.is_verified),
        stats: {
          trips: u.total_trips_shared || 0,
          posts: u.posts_count || 0,
          places: u.places_count || 0,
          plans: u.plans_count || 0,
          expeditions: u.expeditions_count || 0,
          cities: Math.max(1, Math.min(64, Math.floor((u.total_trips_shared || 1) * 1.5)))
        }
      };
    });

    const filtered = league === "All" 
      ? formatted 
      : formatted.filter(t => t.league.toLowerCase() === league.toLowerCase());

    const travelersWithRank = filtered.map((t, index) => ({
      ...t,
      rank: off + index + 1
    }));

    res.json({
      success: true,
      count: travelersWithRank.length,
      travelers: travelersWithRank
    });
  } catch (error) {
    console.error("Error in getRankedTravelers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/rankings/guides
 * Master Tour Guides ranked by verified mapped spots, reviews, and expeditions
 */
export async function getRankedGuides(req, res) {
  try {
    const { search = "", division = "All", limit = 50, offset = 0 } = req.query;

    const lim = Math.min(parseInt(limit, 10) || 50, 100);
    const off = Math.max(parseInt(offset, 10) || 0, 0);

    const conditions = ["u.account_status = 'active'", "u.user_id != 'admin_root'"];
    const params = [];

    if (search.trim()) {
      const s = `%${search.trim()}%`;
      conditions.push("(u.username LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.city LIKE ?)");
      params.push(s, s, s, s);
    }

    if (division !== "All") {
      conditions.push("u.city LIKE ?");
      params.push(`%${division}%`);
    }

    const whereSql = `WHERE ${conditions.join(" AND ")}`;

    const rows = await query(`
      SELECT 
        u.user_id AS id,
        u.username,
        u.first_name,
        u.last_name,
        u.profile_picture_url AS avatar,
        u.bio,
        u.city,
        u.country,
        u.league_points AS points,
        u.followers_count AS followers,
        u.is_verified,
        COUNT(DISTINCT pl.place_id) AS verified_places,
        COUNT(DISTINCT eg.group_id) AS expeditions_led,
        COUNT(DISTINCT tp.tour_plan_id) AS tour_plans_authored,
        COALESCE(AVG(pr.place_rating), 4.9) AS avg_guide_rating,
        COUNT(DISTINCT pr.rating_id) AS total_reviews_received,
        (
          (COUNT(DISTINCT pl.place_id) * 100) +
          (COUNT(DISTINCT eg.group_id) * 150) +
          (COUNT(DISTINCT tp.tour_plan_id) * 120) +
          (COALESCE(AVG(pr.place_rating), 4.9) * 40) +
          (u.league_points * 0.5)
        ) AS guide_score
      FROM users u
      LEFT JOIN places pl ON pl.created_by = u.user_id
      LEFT JOIN expedition_groups eg ON eg.organizer_id = u.user_id
      LEFT JOIN tour_plans tp ON tp.user_id = u.user_id AND tp.is_public = 1
      LEFT JOIN place_ratings pr ON pr.place_id = pl.place_id
      ${whereSql}
      GROUP BY u.user_id
      ORDER BY guide_score DESC, verified_places DESC, u.league_points DESC
      LIMIT ? OFFSET ?
    `, [...params, lim, off]);

    const guides = rows.map((g, idx) => ({
      id: g.id,
      user_id: g.id,
      rank: off + idx + 1,
      name: [g.first_name, g.last_name].filter(Boolean).join(" ") || g.username,
      username: g.username,
      avatar: getSafeAvatar(g.avatar, g.username || g.id),
      bio: g.bio || "Certified community explorer and local travel guide.",
      city: g.city || "Bangladesh",
      league: calculateLeague(g.points),
      points: g.points || 0,
      followers: g.followers || 0,
      isVerified: Boolean(g.is_verified),
      guideScore: Math.round(g.guide_score || 0),
      avgRating: parseFloat(Number(g.avg_guide_rating || 4.9).toFixed(4)),
      reviewsCount: g.total_reviews_received || 0,
      verifiedPlaces: g.verified_places || 0,
      expeditionsLed: g.expeditions_led || 0,
      plansAuthored: g.tour_plans_authored || 0,
      specialty: g.city ? `${g.city} & Regional Specialist` : "Bangladesh Eco-Trekking Guide"
    }));

    res.json({ success: true, count: guides.length, guides });
  } catch (error) {
    console.error("Error in getRankedGuides:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/rankings/plans
 * Ranked tour itineraries & travel plans with sorting and filters
 */
export async function getRankedPlans(req, res) {
  try {
    const { 
      sortBy = "rating",
      travelType = "All",
      search = "",
      limit = 50, 
      offset = 0 
    } = req.query;

    const lim = Math.min(parseInt(limit, 10) || 50, 100);
    const off = Math.max(parseInt(offset, 10) || 0, 0);

    const conditions = ["tp.is_public = 1"];
    const params = [];

    if (search.trim()) {
      const s = `%${search.trim()}%`;
      conditions.push("(tp.title LIKE ? OR tp.destination LIKE ? OR tp.starting_location LIKE ? OR u.first_name LIKE ? OR u.username LIKE ?)");
      params.push(s, s, s, s, s);
    }

    if (travelType !== "All") {
      conditions.push("tp.travel_type = ?");
      params.push(travelType);
    }

    let orderClause = "tp.rating_avg DESC, tp.rating_count DESC, tp.likes_count DESC";
    if (sortBy === "likes") {
      orderClause = "tp.likes_count DESC, tp.saves_count DESC";
    } else if (sortBy === "budget") {
      orderClause = "tp.total_budget ASC, tp.rating_avg DESC";
    } else if (sortBy === "saves") {
      orderClause = "tp.saves_count DESC, tp.likes_count DESC";
    } else if (sortBy === "duration") {
      orderClause = "tp.duration_days DESC, tp.rating_avg DESC";
    }

    const whereSql = `WHERE ${conditions.join(" AND ")}`;

    const rows = await query(`
      SELECT 
        tp.tour_plan_id AS id,
        tp.title,
        tp.description,
        tp.destination,
        tp.starting_location AS startingLocation,
        tp.travel_start_date AS startDate,
        tp.travel_end_date AS endDate,
        tp.duration_days AS durationDays,
        tp.transportation,
        tp.accommodation_type AS accommodationType,
        tp.total_budget AS totalBudget,
        tp.travel_tips AS travelTips,
        tp.travel_type AS travelType,
        tp.season,
        tp.views_count AS views,
        tp.likes_count AS likes,
        tp.comments_count AS comments,
        tp.rating_avg AS rating,
        tp.rating_count AS ratingCount,
        tp.saves_count AS saves,
        tp.created_at AS createdAt,
        u.user_id AS author_id,
        u.username AS author_username,
        u.first_name AS author_first_name,
        u.last_name AS author_last_name,
        u.profile_picture_url AS author_avatar,
        u.league_points AS author_points
      FROM tour_plans tp
      LEFT JOIN users u ON tp.user_id = u.user_id
      ${whereSql}
      ORDER BY ${orderClause}
      LIMIT ? OFFSET ?
    `, [...params, lim, off]);

    const planIds = rows.map(r => r.id);
    let placesMap = {};

    if (planIds.length > 0) {
      const ph = planIds.map(() => "?").join(",");
      const placesRaw = await query(`
        SELECT 
          tpm.tour_plan_id,
          tpm.place_id,
          tpm.location,
          tpm.transportation,
          tpm.Expense,
          p.place_name AS placeName,
          p.district,
          p.division
        FROM tour_plan_places_modified tpm
        LEFT JOIN places p ON tpm.place_id = p.place_id
        WHERE tpm.tour_plan_id IN (${ph})
        ORDER BY tpm.visit_date ASC, tpm.created_at ASC
      `, planIds);

      placesRaw.forEach(p => {
        if (!placesMap[p.tour_plan_id]) placesMap[p.tour_plan_id] = [];
        placesMap[p.tour_plan_id].push({
          placeId: p.place_id,
          placeName: p.placeName || p.location || "Destined Stop",
          district: p.district || "",
          division: p.division || "",
          transportation: p.transportation || "Bus",
          expense: p.Expense || 0
        });
      });
    }

    const plans = rows.map((p, idx) => ({
      id: p.id,
      rank: off + idx + 1,
      title: p.title,
      description: p.description || "",
      destination: p.destination,
      destinationName: p.destination,
      startingLocation: p.startingLocation || "Dhaka",
      durationDays: p.durationDays || 3,
      transportation: p.transportation || "Bus",
      accommodationType: p.accommodationType || "Hotel",
      totalBudget: Number(p.totalBudget) || 8500,
      travelTips: p.travelTips || "",
      travelType: p.travelType || "Friends",
      season: p.season || "Winter",
      views: p.views || 0,
      likes: p.likes || 0,
      comments: p.comments || 0,
      saves: p.saves || 0,
      rating: parseFloat(Number(p.rating || 4.9).toFixed(4)),
      ratingCount: p.ratingCount || 1,
      createdAt: p.createdAt,
      legs: placesMap[p.id] || [
        { from: p.startingLocation || "Dhaka", placeName: p.destination, transportation: p.transportation || "Bus" }
      ],
      author: {
        id: p.author_id,
        username: p.author_username,
        name: [p.author_first_name, p.author_last_name].filter(Boolean).join(" ") || p.author_username || "Traveler",
        avatar: getSafeAvatar(p.author_avatar, p.author_username || p.author_id),
        league: calculateLeague(p.author_points)
      }
    }));

    res.json({ success: true, count: plans.length, plans });
  } catch (error) {
    console.error("Error in getRankedPlans:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/rankings/places
 * Top ranked tourist spots & hidden gems by community safety rating and popularity
 */
export async function getRankedPlaces(req, res) {
  try {
    const { division = "All", search = "", limit = 50, offset = 0 } = req.query;

    const lim = Math.min(parseInt(limit, 10) || 50, 100);
    const off = Math.max(parseInt(offset, 10) || 0, 0);

    const conditions = ["p.is_public = 1"];
    const params = [];

    if (search.trim()) {
      const s = `%${search.trim()}%`;
      conditions.push("(p.place_name LIKE ? OR p.district LIKE ? OR p.division LIKE ? OR p.description LIKE ?)");
      params.push(s, s, s, s);
    }

    if (division !== "All") {
      conditions.push("(p.division LIKE ? OR p.district LIKE ?)");
      params.push(`%${division}%`, `%${division}%`);
    }

    const whereSql = `WHERE ${conditions.join(" AND ")}`;

    const rows = await query(`
      SELECT 
        p.place_id AS id,
        p.place_name AS placeName,
        p.description,
        p.division,
        p.district,
        p.address,
        p.latitude,
        p.longitude,
        p.safety_rating AS safetyRating,
        p.safety_rating_count AS ratingsCount,
        p.likes_count AS likes,
        p.comments_count AS comments,
        p.saves_count AS saves,
        p.created_at AS createdAt,
        (
          (p.safety_rating * 150) + 
          (p.safety_rating_count * 20) + 
          (p.likes_count * 10) + 
          (p.saves_count * 15)
        ) AS popularity_score,
        (SELECT image_url FROM place_images pi WHERE pi.place_id = p.place_id LIMIT 1) AS coverImage,
        u.user_id AS author_id,
        u.username AS author_username,
        u.first_name AS author_first_name,
        u.last_name AS author_last_name,
        u.profile_picture_url AS author_avatar
      FROM places p
      LEFT JOIN users u ON p.created_by = u.user_id
      ${whereSql}
      ORDER BY popularity_score DESC, p.safety_rating DESC, p.likes_count DESC
      LIMIT ? OFFSET ?
    `, [...params, lim, off]);

    const places = rows.map((p, idx) => ({
      id: p.id,
      rank: off + idx + 1,
      placeName: p.placeName,
      description: p.description || "Scenic destination in Bangladesh.",
      division: p.division || "Bangladesh",
      district: p.district || "",
      address: p.address || "",
      latitude: p.latitude,
      longitude: p.longitude,
      safetyRating: parseFloat(Number(p.safetyRating || 5.0).toFixed(4)),
      ratingsCount: p.ratingsCount || 0,
      likes: p.likes || 0,
      comments: p.comments || 0,
      saves: p.saves || 0,
      coverImage: p.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
      popularityScore: Math.round(p.popularity_score || 0),
      author: {
        id: p.author_id,
        name: [p.author_first_name, p.author_last_name].filter(Boolean).join(" ") || p.author_username || "Community Traveler",
        avatar: getSafeAvatar(p.author_avatar, p.author_username || p.author_id)
      }
    }));

    res.json({ success: true, count: places.length, places });
  } catch (error) {
    console.error("Error in getRankedPlaces:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
