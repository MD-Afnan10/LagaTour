import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import { getIO } from "../services/socketService.js";

// Helper for League calculation
function calculateLeague(points) {
  const p = Number(points) || 0;
  if (p >= 5000) return "Legend";
  if (p >= 2500) return "Expert";
  if (p >= 1000) return "Traveler";
  if (p >= 500) return "Adventurer";
  return "Explorer";
}

// ==========================================
// 1. OVERVIEW & SYSTEM METRICS
// ==========================================
export async function getAdminOverview(req, res) {
  try {
    // 1. User metrics
    const [userStats] = await query(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN account_status = 'active' THEN 1 ELSE 0 END) as activeUsers,
        SUM(CASE WHEN account_status = 'suspended' THEN 1 ELSE 0 END) as suspendedUsers,
        SUM(CASE WHEN role IN ('admin', 'superadmin') THEN 1 ELSE 0 END) as adminUsers
      FROM users
    `);

    // 2. Post metrics
    const [postStats] = await query(`
      SELECT 
        COUNT(*) as totalPosts,
        SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END) as publicPosts,
        SUM(CASE WHEN is_public = 0 THEN 1 ELSE 0 END) as hiddenPosts
      FROM posts
    `);

    // 3. Tour Plan metrics
    const [planStats] = await query(`
      SELECT 
        COUNT(*) as totalPlans,
        SUM(CASE WHEN duration_days >= 3 THEN 1 ELSE 0 END) as multiDayPlans
      FROM tour_plans
    `);

    // 4. Place metrics
    const [placeStats] = await query(`
      SELECT 
        COUNT(*) as totalPlaces,
        AVG(safety_rating) as avgSafetyRating
      FROM places
    `);

    // 5. Report metrics
    const [reportStats] = await query(`
      SELECT 
        COUNT(*) as totalReports,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingReports,
        SUM(CASE WHEN status = 'action_taken' THEN 1 ELSE 0 END) as actionTakenReports,
        SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as dismissedReports
      FROM reports
    `);

    // 6. Media verification metrics
    const [mediaStats] = await query(`
      SELECT 
        COUNT(*) as totalMedia,
        SUM(CASE WHEN ai_verification_status = 'flagged' THEN 1 ELSE 0 END) as flaggedMedia,
        SUM(CASE WHEN ai_verification_status = 'approved' THEN 1 ELSE 0 END) as approvedMedia
      FROM post_media
    `);

    // Recent 5 signups
    const recentUsers = await query(`
      SELECT user_id, username, email, first_name, last_name, profile_picture_url, role, account_status, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Recent 5 reports
    const recentReports = await query(`
      SELECT r.*, u.username as reporter_username, u.email as reporter_email
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.user_id
      ORDER BY r.created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        totalUsers: Number(userStats.totalUsers) || 0,
        activeUsers: Number(userStats.activeUsers) || 0,
        suspendedUsers: Number(userStats.suspendedUsers) || 0,
        adminUsers: Number(userStats.adminUsers) || 0,
        totalPosts: Number(postStats.totalPosts) || 0,
        publicPosts: Number(postStats.publicPosts) || 0,
        hiddenPosts: Number(postStats.hiddenPosts) || 0,
        totalPlans: Number(planStats.totalPlans) || 0,
        totalPlaces: Number(placeStats.totalPlaces) || 0,
        avgSafetyRating: Number(placeStats.avgSafetyRating || 5).toFixed(1),
        totalReports: Number(reportStats.totalReports) || 0,
        pendingReports: Number(reportStats.pendingReports) || 0,
        actionTakenReports: Number(reportStats.actionTakenReports) || 0,
        totalMedia: Number(mediaStats.totalMedia) || 0,
        flaggedMedia: Number(mediaStats.flaggedMedia) || 0
      },
      recentUsers,
      recentReports
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch admin overview statistics", error: error.message });
  }
}

// ==========================================
// 2. USER MANAGEMENT
// ==========================================
export async function getAllUsers(req, res) {
  try {
    const { search = "", status = "All", role = "All" } = req.query;

    let sql = `
      SELECT 
        user_id as id,
        user_id,
        email,
        username,
        CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) as name,
        first_name,
        last_name,
        profile_picture_url as avatar,
        bio,
        country,
        city,
        phone,
        preferred_travel_type as preferredTravelType,
        total_trips_shared as totalTripsShared,
        league_points as points,
        followers_count as followersCount,
        following_count as followingCount,
        is_verified as isVerified,
        account_status as status,
        role,
        created_at as createdAt,
        last_login as lastLogin
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (search.trim()) {
      sql += ` AND (user_id LIKE ? OR username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (status !== "All") {
      sql += ` AND account_status = ?`;
      params.push(status.toLowerCase());
    }

    if (role !== "All") {
      sql += ` AND role = ?`;
      params.push(role.toLowerCase());
    }

    sql += ` ORDER BY created_at DESC`;

    const users = await query(sql, params);

    const formattedUsers = users.map(u => ({
      ...u,
      name: u.name.trim() || u.username,
      league: calculateLeague(u.points),
      avatar: u.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`
    }));

    res.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users", error: error.message });
  }
}

