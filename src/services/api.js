// LagaTour Backend API Client
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Helper to handle fetch responses and throw meaningful errors
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMsg = errorData.message;
      }
    } catch {
      // Ignored
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  /**
   * Health Check
   */
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return await handleResponse(res);
    } catch (err) {
      console.warn("Backend health check failed:", err.message);
      return null;
    }
  },

  // ===================== AUTH & USER PROFILE =====================

  /**
   * Send 6-digit email OTP verification code
   */
  async sendVerificationCode(email, purpose = "signup") {
    const res = await fetch(`${API_BASE_URL}/auth/send-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose })
    });
    return await handleResponse(res);
  },

  /**
   * Verify email OTP code
   */
  async verifyCode(email, code, purpose = "signup") {
    const res = await fetch(`${API_BASE_URL}/auth/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, purpose })
    });
    return await handleResponse(res);
  },

  /**
   * User Signup (requires verified code, stores hashed password in MySQL)
   */
  async signup(name, email, password, code) {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, code })
    });
    return await handleResponse(res);
  },

  /**
   * User Login (authenticates against MySQL hashed password)
   */
  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    return await handleResponse(res);
  },

  /**
   * Forgot Password Reset (using verified 6-digit OTP code)
   */
  async forgotPassword(email, code, newPassword) {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword })
    });
    return await handleResponse(res);
  },

  /**
   * Update User Profile in MySQL
   */
  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData)
    });
    return await handleResponse(res);
  },

  /**
   * Get User Profile from MySQL
   */
  async getUserProfile(userId) {
    const res = await fetch(`${API_BASE_URL}/auth/profile/${userId}`);
    return await handleResponse(res);
  },

  // ===================== POSTS & INTERACTIONS =====================

  /**
   * Fetch all posts from backend MySQL
   */
  async fetchPosts(userId = null, includeHidden = false) {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    if (includeHidden) params.append("includeHidden", "true");

    const url = `${API_BASE_URL}/posts${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url);
    const data = await handleResponse(res);
    return data.posts || [];
  },

  /**
   * Create a new post in MySQL
   */
  async createPost(postPayload) {
    const res = await fetch(`${API_BASE_URL}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postPayload)
    });
    const data = await handleResponse(res);
    return data.post;
  },

  /**
   * Like / Unlike a post
   */
  async likePost(postId, user) {
    const res = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user })
    });
    return await handleResponse(res);
  },

  /**
   * Add a comment to a post
   */
  async commentPost(postId, user, text, parentCommentId = null) {
    const res = await fetch(`${API_BASE_URL}/posts/${postId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, text, parentCommentId })
    });
    const data = await handleResponse(res);
    return data.comment;
  },

  /**
   * Save / Bookmark a post
   */
  async savePost(postId, user) {
    const res = await fetch(`${API_BASE_URL}/posts/${postId}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user })
    });
    return await handleResponse(res);
  },

  /**
   * Share a post (increments shares count)
   */
  async sharePost(postId) {
    const res = await fetch(`${API_BASE_URL}/posts/${postId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    return await handleResponse(res);
  },

  /**
   * Report a post to admin moderation
   */
  async reportPost(postId, user, reason, reporterName = "") {
    const res = await fetch(`${API_BASE_URL}/posts/${postId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, reason, reporterName })
    });
    return await handleResponse(res);
  },

  /**
   * Fetch all moderation reports (for Admin Panel)
   */
  async fetchReports() {
    const res = await fetch(`${API_BASE_URL}/reports`);
    const data = await handleResponse(res);
    return data.reports || [];
  },

  /**
   * Fetch all posts authored by a user
   */
  async getUserPosts(userId, currentUserId = null) {
    const params = new URLSearchParams();
    if (currentUserId) params.append("currentUserId", currentUserId);

    const url = `${API_BASE_URL}/posts/user/${userId}${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url);
    const data = await handleResponse(res);
    return data.posts || [];
  },

  /**
   * Fetch all posts saved/bookmarked by a user from MySQL
   */
  async getSavedPosts(userId) {
    const url = `${API_BASE_URL}/posts/saved/${userId}`;
    const res = await fetch(url);
    const data = await handleResponse(res);
    return data.posts || [];
  },

  /**
   * Update a post in MySQL
   */
  async updatePost(postId, postData) {
    const res = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData)
    });
    return await handleResponse(res);
  },

  /**
   * Permanently delete a post from MySQL
   */
  async deletePost(postId) {
    const res = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: "DELETE"
    });
    return await handleResponse(res);
  },

  /**
   * Update post visibility (Make Private / Public)
   */
  async updatePostVisibility(postId, isPublic) {
    const res = await fetch(`${API_BASE_URL}/posts/${postId}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic })
    });
    return await handleResponse(res);
  },

  /**
   * Dismiss a report
   */
  async dismissReport(reportId) {
    const res = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
      method: "DELETE"
    });
    return await handleResponse(res);
  },

  // ===================== CHAT & MESSAGING =====================

  /**
   * Fetch all conversations for a user
   */
  async fetchUserConversations(userId) {
    const res = await fetch(`${API_BASE_URL}/chats?userId=${encodeURIComponent(userId)}`);
    const data = await handleResponse(res);
    return data.chats || [];
  },

  /**
   * Fetch message history for a conversation
   */
  async fetchChatMessages(conversationId) {
    const res = await fetch(`${API_BASE_URL}/chats/${encodeURIComponent(conversationId)}/messages`);
    const data = await handleResponse(res);
    return data.messages || [];
  },

  /**
   * Get or create 1-on-1 direct chat
   */
  async getOrCreateDirectChat(userId1, userId2) {
    const res = await fetch(`${API_BASE_URL}/chats/direct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId1, userId2 })
    });
    const data = await handleResponse(res);
    return data.chat;
  },

  /**
   * Create a new group chat
   */
  async createGroupChat(groupData) {
    const res = await fetch(`${API_BASE_URL}/chats/group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(groupData)
    });
    const data = await handleResponse(res);
    return data.chat;
  },

  /**
   * Send a message to a conversation
   */
  async sendChatMessage(conversationId, messageData) {
    const res = await fetch(`${API_BASE_URL}/chats/${encodeURIComponent(conversationId)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messageData)
    });
    const data = await handleResponse(res);
    return data.message;
  }
};

export default api;

