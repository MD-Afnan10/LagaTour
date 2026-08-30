import { query } from "../config/db.js";
import { emitToConversation } from "../services/socketService.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Ensures a user exists in the MySQL database (handles first-time Firebase users)
 */
async function ensureUserExists(userData) {
  if (!userData) return null;
  const userId = userData.id || userData.user_id;
  if (!userId) return null;

  const username =
    userData.username ||
    (userData.name || "traveler").toLowerCase().replace(/\s+/g, "_");
  const email = userData.email || `${username}@laga.tour`;
  const nameParts = (userData.name || username).split(" ");
  const firstName = nameParts[0] || "Traveler";
  const lastName = nameParts.slice(1).join(" ") || "";
  const avatar =
    userData.avatar ||
    userData.profile_picture_url ||
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`;
  const points = userData.points || userData.league_points || 350;

  try {
    await query(
      `INSERT INTO users (user_id, email, username, first_name, last_name, profile_picture_url, league_points)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         profile_picture_url = VALUES(profile_picture_url),
         league_points = VALUES(league_points)`,
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

    // Verify user exists
    const [userRow] = await query(`SELECT user_id FROM users WHERE user_id = ?`, [userId]);
    if (!userRow) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

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

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId query parameter is required." });
    }

    // Verify user is a member of this conversation
    const [member] = await query(
      `SELECT member_id FROM conversation_members WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, userId]
    );
    if (!member) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant of this conversation.",
      });
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

    // Update last_read_at for this member
    await query(
      `UPDATE conversation_members SET last_read_at = NOW() WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, userId]
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
        `https://api.dicebear.com/7.x/adventurer/svg?seed=${m.username || m.sender_id}`,
      text: m.message_text,
      mediaUrl: m.media_url,
      type: m.message_type || "text",
      isRead: Boolean(m.is_read),
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
    const { senderId, recipientId, senderData } = req.body;

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
      return res.json({ success: true, conversation, isNew: false });
    }

    // Verify recipient exists
    const [recipient] = await query(`SELECT user_id FROM users WHERE user_id = ?`, [recipientId]);
    if (!recipient) {
      return res.status(404).json({ success: false, message: "Recipient user not found." });
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

    res.status(201).json({ success: true, conversation, isNew: true });
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
    const { creator, groupName, memberIds = [], avatarUrl } = req.body;

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
    for (const mId of memberIds) {
      if (mId === creatorId || addedMembers.includes(mId)) continue;
      const [uRow] = await query(`SELECT user_id FROM users WHERE user_id = ?`, [mId]);
      if (uRow) {
        await query(
          `INSERT INTO conversation_members (member_id, conversation_id, user_id, role, joined_at)
           VALUES (?, ?, ?, 'member', NOW())`,
          [uid("cm"), conversationId, mId]
        );
        addedMembers.push(mId);
      }
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
    );

    const convRows = await query(
      `SELECT * FROM conversations WHERE conversation_id = ?`,
      [conversationId]
    );
    const [conversation] = await hydrateConversations(convRows, creatorId);

    // Preload system message so frontend can display immediately
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

    res.status(201).json({ success: true, conversation });
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
    const { user, text, mediaUrl = null, messageType = "text" } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Message text cannot be empty." });
    }
    if (text.trim().length > 5000) {
      return res.status(400).json({ success: false, message: "Message cannot exceed 5000 characters." });
    }
    if (!user) {
      return res.status(400).json({ success: false, message: "User information is required." });
    }

    const senderId = await ensureUserExists(user);

    // Verify sender is a member of this conversation
    const [member] = await query(
      `SELECT member_id FROM conversation_members WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, senderId]
    );
    if (!member) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant of this conversation.",
      });
    }

    const messageId = uid("msg");
    const cleanText = text.trim();

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
    );

    const formattedMessage = {
      id: messageId,
      conversationId,
      senderId,
      senderName: user.name || "Traveler",
      avatar: user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username || senderId}`,
      text: cleanText,
      mediaUrl,
      type: messageType,
      time: new Date().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // ⚡ Real-time WebSocket Broadcast: notify everyone in the room immediately
    emitToConversation(conversationId, "receive_message", formattedMessage);

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
    const { q = "", currentUserId } = req.query;

    const searchTerm = `%${q.trim()}%`;
    const rows = await query(
      `SELECT user_id, username, first_name, last_name, profile_picture_url, bio, league_points
       FROM users
       WHERE account_status = 'active'
         AND user_id != ?
         AND (
           username LIKE ? OR
           first_name LIKE ? OR
           last_name LIKE ? OR
           bio LIKE ?
         )
       ORDER BY league_points DESC
       LIMIT 20`,
      [currentUserId || "___none___", searchTerm, searchTerm, searchTerm, searchTerm]
    );

    const users = rows.map((r) => formatUser(r));
    res.json({ success: true, users });
  } catch (error) {
    console.error("Error in searchChatUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