export async function createAdminUser(req, res) {
  try {
    const {
      name,
      username,
      email,
      password,
      role = "user",
      status = "active",
      phone = "",
      city = "",
      country = "Bangladesh",
      preferredTravelType = "Solo",
      points = 100
    } = req.body;

    if (!email || !username) {
      return res.status(400).json({ success: false, message: "Email and username are required." });
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const hashedPassword = await bcrypt.hash(password || "123456", 10);
    const names = (name || username).split(" ");
    const firstName = names[0] || username;
    const lastName = names.slice(1).join(" ") || "";
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`;

    await query(`
      INSERT INTO users (
        user_id, email, password_hash, username, first_name, last_name, 
        profile_picture_url, phone, city, country, preferred_travel_type, 
        league_points, account_status, role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, email, hashedPassword, username, firstName, lastName,
      avatar, phone, city, country, preferredTravelType,
      Number(points) || 0, status.toLowerCase(), role.toLowerCase()
    ]);

    res.json({
      success: true,
      message: "User account created successfully in MySQL database",
      user: {
        id: userId,
        user_id: userId,
        name: name || username,
        username,
        email,
        role,
        status,
        points: Number(points) || 0,
        league: calculateLeague(points),
        avatar,
        phone,
        city,
        country
      }
    });
  } catch (error) {
    console.error("createAdminUser error:", error);
    res.status(500).json({ success: false, message: "Failed to create user", error: error.message });
  }
}

export async function updateAdminUser(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      city,
      country,
      points,
      role,
      status,
      preferredTravelType,
      password
    } = req.body;

    const [existing] = await query("SELECT * FROM users WHERE user_id = ?", [id]);
    if (!existing) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    let firstName = existing.first_name;
    let lastName = existing.last_name;
    if (name) {
      const names = name.trim().split(" ");
      firstName = names[0];
      lastName = names.slice(1).join(" ");
    }

    let passwordClause = "";
    const params = [
      email || existing.email,
      firstName,
      lastName,
      phone !== undefined ? phone : existing.phone,
      city !== undefined ? city : existing.city,
      country !== undefined ? country : existing.country,
      points !== undefined ? Number(points) : existing.league_points,
      status ? status.toLowerCase() : existing.account_status,
      role ? role.toLowerCase() : existing.role,
      preferredTravelType || existing.preferred_travel_type
    ];

    if (password && password.trim().length >= 4) {
      const hashed = await bcrypt.hash(password.trim(), 10);
      passwordClause = ", password_hash = ?";
      params.push(hashed);
    }

    params.push(id);

    await query(`
      UPDATE users SET 
        email = ?,
        first_name = ?,
        last_name = ?,
        phone = ?,
        city = ?,
        country = ?,
        league_points = ?,
        account_status = ?,
        role = ?,
        preferred_travel_type = ?
        ${passwordClause}
      WHERE user_id = ?
    `, params);

    res.json({ success: true, message: "User updated successfully in MySQL database" });
  } catch (error) {
    console.error("updateAdminUser error:", error);
    res.status(500).json({ success: false, message: "Failed to update user", error: error.message });
  }
}

