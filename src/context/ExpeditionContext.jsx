import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { INITIAL_MOCK_EXPEDITIONS, BANGLADESH_PLACES_DATABASE, MOCK_COMPANIONS, MOCK_EXISTING_TOUR_GROUPS } from "../data/mockExpeditions";
import { useAuth } from "./AuthContext";
import { usePosts } from "./PostContext";
import confetti from "canvas-confetti";

const ExpeditionContext = createContext();

export function useExpeditions() {
  const context = useContext(ExpeditionContext);
  return context || {};
}

export function ExpeditionProvider({ children }) {
  const { currentUser, addPoints } = useAuth();
  const { posts, createPost, updatePost } = usePosts();

  const [expeditions, setExpeditions] = useState(() => {
    const saved = localStorage.getItem("ts_expeditions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse saved expeditions", e);
      }
    }
    return INITIAL_MOCK_EXPEDITIONS;
  });

  const [activeExpeditionId, setActiveExpeditionId] = useState(() => {
    return localStorage.getItem("ts_active_expedition_id") || "exp_sylhet_haor_2026";
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Track online / offline connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("ts_expeditions", JSON.stringify(expeditions));
  }, [expeditions]);

  useEffect(() => {
    if (activeExpeditionId) {
      localStorage.setItem("ts_active_expedition_id", activeExpeditionId);
    } else {
      localStorage.removeItem("ts_active_expedition_id");
    }
  }, [activeExpeditionId]);

  // Active expedition object
  const activeExpedition = expeditions.find(e => e.id === activeExpeditionId) || expeditions.find(e => e.status === "ongoing") || null;

  /**
   * Helper to sync modified expedition with any linked Social Feed Post
   */
  const syncWithSocialFeed = useCallback(async (expedition) => {
    if (!expedition || !expedition.isPublished) return;

    const checkedStops = (expedition.stops || []).filter(s => s.status === "checked_in");
    const spontaneousStops = (expedition.stops || []).filter(s => s.isSpontaneous);
    const totalSpent = (expedition.expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const captionSummary = `🗺️ Expedition Update: ${expedition.title}\n` +
      `📍 Route: ${expedition.startingLocation} ➔ ${expedition.destination} (${checkedStops.length}/${expedition.stops?.length || 0} stops covered)\n` +
      `💰 Budget: ${Number(totalSpent).toLocaleString()} / ${Number(expedition.targetBudget).toLocaleString()} BDT\n` +
      `${spontaneousStops.length > 0 ? `🌟 ${spontaneousStops.length} Spontaneous Discoveries logged!\n` : ''}` +
      `✨ ${expedition.description || ''}`;

    const mediaPhotos = checkedStops.flatMap(s => s.photos || []).filter(Boolean);
    const coverPhotos = mediaPhotos.length > 0 ? mediaPhotos : (expedition.coverImage ? [expedition.coverImage] : ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"]);

    // If an existing post is linked
    if (expedition.socialPostId && updatePost) {
      updatePost(expedition.socialPostId, {
        caption: captionSummary,
        images: coverPhotos,
        destination: expedition.destination,
        isPublic: true,
        expeditionData: {
          id: expedition.id,
          title: expedition.title,
          status: expedition.status,
          stopsCount: expedition.stops?.length || 0,
          checkedCount: checkedStops.length,
          spentBudget: totalSpent,
          targetBudget: expedition.targetBudget,
          season: expedition.season,
          travelType: expedition.travelType
        }
      });
    }
  }, [updatePost]);

  /**
   * Create a new Tour Plan / Expedition
   */
  const createExpedition = (tourData) => {
    const authorUser = currentUser ? {
      id: currentUser.id || currentUser.user_id || "user_" + Date.now(),
      name: currentUser.name || "Adventurer",
      username: currentUser.username || "traveler",
      avatar: currentUser.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=traveler",
      league: currentUser.league || "Adventurer",
      points: currentUser.points || 0
    } : {
      id: "guest",
      name: "Traveler",
      username: "traveler",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=guest",
      league: "Explorer",
      points: 100
    };

    const newId = "exp_" + Date.now();
    const newExpedition = {
      id: newId,
      title: tourData.title || `${tourData.startingLocation || 'Dhaka'} to ${tourData.destination || 'Sylhet'} Tour`,
      description: tourData.description || "A custom planned expedition across scenic locations.",
      startingLocation: tourData.startingLocation || "Dhaka",
      destination: tourData.destination || "Sylhet",
      startDate: tourData.startDate || new Date().toISOString().split("T")[0],
      endDate: tourData.endDate || new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0],
      targetBudget: Number(tourData.targetBudget) || 25000,
      spentBudget: 0,
      status: tourData.status || "planned", // 'planned' | 'ongoing' | 'completed'
      travelType: tourData.travelType || "Friends",
      season: tourData.season || "Monsoon",
      coverImage: tourData.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
      author: authorUser,
      companions: tourData.companions || [],
      stops: tourData.stops || [],
      expenses: [],
      currentGps: tourData.stops && tourData.stops[0] ? { lat: tourData.stops[0].lat, lng: tourData.stops[0].lng, lastUpdated: "Planned" } : { lat: 23.8103, lng: 90.4125, lastUpdated: "Planned" },
      isPublished: false,
      likes: 0,
      comments: []
    };

    setExpeditions(prev => [newExpedition, ...prev]);

    if (tourData.status === "ongoing") {
      setActiveExpeditionId(newId);
    }

    if (addPoints) {
      addPoints(75); // Points for creating tour plan
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    }

    return newExpedition;
  };

  /**
   * Modify / Update an existing Tour Plan
   */
  const updateExpedition = (tourId, updatedFields) => {
    let updatedObj = null;

    setExpeditions(prev => prev.map(exp => {
      if (exp.id === tourId) {
        // Recalculate spent budget from expenses if needed
        const currentExpenses = updatedFields.expenses || exp.expenses || [];
        const calculatedSpent = currentExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

        updatedObj = {
          ...exp,
          ...updatedFields,
          spentBudget: updatedFields.spentBudget !== undefined ? updatedFields.spentBudget : calculatedSpent
        };
        return updatedObj;
      }
      return exp;
    }));

    if (updatedObj && updatedObj.isPublished) {
      syncWithSocialFeed(updatedObj);
    }

    return updatedObj;
  };

  /**
   * Delete an expedition
   */
  const deleteExpedition = (tourId) => {
    setExpeditions(prev => prev.filter(e => e.id !== tourId));
    if (activeExpeditionId === tourId) {
      setActiveExpeditionId(null);
    }
  };

  /**
   * Start Tour / Transition to Ongoing Live Mode
   */
  const startExpedition = (tourId) => {
    setActiveExpeditionId(tourId);
    const updated = updateExpedition(tourId, {
      status: "ongoing"
    });

    if (addPoints) {
      addPoints(50);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    return updated;
  };

  /**
   * Check in at a scheduled stop with live GPS coordinates
   */
  const checkInStop = (tourId, stopId, checkInData = {}) => {
    const targetExp = expeditions.find(e => e.id === tourId);
    if (!targetExp) return;

    const nowIso = new Date().toISOString();
    const updatedStops = (targetExp.stops || []).map(stop => {
      if (stop.id === stopId) {
        return {
          ...stop,
          status: "checked_in",
          checkInTime: nowIso,
          checkInGps: checkInData.gps || { lat: stop.lat, lng: stop.lng },
          checkInNote: checkInData.note || stop.notes || "Arrived safely and checked in!",
          photos: checkInData.photos || stop.photos || ["https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=500"]
        };
      }
      return stop;
    });

    // Optionally append an expense if included during check-in
    let updatedExpenses = [...(targetExp.expenses || [])];
    if (checkInData.expense && Number(checkInData.expense.amount) > 0) {
      updatedExpenses.push({
        id: "exp_" + Date.now(),
        stopId: stopId,
        category: checkInData.expense.category || "Accommodation",
        amount: Number(checkInData.expense.amount),
        note: checkInData.expense.note || `Expense logged at check-in`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    const currentGps = checkInData.gps || {
      lat: targetExp.stops.find(s => s.id === stopId)?.lat || 23.8103,
      lng: targetExp.stops.find(s => s.id === stopId)?.lng || 90.4125,
      lastUpdated: "Just now"
    };

    const updated = updateExpedition(tourId, {
      stops: updatedStops,
      expenses: updatedExpenses,
      currentGps: currentGps
    });

    if (addPoints) {
      addPoints(35); // Points for live GPS check-in
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
    }

    return updated;
  };

  /**
   * Skip a scheduled stop
   */
  const skipStop = (tourId, stopId, reason = "Route altered due to time / weather") => {
    const targetExp = expeditions.find(e => e.id === tourId);
    if (!targetExp) return;

    const updatedStops = (targetExp.stops || []).map(stop => {
      if (stop.id === stopId) {
        return {
          ...stop,
          status: "skipped",
          skipReason: reason
        };
      }
      return stop;
    });

    return updateExpedition(tourId, { stops: updatedStops });
  };

  /**
   * Dynamically add unexpected on-the-road discoveries (Spontaneous Discovery)
   */
  const addSpontaneousDiscovery = (tourId, discoveryData) => {
    const targetExp = expeditions.find(e => e.id === tourId);
    if (!targetExp) return;

    const newStopId = "stop_spont_" + Date.now();
    const newSpontaneousStop = {
      id: newStopId,
      order: (targetExp.stops || []).length + 1,
      placeName: discoveryData.placeName || "Uncharted Scenic Spot",
      location: discoveryData.location || "On Route Discovery",
      lat: discoveryData.lat || (targetExp.currentGps?.lat ? targetExp.currentGps.lat + 0.02 : 24.3000),
      lng: discoveryData.lng || (targetExp.currentGps?.lng ? targetExp.currentGps.lng + 0.02 : 91.8000),
      transportMode: discoveryData.transportMode || "Local Transport",
      transportDetails: discoveryData.transportDetails || "Spontaneous road trip detour",
      transportCost: Number(discoveryData.transportCost) || 0,
      accommodationType: discoveryData.accommodationType || "Eco Cottage",
      accommodationDetails: discoveryData.accommodationDetails || "Local discovery",
      accommodationCost: Number(discoveryData.accommodationCost) || 0,
      stayDuration: discoveryData.stayDuration || "2 Hours",
      notes: discoveryData.notes || "Spontaneous on-the-road discovery found by travelers!",
      status: "checked_in",
      isSpontaneous: true,
      discoveryBadge: discoveryData.badge || "Hidden Gem",
      checkInTime: new Date().toISOString(),
      checkInGps: {
        lat: discoveryData.lat || 24.3000,
        lng: discoveryData.lng || 91.8000
      },
      checkInNote: discoveryData.notes || "Discovered on the road!",
      photos: discoveryData.photos && discoveryData.photos.length > 0 ? discoveryData.photos : ["https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500"]
    };

    const updatedStops = [...(targetExp.stops || []), newSpontaneousStop];

    let updatedExpenses = [...(targetExp.expenses || [])];
    if (discoveryData.expense && Number(discoveryData.expense.amount) > 0) {
      updatedExpenses.push({
        id: "exp_" + Date.now(),
        stopId: newStopId,
        category: discoveryData.expense.category || "Activities",
        amount: Number(discoveryData.expense.amount),
        note: `Spontaneous: ${discoveryData.placeName}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    const updated = updateExpedition(tourId, {
      stops: updatedStops,
      expenses: updatedExpenses,
      currentGps: {
        lat: newSpontaneousStop.lat,
        lng: newSpontaneousStop.lng,
        lastUpdated: "Spontaneous Discovery"
      }
    });

    if (addPoints) {
      addPoints(60); // Spontaneous discovery bonus
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }

    return updated;
  };

  /**
   * Log an expense
   */
  const logExpense = (tourId, expenseData) => {
    const targetExp = expeditions.find(e => e.id === tourId);
    if (!targetExp) return;

    const newExpense = {
      id: "exp_" + Date.now(),
      stopId: expenseData.stopId || null,
      category: expenseData.category || "Food",
      amount: Number(expenseData.amount) || 0,
      note: expenseData.note || "General Travel Expense",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedExpenses = [...(targetExp.expenses || []), newExpense];
    return updateExpedition(tourId, { expenses: updatedExpenses });
  };

  /**
   * Finish Expedition & Trigger AI Gamification Evaluation
   */
  const finishExpedition = (tourId) => {
    const targetExp = expeditions.find(e => e.id === tourId);
    if (!targetExp) return null;

    const stops = targetExp.stops || [];
    const checkedStops = stops.filter(s => s.status === "checked_in");
    const spontaneousStops = stops.filter(s => s.isSpontaneous);
    const expenses = targetExp.expenses || [];
    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // AI Evaluation Engine Calculations
    const completionRatio = stops.length > 0 ? (checkedStops.length / stops.length) : 1;
    const explorationScore = Math.min(100, Math.round(completionRatio * 95));

    // Budget discipline score (target vs spent)
    const budgetVariance = Math.abs(totalSpent - targetExp.targetBudget) / targetExp.targetBudget;
    const budgetScore = Math.max(60, Math.min(100, Math.round((1 - budgetVariance * 0.5) * 100)));

    // Spontaneous bonus score
    const spontaneousBonusScore = Math.min(100, 70 + spontaneousStops.length * 15);

    // Total points computed
    const totalGamificationPoints = Math.round(150 + explorationScore * 1.2 + budgetScore * 0.8 + spontaneousStops.length * 40);

    // Generate unlocked badges based on tour characteristics
    const earnedBadges = [];
    if (budgetScore >= 85) earnedBadges.push("Budget Maestro");
    if (explorationScore >= 80) earnedBadges.push("Trailblazer");
    if (spontaneousStops.length > 0) earnedBadges.push("Off-the-Beaten-Path Pioneer");
    if (targetExp.destination.toLowerCase().includes("sylhet") || targetExp.destination.toLowerCase().includes("haor")) {
      earnedBadges.push("Haor Navigator");
    } else if (targetExp.destination.toLowerCase().includes("bandarban") || targetExp.destination.toLowerCase().includes("sajek")) {
      earnedBadges.push("Cloud Walker");
    } else {
      earnedBadges.push("Expedition Veteran");
    }

    const aiScoreData = {
      totalPoints: totalGamificationPoints,
      budgetDisciplineScore: budgetScore,
      explorationBonus: explorationScore,
      paceEfficiency: 92,
      spontaneousBonus: spontaneousBonusScore,
      reviewSummary: `Outstanding expedition! Completed ${checkedStops.length} stops (${spontaneousStops.length} spontaneous gems) with ${budgetScore}% budget discipline against the ${Number(targetExp.targetBudget).toLocaleString()} BDT target.`,
      badges: earnedBadges
    };

    const updated = updateExpedition(tourId, {
      status: "completed",
      spentBudget: totalSpent,
      aiScore: aiScoreData
    });

    if (activeExpeditionId === tourId) {
      setActiveExpeditionId(null);
      localStorage.removeItem("ts_active_expedition_id");
    }

    if (addPoints) {
      addPoints(totalGamificationPoints);
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
    }

    return { expedition: updated, aiScore: aiScoreData };
  };

  /**
   * One-click publish completed or ongoing expedition to Community Social Feed
   */
  const publishToSocialFeed = async (tourId) => {
    const targetExp = expeditions.find(e => e.id === tourId);
    if (!targetExp) return;

    const checkedStops = (targetExp.stops || []).filter(s => s.status === "checked_in");
    const spontaneousStops = (targetExp.stops || []).filter(s => s.isSpontaneous);
    const totalSpent = (targetExp.expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const captionStory = `🗺️ Live Expedition Story: ${targetExp.title}\n\n` +
      `🚩 From: ${targetExp.startingLocation} ➔ To: ${targetExp.destination}\n` +
      `📅 Season: ${targetExp.season} | Style: ${targetExp.travelType}\n` +
      `📍 Covered ${checkedStops.length} / ${targetExp.stops?.length || 0} stops\n` +
      `💰 Final Budget: ${Number(totalSpent).toLocaleString()} BDT\n` +
      `${spontaneousStops.length > 0 ? `🌟 Discovered ${spontaneousStops.length} hidden gems on the way!\n` : ''}\n` +
      `"${targetExp.description}"`;

    const photos = checkedStops.flatMap(s => s.photos || []).filter(Boolean);
    const postPhotos = photos.length > 0 ? photos : [targetExp.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"];

    let newPostId = targetExp.socialPostId || "post_exp_" + Date.now();

    if (createPost) {
      const created = await createPost({
        author: targetExp.author || currentUser,
        caption: captionStory,
        images: postPhotos,
        destination: targetExp.destination,
        isPublic: true,
        expeditionData: {
          id: targetExp.id,
          title: targetExp.title,
          status: targetExp.status,
          stopsCount: targetExp.stops?.length || 0,
          checkedCount: checkedStops.length,
          spentBudget: totalSpent,
          targetBudget: targetExp.targetBudget,
          season: targetExp.season,
          travelType: targetExp.travelType
        }
      });
      if (created && created.id) {
        newPostId = created.id;
      }
    }

    const updated = updateExpedition(tourId, {
      isPublished: true,
      socialPostId: newPostId
    });

    if (addPoints) {
      addPoints(40); // Points for sharing to social feed
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    }

    return updated;
  };

  const value = {
    expeditions,
    activeExpedition,
    activeExpeditionId,
    setActiveExpeditionId,
    isOnline,
    lastSyncTime,
    placesDatabase: BANGLADESH_PLACES_DATABASE,
    companionsDatabase: MOCK_COMPANIONS,
    existingTourGroups: MOCK_EXISTING_TOUR_GROUPS,
    createExpedition,
    updateExpedition,
    deleteExpedition,
    startExpedition,
    checkInStop,
    skipStop,
    addSpontaneousDiscovery,
    logExpense,
    finishExpedition,
    publishToSocialFeed
  };

  return (
    <ExpeditionContext.Provider value={value}>
      {children}
    </ExpeditionContext.Provider>
  );
}
