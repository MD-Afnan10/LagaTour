import { query } from "../config/db.js";
import { calculateLeague } from "../utils/leagueHelper.js";

// Helper to ensure a user exists in the database
async function ensureUserExists(userData) {
  if (!userData) return "user_anon";
  const userId = userData.id || userData.user_id || `user_${Date.now()}`;
  const username = userData.username || userData.name?.toLowerCase().replace(/\s+/g, "_") || "traveler";
  const email = userData.email || `${username}@laga.tour`;
  const nameParts = (userData.name || username).split(" ");
  const firstName = nameParts[0] || "Traveler";
  const lastName = nameParts.slice(1).join(" ") || "";
  const avatar = userData.avatar || userData.profile_picture_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`;
  const points = userData.points || userData.league_points || 350;

  try {
    await query(`
      INSERT INTO users (user_id, email, username, first_name, last_name, profile_picture_url, league_points)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        username = VALUES(username),
        profile_picture_url = VALUES(profile_picture_url),
        league_points = VALUES(league_points)
    `, [userId, email, username, firstName, lastName, avatar, points]);
  } catch (err) {
    console.error("Error ensuring user exists for place:", err.message);
  }

  return userId;
}

// Fallback Division & District data if DB connection is unavailable
const FALLBACK_DIVISIONS = [
  { division_id: "div_dhaka", division_name: "Dhaka" },
  { division_id: "div_chittagong", division_name: "Chattogram" },
  { division_id: "div_rajshahi", division_name: "Rajshahi" },
  { division_id: "div_khulna", division_name: "Khulna" },
  { division_id: "div_barisal", division_name: "Barishal" },
  { division_id: "div_sylhet", division_name: "Sylhet" },
  { division_id: "div_rangpur", division_name: "Rangpur" },
  { division_id: "div_mymensingh", division_name: "Mymensingh" }
];

const FALLBACK_DISTRICTS = [
  { district_id: "dis_dhaka", district_name: "Dhaka", division_id: "div_dhaka" },
  { district_id: "dis_gazipur", district_name: "Gazipur", division_id: "div_dhaka" },
  { district_id: "dis_narayanganj", district_name: "Narayanganj", division_id: "div_dhaka" },
  { district_id: "dis_coxsbazar", district_name: "Cox's Bazar", division_id: "div_chittagong" },
  { district_id: "dis_chattogram", district_name: "Chattogram", division_id: "div_chittagong" },
  { district_id: "dis_rangamati", district_name: "Rangamati", division_id: "div_chittagong" },
  { district_id: "dis_sylhet", district_name: "Sylhet", division_id: "div_sylhet" },
  { district_id: "dis_moulvibazar", district_name: "Moulvibazar", division_id: "div_sylhet" },
  { district_id: "dis_rajshahi", district_name: "Rajshahi", division_id: "div_rajshahi" },
  { district_id: "dis_khulna", district_name: "Khulna", division_id: "div_khulna" },
  { district_id: "dis_barishal", district_name: "Barishal", division_id: "div_barisal" },
  { district_id: "dis_rangpur", district_name: "Rangpur", division_id: "div_rangpur" },
  { district_id: "dis_mymensingh", district_name: "Mymensingh", division_id: "div_mymensingh" }
];

/**
 * GET /api/places/locations
 * Return all divisions and districts for form selectors
 */
export async function getDivisionsAndDistricts(req, res) {
  try {
    const divisions = await query("SELECT division_id, division_name FROM divisions ORDER BY division_name ASC");
    const districts = await query("SELECT district_id, district_name, division_id FROM districts ORDER BY district_name ASC");

    res.json({
      success: true,
      divisions: divisions && divisions.length > 0 ? divisions : FALLBACK_DIVISIONS,
      districts: districts && districts.length > 0 ? districts : FALLBACK_DISTRICTS
    });
  } catch (error) {
    console.warn("Using fallback divisions and districts:", error.message);
    res.json({
      success: true,
      divisions: FALLBACK_DIVISIONS,
      districts: FALLBACK_DISTRICTS
    });
  }
}

/**
 * GET /api/places/nearby
 * Find existing places near latitude and longitude within a radius (in km)
 */
export async function getNearbyPlaces(req, res) {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius) || 15.0; // default 15 km

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: "Valid lat and lng query parameters are required." });
    }

    // Haversine formula spherical distance calculation
    const sql = `
      SELECT 
        p.*,
        u.username, u.first_name, u.last_name, u.profile_picture_url,
        ( 6371 * acos( 
            cos( radians(?) ) * cos( radians( p.latitude ) ) * 
            cos( radians( p.longitude ) - radians(?) ) + 
            sin( radians(?) ) * sin( radians( p.latitude ) ) 
          ) ) AS distance_km
      FROM places p
      LEFT JOIN users u ON p.created_by = u.user_id
      HAVING distance_km <= ?
      ORDER BY distance_km ASC
      LIMIT 20;
    `;

    let nearbyRaw = [];
    try {
      nearbyRaw = await query(sql, [lat, lng, lat, radius]);
    } catch (dbErr) {
      console.warn("Nearby query fallback:", dbErr.message);
    }

    // Fetch images for these nearby places
    if (nearbyRaw.length > 0) {
      const placeIds = nearbyRaw.map(p => p.place_id);
      const placeholders = placeIds.map(() => "?").join(",");
      const imagesRaw = await query(
        `SELECT place_id, image_url FROM place_images WHERE place_id IN (${placeholders})`,
        placeIds
      );

      const formatted = nearbyRaw.map(p => ({
        ...p,
        distanceKm: parseFloat(Number(p.distance_km).toFixed(2)),
        images: imagesRaw.filter(img => img.place_id === p.place_id).map(img => img.image_url),
        safetyRating: Number(p.safety_rating) || 5.0,
        author: {
          name: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.username || "Traveler",
          username: p.username || "traveler",
          avatar: p.profile_picture_url
        }
      }));

      return res.json({ success: true, count: formatted.length, places: formatted });
    }

    res.json({ success: true, count: 0, places: [] });
  } catch (error) {
    console.error("Error in getNearbyPlaces:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/places/quick-save
 * Instantly records current coordinates as a draft place in "My Places"
 */
export async function quickSavePlace(req, res) {
  try {
    const { user, latitude, longitude, customName } = req.body;
    const userId = await ensureUserExists(user);

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: "Valid latitude and longitude are required." });
    }

    const placeId = `place_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const placeholderTitle = customName?.trim() || `📍 Discovered Spot #${randomCode}`;

    // 1. Create draft place (is_public = 0)
    await query(`
      INSERT INTO places (
        place_id, place_name, description, latitude, longitude, safety_rating,
        safety_rating_count, is_public, created_by
      ) VALUES (?, ?, ?, ?, ?, 5.0, 0, 0, ?)
    `, [
      placeId,
      placeholderTitle,
      `Location recorded on ${new Date().toLocaleDateString()} at coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}). Edit details to publish to the community feed.`,
      lat,
      lng,
      userId
    ]);

    // 2. Link to user in myplaces table
    const myPlaceId = `mp_${userId}_${placeId}`;
    await query(`
      INSERT INTO myplaces (my_place_id, user_id, place_id, is_owner)
      VALUES (?, ?, ?, 1)
    `, [myPlaceId, userId, placeId]);

    // 3. Award discovery points (+25 points)
    await query(`UPDATE users SET league_points = league_points + 25 WHERE user_id = ?`, [userId]);

    res.status(201).json({
      success: true,
      message: "Place location successfully recorded to 'My Places'! You can edit photos and details anytime.",
      place: {
        id: placeId,
        place_id: placeId,
        placeName: placeholderTitle,
        description: `Location recorded at (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        latitude: lat,
        longitude: lng,
        safetyRating: 5.0,
        isPublic: false,
        isOwner: true,
        images: [],
        createdAt: new Date().toISOString()
      },
      pointsAwarded: 25
    });
  } catch (error) {
    console.error("Error in quickSavePlace:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/places/link-existing
 * Adds an existing nearby place into user's "My Places"
 */
export async function linkExistingPlace(req, res) {
  try {
    const { user, placeId } = req.body;
    const userId = await ensureUserExists(user);

    if (!placeId) {
      return res.status(400).json({ success: false, message: "placeId is required." });
    }

    const [place] = await query("SELECT * FROM places WHERE place_id = ?", [placeId]);
    if (!place) {
      return res.status(404).json({ success: false, message: "Place not found." });
    }

    const myPlaceId = `mp_${userId}_${placeId}`;
    await query(`
      INSERT INTO myplaces (my_place_id, user_id, place_id, is_owner)
      VALUES (?, ?, ?, 0)
      ON DUPLICATE KEY UPDATE is_owner = is_owner
    `, [myPlaceId, userId, placeId]);

    // Increment saves count
    await query(`UPDATE places SET saves_count = saves_count + 1 WHERE place_id = ?`, [placeId]);

    // Award bonus points for linking to verified place (+50 pts)
    await query(`UPDATE users SET league_points = league_points + 50 WHERE user_id = ?`, [userId]);

    res.json({
      success: true,
      message: `Added "${place.place_name}" to your 'My Places' collection! (+50 Bonus Points)`,
      placeId,
      pointsAwarded: 50
    });
  } catch (error) {
    console.error("Error in linkExistingPlace:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/places/my-places/:userId
 * Fetch all places saved/discovered by a user in "My Places"
 */
export async function getUserMyPlaces(req, res) {
  try {
    const { userId } = req.params;

    const sql = `
      SELECT 
        mp.my_place_id,
        mp.is_owner,
        mp.created_at AS saved_at,
        p.*,
        d.division_name,
        dis.district_name,
        pr.place_rating AS user_rating,
        pr.review_text AS user_review
      FROM myplaces mp
      JOIN places p ON mp.place_id = p.place_id
      LEFT JOIN divisions d ON p.division_id = d.division_id
      LEFT JOIN districts dis ON p.district_id = dis.district_id
      LEFT JOIN place_ratings pr ON pr.place_id = p.place_id AND pr.user_id = ?
      WHERE mp.user_id = ?
      ORDER BY mp.created_at DESC;
    `;

    const myPlacesRaw = await query(sql, [userId, userId]);

    if (!myPlacesRaw || myPlacesRaw.length === 0) {
      return res.json({ success: true, count: 0, places: [] });
    }

    const placeIds = myPlacesRaw.map(p => p.place_id);
    const placeholders = placeIds.map(() => "?").join(",");

    const imagesRaw = await query(
      `SELECT place_id, image_url FROM place_images WHERE place_id IN (${placeholders}) ORDER BY created_at ASC`,
      placeIds
    );

    const formatted = myPlacesRaw.map(p => {
      const pImages = imagesRaw.filter(img => img.place_id === p.place_id).map(img => img.image_url);
      return {
        id: p.place_id,
        place_id: p.place_id,
        my_place_id: p.my_place_id,
        placeName: p.place_name,
        description: p.description || "",
        divisionId: p.division_id,
        districtId: p.district_id,
        divisionName: p.division_name || p.division || "Bangladesh",
        districtName: p.district_name || p.district || "General",
        latitude: parseFloat(p.latitude),
        longitude: parseFloat(p.longitude),
        safetyRating: parseFloat(p.safety_rating) || 5.0,
        safetyRatingCount: parseInt(p.safety_rating_count, 10) || 0,
        isPublic: Boolean(p.is_public),
        isOwner: Boolean(p.is_owner),
        likesCount: parseInt(p.likes_count, 10) || 0,
        commentsCount: parseInt(p.comments_count, 10) || 0,
        savesCount: parseInt(p.saves_count, 10) || 0,
        images: pImages,
        userRating: p.user_rating ? parseFloat(p.user_rating) : null,
        userReview: p.user_review || "",
        savedAt: p.saved_at
      };
    });

    res.json({ success: true, count: formatted.length, places: formatted });
  } catch (error) {
    console.error("Error in getUserMyPlaces:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PUT /api/places/:placeId
 * Update place details, upload photos, division, district, safety rating, and publish
 */
export async function updatePlaceDetails(req, res) {
  try {
    const { placeId } = req.params;
    const {
      user,
      placeName,
      description,
      divisionId,
      districtId,
      divisionName,
      districtName,
      safetyRating,
      isPublic,
      images = []
    } = req.body;

    const userId = await ensureUserExists(user);

    const [existing] = await query("SELECT * FROM places WHERE place_id = ?", [placeId]);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Place not found." });
    }

    // Verify creator ownership: only the creator can edit place details
    if (existing.created_by && existing.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to edit this place because you are not the original creator."
      });
    }

    const wasPrivate = existing.is_public === 0;
    const willBePublic = isPublic ? 1 : 0;

    // Strict validation before allowing a place to be published publicly
    if (willBePublic === 1) {
      const finalName = (placeName?.trim() || existing.place_name || "").trim();
      const finalDesc = (description?.trim() || existing.description || "").trim();
      const finalDiv = divisionId || existing.division_id;
      const finalDis = districtId || existing.district_id;
      const hasImages = Array.isArray(images) && images.length > 0;
      const existingImages = !hasImages ? await query("SELECT image_url FROM place_images WHERE place_id = ?", [placeId]) : [];

      if (!finalName || finalName.startsWith("📍 Discovered Spot #") || finalName.startsWith("Recorded Spot #") || finalName.startsWith("Saved Spot #")) {
        return res.status(400).json({
          success: false,
          message: "Please enter a specific place name before publishing publicly."
        });
      }
      if (!finalDesc) {
        return res.status(400).json({
          success: false,
          message: "Please enter a short description before publishing publicly."
        });
      }
      if (!finalDiv || !finalDis) {
        return res.status(400).json({
          success: false,
          message: "Please select both a division and district before publishing publicly."
        });
      }
      if (!hasImages && (!existingImages || existingImages.length === 0)) {
        return res.status(400).json({
          success: false,
          message: "Please upload at least one photo before publishing publicly."
        });
      }
      if (!safetyRating && !existing.safety_rating) {
        return res.status(400).json({
          success: false,
          message: "Please set a safety rating before publishing publicly."
        });
      }
    }

    // 1. Update master place record
    await query(`
      UPDATE places 
      SET 
        place_name = ?,
        description = ?,
        division_id = ?,
        district_id = ?,
        division = ?,
        district = ?,
        is_public = ?,
        safety_rating = COALESCE(?, safety_rating)
      WHERE place_id = ?
    `, [
      placeName?.trim() || existing.place_name,
      description || existing.description,
      divisionId || existing.division_id,
      districtId || existing.district_id,
      divisionName || existing.division,
      districtName || existing.district,
      willBePublic,
      safetyRating ? parseFloat(safetyRating) : null,
      placeId
    ]);

    // 2. Update / Insert photos in place_images
    if (Array.isArray(images) && images.length > 0) {
      // Clear old images
      await query("DELETE FROM place_images WHERE place_id = ?", [placeId]);
      for (let i = 0; i < images.length; i++) {
        const imgId = `img_${placeId}_${i + 1}_${Date.now()}`;
        await query(
          "INSERT INTO place_images (img_id, place_id, image_url) VALUES (?, ?, ?)",
          [imgId, placeId, images[i]]
        );
      }
    }

    // 3. If safety rating provided by user, record in place_ratings
    if (safetyRating) {
      const ratingId = `pr_${userId}_${placeId}`;
      await query(`
        INSERT INTO place_ratings (rating_id, user_id, place_id, place_rating, review_text)
        VALUES (?, ?, ?, ?, 'Place verified and safety rated by discovery author.')
        ON DUPLICATE KEY UPDATE 
          place_rating = VALUES(place_rating),
          review_text = VALUES(review_text)
      `, [ratingId, userId, placeId, parseFloat(safetyRating)]);

      // Recalculate average rating
      const [avgCalc] = await query(
        "SELECT AVG(place_rating) as avg_rating, COUNT(*) as cnt FROM place_ratings WHERE place_id = ?",
        [placeId]
      );
      if (avgCalc) {
        await query(
          "UPDATE places SET safety_rating = ?, safety_rating_count = ? WHERE place_id = ?",
          [parseFloat(avgCalc.avg_rating || 5.0).toFixed(1), avgCalc.cnt, placeId]
        );
      }
    }

    // 4. Award bonus points for publishing place to community (+100 pts)
    let pointsAwarded = 0;
    if (wasPrivate && willBePublic === 1) {
      pointsAwarded = 100;
      await query("UPDATE users SET league_points = league_points + 100 WHERE user_id = ?", [userId]);
    }

    res.json({
      success: true,
      message: willBePublic === 1 
        ? `🎉 Place "${placeName || existing.place_name}" published to Community Feed! (+100 Points)`
        : "Place details updated successfully in 'My Places'!",
      pointsAwarded
    });
  } catch (error) {
    console.error("Error in updatePlaceDetails:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/places
 * Fetch all public community places with filters, images, author, and ratings
 */
export async function getPublicPlacesFeed(req, res) {
  try {
    const currentUserId = req.query.userId || null;
    const divisionId = req.query.divisionId || null;
    const districtId = req.query.districtId || null;
    const safetyFilter = req.query.safetyFilter || null; // 'Safe', 'Moderate', 'Caution'
    const search = req.query.search || null;

    let conditions = ["p.is_public = 1"];
    let params = [];

    if (divisionId && divisionId !== "All") {
      conditions.push("p.division_id = ?");
      params.push(divisionId);
    }

    if (districtId && districtId !== "All") {
      conditions.push("p.district_id = ?");
      params.push(districtId);
    }

    if (search) {
      conditions.push("(p.place_name LIKE ? OR p.description LIKE ? OR p.district LIKE ? OR p.division LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (safetyFilter === "Safe") {
      conditions.push("p.safety_rating >= 4.5");
    } else if (safetyFilter === "Moderate") {
      conditions.push("p.safety_rating >= 3.5 AND p.safety_rating < 4.5");
    } else if (safetyFilter === "Caution") {
      conditions.push("p.safety_rating < 3.5");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT 
        p.*,
        u.username, u.first_name, u.last_name, u.profile_picture_url, u.league_points,
        d.division_name,
        dis.district_name
      FROM places p
      LEFT JOIN users u ON p.created_by = u.user_id
      LEFT JOIN divisions d ON p.division_id = d.division_id
      LEFT JOIN districts dis ON p.district_id = dis.district_id
      ${whereClause}
      ORDER BY p.created_at DESC;
    `;

    const placesRaw = await query(sql, params);

    if (!placesRaw || placesRaw.length === 0) {
      return res.json({ success: true, count: 0, places: [] });
    }

    const placeIds = placesRaw.map(p => p.place_id);
    const placeholders = placeIds.map(() => "?").join(",");

    // 1. Fetch images for all places
    const imagesRaw = await query(
      `SELECT place_id, image_url FROM place_images WHERE place_id IN (${placeholders}) ORDER BY created_at ASC`,
      placeIds
    );

    // 2. Fetch comments for all places
    const commentsRaw = await query(
      `SELECT 
        c.comment_id, c.place_id, c.comment_text, c.created_at,
        u.username, u.first_name, u.last_name, u.profile_picture_url AS avatar
       FROM post_comments c
       LEFT JOIN users u ON c.user_id = u.user_id
       WHERE c.commented_type = 'place' AND c.place_id IN (${placeholders})
       ORDER BY c.created_at DESC`,
      placeIds
    );

    // 3. User interaction state (likes, saves, myplaces membership)
    let likedPlaceIds = new Set();
    let savedPlaceIds = new Set();
    let myPlacesIds = new Set();

    if (currentUserId) {
      const likesRaw = await query(
        `SELECT place_id FROM post_likes WHERE user_id = ? AND liked_type = 'place' AND place_id IN (${placeholders})`,
        [currentUserId, ...placeIds]
      );
      likesRaw.forEach(r => likedPlaceIds.add(r.place_id));

      const savesRaw = await query(
        `SELECT place_id FROM saved_posts WHERE user_id = ? AND saved_type = 'place' AND place_id IN (${placeholders})`,
        [currentUserId, ...placeIds]
      );
      savesRaw.forEach(r => savedPlaceIds.add(r.place_id));

      const mypRaw = await query(
        `SELECT place_id FROM myplaces WHERE user_id = ? AND place_id IN (${placeholders})`,
        [currentUserId, ...placeIds]
      );
      mypRaw.forEach(r => myPlacesIds.add(r.place_id));
    }

    const formatted = placesRaw.map(p => {
      const pImages = imagesRaw.filter(img => img.place_id === p.place_id).map(img => img.image_url);
      const pComments = commentsRaw.filter(c => c.place_id === p.place_id).map(c => ({
        id: c.comment_id,
        user: c.username || [c.first_name, c.last_name].filter(Boolean).join(" ") || "Traveler",
        avatar: c.avatar,
        text: c.comment_text,
        time: new Date(c.created_at).toLocaleDateString([], { month: "short", day: "numeric" })
      }));

      const authorName = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.username || "Traveler";
      const league = calculateLeague(p.league_points || 350);

      return {
        id: p.place_id,
        place_id: p.place_id,
        name: p.place_name,
        description: p.description || "",
        divisionId: p.division_id,
        districtId: p.district_id,
        division: p.division_name || p.division || "Bangladesh",
        district: p.district_name || p.district || "General",
        latitude: parseFloat(p.latitude),
        longitude: parseFloat(p.longitude),
        safetyRating: parseFloat(p.safety_rating) || 5.0,
        safetyRatingCount: parseInt(p.safety_rating_count, 10) || 0,
        likesCount: parseInt(p.likes_count, 10) || 0,
        commentsCount: parseInt(p.comments_count, 10) || pComments.length,
        sharesCount: parseInt(p.shares_count, 10) || 0,
        savesCount: parseInt(p.saves_count, 10) || 0,
        images: pImages,
        comments: pComments,
        author: {
          id: p.created_by,
          name: authorName,
          username: p.username || "traveler",
          avatar: p.profile_picture_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.username || 'traveler'}`,
          league
        },
        hasLiked: likedPlaceIds.has(p.place_id),
        hasSaved: savedPlaceIds.has(p.place_id),
        inMyPlaces: myPlacesIds.has(p.place_id),
        createdAt: p.created_at
      };
    });

    res.json({ success: true, count: formatted.length, places: formatted });
  } catch (error) {
    console.error("Error in getPublicPlacesFeed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/places/:placeId/rate-safety
 * Submit a safety rating on a place (User must have added place to My Places)
 */
export async function ratePlaceSafety(req, res) {
  try {
    const { placeId } = req.params;
    const { user, safetyRating, reviewText } = req.body;
    const userId = await ensureUserExists(user);

    const ratingVal = parseFloat(safetyRating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ success: false, message: "Rating must be a number between 1 and 5." });
    }

    // Check if place is added in user's myplaces collection
    const [inMyPlaces] = await query(
      "SELECT 1 FROM myplaces WHERE user_id = ? AND place_id = ?",
      [userId, placeId]
    );

    if (!inMyPlaces) {
      return res.status(403).json({
        success: false,
        message: "You can only rate the safety of places you have added to your 'My Places' collection."
      });
    }

    const ratingId = `pr_${userId}_${placeId}`;
    await query(`
      INSERT INTO place_ratings (rating_id, user_id, place_id, place_rating, review_text)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        place_rating = VALUES(place_rating),
        review_text = VALUES(review_text)
    `, [ratingId, userId, placeId, ratingVal, reviewText || ""]);

    // Recalculate average
    const [calc] = await query(
      "SELECT AVG(place_rating) as avg_rating, COUNT(*) as cnt FROM place_ratings WHERE place_id = ?",
      [placeId]
    );

    const newAvg = parseFloat(calc.avg_rating || 5.0).toFixed(1);
    const newCount = calc.cnt || 1;

    await query(
      "UPDATE places SET safety_rating = ?, safety_rating_count = ? WHERE place_id = ?",
      [newAvg, newCount, placeId]
    );

    // Award review points (+15 pts)
    await query("UPDATE users SET league_points = league_points + 15 WHERE user_id = ?", [userId]);

    res.json({
      success: true,
      message: "Safety rating and review saved successfully!",
      safetyRating: parseFloat(newAvg),
      safetyRatingCount: newCount,
      pointsAwarded: 15
    });
  } catch (error) {
    console.error("Error in ratePlaceSafety:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/places/:placeId/like
 * Toggle like on a place
 */
export async function toggleLikePlace(req, res) {
  try {
    const { placeId } = req.params;
    const { user } = req.body;
    const userId = await ensureUserExists(user);

    const [existing] = await query(
      "SELECT like_id FROM post_likes WHERE user_id = ? AND place_id = ? AND liked_type = 'place'",
      [userId, placeId]
    );

    let netChange = 0;
    let hasLiked = false;

    if (existing) {
      await query("DELETE FROM post_likes WHERE like_id = ?", [existing.like_id]);
      netChange = -1;
      hasLiked = false;
    } else {
      const likeId = `like_pl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      await query(
        "INSERT INTO post_likes (like_id, user_id, place_id, liked_type) VALUES (?, ?, ?, 'place')",
        [likeId, userId, placeId]
      );
      netChange = 1;
      hasLiked = true;
      await query("UPDATE users SET league_points = league_points + 5 WHERE user_id = ?", [userId]);
    }

    await query("UPDATE places SET likes_count = GREATEST(0, likes_count + ?) WHERE place_id = ?", [netChange, placeId]);
    const [updated] = await query("SELECT likes_count FROM places WHERE place_id = ?", [placeId]);

    res.json({
      success: true,
      hasLiked,
      likesCount: updated?.likes_count || 0
    });
  } catch (error) {
    console.error("Error in toggleLikePlace:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/places/:placeId/comment
 * Add comment to a place
 */
export async function addPlaceComment(req, res) {
  try {
    const { placeId } = req.params;
    const { user, commentText } = req.body;
    const userId = await ensureUserExists(user);

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ success: false, message: "Comment text is required." });
    }

    const commentId = `comm_pl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    await query(`
      INSERT INTO post_comments (comment_id, place_id, user_id, comment_text, commented_type)
      VALUES (?, ?, ?, ?, 'place')
    `, [commentId, placeId, userId, commentText.trim()]);

    await query("UPDATE places SET comments_count = comments_count + 1 WHERE place_id = ?", [placeId]);
    await query("UPDATE users SET league_points = league_points + 10 WHERE user_id = ?", [userId]);

    res.status(201).json({
      success: true,
      comment: {
        id: commentId,
        user: user?.username || "traveler",
        avatar: user?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=traveler",
        text: commentText.trim(),
        time: "Just now"
      }
    });
  } catch (error) {
    console.error("Error in addPlaceComment:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/places/:placeId/save
 * Toggle save place to My Places
 */
export async function toggleSavePlace(req, res) {
  try {
    const { placeId } = req.params;
    const { user } = req.body;
    const userId = await ensureUserExists(user);

    const [inMyPlaces] = await query(
      "SELECT my_place_id FROM myplaces WHERE user_id = ? AND place_id = ?",
      [userId, placeId]
    );

    let hasSaved = false;

    if (inMyPlaces) {
      await query("DELETE FROM myplaces WHERE user_id = ? AND place_id = ?", [userId, placeId]);
      await query("DELETE FROM saved_posts WHERE user_id = ? AND place_id = ? AND saved_type = 'place'", [userId, placeId]);
      await query("UPDATE places SET saves_count = GREATEST(0, saves_count - 1) WHERE place_id = ?", [placeId]);
      hasSaved = false;
    } else {
      const myPlaceId = `mp_${userId}_${placeId}`;
      await query("INSERT INTO myplaces (my_place_id, user_id, place_id, is_owner) VALUES (?, ?, ?, 0)", [myPlaceId, userId, placeId]);
      
      const saveId = `save_pl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      await query("INSERT INTO saved_posts (saved_id, user_id, place_id, saved_type) VALUES (?, ?, ?, 'place')", [saveId, userId, placeId]);
      await query("UPDATE places SET saves_count = saves_count + 1 WHERE place_id = ?", [placeId]);
      await query("UPDATE users SET league_points = league_points + 20 WHERE user_id = ?", [userId]);
      hasSaved = true;
    }

    const [updated] = await query("SELECT saves_count FROM places WHERE place_id = ?", [placeId]);

    res.json({
      success: true,
      hasSaved,
      inMyPlaces: hasSaved,
      savesCount: updated?.saves_count || 0
    });
  } catch (error) {
    console.error("Error in toggleSavePlace:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/places/:placeId/report
 * Report a place
 */
export async function reportPlace(req, res) {
  try {
    const { placeId } = req.params;
    const { user, reason } = req.body;
    const userId = await ensureUserExists(user);

    const reportId = `rep_pl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    await query(`
      INSERT INTO reports (report_id, place_id, user_id, report_type, report_description)
      VALUES (?, ?, ?, 'place', ?)
    `, [reportId, placeId, userId, reason || "Incorrect safety / location info reported by user"]);

    res.json({
      success: true,
      message: "Place reported successfully. Our admin team will inspect the location."
    });
  } catch (error) {
    console.error("Error in reportPlace:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/places/my-places/:placeId and DELETE /api/places/:placeId
 * - If the deleting user is the ORIGINAL CREATOR:
 *   Deletes the place completely across the whole platform (places feed, all other users who saved/liked it, ratings, photos).
 * - If the deleting user is a SAVER (non-creator who bookmarked/linked this existing place):
 *   Only removes the place from that specific user's own saved places list.
 */
export async function deleteFromMyPlaces(req, res) {
  try {
    const { placeId } = req.params;
    const userId = req.body?.userId || req.query?.userId;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required." });
    }

    // Check place creator and user's ownership flag
    const [place] = await query("SELECT created_by, is_public FROM places WHERE place_id = ?", [placeId]);
    const [myPlaceEntry] = await query("SELECT is_owner FROM myplaces WHERE user_id = ? AND place_id = ?", [userId, placeId]);

    const isCreator = Boolean(
      (place && place.created_by === userId) || 
      (myPlaceEntry && myPlaceEntry.is_owner === 1)
    );

    if (isCreator) {
      // 1. Creator deleted their place: Cascade delete for EVERYONE across the whole platform
      await query("DELETE FROM post_likes WHERE place_id = ?", [placeId]).catch(() => {});
      await query("DELETE FROM post_comments WHERE place_id = ?", [placeId]).catch(() => {});
      await query("DELETE FROM saved_posts WHERE place_id = ?", [placeId]).catch(() => {});
      await query("DELETE FROM reports WHERE place_id = ?", [placeId]).catch(() => {});
      await query("DELETE FROM place_ratings WHERE place_id = ?", [placeId]).catch(() => {});
      await query("DELETE FROM place_images WHERE place_id = ?", [placeId]).catch(() => {});
      
      // Delete from all users' myplaces
      await query("DELETE FROM myplaces WHERE place_id = ?", [placeId]);
      
      // Delete from master places table (removes from Public Places feed)
      await query("DELETE FROM places WHERE place_id = ?", [placeId]);

      res.json({
        success: true,
        deletedByCreator: true,
        message: "Place created by you was permanently deleted from the public feed and from all users who saved or liked it."
      });
    } else {
      // 2. User is NOT the creator (just saved an existing spot): remove ONLY from this user's list
      await query("DELETE FROM myplaces WHERE user_id = ? AND place_id = ?", [userId, placeId]);
      await query("DELETE FROM saved_posts WHERE user_id = ? AND place_id = ? AND saved_type = 'place'", [userId, placeId]).catch(() => {});
      await query("UPDATE places SET saves_count = GREATEST(0, saves_count - 1) WHERE place_id = ?", [placeId]).catch(() => {});

      res.json({
        success: true,
        deletedByCreator: false,
        message: "Place removed from your personal saved places collection."
      });
    }
  } catch (error) {
    console.error("Error in deleteFromMyPlaces:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
