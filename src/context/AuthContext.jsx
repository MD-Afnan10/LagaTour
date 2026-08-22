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

  // Initialize session
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          // Retrieve extra fields from local storage or set defaults
          const savedPoints = localStorage.getItem(`pts_${firebaseUser.uid}`) || "350";
          const pts = parseInt(savedPoints, 10);
          const league = calculateLeague(pts);
          
          setCurrentUser({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
            username: firebaseUser.email ? firebaseUser.email.split("@")[0] : "traveler",
            email: firebaseUser.email,
            avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${firebaseUser.uid}`,
            points: pts,
            league: league,
            bio: "Avid traveler exploring with Laga Tour!",
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
      // Mock Auth Initialization
      const savedUser = localStorage.getItem("ts_current_user");
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Failed to parse saved user", e);
        }
      }
      setLoading(false);
    }
  }, []);

  // Signup action
  async function signup(email, password, displayName) {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`;
        
        await updateProfile(user, {
          displayName: displayName,
          photoURL: avatarUrl
        });

        const pts = 100; // Starting bonus points
        localStorage.setItem(`pts_${user.uid}`, pts.toString());

        const newUser = {
          id: user.uid,
          uid: user.uid,
          name: displayName,
          username: email.split("@")[0],
          email: email,
          avatar: avatarUrl,
          points: pts,
          league: "Explorer",
          bio: "Just joined Laga Tour! Ready to travel.",
          followers: 0,
          following: 0,
          stats: { trips: 0, saved: 0, cities: 0 }
        };
        setCurrentUser(newUser);
        return newUser;
      } else {
        // Mock signup
        const mockUid = "mock_" + Math.random().toString(36).substr(2, 9);
        const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${mockUid}`;
        const pts = 100;
        
        const newUser = {
          id: mockUid,
          uid: mockUid,
          name: displayName,
          username: email.split("@")[0],
          email: email,
          avatar: avatarUrl,
          points: pts,
          league: "Explorer",
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
      if (isFirebaseConfigured && auth) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
      } else {
        // Mock login: match in mock users or allow any standard email
        const matchedMock = MOCK_USERS.find(u => u.username + "@gmail.com" === email.toLowerCase() || u.username === email.toLowerCase());
        
        let loggedUser;
        if (matchedMock) {
          loggedUser = { ...matchedMock, email: `${matchedMock.username}@laga.tour` };
        } else {
          // Allow custom mock login
          const cleanName = email.split("@")[0];
          loggedUser = {
            id: "mock_user_" + cleanName,
            uid: "mock_user_" + cleanName,
            name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
            username: cleanName,
            email: email,
            avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanName}`,
            points: 450,
            league: "Adventurer",
            bio: "Passionate backpacker exploring new landscapes.",
            followers: 120,
            following: 80,
            stats: { trips: 3, saved: 8, cities: 4 }
          };
        }

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

        const googleUser = {
          id: user.uid,
          uid: user.uid,
          name: user.displayName || "Google Traveler",
          username: user.email ? user.email.split("@")[0] : "traveler",
          email: user.email,
          avatar: user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`,
          points: pts,
          league: league,
          bio: "Exploring the world with Laga Tour!",
          followers: 0,
          following: 0,
          stats: { trips: 0, saved: 0, cities: 0 }
        };
        setCurrentUser(googleUser);
        return googleUser;
      } else {
        // Mock Google Sign-In
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

  // Reset Password action
  async function resetPassword(email) {
    if (isFirebaseConfigured && auth) {
      return await sendPasswordResetEmail(auth, email);
    } else {
      // Mock reset password
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

  const value = {
    currentUser,
    loading,
    isMockAuth,
    signup,
    login,
    loginWithGoogle,
    resetPassword,
    logout,
    addPoints
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
