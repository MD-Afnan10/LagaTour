import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { socketService } from "../services/socketService";
import { MOCK_DESTINATIONS } from "../data/mockData";
import { 
  Users, 
  MapPin, 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  MessageSquare, 
  Plus, 
  UserCheck, 
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Compass,
  Bus,
  Home,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  Send,
  Trash2,
  RefreshCw,
  ExternalLink,
  Crown,
  Eye,
  Info,
  Bell,
  XCircle,
  UserPlus,
  Lightbulb,
  Check,
  X,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  HelpCircle
} from "lucide-react";
import confetti from "canvas-confetti";

function formatDate(d) {
  if (!d) return "Dec 01, 2026";
  try {
    const clean = String(d).split("T")[0];
    const parts = clean.split("-");
    if (parts.length === 3) {
      const [y, m, day] = parts;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthName = months[parseInt(m, 10) - 1] || m;
      return `${monthName} ${parseInt(day, 10)}, ${y}`;
    }
    return String(d).substring(0, 15);
  } catch {
    return String(d).substring(0, 15);
  }
}

export default function GroupPlanner() {
  const { currentUser, addPoints } = useAuth();
  const currentUserId = currentUser?.id || currentUser?.user_id;

  // List of all groups from backend
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Selected Group Workspace State
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("checklist"); // checklist, budget, chat, itinerary

  // Detail Modal for "See More" option
  const [detailModalGroup, setDetailModalGroup] = useState(null);

  // Modal State to create new expedition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [destination, setDestination] = useState(MOCK_DESTINATIONS[0]?.name || "Cox's Bazar Beach");
  const [title, setTitle] = useState("");
  const [travelDate, setTravelDate] = useState("2026-12-01");
  const [budget, setBudget] = useState(8500);
  const [maxMembers, setMaxMembers] = useState(8);
  const [transport, setTransport] = useState("AC Bus & Boat");
  const [accommodation, setAccommodation] = useState("Beach Resort & Camping");
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Workspace action inputs - Collaborative Checklist
  const [newTaskText, setNewTaskText] = useState("");
  const [selectedAssigneeUserId, setSelectedAssigneeUserId] = useState("me");
  const [customAssigneeName, setCustomAssigneeName] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  
  // Workspace action inputs - Budget
  const [newExpTitle, setNewExpTitle] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpPaidBy, setNewExpPaidBy] = useState("");
  const [addingExpense, setAddingExpense] = useState(false);

  // Workspace action inputs - Itinerary Suggestions & Appeals
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [appealDay, setAppealDay] = useState("Day 1");
  const [customAppealDay, setCustomAppealDay] = useState("");
  const [appealActivity, setAppealActivity] = useState("");
  const [appealReason, setAppealReason] = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  // Organizer Rejection Modal State
  const [rejectingSuggestion, setRejectingSuggestion] = useState(null);
  const [rejectionReasonText, setRejectionReasonText] = useState("");
  const [submittingRejection, setSubmittingRejection] = useState(false);

  // Chat stream state inside workspace
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatBottomRef = useRef(null);

  // 1. Fetch All Groups from MySQL Backend
  const loadGroups = async () => {
    try {
      setLoadingGroups(true);
      setErrorMsg(null);
      const data = await api.fetchGroups({ userId: currentUserId });
      setGroups(data || []);
    } catch (err) {
      console.error("Error loading groups:", err);
      setErrorMsg("Unable to load expeditions. Please ensure your backend is running.");
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [currentUserId]);

  // 2. Fetch Selected Group Details when selectedGroupId changes
  const loadGroupDetails = async (groupId) => {
    if (!groupId) return;
    try {
      setLoadingDetails(true);
      const data = await api.fetchGroupDetails(groupId, currentUserId);
      setGroupDetails(data);
      if (data?.conversationId) {
        loadChatMessages(data.conversationId);
      }
    } catch (err) {
      console.error("Error loading group details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupDetails(selectedGroupId);
    } else {
      setGroupDetails(null);
    }
  }, [selectedGroupId, currentUserId]);

  // 3. Load Chat Messages for Linked Group Chat
  const loadChatMessages = async (conversationId) => {
    if (!conversationId) return;
    try {
      setLoadingChat(true);
      const res = await fetch(`http://localhost:5000/api/chats/${conversationId}/messages?userId=${currentUserId || ""}`);
      const data = await res.json();
      if (data && data.success) {
        setChatMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Error loading group chat:", err);
    } finally {
      setLoadingChat(false);
    }
  };

  // 4. Real-time Socket.io Chat Integration
  useEffect(() => {
    if (!groupDetails?.conversationId) return;

    const convId = groupDetails.conversationId;
    socketService.connect(currentUser);
    socketService.joinChat(convId, currentUserId);

    const unsubscribe = socketService.onReceiveMessage((msg) => {
      if (msg && (msg.conversationId === convId || msg.conversation_id === convId)) {
        setChatMessages(prev => {
          if (prev.some(m => m.id === msg.id || m.id === msg.message_id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return () => {
      socketService.leaveChat(convId, currentUserId);
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [groupDetails?.conversationId, currentUserId, currentUser]);

  // Scroll chat to bottom
  useEffect(() => {
    if (activeTab === "chat" && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  // Determine My Expeditions vs Explore Expeditions
  const myExpeditions = groups.filter(g => g.isOrganizer || g.isMember);
  const exploreExpeditions = groups.filter(g => !g.isOrganizer && !g.isMember);

  // 5. Create Group Action
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const userObj = currentUser || {
      id: "user_demo",
      name: "Travel Explorer",
      username: "traveler",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=traveler"
    };

    try {
      setCreatingGroup(true);
      const res = await api.createGroupExpedition({
        title: title.trim(),
        destination,
        travelDate,
        estimatedBudget: Number(budget),
        maxMembers: Number(maxMembers),
        transportation: transport,
        accommodationPlan: accommodation,
        organizer: userObj
      });

      if (res && res.success) {
        setIsModalOpen(false);
        setTitle("");
        addPoints(75);
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        await loadGroups();
        if (res.groupId) {
          setSelectedGroupId(res.groupId);
        }
      }
    } catch (err) {
      console.error("Failed to create expedition:", err);
      alert("Could not create expedition. " + (err.message || ""));
    } finally {
      setCreatingGroup(false);
    }
  };

  // 6. Join Request Action
  const handleJoinRequest = async (groupId) => {
    const userObj = currentUser || {
      id: "user_guest_" + Date.now(),
      name: "Community Traveler",
      username: "traveler",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=traveler"
    };

    try {
      const res = await api.joinGroupExpedition(groupId, userObj);
      if (res && res.success) {
        alert("✉️ Join request sent to the expedition organizer!");
        loadGroups();
        if (selectedGroupId === groupId) loadGroupDetails(groupId);
        if (detailModalGroup?.id === groupId) setDetailModalGroup(null);
      }
    } catch (err) {
      alert(err.message || "Failed to send join request.");
    }
  };

  // 7. Withdraw Join Request Action
  const handleWithdrawRequest = async (groupId) => {
    if (!confirm("Are you sure you want to withdraw your join request?")) return;
    try {
      const res = await api.withdrawJoinRequest(groupId, currentUserId);
      if (res && res.success) {
        loadGroups();
        if (selectedGroupId === groupId) loadGroupDetails(groupId);
        if (detailModalGroup?.id === groupId) setDetailModalGroup(null);
      }
    } catch (err) {
      console.error("Failed to withdraw request:", err);
      alert("Could not withdraw request. " + (err.message || ""));
    }
  };

  // 8. Organizer Accept / Reject Join Request
  const handleRespondRequest = async (groupId, targetUserId, status) => {
    try {
      const res = await api.respondToJoinRequest(groupId, targetUserId, status, currentUserId);
      if (res && res.success) {
        loadGroups();
        loadGroupDetails(groupId);
        if (detailModalGroup?.id === groupId) {
          const updated = await api.fetchGroupDetails(groupId, currentUserId);
          setDetailModalGroup(updated);
        }
      }
    } catch (err) {
      console.error("Failed to update join request:", err);
    }
  };

  // 9. Collaborative Add Checklist Task (Any member can add)
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim() || !selectedGroupId) return;

    let assigneeName = "";
    let assigneeUserId = null;

    if (selectedAssigneeUserId === "me") {
      assigneeName = currentUser?.name || currentUser?.username || "Me";
      assigneeUserId = currentUserId;
    } else if (selectedAssigneeUserId === "custom") {
      assigneeName = customAssigneeName.trim() || "Traveler";
      assigneeUserId = null;
    } else {
      const allMembers = [
        ...(groupDetails?.members || []),
        ...(groupDetails?.organizer ? [groupDetails.organizer] : [])
      ];
      const targetUser = allMembers.find(m => (m.id === selectedAssigneeUserId || m.user_id === selectedAssigneeUserId));
      if (targetUser) {
        assigneeName = targetUser.name || targetUser.username;
        assigneeUserId = targetUser.id || targetUser.user_id;
      } else {
        assigneeName = currentUser?.name || "Traveler";
        assigneeUserId = currentUserId;
      }
    }

    try {
      setAddingTask(true);
      const res = await api.addGroupChecklistTask(selectedGroupId, {
        task: newTaskText.trim(),
        assignedToName: assigneeName,
        assignedToUserId: assigneeUserId
      });
      if (res && res.success) {
        setNewTaskText("");
        setCustomAssigneeName("");
        addPoints(10);
        loadGroupDetails(selectedGroupId);
      }
    } catch (err) {
      console.error("Failed to add task:", err);
    } finally {
      setAddingTask(false);
    }
  };

  // 10. Toggle Task Completed
  const handleToggleTask = async (taskId, currentCompleted) => {
    try {
      const willBeCompleted = !currentCompleted;
      setGroupDetails(prev => {
        if (!prev) return prev;
        const updatedList = prev.checklist.map(c => c.id === taskId ? { ...c, completed: willBeCompleted } : c);
        const allDone = updatedList.length > 0 && updatedList.every(c => c.completed);
        if (allDone && willBeCompleted) {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        }
        return {
          ...prev,
          checklist: updatedList
        };
      });

      if (willBeCompleted) {
        addPoints(5);
      }

      await api.toggleGroupChecklistTask(selectedGroupId, taskId, willBeCompleted);
    } catch (err) {
      console.error("Failed to toggle task:", err);
      loadGroupDetails(selectedGroupId);
    }
  };

  // 11. Delete Task
  const handleDeleteTask = async (taskId) => {
    try {
      setGroupDetails(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          checklist: prev.checklist.filter(c => c.id !== taskId)
        };
      });
      await api.deleteGroupChecklistTask(selectedGroupId, taskId);
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  // 12. Add Shared Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpTitle.trim() || !newExpAmount || !selectedGroupId) return;

    try {
      setAddingExpense(true);
      const res = await api.addGroupExpense(selectedGroupId, {
        title: newExpTitle.trim(),
        amount: parseFloat(newExpAmount),
        paidBy: newExpPaidBy.trim() || (currentUser?.name || "Member"),
        paidByUserId: currentUserId,
        date: new Date().toISOString().split("T")[0]
      });

      if (res && res.success) {
        setNewExpTitle("");
        setNewExpAmount("");
        setNewExpPaidBy("");
        loadGroupDetails(selectedGroupId);
      }
    } catch (err) {
      console.error("Failed to add expense:", err);
    } finally {
      setAddingExpense(false);
    }
  };

  // 13. Delete Expense
  const handleDeleteExpense = async (expenseId) => {
    try {
      setGroupDetails(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          expenses: prev.expenses.filter(e => e.id !== expenseId)
        };
      });
      await api.deleteGroupExpense(selectedGroupId, expenseId);
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  // 14. Send Group Chat Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !groupDetails?.conversationId) return;

    const convId = groupDetails.conversationId;
    const textToSend = newChatMessage.trim();
    setNewChatMessage("");

    try {
      setSendingMessage(true);
      const userObj = currentUser || {
        id: "user_demo",
        name: "Traveler",
        username: "traveler",
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=traveler"
      };

      const res = await fetch(`http://localhost:5000/api/chats/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUserId || userObj.id,
          senderData: userObj,
          text: textToSend,
          type: "text"
        })
      });

      const data = await res.json();
      if (data && data.success && data.message) {
        setChatMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (err) {
      console.error("Failed to send chat message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  // 15. Propose Itinerary Suggestion / Appeal (Member action)
  const handleProposeItinerary = async (e) => {
    e.preventDefault();
    if (!appealActivity.trim() || !selectedGroupId) return;

    const userObj = currentUser || {
      id: "user_demo",
      name: "Traveler",
      username: "traveler",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=traveler"
    };

    const targetDay = appealDay === "custom" ? (customAppealDay.trim() || "Day 1") : appealDay;

    try {
      setSubmittingAppeal(true);
      const res = await api.addItinerarySuggestion(selectedGroupId, {
        day: targetDay,
        activityPlan: appealActivity.trim(),
        reason: appealReason.trim(),
        user: userObj
      });

      if (res && res.success) {
        setIsAppealModalOpen(false);
        setAppealActivity("");
        setAppealReason("");
        setCustomAppealDay("");
        addPoints(15);
        confetti({ particleCount: 90, spread: 60, origin: { y: 0.65 } });
        loadGroupDetails(selectedGroupId);
      }
    } catch (err) {
      console.error("Failed to submit itinerary proposal:", err);
      alert(err.message || "Failed to submit itinerary proposal.");
    } finally {
      setSubmittingAppeal(false);
    }
  };

  // 16. Organizer Accept Itinerary Suggestion
  const handleAcceptSuggestion = async (suggestionId) => {
    try {
      const res = await api.respondToItinerarySuggestion(selectedGroupId, suggestionId, "accepted", "", currentUserId);
      if (res && res.success) {
        confetti({ particleCount: 110, spread: 70, origin: { y: 0.6 } });
        loadGroupDetails(selectedGroupId);
      }
    } catch (err) {
      console.error("Failed to accept suggestion:", err);
      alert(err.message || "Failed to accept suggestion.");
    }
  };

  // 17. Organizer Reject Itinerary Suggestion with Reason
  const handleRejectSuggestionSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingSuggestion || !selectedGroupId) return;

    try {
      setSubmittingRejection(true);
      const res = await api.respondToItinerarySuggestion(
        selectedGroupId, 
        rejectingSuggestion.id, 
        "rejected", 
        rejectionReasonText.trim() || "Declined by trip organizer.", 
        currentUserId
      );
      if (res && res.success) {
        setRejectingSuggestion(null);
        setRejectionReasonText("");
        loadGroupDetails(selectedGroupId);
      }
    } catch (err) {
      console.error("Failed to reject suggestion:", err);
      alert(err.message || "Failed to reject suggestion.");
    } finally {
      setSubmittingRejection(false);
    }
  };

  // 18. Delete / Withdraw Itinerary Suggestion
  const handleDeleteSuggestion = async (suggestionId) => {
    if (!confirm("Are you sure you want to withdraw this itinerary proposal?")) return;
    try {
      const res = await api.deleteItinerarySuggestion(selectedGroupId, suggestionId);
      if (res && res.success) {
        loadGroupDetails(selectedGroupId);
      }
    } catch (err) {
      console.error("Failed to delete suggestion:", err);
    }
  };

  // Total Expenses & Per-Person calculations
  const totalExpCost = (groupDetails?.expenses || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const acceptedMembersCount = Math.max(1, groupDetails?.members?.length || 1);
  const perPersonCost = Math.round(totalExpCost / acceptedMembersCount);

  // Pending Appeals for Creator
  const pendingSuggestions = (groupDetails?.itinerarySuggestions || []).filter(s => s.status === "pending");
  const acceptedSuggestions = (groupDetails?.itinerarySuggestions || []).filter(s => s.status === "accepted");
  const rejectedSuggestions = (groupDetails?.itinerarySuggestions || []).filter(s => s.status === "rejected");

  // All expedition members for assignee dropdown
  const expeditionTeamMembers = [
    ...(groupDetails?.organizer ? [{ ...groupDetails.organizer, isOrganizer: true }] : []),
    ...(groupDetails?.members || []).filter(m => m.id !== groupDetails?.organizer?.id)
  ];

  return (
    <div className="min-h-screen bg-base-100/50 pb-20">
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl space-y-8">
        
        {/* ========================================================================= */}
        {/* VIEW 1: EXPEDITIONS LIST & DISCOVERY */}
        {/* ========================================================================= */}
        {!selectedGroupId && (
          <div className="space-y-8">
            
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-base-100 via-base-200/50 to-base-100 p-6 md:p-8 rounded-3xl border border-base-200 shadow-xs">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                  <Compass className="w-4 h-4" /> Cooperative Travel Hub
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-base-content m-0">
                  Group Expeditions
                </h1>
                <p className="text-sm text-base-content/70 m-0 max-w-xl">
                  Browse available travel groups or manage your joined expedition workspace with checklists, split budgets, live group chat, and collaborative itinerary proposals.
                </p>
              </div>

              <button 
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary font-black rounded-2xl shadow gap-2 text-sm px-6"
              >
                <Plus className="w-5 h-5" /> Plan Expedition
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="alert alert-error shadow-sm text-xs rounded-2xl flex items-center justify-between">
                <span>{errorMsg}</span>
                <button onClick={loadGroups} className="btn btn-xs btn-ghost gap-1">
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            )}

            {/* 1. MY EXPEDITIONS SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-xl font-black text-base-content m-0">My Expeditions</h2>
                </div>
                <span className="badge badge-neutral font-bold text-xs">
                  {myExpeditions.length} Joined / Organized
                </span>
              </div>

              {loadingGroups ? (
                <div className="text-center py-12">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                  <span className="block text-xs text-base-content/50 mt-2">Loading your expeditions...</span>
                </div>
              ) : myExpeditions.length === 0 ? (
                <div className="card bg-base-100 border border-dashed border-base-300 p-8 text-center text-xs text-base-content/50 rounded-3xl space-y-2">
                  <Users className="w-8 h-8 mx-auto text-base-content/30" />
                  <p className="font-bold text-sm text-base-content">No active expeditions yet.</p>
                  <p>Create a new trip or request to join one of the available expeditions below!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {myExpeditions.map(group => {
                    const hasPendingRequests = group.isOrganizer && group.requests && group.requests.length > 0;

                    return (
                      <div 
                        key={group.id}
                        className={`card bg-base-100 border p-5 rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                          hasPendingRequests ? "border-amber-500/40 ring-1 ring-amber-500/20" : "border-base-200"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-black text-base text-base-content m-0 line-clamp-1 flex-1">
                              {group.title}
                            </h3>
                            {group.isOrganizer ? (
                              <span className="badge badge-warning badge-sm font-black text-[10px] shrink-0 gap-1">
                                <Crown className="w-3 h-3" /> Organizer
                              </span>
                            ) : (
                              <span className="badge badge-success text-white badge-sm font-black text-[10px] shrink-0">
                                Joined
                              </span>
                            )}
                          </div>

                          {/* Organizer Notification Banner on Card */}
                          {hasPendingRequests && (
                            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs">
                              <span className="font-bold flex items-center gap-1.5">
                                <Bell className="w-3.5 h-3.5 animate-bounce" /> {group.requests.length} Pending Request{group.requests.length > 1 ? "s" : ""}
                              </span>
                              <button 
                                onClick={() => setSelectedGroupId(group.id)}
                                className="btn btn-xs btn-warning text-slate-900 font-black rounded-lg h-6 min-h-0 text-[10px]"
                              >
                                Review
                              </button>
                            </div>
                          )}

                          <div className="space-y-1.5 text-xs text-base-content/70">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="font-semibold text-base-content">{group.destination}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-secondary shrink-0" />
                              <span>{formatDate(group.travelDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-accent shrink-0" />
                              <span>{group.memberCount || 1} / {group.maxMembers} Members</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-base-200 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-base-content/50 block font-bold uppercase">Budget</span>
                            <span className="font-black text-sm text-primary">
                              {Number(group.estimatedBudget).toLocaleString()} BDT
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => setDetailModalGroup(group)}
                              className="btn btn-ghost btn-xs rounded-xl text-base-content/70 hover:text-base-content gap-1 font-bold"
                            >
                              <Eye className="w-3.5 h-3.5" /> Details
                            </button>

                            <button 
                              onClick={() => setSelectedGroupId(group.id)}
                              className="btn btn-primary btn-sm rounded-xl font-bold gap-1 text-xs shadow-xs"
                            >
                              Workspace <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. EXPLORE AVAILABLE EXPEDITIONS SECTION */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-black text-base-content m-0">Explore Open Expeditions</h2>
                </div>
                <span className="text-xs text-base-content/60">
                  Find new companions and request to join their trips.
                </span>
              </div>

              {exploreExpeditions.length === 0 ? (
                <div className="card bg-base-100 border border-base-200 p-8 text-center text-xs text-base-content/50 rounded-3xl">
                  No open expeditions available right now. Click "Plan Expedition" above to launch the first one!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {exploreExpeditions.map(group => {
                    const isPending = group.isPending || (group.requests && group.requests.some(r => r.user?.id === currentUserId));

                    return (
                      <div 
                        key={group.id}
                        className="card bg-base-100 border border-base-200 p-5 rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-black text-base text-base-content m-0 line-clamp-1 flex-1">
                              {group.title}
                            </h3>
                            <span className="badge badge-outline badge-sm text-[10px] font-bold shrink-0">
                              {group.status || "open"}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs text-base-content/70">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="font-semibold text-base-content">{group.destination}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-secondary shrink-0" />
                              <span>{formatDate(group.travelDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-accent shrink-0" />
                              <span>{group.memberCount || 1} / {group.maxMembers} Members</span>
                            </div>
                          </div>

                          {/* Organizer info badge */}
                          <div className="flex items-center gap-2 pt-2 border-t border-base-200/60">
                            <img 
                              src={group.organizer?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${group.organizer?.name || 'traveler'}`} 
                              className="w-5 h-5 rounded-full object-cover" 
                              alt="Organizer" 
                            />
                            <span className="text-[11px] text-base-content/60 truncate">
                              Organized by <span className="font-bold text-base-content">{group.organizer?.name || "Traveler"}</span>
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-base-200 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-base-content/50 block font-bold uppercase">Budget</span>
                            <span className="font-black text-sm text-primary">
                              {Number(group.estimatedBudget).toLocaleString()} BDT
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => setDetailModalGroup(group)}
                              className="btn btn-ghost btn-xs rounded-xl text-base-content/70 hover:text-base-content gap-1 font-bold"
                            >
                              <Eye className="w-3.5 h-3.5" /> Details
                            </button>

                            {isPending ? (
                              <div className="flex items-center gap-1">
                                <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold text-[11px] whitespace-nowrap">
                                  Pending
                                </span>
                                <button 
                                  onClick={() => handleWithdrawRequest(group.id)}
                                  className="btn btn-xs btn-ghost text-error rounded-xl font-bold text-[10px] px-2 h-7 min-h-0"
                                  title="Withdraw Join Request"
                                >
                                  Withdraw
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleJoinRequest(group.id)}
                                className="btn btn-primary btn-sm rounded-xl font-bold gap-1 text-xs shadow-xs"
                              >
                                Join <UserPlus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: DEDICATED EXPEDITION WORKSPACE */}
        {/* ========================================================================= */}
        {selectedGroupId && (
          <div className="space-y-6">
            
            {/* Top Workspace Bar */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setSelectedGroupId(null)}
                className="btn btn-ghost btn-sm rounded-xl gap-2 font-bold text-xs"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Expeditions
              </button>

              <button 
                onClick={() => loadGroupDetails(selectedGroupId)}
                className="btn btn-ghost btn-xs rounded-xl gap-1 text-base-content/60"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sync Data
              </button>
            </div>

            {loadingDetails || !groupDetails ? (
              <div className="text-center py-20 card bg-base-100 border border-base-200 rounded-3xl">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="text-xs text-base-content/50 mt-3 font-semibold">Loading expedition workspace...</p>
              </div>
            ) : (
              <div className="space-y-6">

                {/* Expedition Hero Card */}
                <div className="card bg-base-100 border border-base-200 p-6 md:p-8 rounded-3xl shadow-xs space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge badge-primary badge-sm font-black text-[10px]">
                          EXPEDITION WORKSPACE
                        </span>
                        {groupDetails.isOrganizer && (
                          <span className="badge badge-warning badge-sm font-bold text-[10px] gap-1">
                            <Crown className="w-3 h-3" /> Trip Organizer
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl md:text-3xl font-black text-base-content m-0">
                        {groupDetails.title}
                      </h2>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-base-content/70 pt-1">
                        <span className="flex items-center gap-1 font-semibold text-base-content">
                          <MapPin className="w-4 h-4 text-primary" /> {groupDetails.destination}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-secondary" /> {formatDate(groupDetails.travelDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bus className="w-4 h-4 text-accent" /> {groupDetails.transportation}
                        </span>
                        <span className="flex items-center gap-1">
                          <Home className="w-4 h-4 text-emerald-500" /> {groupDetails.accommodationPlan}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex md:flex-col items-center md:items-end justify-between w-full md:w-auto">
                      <span className="text-[10px] uppercase font-bold text-base-content/50 block">Est. Budget</span>
                      <span className="text-xl font-black text-primary">
                        {Number(groupDetails.estimatedBudget).toLocaleString()} BDT
                      </span>
                    </div>
                  </div>

                  {/* Team Members Avatar Bar */}
                  <div className="pt-4 border-t border-base-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-base-content/60">Team:</span>
                      <div className="avatar-group -space-x-3 rtl:space-x-reverse">
                        {(groupDetails.members || []).map(m => (
                          <Link to={`/profile/${m.id || m.username}`} key={m.id} className="avatar border-2 border-base-100" title={m.name}>
                            <div className="w-8 h-8 rounded-full">
                              <img src={m.avatar} alt={m.name} />
                            </div>
                          </Link>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-base-content/70 ml-2">
                        {groupDetails.members?.length || 0} / {groupDetails.maxMembers} Members
                      </span>
                    </div>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* ORGANIZER REVIEW PENDING JOIN REQUESTS PANEL */}
                {/* ========================================================================= */}
                {groupDetails.isOrganizer && groupDetails.requests && groupDetails.requests.length > 0 && (
                  <div className="card bg-gradient-to-r from-amber-500/10 via-base-100 to-amber-500/10 border-2 border-amber-500/40 p-6 rounded-3xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-amber-500 animate-bounce" />
                        <h3 className="font-black text-base text-base-content m-0">
                          Pending Join Requests ({groupDetails.requests.length})
                        </h3>
                      </div>
                      <span className="text-xs text-base-content/60">
                        Review traveler profiles and approve their expedition participation.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {groupDetails.requests.map(req => (
                        <div key={req.id} className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs flex flex-col justify-between space-y-3">
                          <div className="flex items-start gap-3">
                            <Link to={`/profile/${req.user?.id || req.user?.username}`}>
                              <img src={req.user?.avatar} className="w-12 h-12 rounded-full object-cover border" alt="Requester" />
                            </Link>
                            <div className="flex-1 space-y-0.5">
                              <Link to={`/profile/${req.user?.id || req.user?.username}`} className="font-extrabold text-sm hover:underline block">
                                {req.user?.name}
                              </Link>
                              <span className="text-[11px] text-base-content/60 block">@{req.user?.username}</span>
                              <span className="badge badge-ghost badge-xs text-[9px] font-bold text-amber-500">
                                ⭐ {req.user?.points || 350} pts
                              </span>
                              {req.user?.bio && (
                                <p className="text-[11px] text-base-content/70 line-clamp-1 pt-0.5 m-0">
                                  {req.user?.bio}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-base-200 flex items-center justify-between gap-2">
                            <Link 
                              to={`/profile/${req.user?.id || req.user?.username}`}
                              className="btn btn-xs btn-ghost text-xs text-primary font-bold"
                            >
                              View Profile
                            </Link>
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => handleRespondRequest(groupDetails.id, req.user?.id, "rejected")}
                                className="btn btn-xs btn-ghost text-error font-bold rounded-lg px-2.5"
                              >
                                Decline
                              </button>
                              <button 
                                onClick={() => handleRespondRequest(groupDetails.id, req.user?.id, "accepted")}
                                className="btn btn-xs btn-success text-white font-bold rounded-lg px-3"
                              >
                                Accept Member
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Workspace Navigation Tabs */}
                <div className="flex justify-center">
                  <div className="join bg-base-200 border border-base-300 p-1 rounded-2xl">
                    <button 
                      onClick={() => setActiveTab("checklist")}
                      className={`join-item btn btn-sm font-black rounded-xl gap-2 ${
                        activeTab === "checklist" ? "btn-primary text-primary-content" : "btn-ghost"
                      }`}
                    >
                      <CheckSquare className="w-4 h-4" /> Checklist
                    </button>
                    <button 
                      onClick={() => setActiveTab("budget")}
                      className={`join-item btn btn-sm font-black rounded-xl gap-2 ${
                        activeTab === "budget" ? "btn-primary text-primary-content" : "btn-ghost"
                      }`}
                    >
                      <DollarSign className="w-4 h-4" /> Split Budget
                    </button>
                    <button 
                      onClick={() => setActiveTab("chat")}
                      className={`join-item btn btn-sm font-black rounded-xl gap-2 ${
                        activeTab === "chat" ? "btn-primary text-primary-content" : "btn-ghost"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" /> Group Chat
                    </button>
                    <button 
                      onClick={() => setActiveTab("itinerary")}
                      className={`join-item btn btn-sm font-black rounded-xl gap-2 relative ${
                        activeTab === "itinerary" ? "btn-primary text-primary-content" : "btn-ghost"
                      }`}
                    >
                      <Compass className="w-4 h-4" /> Itinerary
                      {pendingSuggestions.length > 0 && (
                        <span className="badge badge-warning badge-xs font-black text-[9px] px-1.5 py-0.5 ml-1">
                          {pendingSuggestions.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* TAB 1: COLLABORATIVE CHECKLIST */}
                {/* ========================================================================= */}
                {activeTab === "checklist" && (
                  <div className="card bg-base-100 border border-base-200 p-6 rounded-3xl space-y-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h3 className="font-black text-lg text-base-content m-0">Collaborative Tasks Checklist</h3>
                        <p className="text-xs text-base-content/60 m-0">Any member can assign tasks to teammates and track trip readiness together.</p>
                      </div>
                      <span className="badge badge-neutral font-bold text-xs">
                        {groupDetails.checklist?.filter(c => c.completed).length || 0} / {groupDetails.checklist?.length || 0} Completed
                      </span>
                    </div>

                    {/* Collaborative Add Task Form */}
                    <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2 bg-base-200/40 p-3 rounded-2xl border border-base-200">
                      <input 
                        type="text" 
                        placeholder="Add a new collaborative task (e.g., Book ferry tickets, bring power banks)..." 
                        className="input input-bordered input-sm flex-1 rounded-xl text-xs" 
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                      />

                      {/* Team Member Assignee Selector */}
                      <select 
                        className="select select-bordered select-sm rounded-xl text-xs w-full sm:w-52"
                        value={selectedAssigneeUserId}
                        onChange={(e) => setSelectedAssigneeUserId(e.target.value)}
                      >
                        <option value="me">🙋 Assign to Me ({currentUser?.name || "Me"})</option>
                        <optgroup label="Expedition Team Members">
                          {expeditionTeamMembers.map(m => (
                            <option key={m.id || m.user_id} value={m.id || m.user_id}>
                              {m.name || m.username} {m.isOrganizer ? "(Organizer)" : ""}
                            </option>
                          ))}
                        </optgroup>
                        <option value="custom">✏️ Custom Name...</option>
                      </select>

                      {selectedAssigneeUserId === "custom" && (
                        <input 
                          type="text"
                          placeholder="Type assignee name..."
                          className="input input-bordered input-sm w-full sm:w-36 rounded-xl text-xs"
                          value={customAssigneeName}
                          onChange={(e) => setCustomAssigneeName(e.target.value)}
                        />
                      )}

                      <button 
                        type="submit" 
                        disabled={addingTask || !newTaskText.trim()}
                        className="btn btn-sm btn-primary rounded-xl font-black gap-1 text-xs shrink-0"
                      >
                        <Plus className="w-4 h-4" /> Add Task
                      </button>
                    </form>

                    {/* Checklist Items List */}
                    <div className="space-y-2">
                      {(groupDetails.checklist || []).length === 0 ? (
                        <p className="text-xs text-base-content/50 text-center py-6">No tasks added yet. Create one above!</p>
                      ) : (
                        groupDetails.checklist.map(item => (
                          <div 
                            key={item.id}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                              item.completed ? "bg-base-200/40 border-base-200 text-base-content/60" : "bg-base-100 border-base-200 text-base-content"
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <input 
                                type="checkbox" 
                                checked={item.completed} 
                                onChange={() => handleToggleTask(item.id, item.completed)}
                                className="checkbox checkbox-primary checkbox-sm rounded-lg"
                              />
                              <div className="min-w-0 flex-1">
                                <span className={`text-xs font-bold block truncate ${item.completed ? "line-through text-base-content/50" : "text-base-content"}`}>
                                  {item.task}
                                </span>
                                <span className="text-[11px] text-base-content/60 flex items-center gap-1 mt-0.5">
                                  <Users className="w-3 h-3 text-primary" /> Assigned to: <span className="font-semibold text-base-content">{item.assignedTo || "Unassigned"}</span>
                                </span>
                              </div>
                            </div>

                            <button 
                              onClick={() => handleDeleteTask(item.id)}
                              className="btn btn-ghost btn-xs text-error rounded-lg ml-2"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 2: SPLIT BUDGET */}
                {/* ========================================================================= */}
                {activeTab === "budget" && (
                  <div className="card bg-base-100 border border-base-200 p-6 rounded-3xl space-y-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h3 className="font-black text-lg text-base-content m-0">Group Budget Splitter</h3>
                        <p className="text-xs text-base-content/60 m-0">Log expenses and track equal splits automatically.</p>
                      </div>
                    </div>

                    {/* Cost Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                        <span className="text-[10px] text-primary font-bold uppercase block">Total Spent</span>
                        <span className="text-2xl font-black text-primary">
                          {totalExpCost.toLocaleString()} BDT
                        </span>
                      </div>
                      <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-2xl">
                        <span className="text-[10px] text-secondary font-bold uppercase block">Active Members</span>
                        <span className="text-2xl font-black text-secondary">
                          {acceptedMembersCount} People
                        </span>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">Cost Per Person</span>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {perPersonCost.toLocaleString()} BDT
                        </span>
                      </div>
                    </div>

                    {/* Add Shared Expense Form */}
                    <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        placeholder="Expense Item (e.g., Resort Advance, Jeep Hire)..." 
                        className="input input-bordered input-sm flex-1 rounded-xl text-xs" 
                        value={newExpTitle}
                        onChange={(e) => setNewExpTitle(e.target.value)}
                      />
                      <input 
                        type="number" 
                        placeholder="Amount (BDT)..." 
                        className="input input-bordered input-sm w-full sm:w-36 rounded-xl text-xs" 
                        value={newExpAmount}
                        onChange={(e) => setNewExpAmount(e.target.value)}
                      />
                      <input 
                        type="text" 
                        placeholder="Paid By (Name)..." 
                        className="input input-bordered input-sm w-full sm:w-36 rounded-xl text-xs" 
                        value={newExpPaidBy}
                        onChange={(e) => setNewExpPaidBy(e.target.value)}
                      />
                      <button 
                        type="submit" 
                        disabled={addingExpense || !newExpTitle.trim() || !newExpAmount}
                        className="btn btn-sm btn-primary rounded-xl font-black gap-1 text-xs shrink-0"
                      >
                        <Plus className="w-4 h-4" /> Log Expense
                      </button>
                    </form>

                    {/* Expenses Table */}
                    <div className="overflow-x-auto">
                      <table className="table table-sm text-xs">
                        <thead>
                          <tr className="border-b border-base-200">
                            <th>Expense</th>
                            <th>Paid By</th>
                            <th>Date</th>
                            <th className="text-right">Amount</th>
                            <th className="text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(groupDetails.expenses || []).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-6 text-base-content/50">
                                No expenses logged yet. Add your first shared cost above!
                              </td>
                            </tr>
                          ) : (
                            groupDetails.expenses.map(exp => (
                              <tr key={exp.id}>
                                <td className="font-bold">{exp.title}</td>
                                <td>{exp.paidBy}</td>
                                <td className="text-base-content/60">{exp.date}</td>
                                <td className="font-black text-right text-primary">
                                  {Number(exp.amount).toLocaleString()} BDT
                                </td>
                                <td className="text-right">
                                  <button 
                                    onClick={() => handleDeleteExpense(exp.id)}
                                    className="btn btn-ghost btn-xs text-error rounded-lg"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 3: LIVE GROUP CHAT */}
                {/* ========================================================================= */}
                {activeTab === "chat" && (
                  <div className="card bg-base-100 border border-base-200 rounded-3xl overflow-hidden shadow-xs flex flex-col h-[520px]">
                    {/* Chat Header */}
                    <div className="bg-base-200/60 p-4 border-b border-base-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        <span className="font-black text-xs text-base-content">
                          {groupDetails.title} • Live Chat Stream
                        </span>
                      </div>
                      <Link 
                        to={`/chats?conversationId=${groupDetails.conversationId}`} 
                        className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                      >
                        Open in Full Chat <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3">
                      {loadingChat ? (
                        <div className="text-center py-10">
                          <span className="loading loading-spinner loading-md text-primary"></span>
                        </div>
                      ) : chatMessages.length === 0 ? (
                        <div className="text-center py-16 text-xs text-base-content/50 space-y-1">
                          <MessageSquare className="w-8 h-8 mx-auto text-base-content/30" />
                          <p className="font-bold">No messages in this expedition chat yet.</p>
                          <p>Start the conversation below!</p>
                        </div>
                      ) : (
                        chatMessages.map(msg => {
                          const isMe = msg.senderId === currentUserId || msg.sender_id === currentUserId;
                          const isSystem = msg.type === "system" || msg.message_type === "system";

                          if (isSystem) {
                            return (
                              <div key={msg.id} className="text-center py-1">
                                <span className="badge badge-ghost badge-sm text-[10px] text-base-content/60 font-semibold px-3 py-1">
                                  {msg.text || msg.message_text}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div key={msg.id} className={`chat ${isMe ? "chat-end" : "chat-start"}`}>
                              <div className="chat-image avatar">
                                <div className="w-7 h-7 rounded-full">
                                  <img 
                                    src={msg.senderAvatar || msg.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${msg.senderName || 'traveler'}`} 
                                    alt="Avatar" 
                                  />
                                </div>
                              </div>
                              <div className="chat-header text-[10px] text-base-content/50 mb-0.5">
                                {msg.senderName} <time className="text-[9px] opacity-70 ml-1">{msg.time || ""}</time>
                              </div>
                              <div className={`chat-bubble text-xs ${isMe ? "chat-bubble-primary text-primary-content" : "bg-base-200 text-base-content"}`}>
                                {msg.text || msg.message_text}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-base-200/50 border-t border-base-200 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Type message to expedition team..." 
                        className="input input-bordered input-sm flex-1 rounded-xl text-xs"
                        value={newChatMessage}
                        onChange={(e) => setNewChatMessage(e.target.value)}
                      />
                      <button 
                        type="submit" 
                        disabled={sendingMessage || !newChatMessage.trim()}
                        className="btn btn-sm btn-primary rounded-xl font-bold gap-1 text-xs"
                      >
                        <Send className="w-3.5 h-3.5" /> Send
                      </button>
                    </form>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 4: ITINERARY WITH SUGGESTIONS / APPEALS WORKFLOW */}
                {/* ========================================================================= */}
                {activeTab === "itinerary" && (
                  <div className="space-y-6">
                    
                    {/* Itinerary Header & Propose Appeal Button */}
                    <div className="card bg-base-100 border border-base-200 p-6 rounded-3xl shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-black text-lg text-base-content m-0 flex items-center gap-2">
                          <Compass className="w-5 h-5 text-primary" /> Day-by-Day Expedition Itinerary
                        </h3>
                        <p className="text-xs text-base-content/60 m-0">Scheduled activities, checkpoints, and collaborative proposals from team members.</p>
                      </div>

                      <button 
                        onClick={() => {
                          setAppealDay((groupDetails.itinerary?.[0]?.day) || "Day 1");
                          setIsAppealModalOpen(true);
                        }}
                        className="btn btn-sm btn-primary rounded-2xl font-black gap-2 text-xs shadow-sm shrink-0"
                      >
                        <Lightbulb className="w-4 h-4 text-amber-300" /> Propose Activity / Appeal
                      </button>
                    </div>

                    {/* ========================================================================= */}
                    {/* ORGANIZER REVIEW PANEL FOR ITINERARY APPEALS */}
                    {/* ========================================================================= */}
                    {groupDetails.isOrganizer && pendingSuggestions.length > 0 && (
                      <div className="card bg-gradient-to-r from-amber-500/10 via-base-100 to-amber-500/10 border-2 border-amber-500/40 p-6 rounded-3xl shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-amber-500 animate-bounce" />
                            <h4 className="font-black text-base text-base-content m-0">
                              Member Itinerary Appeals Awaiting Your Review ({pendingSuggestions.length})
                            </h4>
                          </div>
                          <span className="text-xs text-base-content/60">
                            Accept to automatically merge into the official itinerary schedule, or decline with a reason.
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {pendingSuggestions.map(sug => (
                            <div key={sug.id} className="card bg-base-100 border border-amber-500/30 p-4 rounded-2xl shadow-xs flex flex-col justify-between space-y-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <img src={sug.userAvatar} className="w-8 h-8 rounded-full border" alt="Member" />
                                    <div>
                                      <span className="font-extrabold text-xs text-base-content block">{sug.userName}</span>
                                      <span className="text-[10px] text-base-content/50 block">Proposed for <span className="font-bold text-primary">{sug.day}</span></span>
                                    </div>
                                  </div>
                                  <span className="badge badge-warning font-black text-[10px] px-2">
                                    ⏳ Pending Review
                                  </span>
                                </div>

                                <div className="bg-base-200/50 p-3 rounded-xl space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-base-content/50 block">Suggested Activity / Plan:</span>
                                  <p className="text-xs font-semibold text-base-content m-0 leading-relaxed whitespace-pre-line">
                                    {sug.activityPlan}
                                  </p>
                                </div>

                                {sug.reason && (
                                  <div className="text-[11px] text-base-content/70 italic bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                                    <span className="font-bold not-italic text-amber-600 dark:text-amber-400">Reason / Note: </span>
                                    "{sug.reason}"
                                  </div>
                                )}
                              </div>

                              <div className="pt-2 border-t border-base-200 flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    setRejectingSuggestion(sug);
                                    setRejectionReasonText("");
                                  }}
                                  className="btn btn-xs btn-ghost text-error font-bold rounded-lg px-2.5"
                                >
                                  Decline with Reason
                                </button>
                                <button 
                                  onClick={() => handleAcceptSuggestion(sug.id)}
                                  className="btn btn-xs btn-success text-white font-bold rounded-lg px-3 gap-1 shadow-xs"
                                >
                                  <Check className="w-3.5 h-3.5" /> Accept & Merge
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Official Day-by-Day Itinerary Schedule */}
                    <div className="card bg-base-100 border border-base-200 p-6 rounded-3xl space-y-4 shadow-xs">
                      <h4 className="font-extrabold text-sm text-base-content uppercase tracking-wider m-0">
                        Official Trip Schedule
                      </h4>

                      <div className="space-y-3 pt-1">
                        {(groupDetails.itinerary || []).map((dayPlan, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 rounded-2xl bg-base-200/40 border border-base-200 items-start">
                            <div className="badge badge-primary font-black text-xs py-2.5 px-3 shrink-0">
                              {dayPlan.day || `Day ${idx + 1}`}
                            </div>
                            <div className="text-xs text-base-content/80 m-0 leading-relaxed pt-0.5 whitespace-pre-line flex-1">
                              {dayPlan.plan}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Community Proposals & Appeals History */}
                    {(groupDetails.itinerarySuggestions || []).length > 0 && (
                      <div className="card bg-base-100 border border-base-200 p-6 rounded-3xl space-y-4 shadow-xs">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-sm text-base-content uppercase tracking-wider m-0 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-primary" /> Member Suggestions & Appeals Log ({(groupDetails.itinerarySuggestions || []).length})
                          </h4>
                          <span className="text-xs text-base-content/50">
                            History of all ideas submitted by expedition members
                          </span>
                        </div>

                        <div className="space-y-3 pt-1">
                          {(groupDetails.itinerarySuggestions || []).map(sug => {
                            const isMine = sug.userId === currentUserId;
                            return (
                              <div 
                                key={sug.id} 
                                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2.5 ${
                                  sug.status === "accepted" ? "bg-emerald-500/5 border-emerald-500/20" :
                                  sug.status === "rejected" ? "bg-rose-500/5 border-rose-500/20" :
                                  "bg-base-200/40 border-base-200"
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                  <div className="flex items-center gap-2">
                                    <img src={sug.userAvatar} className="w-6 h-6 rounded-full border" alt="User" />
                                    <span className="font-bold text-xs text-base-content">{sug.userName}</span>
                                    <span className="badge badge-ghost badge-sm text-[10px] font-semibold">{sug.day}</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {sug.status === "accepted" && (
                                      <span className="badge badge-success text-white badge-sm font-bold text-[10px] gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Accepted & Added
                                      </span>
                                    )}
                                    {sug.status === "rejected" && (
                                      <span className="badge badge-error text-white badge-sm font-bold text-[10px] gap-1">
                                        <XCircle className="w-3 h-3" /> Declined
                                      </span>
                                    )}
                                    {sug.status === "pending" && (
                                      <span className="badge badge-warning badge-sm font-bold text-[10px] gap-1">
                                        ⏳ Awaiting Creator Review
                                      </span>
                                    )}

                                    {/* Submitter can delete/withdraw their proposal */}
                                    {isMine && sug.status === "pending" && (
                                      <button 
                                        onClick={() => handleDeleteSuggestion(sug.id)}
                                        className="btn btn-ghost btn-xs text-error rounded-lg font-bold text-[10px] px-2"
                                        title="Withdraw Proposal"
                                      >
                                        Withdraw
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <p className="text-xs text-base-content font-medium m-0 leading-relaxed whitespace-pre-line pl-8">
                                  {sug.activityPlan}
                                </p>

                                {sug.reason && (
                                  <p className="text-[11px] text-base-content/60 italic m-0 pl-8">
                                    Motivation: "{sug.reason}"
                                  </p>
                                )}

                                {/* Reason message from Creator if rejected */}
                                {sug.status === "rejected" && sug.rejectionReason && (
                                  <div className="ml-8 mt-1 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                                    <span className="font-bold block text-[10px] uppercase tracking-wider">Note from Expedition Organizer:</span>
                                    <span className="font-semibold">{sug.rejectionReason}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: "SEE MORE" DETAILED EXPEDITION VIEW MODAL */}
        {/* ========================================================================= */}
        {detailModalGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-base-100 border border-base-300 rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-1">
                  <span className="badge badge-primary badge-sm font-black text-[10px]">
                    Expedition Overview
                  </span>
                  <h3 className="font-black text-xl text-base-content m-0">
                    {detailModalGroup.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setDetailModalGroup(null)}
                  className="btn btn-ghost btn-sm btn-circle text-base-content/60"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2.5 bg-base-200/60 p-4 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-base-content/50 uppercase font-bold block">Destination</span>
                    <span className="font-extrabold text-base-content flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" /> {detailModalGroup.destination}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-base-content/50 uppercase font-bold block">Travel Date</span>
                    <span className="font-extrabold text-base-content flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-secondary" /> {formatDate(detailModalGroup.travelDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-base-content/50 uppercase font-bold block">Est. Budget per Person</span>
                    <span className="font-extrabold text-primary text-sm mt-0.5 block">
                      {Number(detailModalGroup.estimatedBudget).toLocaleString()} BDT
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-base-content/50 uppercase font-bold block">Team Capacity</span>
                    <span className="font-extrabold text-base-content text-sm mt-0.5 block">
                      {detailModalGroup.memberCount || 1}/{detailModalGroup.maxMembers} Members
                    </span>
                  </div>
                </div>

                {/* Organizer Profile Information */}
                <div className="p-4 bg-base-200/40 rounded-2xl border border-base-200 space-y-2">
                  <span className="text-[10px] uppercase font-black text-base-content/50 block">Expedition Creator / Organizer</span>
                  <div className="flex items-center gap-3">
                    <img 
                      src={detailModalGroup.organizer?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${detailModalGroup.organizer?.name || 'traveler'}`} 
                      className="w-11 h-11 rounded-full object-cover border" 
                      alt="Organizer" 
                    />
                    <div>
                      <span className="font-extrabold text-sm text-base-content block">
                        {detailModalGroup.organizer?.name || "Organizer"}
                      </span>
                      <span className="text-[11px] text-base-content/60 block">
                        @{detailModalGroup.organizer?.username || "traveler"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Logistics */}
                <div className="space-y-2 bg-base-200/40 p-4 rounded-2xl border border-base-200">
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-accent" />
                    <span className="text-base-content/70">Transportation:</span>
                    <span className="font-bold text-base-content">{detailModalGroup.transportation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-500" />
                    <span className="text-base-content/70">Stay / Accommodation:</span>
                    <span className="font-bold text-base-content">{detailModalGroup.accommodationPlan}</span>
                  </div>
                </div>

                {/* Itinerary Schedule Preview */}
                {detailModalGroup.itinerary && detailModalGroup.itinerary.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-black text-base-content/50 block">Itinerary Plan</span>
                    <div className="space-y-2">
                      {detailModalGroup.itinerary.map((d, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-base-200/50 border border-base-200/60 flex items-start gap-2.5">
                          <span className="badge badge-primary badge-xs font-bold shrink-0">{d.day || `Day ${i + 1}`}</span>
                          <span className="text-xs text-base-content/80 whitespace-pre-line">{d.plan}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons inside Modal */}
              <div className="pt-2 border-t border-base-200 flex justify-end gap-2">
                <button 
                  onClick={() => setDetailModalGroup(null)}
                  className="btn btn-sm btn-ghost rounded-xl font-bold text-xs"
                >
                  Close
                </button>

                {detailModalGroup.isOrganizer || detailModalGroup.isMember ? (
                  <button 
                    onClick={() => {
                      setSelectedGroupId(detailModalGroup.id);
                      setDetailModalGroup(null);
                    }}
                    className="btn btn-sm btn-primary rounded-xl font-bold text-xs gap-1 shadow-xs"
                  >
                    Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : detailModalGroup.isPending ? (
                  <button 
                    onClick={() => handleWithdrawRequest(detailModalGroup.id)}
                    className="btn btn-sm btn-error btn-outline rounded-xl font-bold text-xs"
                  >
                    Withdraw Request
                  </button>
                ) : (
                  <button 
                    onClick={() => handleJoinRequest(detailModalGroup.id)}
                    className="btn btn-sm btn-primary rounded-xl font-bold text-xs gap-1 shadow-xs"
                  >
                    Request to Join <UserPlus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: CREATE NEW EXPEDITION MODAL */}
        {/* ========================================================================= */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-base-100 border border-base-300 rounded-3xl w-full max-w-xl p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-2xl text-base-content m-0">
                    Plan a Group Expedition
                  </h3>
                  <p className="text-xs text-base-content/60 mt-1">
                    Set up your cooperative trip, gather travelers, and collaborate seamlessly.
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost btn-sm btn-circle text-base-content/60"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
                
                <div className="space-y-1">
                  <label className="font-bold text-base-content">Expedition Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 3-Day Sajek Valley & Konglak Peak Cloud Walk"
                    className="input input-bordered w-full rounded-2xl text-xs"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-base-content">Destination</label>
                    <select 
                      className="select select-bordered w-full rounded-2xl text-xs"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    >
                      {MOCK_DESTINATIONS.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-base-content">Travel Date</label>
                    <input 
                      type="date" 
                      className="input input-bordered w-full rounded-2xl text-xs"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-base-content">Estimated Budget per Person (BDT)</label>
                    <input 
                      type="number" 
                      className="input input-bordered w-full rounded-2xl text-xs"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-base-content">Max Team Members</label>
                    <input 
                      type="number" 
                      min="2"
                      max="30"
                      className="input input-bordered w-full rounded-2xl text-xs"
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-base-content">Transport Mode</label>
                    <input 
                      type="text" 
                      placeholder="e.g. AC Bus, Chander Gari, Speedboat"
                      className="input input-bordered w-full rounded-2xl text-xs"
                      value={transport}
                      onChange={(e) => setTransport(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-base-content">Accommodation Plan</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Eco Resort & Tents"
                      className="input input-bordered w-full rounded-2xl text-xs"
                      value={accommodation}
                      onChange={(e) => setAccommodation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-base-200 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-sm btn-ghost rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={creatingGroup || !title.trim()}
                    className="btn btn-sm btn-primary rounded-xl font-black text-xs gap-1.5 shadow"
                  >
                    {creatingGroup ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Launch Expedition (+75 pts)
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: PROPOSE ITINERARY ACTIVITY / APPEAL MODAL */}
        {/* ========================================================================= */}
        {isAppealModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-base-100 border border-base-300 rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-start">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1">
                    <Lightbulb className="w-3.5 h-3.5" /> Collaborative Proposal
                  </div>
                  <h3 className="font-black text-xl text-base-content m-0">
                    Propose Itinerary Activity / Appeal
                  </h3>
                  <p className="text-xs text-base-content/60 mt-1">
                    Suggest a spot or activity for the trip. The expedition creator will review and approve it into the schedule.
                  </p>
                </div>
                <button 
                  onClick={() => setIsAppealModalOpen(false)}
                  className="btn btn-ghost btn-sm btn-circle text-base-content/60"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleProposeItinerary} className="space-y-4 text-xs">
                
                <div className="space-y-1">
                  <label className="font-bold text-base-content">Target Trip Day</label>
                  <select 
                    className="select select-bordered w-full rounded-2xl text-xs"
                    value={appealDay}
                    onChange={(e) => setAppealDay(e.target.value)}
                  >
                    {(groupDetails?.itinerary || []).map((d, i) => (
                      <option key={i} value={d.day || `Day ${i + 1}`}>
                        {d.day || `Day ${i + 1}`}
                      </option>
                    ))}
                    <option value="custom">➕ Custom / New Day Schedule...</option>
                  </select>
                </div>

                {appealDay === "custom" && (
                  <div className="space-y-1">
                    <label className="font-bold text-base-content">Custom Day Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Day 4 (Optional Extension) or Evening Bonfire"
                      className="input input-bordered w-full rounded-2xl text-xs"
                      value={customAppealDay}
                      onChange={(e) => setCustomAppealDay(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-base-content">Proposed Activity / Spot Description</label>
                  <textarea 
                    rows={3}
                    placeholder="Describe the activity, timing, and checkpoint (e.g., Sunset watch from Konglak Peak at 5:30 PM followed by traditional bamboo tea at local stalls)..."
                    className="textarea textarea-bordered w-full rounded-2xl text-xs leading-relaxed"
                    value={appealActivity}
                    onChange={(e) => setAppealActivity(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-base-content">Why should we do this? (Reason / Motivation)</label>
                  <textarea 
                    rows={2}
                    placeholder="e.g., Highest peak in Sajek Valley with 360-degree panoramic cloud views; highly recommended by locals."
                    className="textarea textarea-bordered w-full rounded-2xl text-xs leading-relaxed"
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                  />
                </div>

                <div className="pt-3 border-t border-base-200 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsAppealModalOpen(false)}
                    className="btn btn-sm btn-ghost rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submittingAppeal || !appealActivity.trim()}
                    className="btn btn-sm btn-primary rounded-xl font-black text-xs gap-1.5 shadow"
                  >
                    {submittingAppeal ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Submit Appeal (+15 pts)
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 4: ORGANIZER DECLINE REASON MODAL */}
        {/* ========================================================================= */}
        {rejectingSuggestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-base-100 border border-base-300 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-lg text-base-content m-0">
                    Decline Itinerary Proposal
                  </h3>
                  <p className="text-xs text-base-content/60 mt-1">
                    Provide a reason so {rejectingSuggestion.userName} understands the decision.
                  </p>
                </div>
                <button 
                  onClick={() => setRejectingSuggestion(null)}
                  className="btn btn-ghost btn-sm btn-circle text-base-content/60"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-base-200/50 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-base-content block">{rejectingSuggestion.userName}'s suggestion for {rejectingSuggestion.day}:</span>
                <p className="text-base-content/70 m-0 line-clamp-2 italic">"{rejectingSuggestion.activityPlan}"</p>
              </div>

              <form onSubmit={handleRejectSuggestionSubmit} className="space-y-4 text-xs">
                
                <div className="space-y-1.5">
                  <label className="font-bold text-base-content">Reason for Declining</label>
                  <textarea 
                    rows={3}
                    placeholder="e.g. Schedule for Day 2 is already packed, or location is outside our planned route..."
                    className="textarea textarea-bordered w-full rounded-2xl text-xs"
                    value={rejectionReasonText}
                    onChange={(e) => setRejectionReasonText(e.target.value)}
                    required
                  />

                  {/* Quick Reason Suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      "Schedule already packed",
                      "Too far from accommodation route",
                      "Exceeds estimated budget",
                      "Weather / safety considerations"
                    ].map((chip, i) => (
                      <button 
                        key={i} 
                        type="button" 
                        onClick={() => setRejectionReasonText(chip)}
                        className="badge badge-ghost hover:badge-primary text-[10px] font-semibold cursor-pointer transition-all"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-base-200 flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setRejectingSuggestion(null)}
                    className="btn btn-sm btn-ghost rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submittingRejection || !rejectionReasonText.trim()}
                    className="btn btn-sm btn-error text-white rounded-xl font-black text-xs gap-1"
                  >
                    {submittingRejection ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      "Confirm Decline"
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
