import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

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

  const checkIsAdmin = (email) => {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    return clean.startsWith("admin") || adminAccounts.some(a => a.handle.toLowerCase() === clean);
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
          const freshUser = {
            ...currentUser,
            ...res.user,
            name: [res.user.firstName, res.user.lastName].filter(Boolean).join(" ") || res.user.name || currentUser.name,
            avatar: res.user.avatar || res.user.profilePictureUrl || currentUser.avatar,
            isAdmin: checkIsAdmin(res.user.email) || res.user.isAdmin
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
        const freshUser = {
          ...currentUser,
          ...res.user,
          name: [res.user.firstName, res.user.lastName].filter(Boolean).join(" ") || res.user.name || currentUser.name,
          avatar: res.user.avatar || res.user.profilePictureUrl || currentUser.avatar,
          isAdmin: checkIsAdmin(res.user.email) || res.user.isAdmin
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
      const userWithAdmin = {
        ...res.user,
        isAdmin: checkIsAdmin(res.user.email)
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
    // 1. Check local admin accounts first if logging in as admin
    const cleanEmail = email.toLowerCase().trim();
    const matchedAdmin = adminAccounts.find(a => a.handle.toLowerCase() === cleanEmail && a.password === password);
    
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
        stats: { trips: 50, saved: 20, cities: 10 }
      };
      setCurrentUser(adminUser);
      localStorage.setItem("ts_current_user", JSON.stringify(adminUser));
      return adminUser;
    }

    // 2. Authenticate against MySQL backend
    const res = await api.login(email, password);
    if (res && res.user) {
      const userWithAdmin = {
        ...res.user,
        isAdmin: checkIsAdmin(res.user.email) || res.user.isAdmin
      };
      setCurrentUser(userWithAdmin);
      localStorage.setItem("ts_current_user", JSON.stringify(userWithAdmin));
      return userWithAdmin;
    }

    throw new Error(res?.message || "Invalid credentials.");
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

  const value = {
    currentUser,
    loading,
    adminAccounts,
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
