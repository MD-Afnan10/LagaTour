import { query } from "../config/db.js";
import { getIO } from "../services/socketService.js";
import { calculateLeague } from "../utils/leagueHelper.js";

function formatTraveler(u, isFollowing = false, isFollower = false) {
  const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "Traveler";
  const pts = u.league_points || 350;
  const league = calculateLeague(pts);

  return {
    id: u.user_id,
    user_id: u.user_id,
    username: u.username,
    name: fullName,
    firstName: u.first_name || "",
    lastName: u.last_name || "",
    avatar: u.profile_picture_url || "https://api.dicebear.com/7.x/adventurer/svg?seed=" + u.username,
    bio: u.bio || "Passionate traveler on LagaTour.",
    city: u.city || "Dhaka",
    country: u.country || "Bangladesh",
    preferredTravelType: u.preferred_travel_type || "Solo",
    points: pts,
    league: league,
    followersCount: u.followers_count || 0,
    followingCount: u.following_count || 0,
    isFollowing: Boolean(isFollowing),
    isFollower: Boolean(isFollower),
    followedAt: u.followed_at || null
  };
}

/**
 * POST /api/users/:targetId/follow
 * Toggle follow / unfollow a user with real-time score points and socket broadcast
 */
export async function toggleFollow(req, res) {
  try {
    const { targetId } = req.params;
    const { followerId } = req.body;

    if (!followerId) {
      return res.status(400).json({ success: false, message: "Follower ID is required." });
    }

    // Resolve target user by ID or Username
    const [targetUser] = await query(
      "SELECT * FROM users WHERE user_id = ? OR LOWER(username) = ?",
      [targetId, targetId.toLowerCase()]
    );

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Target user not found." });
    }

    const actualTargetId = targetUser.user_id;

    if (followerId === actualTargetId) {
      return res.status(400).json({ success: false, message: "You cannot follow yourself." });
    }

    // Check existing follow relationship
    const [existingFollow] = await query(
      "SELECT * FROM follows WHERE follower_id = ? AND following_id = ?",
      [followerId, actualTargetId]
    );

    let isFollowing = false;
    let message = "";

    if (existingFollow) {
      // Unfollow
      await query(
        "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
        [followerId, actualTargetId]
      );

      // Recalculate counts
      await query("UPDATE users SET following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND status = \x27accepted\x27) WHERE user_id = ?", [followerId, followerId]);
      await query("UPDATE users SET followers_count = (SELECT COUNT(*) FROM follows WHERE following_id = ? AND status = \x27accepted\x27) WHERE user_id = ?", [actualTargetId, actualTargetId]);

      isFollowing = false;
      message = "Unfollowed @" + targetUser.username + " successfully.";
    } else {
      // Follow
      const followId = "follow_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      await query(
        "INSERT INTO follows (follow_id, follower_id, following_id, status, requested_at, accepted_at) VALUES (?, ?, ?, \x27accepted\x27, NOW(), NOW())",
        [followId, followerId, actualTargetId]
      );

      // Update counts & award gamification points
      await query("UPDATE users SET following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND status = \x27accepted\x27), league_points = league_points + 5 WHERE user_id = ?", [followerId, followerId]);
      await query("UPDATE users SET followers_count = (SELECT COUNT(*) FROM follows WHERE following_id = ? AND status = \x27accepted\x27), league_points = league_points + 15 WHERE user_id = ?", [actualTargetId, actualTargetId]);

      isFollowing = true;
      message = "You are now following @" + targetUser.username + "! (+15 points awarded to traveler)";
    }

    // Fetch updated counts
    const [updatedTarget] = await query("SELECT followers_count, following_count, league_points FROM users WHERE user_id = ?", [actualTargetId]);
    const [updatedFollower] = await query("SELECT followers_count, following_count, league_points FROM users WHERE user_id = ?", [followerId]);

    // Broadcast Socket.io event for real-time live sync
    try {
      getIO().emit("user:follow_updated", {
        followerId,
        targetId: actualTargetId,
        isFollowing,
        targetFollowersCount: updatedTarget?.followers_count || 0,
        followerFollowingCount: updatedFollower?.following_count || 0
      });
    } catch (e) {}

    res.json({
      success: true,
      isFollowing,
      message,
      targetUserId: actualTargetId,
      followersCount: updatedTarget?.followers_count || 0,
      followingCount: updatedTarget?.following_count || 0,
      followerFollowingCount: updatedFollower?.following_count || 0
    });
  } catch (error) {
    console.error("Error in toggleFollow:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/users/:targetId/follow-status?followerId=...
 * Check if viewer follows target user and fetch follower/following counts
 */
export async function getFollowStatus(req, res) {
  try {
    const { targetId } = req.params;
    const { followerId } = req.query;

    const [targetUser] = await query(
      "SELECT user_id, followers_count, following_count FROM users WHERE user_id = ? OR LOWER(username) = ?",
      [targetId, targetId.toLowerCase()]
    );

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Target user not found." });
    }

    let isFollowing = false;
    let isFollower = false;

    if (followerId && followerId !== targetUser.user_id) {
      const [followRecord] = await query(
        "SELECT * FROM follows WHERE follower_id = ? AND following_id = ?",
        [followerId, targetUser.user_id]
      );
      isFollowing = Boolean(followRecord);

      const [reverseRecord] = await query(
        "SELECT * FROM follows WHERE follower_id = ? AND following_id = ?",
        [targetUser.user_id, followerId]
      );
      isFollower = Boolean(reverseRecord);
    }

    const [followersCountRow] = await query("SELECT COUNT(*) as count FROM follows WHERE following_id = ? AND status = \x27accepted\x27", [targetUser.user_id]);
    const [followingCountRow] = await query("SELECT COUNT(*) as count FROM follows WHERE follower_id = ? AND status = \x27accepted\x27", [targetUser.user_id]);

    res.json({
      success: true,
      targetUserId: targetUser.user_id,
      isFollowing,
      isFollower,
      isMutual: isFollowing && isFollower,
      followersCount: followersCountRow?.count || targetUser.followers_count || 0,
      followingCount: followingCountRow?.count || targetUser.following_count || 0
    });
  } catch (error) {
    console.error("Error in getFollowStatus:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/users/:targetId/followers?viewerId=...
 * Get list of travelers who follow the target user
 */
export async function getFollowers(req, res) {
  try {
    const { targetId } = req.params;
    const { viewerId } = req.query;

    const [targetUser] = await query(
      "SELECT user_id FROM users WHERE user_id = ? OR LOWER(username) = ?",
      [targetId, targetId.toLowerCase()]
    );

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const actualTargetId = targetUser.user_id;

    const sql = `
      SELECT 
        u.*,
        COALESCE(f.accepted_at, f.requested_at, f.updated_at) AS followed_at,
        (CASE WHEN f_viewer.follow_id IS NOT NULL THEN 1 ELSE 0 END) AS is_viewer_following,
        (CASE WHEN f_reverse.follow_id IS NOT NULL THEN 1 ELSE 0 END) AS is_viewer_follower
      FROM follows f
      JOIN users u ON f.follower_id = u.user_id
      LEFT JOIN follows f_viewer ON f_viewer.follower_id = ? AND f_viewer.following_id = u.user_id
      LEFT JOIN follows f_reverse ON f_reverse.follower_id = u.user_id AND f_reverse.following_id = ?
      WHERE f.following_id = ? AND f.status = \x27accepted\x27
      ORDER BY COALESCE(f.accepted_at, f.requested_at, f.updated_at) DESC
    `;

    const rows = await query(sql, [viewerId || "none", viewerId || "none", actualTargetId]);
    const formatted = rows.map(r => formatTraveler(r, Boolean(r.is_viewer_following), Boolean(r.is_viewer_follower)));

    res.json({
      success: true,
      count: formatted.length,
      followers: formatted
    });
  } catch (error) {
    console.error("Error in getFollowers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/users/:targetId/following?viewerId=...
 * Get list of travelers whom the target user is following
 */
export async function getFollowing(req, res) {
  try {
    const { targetId } = req.params;
    const { viewerId } = req.query;

    const [targetUser] = await query(
      "SELECT user_id FROM users WHERE user_id = ? OR LOWER(username) = ?",
      [targetId, targetId.toLowerCase()]
    );

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const actualTargetId = targetUser.user_id;

    const sql = `
      SELECT 
        u.*,
        COALESCE(f.accepted_at, f.requested_at, f.updated_at) AS followed_at,
        (CASE WHEN f_viewer.follow_id IS NOT NULL THEN 1 ELSE 0 END) AS is_viewer_following,
        (CASE WHEN f_reverse.follow_id IS NOT NULL THEN 1 ELSE 0 END) AS is_viewer_follower
      FROM follows f
      JOIN users u ON f.following_id = u.user_id
      LEFT JOIN follows f_viewer ON f_viewer.follower_id = ? AND f_viewer.following_id = u.user_id
      LEFT JOIN follows f_reverse ON f_reverse.follower_id = u.user_id AND f_reverse.following_id = ?
      WHERE f.follower_id = ? AND f.status = \x27accepted\x27
      ORDER BY COALESCE(f.accepted_at, f.requested_at, f.updated_at) DESC
    `;

    const rows = await query(sql, [viewerId || "none", viewerId || "none", actualTargetId]);
    const formatted = rows.map(r => formatTraveler(r, Boolean(r.is_viewer_following), Boolean(r.is_viewer_follower)));

    res.json({
      success: true,
      count: formatted.length,
      following: formatted
    });
  } catch (error) {
    console.error("Error in getFollowing:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/users/:userId/connected-travelers
 * Get all connected travelers (followers & following) for companion invite & discovery
 */
export async function getConnectedTravelers(req, res) {
  try {
    const { userId } = req.params;

    const [targetUser] = await query(
      "SELECT user_id FROM users WHERE user_id = ? OR LOWER(username) = ?",
      [userId, userId.toLowerCase()]
    );

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const actualUserId = targetUser.user_id;

    const sql = `
      SELECT DISTINCT
        u.user_id,
        u.username,
        u.first_name,
        u.last_name,
        u.profile_picture_url,
        u.bio,
        u.league_points,
        u.preferred_travel_type,
        (CASE WHEN f_out.follow_id IS NOT NULL THEN 1 ELSE 0 END) AS is_following,
        (CASE WHEN f_in.follow_id IS NOT NULL THEN 1 ELSE 0 END) AS is_follower
      FROM users u
      LEFT JOIN follows f_out ON f_out.follower_id = ? AND f_out.following_id = u.user_id AND f_out.status = \x27accepted\x27
      LEFT JOIN follows f_in ON f_in.follower_id = u.user_id AND f_in.following_id = ? AND f_in.status = \x27accepted\x27
      WHERE u.user_id != ? AND (f_out.follow_id IS NOT NULL OR f_in.follow_id IS NOT NULL)
      ORDER BY u.league_points DESC
    `;

    const rows = await query(sql, [actualUserId, actualUserId, actualUserId]);

    const travelers = rows.map(r => {
      const isFollowing = Boolean(r.is_following);
      const isFollower = Boolean(r.is_follower);
      let connectionType = "Connected";
      if (isFollowing && isFollower) connectionType = "Mutual";
      else if (isFollowing) connectionType = "Following";
      else if (isFollower) connectionType = "Follower";

      return {
        id: r.user_id,
        user_id: r.user_id,
        username: r.username,
        name: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.username,
        avatar: r.profile_picture_url || "https://api.dicebear.com/7.x/adventurer/svg?seed=" + r.username,
        bio: r.bio || "Travel companion",
        league: calculateLeague(r.league_points),
        points: r.league_points || 350,
        role: "Companion",
        preferredTravelType: r.preferred_travel_type || "Solo",
        isFollowing,
        isFollower,
        connectionType
      };
    });

    res.json({
      success: true,
      count: travelers.length,
      travelers
    });
  } catch (error) {
    console.error("Error in getConnectedTravelers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
