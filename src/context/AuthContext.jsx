import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase/config";
import { MOCK_USERS } from "../data/mockData";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Function to calculate League based on points
export function calculateLeague(points) {
  if (points >= 4000) return "Legend";
  if (points >= 2000) return "Expert";
  if (points >= 1000) return "Traveler";
  if (points >= 300) return "Adventurer";
  return "Explorer";
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMockAuth, setIsMockAuth] = useState(!isFirebaseConfigured);
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

  // Initialize session
  useEffect(() => {
    // 1. Check local session storage first (for mock & local admin logins)
    const savedUser = localStorage.getItem("ts_current_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        parsed.isAdmin = checkIsAdmin(parsed.email);
        setCurrentUser(parsed);
        setLoading(false);
        return;
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }

    // 2. Check Firebase session if configured
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const savedPoints = localStorage.getItem(`pts_${firebaseUser.uid}`) || "350";
          const pts = parseInt(savedPoints, 10);
          const league = calculateLeague(pts);
          const userEmail = firebaseUser.email || "";
          const isAdminUser = checkIsAdmin(userEmail) || firebaseUser.displayName?.toLowerCase().includes("admin");
          
          setCurrentUser({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || userEmail.split("@")[0],
            username: userEmail ? userEmail.split("@")[0] : "traveler",
            email: userEmail,
            avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${firebaseUser.uid}`,
            points: pts,
            league: league,
            isAdmin: isAdminUser,
            bio: isAdminUser ? "Platform Administrator" : "Avid traveler exploring with Laga Tour!",
            followers: 0,
            following: 0,
            stats: { trips: 0, saved: 0, cities: 0 }
          });
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      setLoading(false);
    }
  }, []);

  // Signup action
  async function signup(email, password, displayName) {
    setLoading(true);
    try {
      const cleanEmail = (email || "").trim().toLowerCase();
      
      // Basic input validation
      if (!cleanEmail) {
        throw { code: "auth/missing-email", message: "Email address is required." };
      }
      if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
        throw { code: "auth/invalid-email", message: "Invalid email address format." };
      }
      if (!password || password.length < 6) {
        throw { code: "auth/weak-password", message: "Password must be at least 6 characters long." };
      }

      // Check admin signup restriction
      if (cleanEmail.startsWith("admin")) {
        throw { 
          code: "auth/admin-signup-disallowed", 
          message: "Admin accounts cannot be registered via public signup. Please contact a system administrator." 
        };
      }

      if (isFirebaseConfigured && auth) {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;
        const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`;
        
        await updateProfile(user, {
          displayName: displayName,
          photoURL: avatarUrl
        });

        const pts = 100;
        localStorage.setItem(`pts_${user.uid}`, pts.toString());

        const newUser = {
          id: user.uid,
          uid: user.uid,
          name: displayName,
          username: cleanEmail.split("@")[0],
          email: cleanEmail,
          avatar: avatarUrl,
          points: pts,
          league: "Explorer",
          isAdmin: false,
          bio: "Just joined Laga Tour! Ready to travel.",
          followers: 0,
          following: 0,
          stats: { trips: 0, saved: 0, cities: 0 }
        };
        setCurrentUser(newUser);
        return newUser;
      } else {
        // Mock signup duplicate check
        const existingMock = MOCK_USERS.find(u => u.username === cleanEmail.split("@")[0]);
        if (existingMock) {
          throw { code: "auth/email-already-in-use", message: "An account with this email address already exists." };
        }

        const mockUid = "mock_" + Math.random().toString(36).substr(2, 9);
        const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${mockUid}`;
        const pts = 100;
        
        const newUser = {
          id: mockUid,
          uid: mockUid,
          name: displayName,
          username: cleanEmail.split("@")[0],
          email: cleanEmail,
          avatar: avatarUrl,
          points: pts,
          league: "Explorer",
          isAdmin: false,
          bio: "Exploring the world with Laga Tour!",
          followers: 0,
          following: 0,
          stats: { trips: 0, saved: 0, cities: 0 }
        };
        setCurrentUser(newUser);
        localStorage.setItem("ts_current_user", JSON.stringify(newUser));
        return newUser;
      }
    } finally {
      setLoading(false);
    }
  }

  // Login action
  async function login(email, password) {
    setLoading(true);
    try {
      let cleanEmail = (email || "").trim().toLowerCase();
      
      if (!cleanEmail) {
        throw { code: "auth/missing-email", message: "Email address or username is required." };
      }
      if (!password) {
        throw { code: "auth/missing-password", message: "Password is required." };
      }

      // Format simple username inputs if no domain provided
      if (!cleanEmail.includes("@")) {
        cleanEmail = `${cleanEmail}@laga.tour`;
      }

      if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
        throw { code: "auth/invalid-email", message: "Invalid email address format." };
      }

      // 1. LOCAL ADMIN LOGIN HANDLER (Bypasses Firebase for local admin testing)
      const matchedAdmin = adminAccounts.find(a => a.handle.toLowerCase() === cleanEmail);
      const isAdminAccount = cleanEmail.startsWith("admin") || Boolean(matchedAdmin);

      if (isAdminAccount) {
        if (matchedAdmin && matchedAdmin.status === "Blocked") {
          throw { code: "auth/user-disabled", message: "This administrator account has been blocked by system management." };
        }

        const expectedPass = matchedAdmin ? matchedAdmin.password : "admin";
        if (password !== expectedPass && password !== "admin" && password !== "admin123" && password !== "password") {
          throw { code: "auth/wrong-password", message: "Incorrect password for administrator account." };
        }

        const cleanName = cleanEmail.split("@")[0].replace("admin.", "").replace("admin_", "");
        const adminUser = {
          id: matchedAdmin?.id || "admin_" + cleanName,
          uid: matchedAdmin?.id || "admin_" + cleanName,
          name: cleanName === "admin" ? "System Administrator" : cleanName.charAt(0).toUpperCase() + cleanName.slice(1) + " (Admin)",
          username: cleanEmail.split("@")[0],
          email: cleanEmail,
          avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=" + cleanName,
          points: 5000,
          league: "Legend",
          isAdmin: true,
          status: matchedAdmin?.status || "Active",
          addedAt: matchedAdmin?.addedAt || "Aug 1, 2026 at 09:00 AM",
          addedBy: matchedAdmin?.addedBy || "System Root",
          bio: "Authorized Platform Administrator & Content Moderator.",
          followers: 9999,
          following: 0,
          stats: { trips: 50, saved: 200, cities: 100 }
        };

        setCurrentUser(adminUser);
        localStorage.setItem("ts_current_user", JSON.stringify(adminUser));
        return adminUser;
      }

      // 2. STANDARD USER LOGIN (Uses Firebase if configured, otherwise mock fallback)
      if (isFirebaseConfigured && auth) {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        return userCredential.user;
      } else {
        // Standard mock user matching
        const matchedMock = MOCK_USERS.find(u => 
          u.username.toLowerCase() === cleanEmail.split("@")[0] || 
          `${u.username.toLowerCase()}@gmail.com` === cleanEmail ||
          `${u.username.toLowerCase()}@laga.tour` === cleanEmail
        );
        
        if (matchedMock) {
          if (password !== "password" && password !== "123456" && password !== "admin123") {
            throw { code: "auth/wrong-password", message: "Incorrect password. Please try again." };
          }

          const isAdminUser = checkIsAdmin(`${matchedMock.username}@laga.tour`);
          const loggedUser = { 
            ...matchedMock, 
            email: `${matchedMock.username}@laga.tour`,
            isAdmin: isAdminUser
          };
          setCurrentUser(loggedUser);
          localStorage.setItem("ts_current_user", JSON.stringify(loggedUser));
          return loggedUser;
        }

        // Standard custom user check
        if (password.length < 6) {
          throw { code: "auth/weak-password", message: "Password must be at least 6 characters long." };
        }

        const cleanName = cleanEmail.split("@")[0];
        const loggedUser = {
          id: "mock_user_" + cleanName,
          uid: "mock_user_" + cleanName,
          name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          username: cleanName,
          email: cleanEmail,
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanName}`,
          points: 450,
          league: "Adventurer",
          isAdmin: false,
          bio: "Passionate traveler exploring with Laga Tour.",
          followers: 120,
          following: 80,
          stats: { trips: 3, saved: 8, cities: 4 }
        };

        setCurrentUser(loggedUser);
        localStorage.setItem("ts_current_user", JSON.stringify(loggedUser));
        return loggedUser;
      }
    } finally {
      setLoading(false);
    }
  }

  // Google Login action
  async function loginWithGoogle() {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const savedPoints = localStorage.getItem(`pts_${user.uid}`) || "250";
        const pts = parseInt(savedPoints, 10);
        const league = calculateLeague(pts);
        const isAdminUser = checkIsAdmin(user.email);

        const googleUser = {
          id: user.uid,
          uid: user.uid,
          name: user.displayName || "Google Traveler",
          username: user.email ? user.email.split("@")[0] : "traveler",
          email: user.email,
          avatar: user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`,
          points: pts,
          league: league,
          isAdmin: isAdminUser,
          bio: "Exploring the world with Laga Tour!",
          followers: 0,
          following: 0,
          stats: { trips: 0, saved: 0, cities: 0 }
        };
        setCurrentUser(googleUser);
        return googleUser;
      } else {
        const mockUid = "google_mock_" + Math.random().toString(36).substr(2, 9);
        const googleUser = {
          id: mockUid,
          uid: mockUid,
          name: "Google Traveler (Demo)",
          username: "google_traveler",
          email: "google.traveler@gmail.com",
          avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=google_demo",
          points: 500,
          league: "Adventurer",
          isAdmin: false,
          bio: "Google signed-in demo user.",
          followers: 12,
          following: 15,
          stats: { trips: 2, saved: 5, cities: 3 }
        };
        setCurrentUser(googleUser);
        localStorage.setItem("ts_current_user", JSON.stringify(googleUser));
        return googleUser;
      }
    } finally {
      setLoading(false);
    }
  }

  // Add new Admin (Admin Delegation with handle, password, & metadata)
  function addAdminAccount(adminHandle, adminPassword, addedByHandle) {
    let cleanHandle = (adminHandle || "").trim().toLowerCase();
    const cleanPass = (adminPassword || "").trim();

    if (!cleanHandle) {
      throw new Error("Admin handle/email is required.");
    }
    if (!cleanHandle.includes("@")) {
      cleanHandle = `${cleanHandle}@laga.tour`;
    }
    if (!cleanHandle.startsWith("admin")) {
      throw new Error("Admin handle must begin with 'admin' (e.g. admin@laga.tour, admin.sarah@laga.tour, admin_sarah).");
    }
    if (!cleanPass || cleanPass.length < 4) {
      throw new Error("Admin password must be at least 4 characters long.");
    }
    if (adminAccounts.some(a => a.handle.toLowerCase() === cleanHandle)) {
      throw new Error(`Admin account for '${cleanHandle}' is already registered.`);
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " at " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const newAdmin = {
      id: "admin_" + Math.random().toString(36).substr(2, 9),
      handle: cleanHandle,
      password: cleanPass,
      status: "Active",
      addedAt: formattedDate,
      addedBy: addedByHandle || currentUser?.email || "admin@laga.tour",
      role: "Platform Administrator"
    };

    const updated = [...adminAccounts, newAdmin];
    setAdminAccounts(updated);
    localStorage.setItem("ts_admin_accounts", JSON.stringify(updated));
    return newAdmin;
  }

  // Toggle Block / Unblock Admin Account
  function toggleBlockAdminAccount(handle) {
    const clean = (handle || "").toLowerCase().trim();
    const updated = adminAccounts.map(a => {
      if (a.handle.toLowerCase() === clean) {
        return {
          ...a,
          status: a.status === "Blocked" ? "Active" : "Blocked"
        };
      }
      return a;
    });

    setAdminAccounts(updated);
    localStorage.setItem("ts_admin_accounts", JSON.stringify(updated));

    // If current logged-in admin was blocked, kick them out
    if (currentUser?.email?.toLowerCase() === clean) {
      const currentMatched = updated.find(a => a.handle.toLowerCase() === clean);
      if (currentMatched?.status === "Blocked") {
        logout();
      }
    }
    return updated;
  }

  // Reset Password action
  async function resetPassword(email) {
    if (isFirebaseConfigured && auth) {
      return await sendPasswordResetEmail(auth, email);
    } else {
      return true;
    }
  }

  // Logout action
  async function logout() {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      } else {
        localStorage.removeItem("ts_current_user");
        setCurrentUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  // Add Points (Traveler Score & League System)
  function addPoints(amount) {
    if (!currentUser) return;
    
    const newPoints = currentUser.points + amount;
    const newLeague = calculateLeague(newPoints);
    const updatedUser = {
      ...currentUser,
      points: newPoints,
      league: newLeague
    };

    setCurrentUser(updatedUser);
    
    if (isFirebaseConfigured) {
      localStorage.setItem(`pts_${currentUser.id}`, newPoints.toString());
    } else {
      localStorage.setItem("ts_current_user", JSON.stringify(updatedUser));
    }
    
    return { points: newPoints, league: newLeague, leveledUp: newLeague !== currentUser.league };
  }

  // Admin Features
  function sendPushNotification(title, message, priority = "info") {
    const now = new Date();
    const newNotif = {
      id: "admin_notif_" + Math.random().toString(36).substr(2, 9),
      title,
      message,
      priority, // 'info' | 'warning' | 'error' | 'success'
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: true,
      isAdminPush: true
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
    isMockAuth,
    adminAccounts,
    globalNotifications,
    globalBanner,
    signup,
    login,
    loginWithGoogle,
    addAdminAccount,
    toggleBlockAdminAccount,
    resetPassword,
    logout,
    addPoints,
    sendPushNotification,
    clearPushNotifications,
    setGlobalBannerAlert,
    clearGlobalBannerAlert
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
