import { query } from "../config/db.js";
import { emitToConversation } from "../services/socketService.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

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
    console.error("ensureUserExists (chat) error:", err.message);
  }

  return userId;
}

function formatUser(row) {
  if (!row) return null;
  const name =
    [row.first_name, row.last_name].filter(Boolean).join(" ") ||
    row.username ||
    "Traveler";
  return {
    id: row.user_id,
    user_id: row.user_id,
    name,
    username: row.username || "traveler",
    avatar:
      row.profile_picture_url ||
      `https://api.dicebear.com/7.x/adventurer/svg?seed=${row.username}`,
    isGroup: false,
  };
}

/**
 * Hydrates conversation rows with member details and latest message
 */
async function hydrateConversations(convRows, currentUserId) {
  if (!convRows || convRows.length === 0) return [];

  const convIds = convRows.map((c) => c.conversation_id);
  const ph = convIds.map(() => "?").join(",");

  // 1. Fetch all members for these conversations
  const membersRaw = await query(
    `SELECT cm.conversation_id, cm.role, cm.joined_at, cm.last_read_at,
            u.user_id, u.username, u.first_name, u.last_name, u.profile_picture_url
     FROM conversation_members cm
     LEFT JOIN users u ON cm.user_id = u.user_id
     WHERE cm.conversation_id IN (${ph})`,
    convIds
  );

  // 2. Fetch all messages for these conversations (ordered by created_at)
  const allMsgsRaw = await query(
    `SELECT m.conversation_id, m.message_id, m.sender_id, m.message_text,
            m.message_type, m.media_url, m.created_at,
            u.username AS sender_username, u.first_name, u.last_name
     FROM messages m
     LEFT JOIN users u ON m.sender_id = u.user_id
     WHERE m.conversation_id IN (${ph})
     ORDER BY m.created_at ASC`,
    convIds
  );

  return convRows.map((conv) => {
    const cId = conv.conversation_id;
    const isGroup = conv.type === "group";

    const members = membersRaw.filter((m) => m.conversation_id === cId);
    const convMsgs = allMsgsRaw.filter((m) => m.conversation_id === cId);
    const lastMsgRow = convMsgs.length > 0 ? convMsgs[convMsgs.length - 1] : null;

    // Calculate unread count for current user
    const currentMember = members.find((m) => m.user_id === currentUserId);
    const lastReadTime = currentMember?.last_read_at ? new Date(currentMember.last_read_at).getTime() : 0;
    const unreadCount = convMsgs.filter(
      (m) => m.sender_id !== currentUserId && new Date(m.created_at).getTime() > lastReadTime
    ).length;


    // For direct chats: the 'user' is the other person
    // For group chats: the 'user' object represents the group itself
    let displayUser;
    if (isGroup) {
      displayUser = {
        id: cId,
        name: conv.title || "Group Chat",
        username: (conv.title || "group").toLowerCase().replace(/\s+/g, "_"),
        avatar:
          conv.avatar_url ||
          `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(conv.title || cId)}`,
        isGroup: true,
        membersCount: members.length,
      };
    } else {
      const otherMember = members.find((m) => m.user_id !== currentUserId) || members[0];
      displayUser = otherMember ? formatUser(otherMember) : {
        id: "unknown",
        name: "Traveler",
        username: "traveler",
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=traveler",
        isGroup: false,
      };
    }

    const lastMsg = lastMsgRow
      ? {
          id: lastMsgRow.message_id,
          senderId: lastMsgRow.sender_id,
          senderName:
            [lastMsgRow.first_name, lastMsgRow.last_name].filter(Boolean).join(" ") ||
            lastMsgRow.sender_username ||
            "Traveler",
          text: lastMsgRow.message_text,
          mediaUrl: lastMsgRow.media_url,
          type: lastMsgRow.message_type,
          createdAt: lastMsgRow.created_at,
          time: new Date(lastMsgRow.created_at).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        }
      : null;

    return {
      id: cId,
      conversationId: cId,
      type: conv.type,
      isGroup,
      title: conv.title,
      avatarUrl: conv.avatar_url,
      user: displayUser,
      members: members.map((m) => ({ ...formatUser(m), role: m.role })),
      messages: [], // messages loaded on-demand via GET /api/chats/:id/messages
      lastMessage: lastMsg,
      unreadCount: unreadCount || 0,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/chats
 * Fetches all conversations (DMs and groups) for the current user
 */
export async function getConversations(req, res) {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId query parameter is required." });
    }

    // Auto-ensure user exists in database so fresh accounts don't trigger 404
    await ensureUserExists(userId);

    const convRows = await query(
      `SELECT c.*
       FROM conversations c
       INNER JOIN conversation_members cm ON c.conversation_id = cm.conversation_id
       WHERE cm.user_id = ?
       ORDER BY c.updated_at DESC, c.created_at DESC`,
      [userId]
    );

    const chats = await hydrateConversations(convRows, userId);

    res.json({ success: true, chats });
  } catch (error) {
    console.error("Error in getConversations:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/chats/:conversationId/messages
 * Fetches message stream for a specific conversation and updates last_read_at
 */
export async function getMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const { userId, limit = 50, offset = 0 } = req.query;

    // If userId is provided, update read tracker
    if (userId) {
      await query(
        `UPDATE conversation_members SET last_read_at = NOW() WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
      ).catch(() => {});
    }

    const lim = Math.min(parseInt(limit, 10) || 50, 200);
    const off = parseInt(offset, 10) || 0;

    const messagesRaw = await query(
      `SELECT m.*, u.username, u.first_name, u.last_name, u.profile_picture_url
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.user_id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC
       LIMIT ? OFFSET ?`,
      [conversationId, lim, off]
    );

    const messages = messagesRaw.map((m) => ({
      id: m.message_id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      senderName:
        [m.first_name, m.last_name].filter(Boolean).join(" ") ||
        m.username ||
        "Traveler",
      avatar:
        m.profile_picture_url ||
        `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(m.username || m.sender_id)}`,
      senderAvatar:
        m.profile_picture_url ||
        `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(m.username || m.sender_id)}`,
      text: m.message_text,
      mediaUrl: m.media_url,
      type: m.message_type || "text",
      isRead: Boolean(m.is_read),
      createdAt: m.created_at,
      time: new Date(m.created_at).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    res.json({ success: true, messages, hasMore: messages.length === lim });
  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/chats/direct
 * Starts or retrieves an existing 1-on-1 direct message conversation
 */
export async function getOrCreateDM(req, res) {
  try {
    const senderId = req.body.senderId || req.body.userId1 || req.body.userId || req.body.currentUserId;
    const recipientId = req.body.recipientId || req.body.userId2 || req.body.targetUserId || req.body.otherUserId;
    const { senderData } = req.body;

    if (!senderId || !recipientId) {
      return res.status(400).json({ success: false, message: "senderId and recipientId are required." });
    }
    if (senderId === recipientId) {
      return res.status(400).json({ success: false, message: "You cannot start a direct conversation with yourself." });
    }

    if (senderData) await ensureUserExists(senderData);

    // Check if a direct conversation already exists between these 2 users
    const [existing] = await query(
      `SELECT c.conversation_id
       FROM conversations c
       INNER JOIN conversation_members cm1 ON c.conversation_id = cm1.conversation_id AND cm1.user_id = ?
       INNER JOIN conversation_members cm2 ON c.conversation_id = cm2.conversation_id AND cm2.user_id = ?
       WHERE c.type = 'direct'
       LIMIT 1`,
      [senderId, recipientId]
    );

    if (existing) {
      const convRows = await query(
        `SELECT * FROM conversations WHERE conversation_id = ?`,
        [existing.conversation_id]
      );
      const [conversation] = await hydrateConversations(convRows, senderId);
      return res.json({ success: true, conversation, chat: conversation, isNew: false });
    }

    // Verify recipient exists (or ensure default fallback)
    const [recipient] = await query(`SELECT user_id FROM users WHERE user_id = ?`, [recipientId]);
    if (!recipient) {
      // Auto register minimal stub if user exists in Firebase/frontend
      await query(
        `INSERT INTO users (user_id, email, username, first_name, last_name, profile_picture_url)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE user_id=user_id`,
        [recipientId, `${recipientId}@laga.tour`, recipientId, "Traveler", "", `https://api.dicebear.com/7.x/adventurer/svg?seed=${recipientId}`]
      );
    }

    const conversationId = uid("chat");
    await query(
      `INSERT INTO conversations (conversation_id, type, created_by, created_at, updated_at)
       VALUES (?, 'direct', ?, NOW(), NOW())`,
      [conversationId, senderId]
    );

    await query(
      `INSERT INTO conversation_members (member_id, conversation_id, user_id, role, joined_at)
       VALUES (?, ?, ?, 'member', NOW()), (?, ?, ?, 'member', NOW())`,
      [uid("cm"), conversationId, senderId, uid("cm"), conversationId, recipientId]
    );

    const convRows = await query(
      `SELECT * FROM conversations WHERE conversation_id = ?`,
      [conversationId]
    );
    const [conversation] = await hydrateConversations(convRows, senderId);

    res.status(201).json({ success: true, conversation, chat: conversation, isNew: true });
  } catch (error) {
    console.error("Error in getOrCreateDM:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/chats/group
 * Creates a new multi-member group chat
 */
export async function createGroupChat(req, res) {
  try {
    const groupName = req.body.groupName || req.body.name || req.body.title;
    const creator = req.body.creator || req.body.createdBy || req.body.userId || req.body.user;
    const memberIds = req.body.memberIds || req.body.members || [];
    const avatarUrl = req.body.avatarUrl || req.body.avatar;

    if (!groupName || !groupName.trim()) {
      return res.status(400).json({ success: false, message: "Group name is required." });
    }
    if (!creator) {
      return res.status(400).json({ success: false, message: "Creator information is required." });
    }
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ success: false, message: "Please select at least one member to create a group chat." });
    }

    const creatorId = await ensureUserExists(creator);
    const conversationId = uid("chat_group");
    const cleanTitle = groupName.trim();
    const groupAvatar =
      avatarUrl ||
      `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(cleanTitle)}`;

    // Create group conversation
    await query(
      `INSERT INTO conversations (conversation_id, type, title, avatar_url, created_by, created_at, updated_at)
       VALUES (?, 'group', ?, ?, ?, NOW(), NOW())`,
      [conversationId, cleanTitle, groupAvatar, creatorId]
    );

    // Add creator as admin
    await query(
      `INSERT INTO conversation_members (member_id, conversation_id, user_id, role, joined_at)
       VALUES (?, ?, ?, 'admin', NOW())`,
      [uid("cm"), conversationId, creatorId]
    );

    // Add selected members
    const addedMembers = [creatorId];
    for (const rawMember of memberIds) {
      const mId = typeof rawMember === "string" ? rawMember : (rawMember.id || rawMember.user_id);
      if (!mId || mId === creatorId || addedMembers.includes(mId)) continue;
      await ensureUserExists(rawMember);
      await query(
        `INSERT INTO conversation_members (member_id, conversation_id, user_id, role, joined_at)
         VALUES (?, ?, ?, 'member', NOW())
         ON DUPLICATE KEY UPDATE role = VALUES(role)`,
        [uid("cm"), conversationId, mId]
      );
      addedMembers.push(mId);
    }

    // Insert welcome system message
    const systemMsgId = uid("msg");
    const welcomeText = `🎉 Group chat "${cleanTitle}" created with ${addedMembers.length} members!`;
    await query(
      `INSERT INTO messages (message_id, conversation_id, sender_id, message_text, message_type, created_at)
       VALUES (?, ?, ?, ?, 'system', NOW())`,
      [systemMsgId, conversationId, creatorId, welcomeText]
    );

    // Award league points for group creation
    await query(
      `UPDATE users SET league_points = league_points + 25 WHERE user_id = ?`,
      [creatorId]
    ).catch(() => {});

    const convRows = await query(
      `SELECT * FROM conversations WHERE conversation_id = ?`,
      [conversationId]
    );
    const [conversation] = await hydrateConversations(convRows, creatorId);

    // Preload system message so frontend can display immediately
    if (conversation) {
      conversation.messages = [
        {
          id: systemMsgId,
          conversationId,
          senderId: "system",
          senderName: "System",
          text: welcomeText,
          type: "system",
          time: "Just now",
        },
      ];
    }

    res.status(201).json({ success: true, conversation, chat: conversation });
  } catch (error) {
    console.error("Error in createGroupChat:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/chats/:conversationId/messages
 * Sends a message in a conversation and triggers real-time Socket.io broadcast
 */
export async function sendMessage(req, res) {
  try {
    const { conversationId } = req.params;
    const { text, mediaUrl = null, messageType = "text" } = req.body;
    const userPayload = req.body.user || {
      id: req.body.senderId || req.body.userId,
      user_id: req.body.senderId || req.body.userId,
      name: req.body.senderName || "Traveler",
      avatar: req.body.senderAvatar || req.body.avatar,
      username: req.body.username
    };

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Message text cannot be empty." });
    }
    if (text.trim().length > 5000) {
      return res.status(400).json({ success: false, message: "Message cannot exceed 5000 characters." });
    }
    if (!userPayload || (!userPayload.id && !userPayload.user_id)) {
      return res.status(400).json({ success: false, message: "User information is required." });
    }

    const senderId = await ensureUserExists(userPayload);

    // 1. Ensure conversation exists in conversations table (prevents FK violation)
    const [convRow] = await query(
      `SELECT conversation_id FROM conversations WHERE conversation_id = ?`,
      [conversationId]
    );

    if (!convRow) {
      await query(
        `INSERT INTO conversations (conversation_id, type, created_by, created_at, updated_at)
         VALUES (?, 'direct', ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE updated_at = NOW()`,
        [conversationId, senderId]
      );

      // If conversationId is structured as chat_direct_<recipientId>, auto-register recipient
      if (conversationId.startsWith("chat_direct_")) {
        const otherId = conversationId.replace(/^chat_direct_/, "");
        await ensureUserExists(otherId);
        await query(
          `INSERT INTO conversation_members (member_id, conversation_id, user_id, role, joined_at)
           VALUES (?, ?, ?, 'member', NOW())
           ON DUPLICATE KEY UPDATE role = VALUES(role)`,
          [uid("cm"), conversationId, otherId]
        ).catch(() => {});
      }
    }

    // 2. Verify sender is a member of this conversation, or auto-add
    await query(
      `INSERT INTO conversation_members (member_id, conversation_id, user_id, role, joined_at)
       VALUES (?, ?, ?, 'member', NOW())
       ON DUPLICATE KEY UPDATE last_read_at = NOW()`,
      [uid("cm"), conversationId, senderId]
    ).catch(() => {});

    const messageId = uid("msg");
    const cleanText = text.trim();

    // 3. Insert message into messages table
    await query(
      `INSERT INTO messages (message_id, conversation_id, sender_id, message_text, media_url, message_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [messageId, conversationId, senderId, cleanText, mediaUrl, messageType]
    );

    // Update conversation timestamp for inbox sorting
    await query(
      `UPDATE conversations SET updated_at = NOW() WHERE conversation_id = ?`,
      [conversationId]
    );

    // Award active communication points
    await query(
      `UPDATE users SET league_points = league_points + 2 WHERE user_id = ?`,
      [senderId]
    ).catch(() => {});

    const senderName = userPayload.name || userPayload.first_name || userPayload.username || "Traveler";
    const senderAvatar =
      userPayload.avatar ||
      userPayload.profile_picture_url ||
      userPayload.profilePictureUrl ||
      `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userPayload.username || senderId)}`;

    const formattedMessage = {
      id: messageId,
      conversationId,
      senderId,
      senderName,
      senderAvatar,
      avatar: senderAvatar,
      text: cleanText,
      mediaUrl,
      type: messageType,
      createdAt: new Date().toISOString(),
      time: new Date().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // ⚡ Real-time WebSocket Broadcast: notify the conversation room immediately
    emitToConversation(conversationId, "receive_message", formattedMessage);

    // ⚡ Also notify all conversation members on their private user socket rooms
    try {
      const memberRows = await query(
        `SELECT user_id FROM conversation_members WHERE conversation_id = ?`,
        [conversationId]
      );
      for (const m of memberRows) {
        if (m.user_id && m.user_id !== senderId) {
          emitToConversation(`user_${m.user_id}`, "receive_message", formattedMessage);
        }
      }
    } catch (socketErr) {
      console.warn("Socket member broadcast note:", socketErr.message);
    }

    res.status(201).json({
      success: true,
      message: formattedMessage,
    });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/chats/users
 * Live search for travelers to chat with
 */
export async function searchChatUsers(req, res) {
  try {
    const { q = "", currentUserId = "" } = req.query;

    const cleanQ = (q || "").trim().replace(/^@/, "").toLowerCase();
    const searchTerm = `%${cleanQ}%`;

    let querySql = `
      SELECT user_id, username, first_name, last_name, profile_picture_url, bio, league_points
      FROM users
      WHERE (account_status IS NULL OR LOWER(account_status) NOT IN ('blocked', 'suspended', 'deleted', 'banned'))
    `;
    const queryParams = [];

    if (currentUserId && currentUserId !== "___none___") {
      querySql += ` AND user_id != ?`;
      queryParams.push(currentUserId);
    }

    if (cleanQ) {
      querySql += ` AND (
        LOWER(username) LIKE ? OR
        LOWER(first_name) LIKE ? OR
        LOWER(last_name) LIKE ? OR
        LOWER(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) LIKE ? OR
        LOWER(COALESCE(bio, '')) LIKE ?
      )`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    querySql += ` ORDER BY league_points DESC LIMIT 50`;

    const rows = await query(querySql, queryParams);
    const users = (rows || []).map((r) => formatUser(r)).filter(Boolean);

    res.json({ success: true, users });
  } catch (error) {
    console.error("Error in searchChatUsers:", error);
    res.status(500).json({ success: false, message: error.message, users: [] });
  }
}
