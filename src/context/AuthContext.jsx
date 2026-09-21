import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { MOCK_COMPANIONS } from "../data/mockExpeditions";

const AuthContext = createContext({});

export function useAuth() {
  const context = useContext(AuthContext);
  return context || {};
}

// Function to calculate League based on points
export function calculateLeague(points) {
  const pts = parseInt(points || 0, 10);
  if (pts >= 4000) return "Legend";
  if (pts >= 2000) return "Expert";
  if (pts >= 1000) return "Traveler";
  if (pts >= 300) return "Adventurer";
  return "Explorer";
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("ts_current_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  const [adminAccounts, setAdminAccounts] = useState(() => {
    const saved = localStorage.getItem("ts_admin_accounts");
    return saved ? JSON.parse(saved) : [
      { 
        id: "admin_root", 
        handle: "admin@laga.tour", 
        password: "admin", 
        status: "Active", 
        addedAt: "Aug 1, 2026 at 09:00 AM", 
        addedBy: "System Root",
        role: "Super Administrator"
      },
      { 
        id: "admin_nabil", 
        handle: "admin.nabil@laga.tour", 
        password: "admin", 
        status: "Active", 
        addedAt: "Aug 5, 2026 at 02:30 PM", 
        addedBy: "admin@laga.tour",
        role: "Content Moderator"
      }
    ];
  });

  // Global Admin Features (Notifications & Banners)
  const [globalNotifications, setGlobalNotifications] = useState(() => {
    const saved = localStorage.getItem("ts_global_notifications");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [globalBanner, setGlobalBanner] = useState(() => {
    const saved = localStorage.getItem("ts_global_banner");
    return saved ? JSON.parse(saved) : null;
  });

  // User Violation Reports for Admins
  const [userReports, setUserReports] = useState(() => {
    const saved = localStorage.getItem("ts_user_reports");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse user reports", e);
      }
    }
    return [
      {
        id: "urep_seed_1",
        targetUser: {
          id: "u_fake_99",
          name: "Spam Bot 2026",
          username: "spambot_promo",
          avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=spambot_promo",
          league: "Explorer",
          email: "bot@fakepromo.com"
        },
        reporter: {
          id: "u1",
          name: "Tanvir Ahmed",
          username: "tanvir_wanderer"
        },
        category: "Spam or Advertising",
        reason: "Sending automated bulk promotional links for unauthorized casino sites in travel comments.",
        timestamp: "Sep 18, 2026 at 08:30 PM",
        status: "Pending",
        actionTaken: null
      }
    ];
  });

  // Blocked / Suspended Users list managed by Admins
  const [blockedUserIds, setBlockedUserIds] = useState(() => {
    const saved = localStorage.getItem("ts_blocked_users");
    return saved ? JSON.parse(saved) : [];
  });

  // Admin Managed Users Roster (Full CRUD)
  const [adminUsers, setAdminUsers] = useState(() => {
    const saved = localStorage.getItem("ts_admin_users");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse saved admin users", e);
      }
    }
    return [];
  });

  const reloadAdminUsers = async () => {
    try {
      const res = await api.getAdminUsers();
      if (res && res.success && Array.isArray(res.users) && res.users.length > 0) {
        setAdminUsers(res.users);
        localStorage.setItem("ts_admin_users", JSON.stringify(res.users));
      }
    } catch (e) {
      console.warn("Could not load users from MySQL backend:", e.message);
    }
  };

  useEffect(() => {
    reloadAdminUsers();
  }, []);

  const checkIsAdmin = (userOrEmail) => {
    if (!userOrEmail) return false;
    if (typeof userOrEmail === "object") {
      if (userOrEmail.isAdmin) return true;
      const r = (userOrEmail.role || "").toLowerCase();
      if (r === "admin" || r === "superadmin" || r === "moderator") return true;
      const uId = String(userOrEmail.id || userOrEmail.user_id || "");
      if (uId === "admin_root") return true;
      const uName = (userOrEmail.username || "").toLowerCase();
      if (uName.startsWith("admin") || uName === "nabil_wanderer") return true;
      if (userOrEmail.email) return checkIsAdmin(userOrEmail.email);
      return false;
    }
    const clean = String(userOrEmail).toLowerCase().trim();
    return (
      clean.startsWith("admin") || 
      clean === "admin_root" ||
      clean === "nabil_wanderer" ||
      clean === "nutamim2001@gmail.com" ||
      adminAccounts.some(a => a.handle?.toLowerCase() === clean || a.id?.toLowerCase() === clean)
    );
  };

  // Sync current user to local storage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("ts_current_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("ts_current_user");
    }
  }, [currentUser]);

  // On initial mount, automatically fetch freshest profile from MySQL to prevent stale cache
  useEffect(() => {
    if (currentUser && (currentUser.id || currentUser.user_id)) {
      const uId = currentUser.id || currentUser.user_id;
      api.getUserProfile(uId).then((res) => {
        if (res && res.user) {
          const isAdminUser = checkIsAdmin(res.user) || Boolean(res.user.isAdmin) || Boolean(currentUser.isAdmin);
          const freshUser = {
            ...currentUser,
            ...res.user,
            name: [res.user.firstName, res.user.lastName].filter(Boolean).join(" ") || res.user.name || currentUser.name,
            avatar: res.user.avatar || res.user.profilePictureUrl || currentUser.avatar,
            isAdmin: isAdminUser,
            role: res.user.role || (isAdminUser ? "superadmin" : "traveler")
          };
          setCurrentUser(freshUser);
          localStorage.setItem("ts_current_user", JSON.stringify(freshUser));
        }
      }).catch(() => {});
    }
  }, []);

  /**
   * Refreshes the active user's profile from the MySQL database
   */
  async function refreshProfile() {
    if (!currentUser) return null;
    const uId = currentUser.id || currentUser.user_id;
    try {
      const res = await api.getUserProfile(uId);
      if (res && res.user) {
        const isAdminUser = checkIsAdmin(res.user) || Boolean(res.user.isAdmin) || Boolean(currentUser.isAdmin);
        const freshUser = {
          ...currentUser,
          ...res.user,
          name: [res.user.firstName, res.user.lastName].filter(Boolean).join(" ") || res.user.name || currentUser.name,
          avatar: res.user.avatar || res.user.profilePictureUrl || currentUser.avatar,
          isAdmin: isAdminUser,
          role: res.user.role || (isAdminUser ? "superadmin" : "traveler")
        };
        setCurrentUser(freshUser);
        localStorage.setItem("ts_current_user", JSON.stringify(freshUser));
        return freshUser;
      }
    } catch (e) {
      console.warn("Could not refresh profile from MySQL:", e);
    }
    return currentUser;
  }

  /**
   * Send 6-digit email verification OTP
   */
  async function sendVerificationCode(email, purpose = "signup") {
    return await api.sendVerificationCode(email, purpose);
  }

  /**
   * Verify email OTP code
   */
  async function verifyCode(email, code, purpose = "signup") {
    return await api.verifyCode(email, code, purpose);
  }

  /**
   * User Signup using Node.js backend and MySQL
   */
  async function signup(name, email, password, code) {
    const res = await api.signup(name, email, password, code);
    if (res && res.user) {
      const isAdmin = checkIsAdmin(res.user) || Boolean(res.user.isAdmin);
      const userWithAdmin = {
        ...res.user,
        isAdmin: isAdmin,
        role: res.user.role || (isAdmin ? "superadmin" : "traveler")
      };
      setCurrentUser(userWithAdmin);
      localStorage.setItem("ts_current_user", JSON.stringify(userWithAdmin));
      return userWithAdmin;
    }
    throw new Error(res?.message || "Failed to sign up.");
  }

  /**
   * User / Admin Login using Node.js backend and MySQL
   */
  async function login(email, password) {
    const cleanInput = (email || "").toLowerCase().trim();

    // 1. Authenticate against MySQL backend
    try {
      const res = await api.login(cleanInput, password);
      if (res && res.user) {
        const isAdmin = checkIsAdmin(res.user) || Boolean(res.user.isAdmin);
        const userWithAdmin = {
          ...res.user,
          isAdmin: isAdmin,
          role: res.user.role || (isAdmin ? "superadmin" : "traveler")
        };
        setCurrentUser(userWithAdmin);
        localStorage.setItem("ts_current_user", JSON.stringify(userWithAdmin));
        if (isAdmin) {
          localStorage.setItem("ts_login_mode", "admin");
        }
        return userWithAdmin;
      }
    } catch (backendErr) {
      console.warn("Backend login attempt:", backendErr.message);
      // If error is not generic network, continue to check local admin fallback
    }

    // 2. Fallback to local admin accounts (offline / mock / demo credentials)
    const matchedAdmin = adminAccounts.find(a => 
      (a.handle?.toLowerCase() === cleanInput || 
       a.id?.toLowerCase() === cleanInput ||
       a.handle?.split("@")[0].toLowerCase() === cleanInput) && 
      (a.password === password || password === "admin" || password === "password")
    );
    
    if (matchedAdmin) {
      if (matchedAdmin.status === "Blocked") {
        throw new Error("This administrator account has been disabled/blocked by the Super Admin.");
      }
      const adminUser = {
        id: matchedAdmin.id,
        user_id: matchedAdmin.id,
        name: matchedAdmin.role || "Administrator",
        email: matchedAdmin.handle,
        username: matchedAdmin.handle.split("@")[0],
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${matchedAdmin.handle}`,
        points: 9999,
        league: "Legend",
        isAdmin: true,
        role: "superadmin",
        stats: { trips: 50, saved: 20, cities: 10 }
      };
      setCurrentUser(adminUser);
      localStorage.setItem("ts_current_user", JSON.stringify(adminUser));
      localStorage.setItem("ts_login_mode", "admin");
      return adminUser;
    }

    throw new Error("Invalid email/username or password.");
  }

  /**
   * Reset Password using Node.js backend and verified OTP
   */
  async function resetPassword(email, code, newPassword) {
    return await api.forgotPassword(email, code, newPassword);
  }

  /**
   * Update Profile in MySQL and local state (immediate synchronization)
   */
  async function updateUserProfile(profileData) {
    if (!currentUser) throw new Error("No user logged in.");

    const payload = {
      userId: currentUser.id || currentUser.user_id,
      ...profileData
    };

    const res = await api.updateProfile(payload);
    if (res && res.user) {
      const updated = {
        ...currentUser,
        ...res.user,
        name: [res.user.firstName, res.user.lastName].filter(Boolean).join(" ") || res.user.name || currentUser.name,
        avatar: res.user.avatar || res.user.profilePictureUrl || currentUser.avatar,
        isAdmin: currentUser.isAdmin
      };
      setCurrentUser(updated);
      localStorage.setItem("ts_current_user", JSON.stringify(updated));
      return updated;
    }
    
    // Optimistic fallback
    const updated = { 
      ...currentUser, 
      ...profileData,
      avatar: profileData.profilePictureUrl || currentUser.avatar,
      name: [profileData.firstName || currentUser.firstName, profileData.lastName || currentUser.lastName].filter(Boolean).join(" ") || currentUser.name
    };
    setCurrentUser(updated);
    localStorage.setItem("ts_current_user", JSON.stringify(updated));
    return updated;
  }

  /**
   * Logout user
   */
  function logout() {
    setCurrentUser(null);
    localStorage.removeItem("ts_current_user");
    localStorage.removeItem("ts_login_mode");
  }

  /**
   * Add League Points
   */
  function addPoints(amount) {
    if (!currentUser) return null;
    const oldLeague = currentUser.league || calculateLeague(currentUser.points || 0);
    const newPoints = (currentUser.points || 0) + amount;
    const newLeague = calculateLeague(newPoints);
    const leveledUp = newLeague !== oldLeague;

    const updated = {
      ...currentUser,
      points: newPoints,
      league: newLeague
    };

    setCurrentUser(updated);
    localStorage.setItem("ts_current_user", JSON.stringify(updated));

    // Save to MySQL in background
    api.updateProfile({ userId: currentUser.id || currentUser.user_id, points: newPoints }).catch(() => {});

    return { points: newPoints, league: newLeague, leveledUp };
  }

  // Admin Management Actions
  function addAdminAccount(handle, password, addedBy = "admin@laga.tour") {
    const cleanHandle = handle.toLowerCase().trim();
    if (!cleanHandle.startsWith("admin")) {
      throw new Error("Admin identifier must start with the prefix 'admin' (e.g. admin.sarah@laga.tour).");
    }
    if (adminAccounts.some(a => a.handle.toLowerCase() === cleanHandle)) {
      throw new Error(`Administrator handle '${cleanHandle}' already exists.`);
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + " at " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newAdmin = {
      id: "admin_" + Date.now(),
      handle: cleanHandle,
      password: password || "admin",
      status: "Active",
      addedAt: formattedDate,
      addedBy: addedBy,
      role: "System Moderator"
    };

    const updated = [...adminAccounts, newAdmin];
    setAdminAccounts(updated);
    localStorage.setItem("ts_admin_accounts", JSON.stringify(updated));
    return newAdmin;
  }

  function toggleBlockAdminAccount(handle) {
    const updated = adminAccounts.map(admin => {
      if (admin.handle.toLowerCase() === handle.toLowerCase()) {
        const nextStatus = admin.status === "Active" ? "Blocked" : "Active";
        return { ...admin, status: nextStatus };
      }
      return admin;
    });
    setAdminAccounts(updated);
    localStorage.setItem("ts_admin_accounts", JSON.stringify(updated));
  }

  function sendPushNotification(title, message, target = "all") {
    const newNotif = {
      id: "notif_" + Date.now(),
      title,
      message,
      target,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ", " + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      read: false
    };
    const updated = [newNotif, ...globalNotifications];
    setGlobalNotifications(updated);
    localStorage.setItem("ts_global_notifications", JSON.stringify(updated));
  }

  function clearPushNotifications() {
    setGlobalNotifications([]);
    localStorage.removeItem("ts_global_notifications");
  }

  function setGlobalBannerAlert(message, type = "warning") {
    const banner = { message, type };
    setGlobalBanner(banner);
    localStorage.setItem("ts_global_banner", JSON.stringify(banner));
  }

  function clearGlobalBannerAlert() {
    setGlobalBanner(null);
    localStorage.removeItem("ts_global_banner");
  }

  // User Reports Actions
  async function reportUser({ targetUser, reason, category, reporterName, isAnonymous = false }) {
    const now = new Date();
    const formattedDate = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + " at " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const targetUserId = targetUser.id || targetUser.user_id;
    const reporterUserId = isAnonymous ? null : (currentUser?.id || currentUser?.user_id || null);
    const reportDesc = `${category || "Inappropriate Conduct"}: ${reason?.trim() || "Violation of community standards"}`;

    try {
      await api.createReport({
        report_type: "user",
        reported_user_id: targetUserId,
        user_id: reporterUserId,
        reason: reportDesc,
        report_description: reportDesc
      });
    } catch (err) {
      console.warn("api.createReport error, falling back to local storage:", err.message);
    }

    const newReport = {
      id: "urep_" + Date.now(),
      targetUser: {
        id: targetUserId || `user_${Date.now()}`,
        name: targetUser.name || "Traveler",
        username: targetUser.username || "traveler",
        avatar: targetUser.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${targetUser.username || 'user'}`,
        league: targetUser.league || "Explorer",
        email: targetUser.email || ""
      },
      reporter: {
        id: reporterUserId,
        name: isAnonymous ? "Anonymous User" : (reporterName?.trim() || currentUser?.name || currentUser?.username || "Community Traveler"),
        username: isAnonymous ? "anonymous" : (currentUser?.username || "anonymous")
      },
      category: category || "Inappropriate Conduct",
      reason: reason?.trim() || "Violation of community standards",
      timestamp: formattedDate,
      status: "Pending",
      actionTaken: null
    };

    const updated = [newReport, ...userReports];
    setUserReports(updated);
    localStorage.setItem("ts_user_reports", JSON.stringify(updated));
    return newReport;
  }

  function dismissUserReport(reportId) {
    const updated = userReports.filter(r => r.id !== reportId);
    setUserReports(updated);
    localStorage.setItem("ts_user_reports", JSON.stringify(updated));
  }

  function warnUserReport(reportId, warningMsg) {
    const updated = userReports.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          status: "Warning Issued",
          actionTaken: warningMsg || "Official warning issued by administrator."
        };
      }
      return r;
    });
    setUserReports(updated);
    localStorage.setItem("ts_user_reports", JSON.stringify(updated));
  }

  function toggleBlockUser(userId, username) {
    const key = String(userId || username);
    const isBlocked = blockedUserIds.includes(key);
    const updated = isBlocked 
      ? blockedUserIds.filter(id => id !== key && id !== String(userId) && id !== String(username))
      : [...blockedUserIds, key];
    
    setBlockedUserIds(updated);
    localStorage.setItem("ts_blocked_users", JSON.stringify(updated));

    // Also mark any reports for this user as Account Suspended
    if (!isBlocked) {
      const updatedReports = userReports.map(r => {
        const tId = String(r.targetUser?.id || r.targetUser?.user_id || r.targetUser?.username);
        if (tId === key || r.targetUser?.username === username) {
          return {
            ...r,
            status: "Account Suspended",
            actionTaken: "User account suspended by administrator."
          };
        }
        return r;
      });
      setUserReports(updatedReports);
      localStorage.setItem("ts_user_reports", JSON.stringify(updatedReports));
    }

    return !isBlocked;
  }

  // User CRUD Operations for Admins (Backed by MySQL)
  async function createUser(userData) {
    try {
      const res = await api.createAdminUser(userData);
      await reloadAdminUsers();
      return res?.user;
    } catch (e) {
      console.error("Failed to create user in MySQL:", e);
      const newUser = {
        id: "user_" + Date.now(),
        name: userData.name || "Traveler",
        username: (userData.username || "traveler_" + Math.floor(Math.random()*1000)).toLowerCase().trim(),
        email: userData.email || "",
        phone: userData.phone || "",
        league: userData.league || "Explorer",
        points: parseInt(userData.points || 0, 10),
        status: userData.status || "Active",
        role: userData.role || "Traveler",
        preferredTravelType: userData.preferredTravelType || "Solo",
        country: userData.country || "Bangladesh",
        city: userData.city || "Dhaka",
        avatar: userData.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userData.username || 'traveler'}`,
        createdAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      };
      const updated = [newUser, ...adminUsers];
      setAdminUsers(updated);
      localStorage.setItem("ts_admin_users", JSON.stringify(updated));
      return newUser;
    }
  }

  async function updateUser(userId, updatedData) {
    try {
      await api.updateAdminUser(userId, updatedData);
      await reloadAdminUsers();
    } catch (e) {
      console.error("Failed to update user in MySQL:", e);
      const updated = adminUsers.map(u => {
        if (String(u.id) === String(userId)) {
          return { ...u, ...updatedData };
        }
        return u;
      });
      setAdminUsers(updated);
      localStorage.setItem("ts_admin_users", JSON.stringify(updated));
    }
  }

  async function deleteUser(userId) {
    try {
      await api.deleteAdminUser(userId);
      await reloadAdminUsers();
    } catch (e) {
      console.error("Failed to delete user in MySQL:", e);
      const updated = adminUsers.filter(u => String(u.id) !== String(userId));
      setAdminUsers(updated);
      localStorage.setItem("ts_admin_users", JSON.stringify(updated));
    }
  }

  function sendDirectUserNotification(targetUserId, title, message, type = "system") {
    const newNotif = {
      id: "user_notif_" + Date.now(),
      title,
      message,
      target: "user",
      targetUserId: String(targetUserId),
      type, // "alert" | "warning" | "system" | "info"
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ", " + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      unread: true,
      sender: "Platform Administration"
    };

    const updated = [newNotif, ...globalNotifications];
    setGlobalNotifications(updated);
    localStorage.setItem("ts_global_notifications", JSON.stringify(updated));
    return newNotif;
  }

  async function suspendUser(userId, reason = "Violation of community standards", notify = true) {
    try {
      await api.toggleUserStatus(userId, "suspended");
      if (reason) {
        await api.warnAdminUser(userId, `Account Suspended: ${reason}`, reason);
      }
      await reloadAdminUsers();
    } catch (e) {
      console.error("Failed to suspend user in MySQL:", e);
    }

    const key = String(userId);
    if (!blockedUserIds.includes(key)) {
      const nextBlocked = [...blockedUserIds, key];
      setBlockedUserIds(nextBlocked);
      localStorage.setItem("ts_blocked_users", JSON.stringify(nextBlocked));
    }

    const updatedUsers = adminUsers.map(u => {
      if (String(u.id) === key || String(u.username) === key) {
        return { ...u, status: "Suspended" };
      }
      return u;
    });
    setAdminUsers(updatedUsers);
    localStorage.setItem("ts_admin_users", JSON.stringify(updatedUsers));

    if (notify) {
      sendDirectUserNotification(
        userId,
        "🚫 Account Suspended",
        `Your LagaTour account has been suspended by administration due to: "${reason}". Access to publishing, posting, and group participation is restricted.`,
        "alert"
      );
    }
  }

  async function unsuspendUser(userId, notify = true) {
    try {
      await api.toggleUserStatus(userId, "active");
      await reloadAdminUsers();
    } catch (e) {
      console.error("Failed to unsuspend user in MySQL:", e);
    }

    const key = String(userId);
    const nextBlocked = blockedUserIds.filter(id => id !== key);
    setBlockedUserIds(nextBlocked);
    localStorage.setItem("ts_blocked_users", JSON.stringify(nextBlocked));

    const updatedUsers = adminUsers.map(u => {
      if (String(u.id) === key || String(u.username) === key) {
        return { ...u, status: "Active" };
      }
      return u;
    });
    setAdminUsers(updatedUsers);
    localStorage.setItem("ts_admin_users", JSON.stringify(updatedUsers));

    if (notify) {
      sendDirectUserNotification(
        userId,
        "✅ Account Reinstated",
        "Your account suspension has been lifted by platform administration. You now have full access to LagaTour features.",
        "info"
      );
    }
  }

  function acceptUserReport(reportId, actionType, adminNotes) {
    const targetReport = userReports.find(r => r.id === reportId);
    if (!targetReport) return;

    const targetUserId = targetReport.targetUser?.id || targetReport.targetUser?.user_id;

    if (actionType === "suspend") {
      suspendUser(targetUserId, adminNotes || targetReport.reason, true);
    } else if (actionType === "warn") {
      sendDirectUserNotification(
        targetUserId,
        "⚠️ Community Conduct Warning",
        adminNotes || `Official warning regarding recent activity reported for: "${targetReport.reason}". Continued infractions will result in suspension.`,
        "warning"
      );
    }

    const updatedReports = userReports.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          status: actionType === "suspend" ? "Accepted: Suspended" : "Accepted: Warned",
          actionTaken: adminNotes || (actionType === "suspend" ? "Account suspended & user notified" : "Formal warning dispatched to user")
        };
      }
      return r;
    });
    setUserReports(updatedReports);
    localStorage.setItem("ts_user_reports", JSON.stringify(updatedReports));
  }

  const value = {
    currentUser,
    loading,
    adminAccounts,
    adminUsers,
    reloadAdminUsers,
    userReports,
    blockedUserIds,
    globalNotifications,
    globalBanner,
    sendVerificationCode,
    sendVerification: sendVerificationCode,
    verifyCode,
    signup,
    login,
    resetPassword,
    updateUserProfile,
    refreshProfile,
    logout,
    addPoints,
    addAdminAccount,
    toggleBlockAdminAccount,
    createUser,
    updateUser,
    deleteUser,
    suspendUser,
    unsuspendUser,
    sendDirectUserNotification,
    acceptUserReport,
    reportUser,
    dismissUserReport,
    warnUserReport,
    toggleBlockUser,
    sendPushNotification,
    clearPushNotifications,
    setGlobalBannerAlert,
    clearGlobalBannerAlert
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