export async function toggleUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'suspended'

    if (!status || !["active", "suspended"].includes(status.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Status must be 'active' or 'suspended'" });
    }

    await query("UPDATE users SET account_status = ? WHERE user_id = ?", [status.toLowerCase(), id]);

    res.json({
      success: true,
      message: `User ${id} status changed to ${status}`
    });
  } catch (error) {
    console.error("toggleUserStatus error:", error);
    res.status(500).json({ success: false, message: "Failed to change user status", error: error.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    await query("DELETE FROM users WHERE user_id = ?", [id]);
    res.json({ success: true, message: `User ${id} deleted successfully from database` });
  } catch (error) {
    console.error("deleteUser error:", error);
    res.status(500).json({ success: false, message: "Failed to delete user", error: error.message });
  }
}

export async function warnUser(req, res) {
  try {
    const { id } = req.params;
    const { warningMessage, reason } = req.body;

    const reportId = `warn_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    await query(`
      INSERT INTO reports (report_id, reported_user_id, user_id, report_type, report_description, status, action_taken)
      VALUES (?, ?, 'admin_root', 'user_warning', ?, 'action_taken', ?)
    `, [reportId, id, warningMessage || reason || "Administrative Warning", "Warned user"]);

    res.json({ success: true, message: `Warning sent to user ${id}` });
  } catch (error) {
    console.error("warnUser error:", error);
    res.status(500).json({ success: false, message: "Failed to send warning", error: error.message });
  }
}

// ==========================================
// 3. POST & MEDIA MODERATION
// ==========================================
export async function getAdminPosts(req, res) {
  try {
    const { search = "", visibility = "All" } = req.query;

    let sql = `
      SELECT 
        p.post_id as id,
        p.post_id,
        p.user_id,
        p.caption,
        p.likes_count,
        p.comments_count,
        p.shares_count,
        p.saves_count,
        p.is_public,
        p.created_at,
        u.username,
        u.email,
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as author_name,
        u.profile_picture_url as author_avatar
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (search.trim()) {
      sql += ` AND (p.post_id LIKE ? OR p.user_id LIKE ? OR p.caption LIKE ? OR u.username LIKE ? OR u.first_name LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (visibility === "Public") {
      sql += ` AND p.is_public = 1`;
    } else if (visibility === "Hidden") {
      sql += ` AND p.is_public = 0`;
    }

    sql += ` ORDER BY p.created_at DESC`;

    const posts = await query(sql, params);

    const postIds = posts.map(p => p.id);
    let mediaByPost = {};

    if (postIds.length > 0) {
      const placeholders = postIds.map(() => "?").join(",");
      const mediaList = await query(
        `SELECT * FROM post_media WHERE post_id IN (${placeholders})`,
        postIds
      );
      mediaList.forEach(m => {
        if (!mediaByPost[m.post_id]) mediaByPost[m.post_id] = [];
        mediaByPost[m.post_id].push(m);
      });
    }

    const formattedPosts = posts.map(p => {
      const media = mediaByPost[p.id] || [];
      return {
        id: p.id,
        user: {
          id: p.user_id,
          name: p.author_name.trim() || p.username,
          username: p.username,
          avatar: p.author_avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.username}`
        },
        caption: p.caption,
        likes: p.likes_count,
        comments: p.comments_count,
        shares: p.shares_count,
        saves: p.saves_count,
        isPublic: Boolean(p.is_public),
        createdAt: p.created_at,
        media: media.map(m => ({
          id: m.media_id,
          url: m.media_url,
          type: m.media_type,
          aiVerificationStatus: m.ai_verification_status,
          adminReviewNotes: m.admin_review_notes
        }))
      };
    });

    res.json({ success: true, posts: formattedPosts });
  } catch (error) {
    console.error("getAdminPosts error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch admin posts", error: error.message });
  }
}

export async function togglePostVisibility(req, res) {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;

    const val = isPublic ? 1 : 0;
    await query("UPDATE posts SET is_public = ? WHERE post_id = ?", [val, id]);

    res.json({
      success: true,
      message: `Post ${id} visibility updated to ${isPublic ? "public" : "hidden"}`
    });
  } catch (error) {
    console.error("togglePostVisibility error:", error);
    res.status(500).json({ success: false, message: "Failed to update visibility", error: error.message });
  }
}

export async function updateMediaVerification(req, res) {
  try {
    const { mediaId } = req.params;
    const { status, adminNotes } = req.body;

    await query(`
      UPDATE post_media SET 
        ai_verification_status = ?,
        verified_by_admin = 'admin_root',
        admin_review_notes = ?
      WHERE media_id = ?
    `, [status, adminNotes || null, mediaId]);

    res.json({ success: true, message: `Media ${mediaId} status set to ${status}` });
  } catch (error) {
    console.error("updateMediaVerification error:", error);
    res.status(500).json({ success: false, message: "Failed to update media status", error: error.message });
  }
}

