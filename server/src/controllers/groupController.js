import { query } from "../config/db.js";
import { emitToConversation } from "../services/socketService.js";

function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

async function ensureUserExists(userData) {
  if (!userData) return null;
  const userId = typeof userData === "string" ? userData : (userData.id || userData.user_id);
  if (!userId) return null;

  const username =
    typeof userData === "object" && userData.username
      ? userData.username
      : (typeof userData === "object" && userData.name ? userData.name : userId)
          .toLowerCase()
          .replace(/\s+/g, "_");
  const email = (typeof userData === "object" && userData.email) || `${username}@laga.tour`;
  const nameParts = ((typeof userData === "object" && userData.name) || username).split(" ");
  const firstName = (typeof userData === "object" && userData.firstName) || nameParts[0] || "Traveler";
  const lastName = (typeof userData === "object" && userData.lastName) || nameParts.slice(1).join(" ") || "";
  const avatar =
    (typeof userData === "object" && (userData.avatar || userData.profile_picture_url || userData.profilePictureUrl)) ||
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`;
  const points = (typeof userData === "object" && (userData.points || userData.league_points)) || 350;

  try {
    await query(
      `INSERT INTO users (user_id, email, username, first_name, last_name, profile_picture_url, league_points)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         profile_picture_url = VALUES(profile_picture_url)`,
      [userId, email, username, firstName, lastName, avatar, points]
    );
  } catch (err) {
    console.error("ensureUserExists (group) error:", err.message);
  }

  return userId;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/groups
 * List all group expeditions with organizer details, member counts, and membership status
 */
export async function getAllGroups(req, res) {
  try {
    const { userId, destination, status } = req.query;

    const conditions = [];
    const params = [];

    if (destination && destination !== "All") {
      conditions.push("(eg.destination LIKE ? OR eg.title LIKE ?)");
      params.push(`%${destination}%`, `%${destination}%`);
    }

    if (status && status !== "all") {
      conditions.push("eg.status = ?");
      params.push(status);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await query(`
      SELECT 
        eg.group_id AS id,
        eg.organizer_id,
        eg.conversation_id AS conversationId,
        eg.title,
        eg.destination,
        eg.travel_date AS travelDate,
        eg.estimated_budget AS estimatedBudget,
        eg.max_members AS maxMembers,
        eg.transportation,
        eg.accommodation_plan AS accommodationPlan,
        eg.itinerary,
        eg.status,
        eg.created_at AS createdAt,
        u.username AS organizer_username,
        u.first_name AS organizer_first_name,
        u.last_name AS organizer_last_name,
        u.profile_picture_url AS organizer_avatar,
        (SELECT COUNT(*) FROM expedition_members em WHERE em.group_id = eg.group_id AND em.status = 'accepted') AS memberCount
      FROM expedition_groups eg
      LEFT JOIN users u ON eg.organizer_id = u.user_id
      ${whereSql}
      ORDER BY eg.created_at DESC
    `, params);

    // Fetch members for each group to populate cards & determine membership
    const groupIds = rows.map(r => r.id);
    let membersMap = {};
    let requestsMap = {};

    if (groupIds.length > 0) {
      const ph = groupIds.map(() => "?").join(",");
      const allMembersRaw = await query(`
        SELECT 
          em.id AS member_row_id,
          em.group_id,
          em.user_id,
          em.role,
          em.status,
          em.joined_at,
          u.username,
          u.first_name,
          u.last_name,
          u.profile_picture_url,
          u.league_points,
          u.bio
        FROM expedition_members em
        LEFT JOIN users u ON em.user_id = u.user_id
        WHERE em.group_id IN (${ph})
      `, groupIds);

      allMembersRaw.forEach(m => {
        const userObj = {
          id: m.user_id,
          user_id: m.user_id,
          username: m.username || "traveler",
          name: [m.first_name, m.last_name].filter(Boolean).join(" ") || m.username || "Traveler",
          avatar: m.profile_picture_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(m.username || m.user_id)}`,
          role: m.role,
          points: m.league_points || 350,
          bio: m.bio || ""
        };

        if (m.status === 'accepted') {
          if (!membersMap[m.group_id]) membersMap[m.group_id] = [];
          membersMap[m.group_id].push(userObj);
        } else if (m.status === 'pending') {
          if (!requestsMap[m.group_id]) requestsMap[m.group_id] = [];
          requestsMap[m.group_id].push({
            id: m.member_row_id,
            user: userObj,
            status: "pending",
            requestedAt: m.joined_at
          });
        }
      });
    }

    const groups = rows.map(g => {
      let parsedItinerary = [];
      try {
        parsedItinerary = typeof g.itinerary === "string" ? JSON.parse(g.itinerary) : (g.itinerary || []);
      } catch {
        parsedItinerary = [
          { day: "Day 1", plan: "Depart and check into accommodation. Evening group dinner." },
          { day: "Day 2", plan: "Sightseeing, photography, and local adventure trails." },
          { day: "Day 3", plan: "Return journey back home." }
        ];
      }

      const organizerObj = {
        id: g.organizer_id,
        user_id: g.organizer_id,
        username: g.organizer_username || "traveler",
        name: [g.organizer_first_name, g.organizer_last_name].filter(Boolean).join(" ") || g.organizer_username || "Organizer",
        avatar: g.organizer_avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(g.organizer_username || g.organizer_id)}`
      };

      const groupMembers = membersMap[g.id] || [organizerObj];
      const groupRequests = requestsMap[g.id] || [];

      // Check user membership status
      const isOrganizer = userId ? (g.organizer_id === userId) : false;
      const isMember = userId ? groupMembers.some(m => m.id === userId || m.user_id === userId) : false;
      const isPending = userId ? groupRequests.some(r => r.user?.id === userId || r.user?.user_id === userId) : false;

      return {
        id: g.id,
        title: g.title,
        destination: g.destination,
        travelDate: g.travelDate ? String(g.travelDate).split("T")[0] : "2026-12-01",
        estimatedBudget: Number(g.estimatedBudget) || 8500,
        maxMembers: g.maxMembers || 8,
        transportation: g.transportation || "Bus",
        accommodationPlan: g.accommodationPlan || "Resort / Hotel",
        status: g.status || "open",
        conversationId: g.conversationId,
        organizer: organizerObj,
        members: groupMembers,
        requests: groupRequests,
        pendingCount: groupRequests.length,
        itinerary: parsedItinerary,
        memberCount: groupMembers.length,
        isOrganizer,
        isMember: isOrganizer || isMember,
        isPending
      };
    });

    res.json({ success: true, count: groups.length, groups });
  } catch (error) {
    console.error("Error in getAllGroups:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/groups/:id
 * Full details of a single expedition including checklist, expenses, members, and chat info
 */
export async function getGroupDetails(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const [groupRaw] = await query(`
      SELECT 
        eg.group_id AS id,
        eg.organizer_id,
        eg.conversation_id AS conversationId,
        eg.title,
        eg.destination,
        eg.travel_date AS travelDate,
        eg.estimated_budget AS estimatedBudget,
        eg.max_members AS maxMembers,
        eg.transportation,
        eg.accommodation_plan AS accommodationPlan,
        eg.itinerary,
        eg.status,
        eg.created_at AS createdAt,
        u.username AS organizer_username,
        u.first_name AS organizer_first_name,
        u.last_name AS organizer_last_name,
        u.profile_picture_url AS organizer_avatar
      FROM expedition_groups eg
      LEFT JOIN users u ON eg.organizer_id = u.user_id
      WHERE eg.group_id = ?
      LIMIT 1
    `, [id]);

    if (!groupRaw) {
      return res.status(404).json({ success: false, message: "Expedition not found" });
    }

    // 1. Fetch Members & Requests
    const membersRaw = await query(`
      SELECT 
        em.id AS member_row_id,
        em.user_id,
        em.role,
        em.status,
        em.joined_at,
        u.username,
        u.first_name,
        u.last_name,
        u.profile_picture_url,
        u.league_points,
        u.bio
      FROM expedition_members em
      LEFT JOIN users u ON em.user_id = u.user_id
      WHERE em.group_id = ?
    `, [id]);

    const members = [];
    const requests = [];

    membersRaw.forEach(m => {
      const userObj = {
        id: m.user_id,
        user_id: m.user_id,
        username: m.username || "traveler",
        name: [m.first_name, m.last_name].filter(Boolean).join(" ") || m.username || "Traveler",
        avatar: m.profile_picture_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(m.username || m.user_id)}`,
        role: m.role,
        points: m.league_points || 350,
        bio: m.bio || ""
      };

      if (m.status === 'accepted') {
        members.push(userObj);
      } else if (m.status === 'pending') {
        requests.push({
          id: m.member_row_id,
          user: userObj,
          status: "pending",
          requestedAt: m.joined_at
        });
      }
    });

    // 2. Fetch Checklists
    const checklistRaw = await query(`
      SELECT 
        task_id AS id,
        task,
        is_completed AS completed,
        assigned_to_user_id AS assignedToUserId,
        assigned_to_name AS assignedTo,
        created_at AS createdAt
      FROM expedition_checklists
      WHERE group_id = ?
      ORDER BY created_at ASC
    `, [id]);

    const checklist = checklistRaw.map(c => ({
      ...c,
      completed: Boolean(c.completed)
    }));

    // 3. Fetch Expenses
    const expensesRaw = await query(`
      SELECT 
        expense_id AS id,
        title,
        amount,
        paid_by_user_id AS paidByUserId,
        paid_by_name AS paidBy,
        date,
        created_at AS createdAt
      FROM expedition_expenses
      WHERE group_id = ?
      ORDER BY created_at DESC
    `, [id]);

    const expenses = expensesRaw.map(e => ({
      ...e,
      amount: Number(e.amount)
    }));

    // 4. Parse Itinerary
    let itinerary = [];
    try {
      itinerary = typeof groupRaw.itinerary === "string" ? JSON.parse(groupRaw.itinerary) : (groupRaw.itinerary || []);
    } catch {
      itinerary = [];
    }

    const organizerObj = {
      id: groupRaw.organizer_id,
      user_id: groupRaw.organizer_id,
      username: groupRaw.organizer_username || "traveler",
      name: [groupRaw.organizer_first_name, groupRaw.organizer_last_name].filter(Boolean).join(" ") || groupRaw.organizer_username || "Organizer",
      avatar: groupRaw.organizer_avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(groupRaw.organizer_username || groupRaw.organizer_id)}`
    };

    // 5. Fetch Itinerary Suggestions / Appeals
    const suggestionsRaw = await query(`
      SELECT 
        id,
        group_id AS groupId,
        user_id AS userId,
        user_name AS userName,
        user_avatar AS userAvatar,
        day,
        activity_plan AS activityPlan,
        reason,
        status,
        rejection_reason AS rejectionReason,
        reviewed_by AS reviewedBy,
        reviewed_at AS reviewedAt,
        created_at AS createdAt
      FROM expedition_itinerary_suggestions
      WHERE group_id = ?
      ORDER BY created_at DESC
    `, [id]);

    const itinerarySuggestions = suggestionsRaw.map(s => ({
      ...s,
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : null,
      reviewedAt: s.reviewedAt ? new Date(s.reviewedAt).toISOString() : null
    }));

    const isOrganizer = userId ? (groupRaw.organizer_id === userId) : false;
    const isMember = userId ? members.some(m => m.id === userId || m.user_id === userId) : false;
    const isPending = userId ? requests.some(r => r.user?.id === userId || r.user?.user_id === userId) : false;

    res.json({
      success: true,
      group: {
        id: groupRaw.id,
        title: groupRaw.title,
        destination: groupRaw.destination,
        travelDate: groupRaw.travelDate ? String(groupRaw.travelDate).split("T")[0] : "2026-12-01",
        estimatedBudget: Number(groupRaw.estimatedBudget) || 8500,
        maxMembers: groupRaw.maxMembers || 8,
        transportation: groupRaw.transportation || "Bus",
        accommodationPlan: groupRaw.accommodationPlan || "Resort / Hotel",
        status: groupRaw.status || "open",
        conversationId: groupRaw.conversationId,
        organizer: organizerObj,
        members,
        requests,
        pendingCount: requests.length,
        checklist,
        expenses,
        itinerary,
        itinerarySuggestions,
        pendingSuggestionsCount: itinerarySuggestions.filter(s => s.status === 'pending').length,
        isOrganizer,
        isMember: isOrganizer || isMember,
        isPending
      }
    });
  } catch (error) {
    console.error("Error in getGroupDetails:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/groups
 * Create a new expedition group and auto-create linked group chat in conversations
 */
export async function createGroup(req, res) {
  try {
    const {
      title,
      destination,
      travelDate,
      estimatedBudget,
      maxMembers,
      transportation,
      accommodationPlan,
      itinerary,
      organizer
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Expedition title is required." });
    }

    const organizerId = await ensureUserExists(organizer);
    if (!organizerId) {
      return res.status(400).json({ success: false, message: "Valid organizer information is required." });
    }

    const groupId = uid("group");
    const conversationId = uid("chat_group");
    const cleanTitle = title.trim();

    // 1. Create linked Group Chat in `conversations`
    const groupAvatar = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(destination || cleanTitle)}`;
    await query(`
      INSERT INTO conversations (conversation_id, type, title, avatar_url, created_by, created_at, updated_at)
      VALUES (?, 'group', ?, ?, ?, NOW(), NOW())
    `, [conversationId, cleanTitle, groupAvatar, organizerId]);

    // 2. Add organizer as admin in `conversation_members`
    await query(`
      INSERT INTO conversation_members (member_id, conversation_id, user_id, role, joined_at)
      VALUES (?, ?, ?, 'admin', NOW())
    `, [uid("cm"), conversationId, organizerId]);

    // 3. Add initial welcome message in chat
    await query(`
      INSERT INTO messages (message_id, conversation_id, sender_id, message_text, message_type, created_at)
      VALUES (?, ?, ?, ?, 'system', NOW())
    `, [uid("msg"), conversationId, organizerId, `🎉 Welcome to the ${cleanTitle} expedition group! Let's plan our trip.`]);

    // 4. Default Itinerary JSON
    const defaultItinerary = itinerary && Array.isArray(itinerary) ? itinerary : [
      { day: "Day 1", plan: `Depart for ${destination || "destination"}. Check into accommodation and group dinner.` },
      { day: "Day 2", plan: "Sightseeing, photography, hiking, and local adventure trails." },
      { day: "Day 3", plan: "Morning sunrise view, local souvenir shopping, and return journey." }
    ];

    // 5. Create Expedition in `expedition_groups`
    await query(`
      INSERT INTO expedition_groups (
        group_id, organizer_id, conversation_id, title, destination, travel_date,
        estimated_budget, max_members, transportation, accommodation_plan, itinerary, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', NOW())
    `, [
      groupId,
      organizerId,
      conversationId,
      cleanTitle,
      destination || "Cox's Bazar Beach",
      travelDate || "2026-12-01",
      Number(estimatedBudget) || 8500,
      Number(maxMembers) || 8,
      transportation || "AC Bus & Boat",
      accommodationPlan || "Beach Resort & Camping",
      JSON.stringify(defaultItinerary)
    ]);

    // 6. Add Organizer to `expedition_members`
    await query(`
      INSERT INTO expedition_members (id, group_id, user_id, role, status, joined_at)
      VALUES (?, ?, ?, 'organizer', 'accepted', NOW())
    `, [uid("em"), groupId, organizerId]);

    // 7. Seed initial default checklist tasks
    const initialTasks = [
      { id: uid("chk"), task: "Book group transportation tickets", assignedToName: organizer?.name || "Organizer" },
      { id: uid("chk"), task: `Confirm ${accommodationPlan || "hotel"} reservation`, assignedToName: organizer?.name || "Organizer" },
      { id: uid("chk"), task: "Create emergency medical & first aid packing kit", assignedToName: organizer?.name || "Organizer" }
    ];

    for (const t of initialTasks) {
      await query(`
        INSERT INTO expedition_checklists (task_id, group_id, task, is_completed, assigned_to_user_id, assigned_to_name, created_at)
        VALUES (?, ?, ?, 0, ?, ?, NOW())
      `, [t.id, groupId, t.task, organizerId, t.assignedToName]);
    }

    // 8. Award Organizer League Points (+75 points)
    await query(`
      UPDATE users SET league_points = league_points + 75 WHERE user_id = ?
    `, [organizerId]);

    res.status(201).json({
      success: true,
      message: "Expedition created successfully!",
      groupId,
      conversationId
    });
  } catch (error) {
    console.error("Error in createGroup:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/groups/:id/join
 * Request to join an expedition group
 */
export async function requestToJoinGroup(req, res) {
  try {
    const { id } = req.params;
    const user = req.body.user || (req.body.userId ? req.body : null) || req.body;

    const userId = await ensureUserExists(user);
    if (!userId) {
      return res.status(400).json({ success: false, message: "User information is required." });
    }

    // Check if group exists and is open
    const [group] = await query(`SELECT group_id, max_members, status FROM expedition_groups WHERE group_id = ?`, [id]);
    if (!group) {
      return res.status(404).json({ success: false, message: "Expedition not found." });
    }

    // Check if user already in group or requested
    const [existing] = await query(`SELECT id, status FROM expedition_members WHERE group_id = ? AND user_id = ?`, [id, userId]);
    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ success: false, message: "You are already a member of this expedition." });
      }
      return res.status(400).json({ success: false, message: "You already have a pending join request." });
    }

    await query(`
      INSERT INTO expedition_members (id, group_id, user_id, role, status, joined_at)
      VALUES (?, ?, ?, 'member', 'pending', NOW())
    `, [uid("em"), id, userId]);

    res.json({ success: true, message: "Join request sent to the expedition organizer!" });
  } catch (error) {
    console.error("Error in requestToJoinGroup:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/groups/:id/join
 * Withdraw / Cancel a pending join request
 */
export async function withdrawJoinRequest(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required to withdraw request." });
    }

    await query(`
      DELETE FROM expedition_members 
      WHERE group_id = ? AND user_id = ? AND status = 'pending'
    `, [id, userId]);

    res.json({ success: true, message: "Join request withdrawn successfully." });
  } catch (error) {
    console.error("Error in withdrawJoinRequest:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PATCH /api/groups/:id/members/:targetUserId
 * Organizer responds to join request (accept or reject)
 */
export async function updateMemberStatus(req, res) {
  try {
    const { id, targetUserId } = req.params;
    const { status, organizerId } = req.body; // status: 'accepted' | 'rejected'

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be accepted or rejected." });
    }

    const [group] = await query(`SELECT group_id, conversation_id, organizer_id, title FROM expedition_groups WHERE group_id = ?`, [id]);
    if (!group) {
      return res.status(404).json({ success: false, message: "Expedition not found." });
    }

    if (organizerId && group.organizer_id !== organizerId) {
      return res.status(403).json({ success: false, message: "Only the organizer can approve join requests." });
    }

    if (status === "accepted") {
      // Update member status
      await query(`
        UPDATE expedition_members 
        SET status = 'accepted', joined_at = NOW() 
        WHERE group_id = ? AND user_id = ?
      `, [id, targetUserId]);

      // Automatically add user to the linked group chat in `conversation_members`
      if (group.conversation_id) {
        await query(`
          INSERT INTO conversation_members (member_id, conversation_id, user_id, role, joined_at)
          VALUES (?, ?, ?, 'member', NOW())
          ON DUPLICATE KEY UPDATE role = VALUES(role)
        `, [uid("cm"), group.conversation_id, targetUserId]);

        // Post a notification message into the group chat
        const [u] = await query(`SELECT first_name, last_name, username FROM users WHERE user_id = ?`, [targetUserId]);
        const userName = u ? ([u.first_name, u.last_name].filter(Boolean).join(" ") || u.username) : "A new traveler";

        await query(`
          INSERT INTO messages (message_id, conversation_id, sender_id, message_text, message_type, created_at)
          VALUES (?, ?, ?, ?, 'system', NOW())
        `, [uid("msg"), group.conversation_id, group.organizer_id, `👋 ${userName} has joined the expedition team!`]);

        emitToConversation(group.conversation_id, "chat:member_joined", {
          conversationId: group.conversation_id,
          userId: targetUserId,
          userName
        });
      }

      // Award points for joining
      await query(`UPDATE users SET league_points = league_points + 25 WHERE user_id = ?`, [targetUserId]);
    } else {
      // Reject request
      await query(`DELETE FROM expedition_members WHERE group_id = ? AND user_id = ?`, [id, targetUserId]);
    }

    res.json({ success: true, message: `Member request has been ${status}.` });
  } catch (error) {
    console.error("Error in updateMemberStatus:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/groups/:id/checklist
 * Add new task to group checklist
 */
export async function addChecklistTask(req, res) {
  try {
    const { id } = req.params;
    const { task, assignedToName, assignedToUserId } = req.body;

    if (!task || !task.trim()) {
      return res.status(400).json({ success: false, message: "Task description is required." });
    }

    const taskId = uid("chk");
    await query(`
      INSERT INTO expedition_checklists (task_id, group_id, task, is_completed, assigned_to_user_id, assigned_to_name, created_at)
      VALUES (?, ?, ?, 0, ?, ?, NOW())
    `, [taskId, id, task.trim(), assignedToUserId || null, assignedToName || "Unassigned"]);

    res.status(201).json({
      success: true,
      task: {
        id: taskId,
        task: task.trim(),
        completed: false,
        assignedTo: assignedToName || "Unassigned",
        assignedToUserId: assignedToUserId || null
      }
    });
  } catch (error) {
    console.error("Error in addChecklistTask:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PATCH /api/groups/:id/checklist/:taskId
 * Toggle task completion status
 */
export async function toggleChecklistTask(req, res) {
  try {
    const { taskId } = req.params;
    const { completed } = req.body;

    await query(`
      UPDATE expedition_checklists 
      SET is_completed = ? 
      WHERE task_id = ?
    `, [completed ? 1 : 0, taskId]);

    res.json({ success: true, completed: Boolean(completed) });
  } catch (error) {
    console.error("Error in toggleChecklistTask:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/groups/:id/checklist/:taskId
 * Delete checklist task
 */
export async function deleteChecklistTask(req, res) {
  try {
    const { taskId } = req.params;
    await query(`DELETE FROM expedition_checklists WHERE task_id = ?`, [taskId]);
    res.json({ success: true, message: "Task deleted" });
  } catch (error) {
    console.error("Error in deleteChecklistTask:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/groups/:id/expenses
 * Add a shared group expense
 */
export async function addExpense(req, res) {
  try {
    const { id } = req.params;
    const { title, amount, paidBy, paidByUserId, date } = req.body;

    if (!title || !title.trim() || !amount) {
      return res.status(400).json({ success: false, message: "Expense title and amount are required." });
    }

    const expenseId = uid("exp");
    const cleanAmount = parseFloat(amount);

    await query(`
      INSERT INTO expedition_expenses (expense_id, group_id, title, amount, paid_by_user_id, paid_by_name, date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      expenseId,
      id,
      title.trim(),
      cleanAmount,
      paidByUserId || null,
      paidBy || "Member",
      date || new Date().toISOString().split("T")[0]
    ]);

    res.status(201).json({
      success: true,
      expense: {
        id: expenseId,
        title: title.trim(),
        amount: cleanAmount,
        paidBy: paidBy || "Member",
        paidByUserId: paidByUserId || null,
        date: date || new Date().toISOString().split("T")[0]
      }
    });
  } catch (error) {
    console.error("Error in addExpense:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/groups/:id/expenses/:expenseId
 * Delete expense record
 */
export async function deleteExpense(req, res) {
  try {
    const { expenseId } = req.params;
    await query(`DELETE FROM expedition_expenses WHERE expense_id = ?`, [expenseId]);
    res.json({ success: true, message: "Expense removed" });
  } catch (error) {
    console.error("Error in deleteExpense:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/groups/:id
 * Delete/Cancel an expedition group
 */
export async function deleteGroup(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const [group] = await query(`SELECT organizer_id, conversation_id FROM expedition_groups WHERE group_id = ?`, [id]);
    if (!group) {
      return res.status(404).json({ success: false, message: "Expedition not found" });
    }

    await query(`DELETE FROM expedition_groups WHERE group_id = ?`, [id]);

    // Also clean up conversation if desired
    if (group.conversation_id) {
      await query(`DELETE FROM conversations WHERE conversation_id = ?`, [group.conversation_id]);
    }

    res.json({ success: true, message: "Expedition deleted successfully" });
  } catch (error) {
    console.error("Error in deleteGroup:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/groups/:id/itinerary-suggestions
 * Member proposes an itinerary appeal / activity suggestion
 */
export async function createItinerarySuggestion(req, res) {
  try {
    const { id } = req.params;
    const { day, activityPlan, reason, user } = req.body;

    if (!activityPlan || !activityPlan.trim()) {
      return res.status(400).json({ success: false, message: "Activity plan description is required." });
    }

    const userData = user || (req.body.userId ? req.body : null) || req.body;
    const userId = await ensureUserExists(userData);
    if (!userId) {
      return res.status(400).json({ success: false, message: "User information is required." });
    }

    const userName = (typeof userData === "object" && (userData.name || userData.username)) || "Traveler";
    const userAvatar = (typeof userData === "object" && (userData.avatar || userData.profile_picture_url)) || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userName)}`;

    const suggestionId = uid("sug");
    const chosenDay = day && day.trim() ? day.trim() : "Day 1";

    await query(`
      INSERT INTO expedition_itinerary_suggestions 
        (id, group_id, user_id, user_name, user_avatar, day, activity_plan, reason, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `, [suggestionId, id, userId, userName, userAvatar, chosenDay, activityPlan.trim(), reason?.trim() || null]);

    // Send a real-time system message to the group chat
    try {
      const [grp] = await query(`SELECT conversation_id, title FROM expedition_groups WHERE group_id = ?`, [id]);
      if (grp && grp.conversation_id) {
        const msgId = uid("msg");
        await query(`
          INSERT INTO messages (message_id, conversation_id, sender_id, message_type, message_text, created_at)
          VALUES (?, ?, 'system', 'system', ?, NOW())
        `, [msgId, grp.conversation_id, `💡 ${userName} proposed an itinerary suggestion for ${chosenDay}: "${activityPlan.trim()}"`]);
      }
    } catch (chatErr) {
      console.warn("Could not post suggestion chat notification:", chatErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Itinerary proposal submitted for creator review!",
      suggestion: {
        id: suggestionId,
        groupId: id,
        userId,
        userName,
        userAvatar,
        day: chosenDay,
        activityPlan: activityPlan.trim(),
        reason: reason?.trim() || null,
        status: "pending",
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error in createItinerarySuggestion:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PATCH /api/groups/:id/itinerary-suggestions/:suggestionId
 * Creator reviews and accepts / rejects member itinerary appeal
 */
export async function respondToItinerarySuggestion(req, res) {
  try {
    const { id, suggestionId } = req.params;
    const { status, rejectionReason, organizerId } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'accepted' or 'rejected'." });
    }

    const [suggestion] = await query(`
      SELECT * FROM expedition_itinerary_suggestions WHERE id = ? AND group_id = ?
    `, [suggestionId, id]);

    if (!suggestion) {
      return res.status(404).json({ success: false, message: "Itinerary suggestion not found." });
    }

    const [group] = await query(`
      SELECT group_id, title, itinerary, conversation_id, organizer_id FROM expedition_groups WHERE group_id = ?
    `, [id]);

    if (!group) {
      return res.status(404).json({ success: false, message: "Expedition not found." });
    }

    if (status === "accepted") {
      // Parse current itinerary
      let itinerary = [];
      try {
        itinerary = typeof group.itinerary === "string" ? JSON.parse(group.itinerary) : (group.itinerary || []);
      } catch {
        itinerary = [];
      }

      // Check if day exists in itinerary
      const targetDayNormalized = (suggestion.day || "Day 1").toLowerCase().trim();
      let dayFound = false;

      for (let d of itinerary) {
        if (d.day && d.day.toLowerCase().trim() === targetDayNormalized) {
          d.plan = d.plan ? `${d.plan}\n• ${suggestion.activity_plan}` : suggestion.activity_plan;
          dayFound = true;
          break;
        }
      }

      if (!dayFound) {
        itinerary.push({
          day: suggestion.day || `Day ${itinerary.length + 1}`,
          plan: suggestion.activity_plan
        });
      }

      // Update group itinerary in database
      await query(`
        UPDATE expedition_groups SET itinerary = ? WHERE group_id = ?
      `, [JSON.stringify(itinerary), id]);

      // Update suggestion status
      await query(`
        UPDATE expedition_itinerary_suggestions 
        SET status = 'accepted', reviewed_by = ?, reviewed_at = NOW(), rejection_reason = NULL
        WHERE id = ?
      `, [organizerId || group.organizer_id, suggestionId]);

      // Award league points (+25 points) to contributor
      await query(`
        UPDATE users SET league_points = league_points + 25 WHERE user_id = ?
      `, [suggestion.user_id]);

      // Post chat notification
      if (group.conversation_id) {
        try {
          const msgId = uid("msg");
          await query(`
            INSERT INTO messages (message_id, conversation_id, sender_id, message_type, message_text, created_at)
            VALUES (?, ?, 'system', 'system', ?, NOW())
          `, [msgId, group.conversation_id, `🎉 Creator accepted ${suggestion.user_name}'s itinerary suggestion for ${suggestion.day}! The itinerary has been updated.`]);
        } catch (chatErr) {}
      }

      return res.json({
        success: true,
        message: "Itinerary suggestion accepted and merged into the official schedule!",
        itinerary,
        status: "accepted"
      });
    } else {
      // Rejected with reason
      const cleanReason = (rejectionReason && rejectionReason.trim()) || "Declined by expedition organizer.";
      
      await query(`
        UPDATE expedition_itinerary_suggestions 
        SET status = 'rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW()
        WHERE id = ?
      `, [cleanReason, organizerId || group.organizer_id, suggestionId]);

      // Post gentle chat notification or keep in panel
      if (group.conversation_id) {
        try {
          const msgId = uid("msg");
          await query(`
            INSERT INTO messages (message_id, conversation_id, sender_id, message_type, message_text, created_at)
            VALUES (?, ?, 'system', 'system', ?, NOW())
          `, [msgId, group.conversation_id, `ℹ️ Itinerary proposal by ${suggestion.user_name} for ${suggestion.day} was reviewed: "${cleanReason}"`]);
        } catch (chatErr) {}
      }

      return res.json({
        success: true,
        message: "Itinerary suggestion declined.",
        rejectionReason: cleanReason,
        status: "rejected"
      });
    }
  } catch (error) {
    console.error("Error in respondToItinerarySuggestion:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/groups/:id/itinerary-suggestions/:suggestionId
 * Withdraw or delete an itinerary suggestion
 */
export async function deleteItinerarySuggestion(req, res) {
  try {
    const { id, suggestionId } = req.params;
    await query(`
      DELETE FROM expedition_itinerary_suggestions WHERE id = ? AND group_id = ?
    `, [suggestionId, id]);

    res.json({ success: true, message: "Itinerary suggestion removed." });
  } catch (error) {
    console.error("Error in deleteItinerarySuggestion:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