export async function createAdminPost(req, res) {
  try {
    const { caption, images = [], videos = [], destination = "General Exploration", isPublic = true, author } = req.body;

    if (!caption && images.length === 0 && videos.length === 0) {
      return res.status(400).json({ success: false, message: "Caption or media is required." });
    }

    const userId = author?.id || author?.user_id || "admin_root";
    const postId = "post_" + Date.now();

    await query(
      `INSERT INTO posts (post_id, user_id, caption, likes_count, comments_count, shares_count, saves_count, is_public)
       VALUES (?, ?, ?, 0, 0, 0, 0, ?)`,
      [postId, userId, caption || "", isPublic ? 1 : 0]
    );

    for (let i = 0; i < images.length; i++) {
      const mediaId = `media_img_${Date.now()}_${i}`;
      await query(
        `INSERT INTO post_media (media_id, post_id, media_url, media_type, ai_verification_status)
         VALUES (?, ?, ?, 'photo', 'approved')`,
        [mediaId, postId, images[i]]
      );
    }

    for (let i = 0; i < videos.length; i++) {
      const mediaId = `media_vid_${Date.now()}_${i}`;
      await query(
        `INSERT INTO post_media (media_id, post_id, media_url, media_type, ai_verification_status)
         VALUES (?, ?, ?, 'video', 'approved')`,
        [mediaId, postId, videos[i]]
      );
    }

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      postId
    });
  } catch (error) {
    console.error("createAdminPost error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateAdminPost(req, res) {
  try {
    const { id } = req.params;
    const { caption, destination, images, videos, isPublic } = req.body;

    const updates = [];
    const values = [];

    if (caption !== undefined) {
      updates.push("caption = ?");
      values.push(caption);
    }
    if (isPublic !== undefined) {
      updates.push("is_public = ?");
      values.push(isPublic ? 1 : 0);
    }

    if (updates.length > 0) {
      values.push(id);
      await query(`UPDATE posts SET ${updates.join(", ")} WHERE post_id = ?`, values);
    }

    if (Array.isArray(images)) {
      await query("DELETE FROM post_media WHERE post_id = ? AND media_type = 'photo'", [id]);
      for (let i = 0; i < images.length; i++) {
        const mediaId = `media_img_${Date.now()}_${i}`;
        await query(
          `INSERT INTO post_media (media_id, post_id, media_url, media_type, ai_verification_status)
           VALUES (?, ?, ?, 'photo', 'approved')`,
          [mediaId, id, images[i]]
        );
      }
    }

    if (Array.isArray(videos)) {
      await query("DELETE FROM post_media WHERE post_id = ? AND media_type = 'video'", [id]);
      for (let i = 0; i < videos.length; i++) {
        const mediaId = `media_vid_${Date.now()}_${i}`;
        await query(
          `INSERT INTO post_media (media_id, post_id, media_url, media_type, ai_verification_status)
           VALUES (?, ?, ?, 'video', 'approved')`,
          [mediaId, id, videos[i]]
        );
      }
    }

    res.json({ success: true, message: `Post ${id} updated successfully` });
  } catch (error) {
    console.error("updateAdminPost error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deletePostByAdmin(req, res) {
  try {
    const { id } = req.params;
    await query("DELETE FROM posts WHERE post_id = ?", [id]);
    res.json({ success: true, message: `Post ${id} deleted successfully from database` });
  } catch (error) {
    console.error("deletePostByAdmin error:", error);
    res.status(500).json({ success: false, message: "Failed to delete post", error: error.message });
  }
}

// ==========================================
// 4. TOUR PLANS AUDITING
// ==========================================
export async function getAdminTourPlans(req, res) {
  try {
    const { search = "" } = req.query;

    let sql = `
      SELECT 
        tp.*,
        u.username,
        u.email,
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as author_name,
        u.profile_picture_url as author_avatar
      FROM tour_plans tp
      JOIN users u ON tp.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (search.trim()) {
      sql += ` AND (tp.title LIKE ? OR tp.destination LIKE ? OR u.username LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY tp.created_at DESC`;

    const plans = await query(sql, params);

    res.json({ success: true, plans });
  } catch (error) {
    console.error("getAdminTourPlans error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tour plans", error: error.message });
  }
}

export async function deleteTourPlanByAdmin(req, res) {
  try {
    const { id } = req.params;
    await query("DELETE FROM tour_plans WHERE tour_plan_id = ?", [id]);
    res.json({ success: true, message: `Tour plan ${id} deleted successfully` });
  } catch (error) {
    console.error("deleteTourPlanByAdmin error:", error);
    res.status(500).json({ success: false, message: "Failed to delete tour plan", error: error.message });
  }
}

// ==========================================
// 5. DESTINATIONS & PLACES MANAGEMENT
// ==========================================
export async function getAdminPlaces(req, res) {
  try {
    const { search = "", division = "All" } = req.query;

    let sql = `
      SELECT 
        p.*,
        d.division_name,
        dis.district_name
      FROM places p
      LEFT JOIN divisions d ON p.division_id = d.division_id
      LEFT JOIN districts dis ON p.district_id = dis.district_id
      WHERE 1=1
    `;
    const params = [];

    if (search.trim()) {
      sql += ` AND (p.place_name LIKE ? OR p.address LIKE ? OR p.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (division !== "All") {
      sql += ` AND (p.division = ? OR d.division_name = ?)`;
      params.push(division, division);
    }

    sql += ` ORDER BY p.created_at DESC`;

    const places = await query(sql, params);

    const placeIds = places.map(p => p.place_id);
    let imagesByPlace = {};
    if (placeIds.length > 0) {
      const placeholders = placeIds.map(() => "?").join(",");
      const images = await query(`SELECT * FROM place_images WHERE place_id IN (${placeholders})`, placeIds);
      images.forEach(img => {
        if (!imagesByPlace[img.place_id]) imagesByPlace[img.place_id] = [];
        imagesByPlace[img.place_id].push(img.image_url);
      });
    }

    const formatted = places.map(p => ({
      id: p.place_id,
      place_id: p.place_id,
      name: p.place_name,
      place_name: p.place_name,
      description: p.description,
      division: p.division_name || p.division || "Dhaka",
      district: p.district_name || p.district || "Dhaka",
      division_id: p.division_id,
      district_id: p.district_id,
      lat: Number(p.latitude) || 23.8103,
      lng: Number(p.longitude) || 90.4125,
      latitude: Number(p.latitude) || 23.8103,
      longitude: Number(p.longitude) || 90.4125,
      address: p.address,
      safetyRating: Number(p.safety_rating) || 5.0,
      safety_rating: Number(p.safety_rating) || 5.0,
      safety_rating_count: Number(p.safety_rating_count) || 0,
      likes: p.likes_count || 0,
      is_public: Boolean(p.is_public),
      images: imagesByPlace[p.place_id] || [
        "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=600"
      ]
    }));

    res.json({ success: true, places: formatted });
  } catch (error) {
    console.error("getAdminPlaces error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch places", error: error.message });
  }
}

export async function createAdminPlace(req, res) {
  try {
    const {
      name,
      place_name,
      description = "",
      division = "Dhaka",
      district = "Dhaka",
      division_id,
      district_id,
      lat,
      lng,
      latitude,
      longitude,
      address = "",
      safetyRating = 5.0,
      images = []
    } = req.body;

    const title = name || place_name;
    if (!title) {
      return res.status(400).json({ success: false, message: "Place name is required" });
    }

    const placeId = `place_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const finalLat = Number(latitude || lat) || 23.8103;
    const finalLng = Number(longitude || lng) || 90.4125;

    await query(`
      INSERT INTO places (
        place_id, place_name, description, division, district, division_id, district_id,
        latitude, longitude, address, safety_rating, is_public, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'admin_root')
    `, [
      placeId, title, description, division, district, division_id || null, district_id || null,
      finalLat, finalLng, address, Number(safetyRating) || 5.0
    ]);

    if (Array.isArray(images) && images.length > 0) {
      for (const imgUrl of images) {
        const imgId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        await query("INSERT INTO place_images (img_id, place_id, image_url) VALUES (?, ?, ?)", [imgId, placeId, imgUrl]);
      }
    }

    res.json({
      success: true,
      message: "Destination added successfully to database",
      placeId
    });
  } catch (error) {
    console.error("createAdminPlace error:", error);
    res.status(500).json({ success: false, message: "Failed to create destination", error: error.message });
  }
}

export async function updateAdminPlace(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      place_name,
      description,
      division,
      district,
      lat,
      lng,
      latitude,
      longitude,
      address,
      safetyRating,
      images
    } = req.body;

    const finalLat = Number(latitude || lat);
    const finalLng = Number(longitude || lng);

    await query(`
      UPDATE places SET 
        place_name = COALESCE(?, place_name),
        description = COALESCE(?, description),
        division = COALESCE(?, division),
        district = COALESCE(?, district),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        address = COALESCE(?, address),
        safety_rating = COALESCE(?, safety_rating)
      WHERE place_id = ?
    `, [
      name || place_name || null,
      description !== undefined ? description : null,
      division || null,
      district || null,
      !isNaN(finalLat) ? finalLat : null,
      !isNaN(finalLng) ? finalLng : null,
      address !== undefined ? address : null,
      safetyRating !== undefined ? Number(safetyRating) : null,
      id
    ]);

    if (Array.isArray(images) && images.length > 0) {
      await query("DELETE FROM place_images WHERE place_id = ?", [id]);
      for (const imgUrl of images) {
        const imgId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        await query("INSERT INTO place_images (img_id, place_id, image_url) VALUES (?, ?, ?)", [imgId, id, imgUrl]);
      }
    }

    res.json({ success: true, message: "Destination updated successfully" });
  } catch (error) {
    console.error("updateAdminPlace error:", error);
    res.status(500).json({ success: false, message: "Failed to update destination", error: error.message });
  }
}

export async function deleteAdminPlace(req, res) {
  try {
    const { id } = req.params;
    await query("DELETE FROM places WHERE place_id = ?", [id]);
    res.json({ success: true, message: `Destination ${id} removed successfully from database` });
  } catch (error) {
    console.error("deleteAdminPlace error:", error);
    res.status(500).json({ success: false, message: "Failed to delete destination", error: error.message });
  }
}

// ==========================================
// 6. REPORTS & MODERATION
// ==========================================
export async function createReport(req, res) {
  try {
    const {
      report_type = "user",
      reported_user_id = null,
      post_id = null,
      place_id = null,
      user_id = null,
      reason,
      report_description
    } = req.body;

    const reportId = req.body.report_id || `rep_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const desc = (report_description || reason || "Community violation reported").trim();

    // Verify reporter user_id exists if provided
    let reporterId = null;
    if (user_id && user_id !== "guest" && user_id !== "anonymous") {
      const [u] = await query("SELECT user_id FROM users WHERE user_id = ?", [user_id]);
      if (u) reporterId = user_id;
    }

    await query(`
      INSERT INTO reports (report_id, user_id, reported_user_id, post_id, place_id, report_type, report_description, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `, [
      reportId,
      reporterId,
      reported_user_id || null,
      post_id || null,
      place_id || null,
      report_type,
      desc
    ]);

    try {
      const io = getIO();
      io.emit("admin:new_report", {
        reportId,
        report_type,
        reported_user_id,
        post_id,
        desc,
        createdAt: new Date().toISOString()
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      reportId,
      message: "Report submitted to admin panel successfully."
    });
  } catch (error) {
    console.error("createReport error:", error);
    res.status(500).json({ success: false, message: "Failed to submit report", error: error.message });
  }
}

export async function getAdminReports(req, res) {
  try {
    const sql = `
      SELECT 
        r.*,
        u.username as reporter_username,
        u.first_name as reporter_first_name,
        u.last_name as reporter_last_name,
        u.email as reporter_email,
        u.profile_picture_url as reporter_avatar,
        ru.user_id as reported_user_id,
        ru.username as reported_username,
        ru.first_name as reported_first_name,
        ru.last_name as reported_last_name,
        ru.email as reported_email,
        ru.profile_picture_url as reported_avatar,
        ru.account_status as reported_account_status,
        ru.role as reported_user_role,
        ru.league_points as reported_user_points,
        p.caption as post_caption,
        p.is_public as post_is_public,
        (SELECT media_url FROM post_media pm WHERE pm.post_id = p.post_id ORDER BY pm.created_at ASC LIMIT 1) as post_media_url,
        (SELECT media_type FROM post_media pm WHERE pm.post_id = p.post_id ORDER BY pm.created_at ASC LIMIT 1) as post_media_type,
        pl.place_name
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.user_id
      LEFT JOIN users ru ON r.reported_user_id = ru.user_id
      LEFT JOIN posts p ON r.post_id = p.post_id
      LEFT JOIN places pl ON r.place_id = pl.place_id
      ORDER BY r.created_at DESC
    `;
    const reports = await query(sql);

    res.json({ success: true, reports });
  } catch (error) {
    console.error("getAdminReports error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch reports", error: error.message });
  }
}

export async function dismissAdminReport(req, res) {
  try {
    const { id } = req.params;
    // Retain report in database for audit history with status 'dismissed'
    await query("UPDATE reports SET status = 'dismissed', action_taken = 'Dismissed by administrator' WHERE report_id = ?", [id]);
    res.json({ success: true, message: "Report dismissed and archived in database." });
  } catch (error) {
    console.error("dismissAdminReport error:", error);
    res.status(500).json({ success: false, message: "Failed to dismiss report", error: error.message });
  }
}

export async function resolveAdminReport(req, res) {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    const [rep] = await query("SELECT * FROM reports WHERE report_id = ?", [id]);
    if (rep) {
      if (action === "hide_post" && rep.post_id) {
        await query("UPDATE posts SET is_public = 0 WHERE post_id = ?", [rep.post_id]);
      } else if (action === "suspend_user" && rep.reported_user_id) {
        await query("UPDATE users SET account_status = 'suspended' WHERE user_id = ?", [rep.reported_user_id]);
      }
    }

    // Retain report in database with audit record
    await query(`
      UPDATE reports SET 
        status = 'action_taken',
        action_taken = ?
      WHERE report_id = ?
    `, [notes || action || "Action taken by administrator", id]);

    res.json({ success: true, message: "Report resolved and recorded in database." });
  } catch (error) {
    console.error("resolveAdminReport error:", error);
    res.status(500).json({ success: false, message: "Failed to resolve report", error: error.message });
  }
}

// ==========================================
// 8. ADMIN SUPPORT CHAT & REAL-TIME PORTAL
// ==========================================

export async function requestAdminSupport(req, res) {
  try {
    const userId = req.body.userId || req.body.id;
    const userPayload = req.body.user || req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required to start admin support" });
    }

    // Ensure traveler user exists
    const [existingUser] = await query("SELECT user_id, username, first_name, last_name FROM users WHERE user_id = ?", [userId]);
    if (!existingUser) {
      const username = userPayload.username || userPayload.name || userId;
      await query(`
        INSERT INTO users (user_id, email, username, first_name, profile_picture_url)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE username = VALUES(username)
      `, [
        userId,
        userPayload.email || `${username}@laga.tour`,
        username,
        userPayload.name || username,
        userPayload.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`
      ]);
    }

    // Check if there is an existing pending or accepted support chat for this user
    const [activeSupport] = await query(`
      SELECT s.*, c.conversation_id, c.title
      FROM admin_support_chats s
      INNER JOIN conversations c ON s.conversation_id = c.conversation_id
      WHERE s.user_id = ? AND s.status IN ('pending', 'accepted')
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [userId]);

    if (activeSupport) {
      // Ensure user is in conversation_members
      const cmId = `cm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      await query(`
        INSERT INTO conversation_members (member_id, conversation_id, user_id, role, joined_at)
        VALUES (?, ?, ?, 'member', NOW())
        ON DUPLICATE KEY UPDATE role = 'member'
      `, [cmId, activeSupport.conversation_id, userId]);

      return res.json({
        success: true,
        conversationId: activeSupport.conversation_id,
        requestId: activeSupport.request_id,
        status: activeSupport.status,
        acceptedBy: activeSupport.accepted_by,
        acceptedByName: activeSupport.accepted_by_name,
        isExisting: true
      });
    }

    // Create new support conversation
    const conversationId = `support_${userId}_${Date.now()}`;
    const requestId = `req_supp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const userName = userPayload.name || userPayload.first_name || userPayload.username || "Traveler";

    await query(`
      INSERT INTO conversations (conversation_id, type, title, created_by, created_at, updated_at)
      VALUES (?, 'support', ?, ?, NOW(), NOW())
    `, [conversationId, `Admin Support: ${userName}`, userId]);

    // Add user to conversation_members
    await query(`
      INSERT INTO conversation_members (member_id, conversation_id, user_id, role, joined_at)
      VALUES (?, ?, ?, 'member', NOW())
    `, [`cm_u_${Date.now()}`, conversationId, userId]);

    // Find all admins and add them as members
    const adminRows = await query(`
      SELECT user_id, username, first_name, last_name, email FROM users
      WHERE role IN ('admin', 'superadmin') OR user_id = 'admin_root'
    `);

    for (const adm of adminRows) {
      const admMemberId = `cm_adm_${adm.user_id}_${Date.now().toString(36)}`;
      await query(`
        INSERT INTO conversation_members (member_id, conversation_id, user_id, role, joined_at)
        VALUES (?, ?, ?, 'admin', NOW())
        ON DUPLICATE KEY UPDATE role = 'admin'
      `, [admMemberId, conversationId, adm.user_id]).catch(() => {});
    }

    // Create admin_support_chats record
    await query(`
      INSERT INTO admin_support_chats (request_id, user_id, conversation_id, status, created_at)
      VALUES (?, ?, ?, 'pending', NOW())
    `, [requestId, userId, conversationId]);

    // Add initial system greeting
    const systemMsgId = `msg_sys_${Date.now()}`;
    const welcomeText = `👋 Hello ${userName}! Welcome to LagaTour Live Support. An administrator has been notified and will join this chat momentarily.`;
    await query(`
      INSERT INTO messages (message_id, conversation_id, sender_id, message_text, message_type, created_at)
      VALUES (?, ?, 'system', ?, 'system', NOW())
    `, [systemMsgId, conversationId, welcomeText]);

    // Socket notification to admins
    try {
      const io = getIO();
      const requestPayload = {
        requestId,
        conversationId,
        userId,
        userName,
        userAvatar: userPayload.avatar,
        status: "pending",
        createdAt: new Date().toISOString()
      };
      io.emit("admin:new_support_request", requestPayload);
      io.to(conversationId).emit("receive_message", {
        id: systemMsgId,
        conversationId,
        senderId: "system",
        senderName: "LagaTour System",
        text: welcomeText,
        type: "system",
        time: "Just now"
      });
    } catch (sockErr) {
      console.warn("Socket broadcast error:", sockErr.message);
    }

    res.status(201).json({
      success: true,
      conversationId,
      requestId,
      status: "pending",
      message: "Support request created. Waiting for admin acceptance."
    });
  } catch (error) {
    console.error("requestAdminSupport error:", error);
    res.status(500).json({ success: false, message: "Failed to request support", error: error.message });
  }
}

export async function getAdminSupportRequests(req, res) {
  try {
    const requests = await query(`
      SELECT 
        s.*,
        u.username,
        u.first_name,
        u.last_name,
        u.email,
        u.profile_picture_url,
        u.account_status,
        u.league_points,
        (
          SELECT m.message_text 
          FROM messages m 
          WHERE m.conversation_id = s.conversation_id 
          ORDER BY m.created_at DESC 
          LIMIT 1
        ) as last_message_text,
        (
          SELECT m.created_at 
          FROM messages m 
          WHERE m.conversation_id = s.conversation_id 
          ORDER BY m.created_at DESC 
          LIMIT 1
        ) as last_message_time
      FROM admin_support_chats s
      LEFT JOIN users u ON s.user_id = u.user_id
      ORDER BY 
        CASE WHEN s.status = 'pending' THEN 1 WHEN s.status = 'accepted' THEN 2 ELSE 3 END ASC,
        s.updated_at DESC
    `);

    res.json({ success: true, requests });
  } catch (error) {
    console.error("getAdminSupportRequests error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch support requests", error: error.message });
  }
}

export async function acceptAdminSupportRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { adminId = "admin_root", adminName = "Platform Admin" } = req.body;

    const [supportChat] = await query("SELECT * FROM admin_support_chats WHERE request_id = ?", [requestId]);
    if (!supportChat) {
      return res.status(404).json({ success: false, message: "Support request not found" });
    }

    await query(`
      UPDATE admin_support_chats SET
        status = 'accepted',
        accepted_by = ?,
        accepted_by_name = ?,
        accepted_at = NOW()
      WHERE request_id = ?
    `, [adminId, adminName, requestId]);

    // Ensure this admin is a member of the conversation
    const cmId = `cm_adm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    await query(`
      INSERT INTO conversation_members (member_id, conversation_id, user_id, role, joined_at)
      VALUES (?, ?, ?, 'admin', NOW())
      ON DUPLICATE KEY UPDATE role = 'admin'
    `, [cmId, supportChat.conversation_id, adminId]).catch(() => {});

    // Insert system notification into conversation
    const systemMsgId = `msg_acc_${Date.now()}`;
    const noticeText = `🛡️ Admin ${adminName} has accepted this request and joined the support chat.`;
    await query(`
      INSERT INTO messages (message_id, conversation_id, sender_id, message_text, message_type, created_at)
      VALUES (?, ?, 'system', ?, 'system', NOW())
    `, [systemMsgId, supportChat.conversation_id, noticeText]);

    try {
      const io = getIO();
      const payload = {
        requestId,
        conversationId: supportChat.conversation_id,
        status: "accepted",
        acceptedBy: adminId,
        acceptedByName: adminName,
        acceptedAt: new Date().toISOString()
      };
      io.emit("admin:support_request_accepted", payload);
      io.to(supportChat.conversation_id).emit("receive_message", {
        id: systemMsgId,
        conversationId: supportChat.conversation_id,
        senderId: "system",
        senderName: "LagaTour System",
        text: noticeText,
        type: "system",
        time: "Just now"
      });
    } catch (sockErr) {
      console.warn("Socket broadcast warning:", sockErr.message);
    }

    res.json({ success: true, message: `Support request accepted by ${adminName}`, conversationId: supportChat.conversation_id });
  } catch (error) {
    console.error("acceptAdminSupportRequest error:", error);
    res.status(500).json({ success: false, message: "Failed to accept support request", error: error.message });
  }
}

export async function resolveAdminSupportRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { adminId = "admin_root", adminName = "Platform Admin" } = req.body;

    const [supportChat] = await query("SELECT * FROM admin_support_chats WHERE request_id = ?", [requestId]);
    if (!supportChat) {
      return res.status(404).json({ success: false, message: "Support request not found" });
    }

    await query(`
      UPDATE admin_support_chats SET
        status = 'resolved'
      WHERE request_id = ?
    `, [requestId]);

    const systemMsgId = `msg_res_${Date.now()}`;
    const noticeText = `✅ This support inquiry was resolved by Admin ${adminName}.`;
    await query(`
      INSERT INTO messages (message_id, conversation_id, sender_id, message_text, message_type, created_at)
      VALUES (?, ?, 'system', ?, 'system', NOW())
    `, [systemMsgId, supportChat.conversation_id, noticeText]);

    try {
      const io = getIO();
      io.emit("admin:support_request_resolved", {
        requestId,
        conversationId: supportChat.conversation_id,
        status: "resolved",
        resolvedBy: adminName
      });
      io.to(supportChat.conversation_id).emit("receive_message", {
        id: systemMsgId,
        conversationId: supportChat.conversation_id,
        senderId: "system",
        senderName: "LagaTour System",
        text: noticeText,
        type: "system",
        time: "Just now"
      });
    } catch (sockErr) {
      console.warn("Socket broadcast warning:", sockErr.message);
    }

    res.json({ success: true, message: "Support request marked as resolved" });
  } catch (error) {
    console.error("resolveAdminSupportRequest error:", error);
    res.status(500).json({ success: false, message: "Failed to resolve support request", error: error.message });
  }
}

// ==========================================
// 7. SYSTEM BROADCASTS & ANNOUNCEMENTS
// ==========================================
export async function createAnnouncement(req, res) {
  try {
    const { title = "System Notification", message, priority = "info", isBanner = false } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message content is required" });
    }

    const announcementId = `ann_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    await query(`
      INSERT INTO system_announcements (announcement_id, title, message, priority, is_banner, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, 1, 'admin_root')
    `, [announcementId, title, message, priority, isBanner ? 1 : 0]);

    try {
      const io = getIO();
      if (isBanner) {
        io.emit("global_banner_alert", { message, type: priority });
      } else {
        io.emit("system_broadcast", { title, message, priority });
      }
    } catch (sockErr) {
      console.warn("Socket.io broadcast notice:", sockErr.message);
    }

    res.json({ success: true, message: "Announcement broadcasted successfully across platform" });
  } catch (error) {
    console.error("createAnnouncement error:", error);
    res.status(500).json({ success: false, message: "Failed to broadcast announcement", error: error.message });
  }
}

export async function getActiveAnnouncements(req, res) {
  try {
    const announcements = await query(`
      SELECT * FROM system_announcements 
      WHERE is_active = 1 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    res.json({ success: true, announcements });
  } catch (error) {
    console.error("getActiveAnnouncements error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch announcements", error: error.message });
  }
}
