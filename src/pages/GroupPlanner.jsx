import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MOCK_GROUP_TOURS, MOCK_DESTINATIONS, MOCK_USERS } from "../data/mockData";
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
  CheckCircle2
} from "lucide-react";
import confetti from "canvas-confetti";

export default function GroupPlanner() {
  const { currentUser, addPoints } = useAuth();
  
  // Build initial demo groups dynamically ensuring current user is part of at least 2 expeditions (1 Organized, 1 Joined)
  const getInitialGroups = () => {
    const userObj = currentUser || {
      id: "user_demo",
      name: "Travel Explorer",
      username: "traveler",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=traveler",
      league: "Explorer"
    };

    const saved = localStorage.getItem("ts_groups");
    let baseList = MOCK_GROUP_TOURS;
    if (saved) {
      try {
        baseList = JSON.parse(saved);
      } catch (err) {
        console.error("Failed to parse saved group expeditions", err);
      }
    }

    // Ensure group_1 includes currentUser in members list
    const updatedBase = baseList.map(g => {
      if (g.id === "group_1") {
        const hasUser = g.members?.some(m => m.id === userObj.id || m.username === userObj.username || m.name === userObj.name);
        if (!hasUser) {
          return {
            ...g,
            members: [userObj, ...(g.members || [])]
          };
        }
      }
      return g;
    });

    // Check if currentUser already has an organized group
    const hasOrganizedGroup = updatedBase.some(g => 
      g.organizer?.id === userObj.id || 
      g.organizer?.username === userObj.username || 
      g.organizer?.name === userObj.name
    );

    if (!hasOrganizedGroup) {
      const demoOrganizedGroup = {
        id: "group_demo_org_" + (userObj.id || "demo"),
        title: "Cox's Bazar Marine Drive Rally 🏖️",
        destination: "Cox's Bazar Beach",
        travelDate: "2026-12-10",
        estimatedBudget: 8500,
        maxMembers: 8,
        transportation: "AC Luxury Bus",
        accommodationPlan: "Mermaid Eco Resort",
        organizer: userObj,
        members: [userObj, MOCK_USERS[1]],
        requests: [
          { id: "req_demo_1", user: MOCK_USERS[2], status: "pending" }
        ],
        itinerary: [
          { day: "Day 1", plan: "Depart Dhaka by overnight bus. Check in at Mermaid Eco Resort. Sunset at Inani Beach." },
          { day: "Day 2", plan: "Marine Drive road trip to Teknaf. Fresh seafood BBQ at Himchari waterfall." },
          { day: "Day 3", plan: "Morning beach sports and shopping. Return bus to Dhaka." }
        ],
        checklist: [
          { id: "chk_d1", task: "Book AC Bus group seats", completed: true, assignedTo: userObj.name },
          { id: "chk_d2", task: "Confirm Eco Resort rooms", completed: true, assignedTo: userObj.name },
          { id: "chk_d3", task: "Arrange Marine Drive open jeep rental", completed: false, assignedTo: "Nabil Ahmed" }
        ],
        expenses: [
          { id: "exp_d1", title: "Resort Advance Booking", amount: 12000, paidBy: userObj.name, date: "2026-08-10" }
        ],
        messages: [
          { id: "gmsg_d1", sender: userObj, text: "Welcome everyone to our Cox's Bazar rally! Check the checklist for assigned tasks.", time: "Aug 10, 10:00 AM" }
        ]
      };
      return [demoOrganizedGroup, ...updatedBase];
    }

    return updatedBase;
  };

  const [groups, setGroups] = useState(getInitialGroups);

  // State: selectedGroupId = null (shows list of expeditions), or string ID (shows details/workspace)
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState("checklist"); // checklist, budget, chat, itinerary

  // Modal State to create new expedition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [destination, setDestination] = useState(MOCK_DESTINATIONS[0]?.name || "Cox's Bazar Beach");
  const [title, setTitle] = useState("");
  const [travelDate, setTravelDate] = useState("2026-12-01");
  const [budget, setBudget] = useState(8500);
  const [maxMembers, setMaxMembers] = useState(8);
  const [transport, setTransport] = useState("AC Bus & Boat");
  const [accommodation, setAccommodation] = useState("Beach Resort & Camping");

  // Inputs for workspace
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  
  const [newExpTitle, setNewExpTitle] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpPaidBy, setNewExpPaidBy] = useState("");

  const [newChatMessage, setNewChatMessage] = useState("");

  // Sync groups to localStorage
  useEffect(() => {
    localStorage.setItem("ts_groups", JSON.stringify(groups));
  }, [groups]);

  // Check if a user belongs to a group as member or organizer
  const isMember = (group) => {
    if (!group || !currentUser) return false;
    const currentId = currentUser.id || currentUser.username;
    const currentName = currentUser.name || currentUser.username;
    const currentUsername = currentUser.username;

    const isOrganizer = group.organizer?.id === currentId || 
                        group.organizer?.username === currentUsername || 
                        group.organizer?.name === currentName;

    const isMemberInList = group.members?.some(m => 
      m.id === currentId || 
      m.username === currentUsername || 
      m.name === currentName
    );

    return isOrganizer || isMemberInList;
  };

  // Filter My Expeditions vs Explore Expeditions
  const myExpeditions = groups.filter(g => isMember(g));
  const exploreExpeditions = groups.filter(g => !isMember(g));

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const isSelectedGroupMember = selectedGroup ? isMember(selectedGroup) : false;

  // Create new expedition
  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const userObj = currentUser || { name: "You", username: "you", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=you" };

    const newGroup = {
      id: "group_" + Date.now(),
      title: title.trim(),
      destination: destination,
      travelDate: travelDate,
      estimatedBudget: Number(budget),
      maxMembers: Number(maxMembers),
      transportation: transport,
      accommodationPlan: accommodation,
      organizer: userObj,
      members: [userObj],
      requests: [],
      itinerary: [
        { day: "Day 1", plan: "Depart and check into accommodation. Evening group dinner." },
        { day: "Day 2", plan: "Sightseeing, photography, and local adventure trails." },
        { day: "Day 3", plan: "Return journey back home." }
      ],
      checklist: [
        { id: "chk_" + Date.now(), task: "Book transport tickets", completed: false, assignedTo: userObj.name }
      ],
      expenses: [],
      messages: []
    };

    const updated = [newGroup, ...groups];
    setGroups(updated);
    setSelectedGroupId(newGroup.id);
    setIsModalOpen(false);
    
    addPoints(75);
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  };

  // Join Request Action
  const handleJoinRequest = (groupId) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const alreadyRequested = g.requests?.some(r => r.user?.id === currentUser?.id || r.user?.username === currentUser?.username);
        if (alreadyRequested) return g;
        return {
          ...g,
          requests: [
            ...(g.requests || []),
            { id: "req_" + Date.now(), user: currentUser, status: "pending" }
          ]
        };
      }
      return g;
    }));
    alert("✉️ Join request sent to the expedition organizer!");
  };

  // Organizer accepts user
  const handleAcceptUser = (groupId, requestId) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const req = g.requests?.find(r => r.id === requestId);
        if (!req) return g;
        
        return {
          ...g,
          members: [...g.members, req.user],
          requests: g.requests.filter(r => r.id !== requestId)
        };
      }
      return g;
    }));
  };

  // Organizer rejects user
  const handleRejectUser = (groupId, requestId) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          requests: g.requests.filter(r => r.id !== requestId)
        };
      }
      return g;
    }));
  };

  // Collaborative Checklist Action
  const toggleChecklist = (taskId) => {
    if (!selectedGroupId) return;
    setGroups(prev => prev.map(g => {
      if (g.id === selectedGroupId) {
        return {
          ...g,
          checklist: g.checklist.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
        };
      }
      return g;
    }));
    addPoints(5);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim() || !selectedGroupId) return;

    setGroups(prev => prev.map(g => {
      if (g.id === selectedGroupId) {
        return {
          ...g,
          checklist: [
            ...g.checklist,
            {
              id: "task_" + Date.now(),
              task: newTaskText.trim(),
              completed: false,
              assignedTo: newTaskAssignee || currentUser?.name || "You"
            }
          ]
        };
      }
      return g;
    }));
    setNewTaskText("");
    addPoints(10);
  };

  // Expense Splitting
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpTitle.trim() || !newExpAmount || !selectedGroupId) return;

    setGroups(prev => prev.map(g => {
      if (g.id === selectedGroupId) {
        return {
          ...g,
          expenses: [
            ...g.expenses,
            {
              id: "exp_" + Date.now(),
              title: newExpTitle.trim(),
              amount: Number(newExpAmount),
              paidBy: newExpPaidBy || currentUser?.name || "You",
              date: new Date().toISOString().split("T")[0]
            }
          ]
        };
      }
      return g;
    }));

    setNewExpTitle("");
    setNewExpAmount("");
    addPoints(15);
  };

  // Collaborative Chat Message
  const handleSendGroupMessage = (e) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !selectedGroupId) return;

    setGroups(prev => prev.map(g => {
      if (g.id === selectedGroupId) {
        return {
          ...g,
          messages: [
            ...g.messages,
            {
              id: "gmsg_" + Date.now(),
              sender: currentUser || { name: "You", username: "you", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=you" },
              text: newChatMessage.trim(),
              time: "Just now"
            }
          ]
        };
      }
      return g;
    }));

    setNewChatMessage("");
    addPoints(2);
  };

  // Calculated totals for active workspace
  const totalSpent = selectedGroup?.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const perMemberShare = selectedGroup?.members?.length > 0 ? Math.round(totalSpent / selectedGroup.members.length) : 0;

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-6xl space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-base-100 border border-base-200 p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1 text-base-content flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" /> Group Expeditions
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70">
            Browse available travel groups or manage your joined expedition workspace.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary text-white font-bold rounded-2xl shadow-lg border-none capitalize gap-2 px-5 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-5 h-5" /> Plan Expedition
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: OVERVIEW PAGE (When no expedition is selected: selectedGroupId === null) */}
      {/* ========================================================================= */}
      {selectedGroupId === null ? (
        <div className="space-y-10">
          
          {/* SECTION A: MY EXPEDITIONS (Expeditions the user belongs to) */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-base-200 pb-3">
              <div>
                <h2 className="text-xl font-black text-base-content flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-success" /> My Expeditions
                </h2>
                <p className="text-xs text-base-content/60">Expeditions you are organizing or currently participating in.</p>
              </div>
              <span className="badge badge-success text-white font-bold px-3 py-1 text-xs">
                {myExpeditions.length} Joined / Organized
              </span>
            </div>

            {myExpeditions.length === 0 ? (
              <div className="text-center py-10 bg-base-100 rounded-3xl border border-dashed border-base-300 p-6 space-y-2">
                <Compass className="w-10 h-10 text-primary mx-auto opacity-50" />
                <h3 className="font-bold text-sm text-base-content">You haven't joined any expedition yet</h3>
                <p className="text-xs text-base-content/60 max-w-sm mx-auto">
                  Browse available expeditions below and send a join request, or create your own group expedition!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myExpeditions.map(group => {
                  const isOrganizer = group.organizer?.id === currentUser?.id || 
                                      group.organizer?.username === currentUser?.username || 
                                      group.organizer?.name === currentUser?.name;

                  return (
                    <div 
                      key={group.id} 
                      className="card bg-base-100 border-2 border-primary/40 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-black text-base text-base-content leading-snug">{group.title}</h3>
                          {isOrganizer ? (
                            <span className="badge badge-warning font-bold text-[10px] text-slate-900 shrink-0 gap-1 shadow-sm">
                              Organizer 👑
                            </span>
                          ) : (
                            <span className="badge badge-success text-white font-bold text-[10px] shrink-0 gap-1 shadow-sm">
                              Joined 🤝
                            </span>
                          )}
                        </div>

                        {/* Visual Tag for Member Status */}
                        <div className="bg-primary/10 border border-primary/20 p-2 rounded-2xl flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-[11px] font-bold text-primary">
                            {isOrganizer ? "You are organizing this expedition" : "You are an active member of this group"}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-base-content/80 pt-1">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{group.destination}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-info shrink-0" />
                            <span>{group.travelDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-base-200 flex justify-between items-center">
                        <div className="flex items-center gap-1 text-xs text-base-content/70 font-bold">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          <span>{group.members?.length || 1} / {group.maxMembers} Members</span>
                        </div>

                        <button 
                          onClick={() => setSelectedGroupId(group.id)}
                          className="btn btn-sm btn-primary text-white font-bold rounded-xl gap-1 shadow"
                        >
                          Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION B: EXPLORE EXPEDITIONS (Expeditions the user is NOT part of) */}
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center border-b border-base-200 pb-3">
              <div>
                <h2 className="text-xl font-black text-base-content flex items-center gap-2">
                  <Compass className="w-5 h-5 text-primary" /> Explore Available Expeditions
                </h2>
                <p className="text-xs text-base-content/60">Discover open group trips created by other travelers and request to join.</p>
              </div>
              <span className="badge badge-outline font-bold px-3 py-1 text-xs">
                {exploreExpeditions.length} Available
              </span>
            </div>

            {exploreExpeditions.length === 0 ? (
              <div className="text-center py-10 bg-base-100 rounded-3xl border border-dashed border-base-300 p-6">
                <p className="text-xs text-base-content/60">No additional open expeditions available to join right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {exploreExpeditions.map(group => {
                  const hasRequested = group.requests?.some(r => r.user?.id === currentUser?.id || r.user?.username === currentUser?.username);
                  const isFull = (group.members?.length || 0) >= group.maxMembers;

                  return (
                    <div 
                      key={group.id} 
                      className="card bg-base-100 border border-base-200 p-5 rounded-3xl shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between space-y-4"
                    >
                      {/* Title & Geotag */}
                      <div className="space-y-2">
                        <h3 className="font-black text-base text-base-content leading-snug">{group.title}</h3>
                        
                        {/* Organizer Profile Card */}
                        <div className="flex items-center gap-2 bg-base-200/60 p-2 rounded-2xl border border-base-200">
                          <img 
                            src={group.organizer?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=organizer"} 
                            alt={group.organizer?.name} 
                            className="w-8 h-8 rounded-full object-cover border border-base-300"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-base-content block truncate">{group.organizer?.name}</span>
                            <span className="text-[10px] text-base-content/50 block font-mono">Creator • @{group.organizer?.username || "traveler"}</span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-1 text-xs text-base-content/75 pt-1">
                          <div className="flex items-center gap-1.5 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{group.destination}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-info shrink-0" />
                            <span>{group.travelDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-primary">
                            <DollarSign className="w-3.5 h-3.5 shrink-0" />
                            <span>Estimated Budget: {group.estimatedBudget} BDT / head</span>
                          </div>
                        </div>
                      </div>

                      {/* Member Capacity Progress */}
                      <div className="space-y-1 pt-2 border-t border-base-200">
                        <div className="flex justify-between items-center text-[11px] font-bold text-base-content/75">
                          <span>Members Capacity</span>
                          <span>{group.members?.length || 1} / {group.maxMembers} Joined</span>
                        </div>
                        <div className="w-full bg-base-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all" 
                            style={{ width: `${((group.members?.length || 1) / group.maxMembers) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-1">
                        <button 
                          onClick={() => setSelectedGroupId(group.id)}
                          className="btn btn-sm btn-outline flex-1 rounded-xl text-xs font-bold"
                        >
                          View Details
                        </button>

                        {hasRequested ? (
                          <span className="btn btn-sm btn-neutral text-white font-bold rounded-xl text-[10px] px-3 shrink-0">
                            Requested ⌛
                          </span>
                        ) : isFull ? (
                          <span className="btn btn-sm btn-disabled font-bold rounded-xl text-[10px] px-3 shrink-0">
                            Expedition Full
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleJoinRequest(group.id)}
                            className="btn btn-sm btn-primary text-white font-bold rounded-xl text-xs px-3 shrink-0 shadow"
                          >
                            Request Join
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: SELECTED EXPEDITION DETAILS / WORKSPACE */
        /* ========================================================================= */
        <div className="space-y-6">
          
          {/* Back Navigation Header */}
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSelectedGroupId(null)}
              className="btn btn-ghost btn-sm rounded-xl gap-2 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" /> Back to All Expeditions
            </button>
            <span className={`badge font-bold text-xs px-3 py-1 ${isSelectedGroupMember ? "badge-success text-white" : "badge-outline"}`}>
              {isSelectedGroupMember ? "Your Active Workspace" : "Expedition Preview Details"}
            </span>
          </div>

          {/* IF USER IS A MEMBER: SHOW FULL WORKSPACE CONSOLE */}
          {isSelectedGroupMember ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left / Center: Active Workspace Console (Takes 2 Cols) */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Active Group Header */}
                <div className="card bg-base-100 border border-base-200 p-5 md:p-6 shadow-sm rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Active Expedition Workspace</span>
                      <h2 className="text-2xl font-black text-base-content mt-0.5 mb-1">{selectedGroup.title}</h2>
                      <p className="text-xs text-base-content/70 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> {selectedGroup.destination} &nbsp;•&nbsp; 
                        <Calendar className="w-3.5 h-3.5 text-info" /> {selectedGroup.travelDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-base-200 py-2 px-3 rounded-2xl border border-base-300">
                      <Users className="w-4 h-4 text-primary" />
                      <div className="text-left leading-none">
                        <span className="text-[10px] text-base-content/60 block">Members</span>
                        <span className="text-xs font-bold">{selectedGroup.members?.length || 1} / {selectedGroup.maxMembers}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Details Cards */}
                  <div className="grid grid-cols-3 gap-2 bg-base-200/50 p-3 rounded-2xl border border-base-200 text-xs">
                    <div>
                      <span className="text-[10px] text-base-content/50 block">Est. Budget</span>
                      <span className="font-bold text-primary">{selectedGroup.estimatedBudget} BDT / hd</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-base-content/50 block">Transport</span>
                      <span className="font-semibold text-base-content/90 truncate block">{selectedGroup.transportation}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-base-content/50 block">Accommodation</span>
                      <span className="font-semibold text-base-content/90 truncate block">{selectedGroup.accommodationPlan || selectedGroup.accommodation}</span>
                    </div>
                  </div>

                  {/* Members Avatar List */}
                  <div className="flex items-center gap-2 pt-2 border-t border-base-200">
                    <span className="text-xs font-bold text-base-content/60 mr-2">Expedition Team:</span>
                    <div className="avatar-group -space-x-4 rtl:space-x-reverse">
                      {selectedGroup.members?.map((m, idx) => (
                        <Link key={idx} to={`/profile/${m.id || m.username}`} className="avatar border-2 border-base-100 w-8 h-8 rounded-full tooltip hover:scale-110 transition-transform" data-tip={m.name}>
                          <img src={m.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"} alt={m.name} />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Workspace Tab Panel */}
                <div className="card bg-base-100 border border-base-200 rounded-3xl overflow-hidden shadow-sm flex-1 min-h-[400px]">
                  
                  {/* Tabs */}
                  <div className="tabs tabs-boxed rounded-none bg-base-200 border-b border-base-300 p-1 flex flex-wrap gap-1">
                    <button 
                      onClick={() => setActiveTab("checklist")} 
                      className={`tab tab-sm font-bold capitalize gap-1.5 ${activeTab === "checklist" ? "tab-active bg-primary text-white font-black" : ""}`}
                    >
                      <CheckSquare className="w-3.5 h-3.5" /> Checklist
                    </button>
                    <button 
                      onClick={() => setActiveTab("budget")} 
                      className={`tab tab-sm font-bold capitalize gap-1.5 ${activeTab === "budget" ? "tab-active bg-primary text-white font-black" : ""}`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" /> Split-Expenses
                    </button>
                    <button 
                      onClick={() => setActiveTab("chat")} 
                      className={`tab tab-sm font-bold capitalize gap-1.5 ${activeTab === "chat" ? "tab-active bg-primary text-white font-black" : ""}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Chat Room
                    </button>
                    <button 
                      onClick={() => setActiveTab("itinerary")} 
                      className={`tab tab-sm font-bold capitalize gap-1.5 ${activeTab === "itinerary" ? "tab-active bg-primary text-white font-black" : ""}`}
                    >
                      <MapPin className="w-3.5 h-3.5" /> Itinerary
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="p-4 md:p-6 flex-1 flex flex-col justify-between">
                    
                    {/* Tab: CHECKLIST */}
                    {activeTab === "checklist" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-base-200">
                          <span className="text-xs font-bold text-base-content/60">Collaborative Preparation Tasks</span>
                          <span className="text-xs font-bold text-primary">
                            {selectedGroup.checklist?.filter(t => t.completed).length || 0} / {selectedGroup.checklist?.length || 0} Completed
                          </span>
                        </div>

                        <div className="space-y-2">
                          {selectedGroup.checklist?.map(task => (
                            <div 
                              key={task.id} 
                              onClick={() => toggleChecklist(task.id)}
                              className={`flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${task.completed ? 'bg-base-200/50 line-through text-base-content/40 border-base-200' : 'bg-base-100 hover:bg-base-200 border-base-300'}`}
                            >
                              <div className="flex items-center gap-3">
                                <input 
                                  type="checkbox" 
                                  checked={task.completed} 
                                  onChange={() => {}}
                                  className="checkbox checkbox-primary checkbox-xs rounded" 
                                />
                                <span className="text-xs font-semibold">{task.task}</span>
                              </div>
                              <span className="badge badge-sm badge-outline text-[10px] font-bold opacity-75">
                                👤 {task.assignedTo}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Add Checklist task */}
                        <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-base-200">
                          <input 
                            type="text" 
                            placeholder="Add task details..." 
                            className="input input-sm input-bordered flex-1 rounded-xl text-xs bg-base-100" 
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            required
                          />
                          <select 
                            className="select select-sm select-bordered rounded-xl text-xs"
                            value={newTaskAssignee}
                            onChange={(e) => setNewTaskAssignee(e.target.value)}
                          >
                            <option value="">Assignee (Default: Me)</option>
                            {selectedGroup.members?.map((m, idx) => (
                              <option key={idx} value={m.name}>{m.name}</option>
                            ))}
                          </select>
                          <button type="submit" className="btn btn-sm btn-primary text-white font-bold rounded-xl text-xs">Add Task</button>
                        </form>
                      </div>
                    )}

                    {/* Tab: BUDGET & SPLITS */}
                    {activeTab === "budget" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2 bg-primary/10 border border-primary/20 p-3 rounded-2xl text-center">
                          <div className="leading-tight">
                            <span className="text-[10px] text-base-content/60 block">Total Spent</span>
                            <span className="text-sm font-black text-primary">{totalSpent} BDT</span>
                          </div>
                          <div className="leading-tight border-x border-base-300">
                            <span className="text-[10px] text-base-content/60 block">Members</span>
                            <span className="text-sm font-black">{selectedGroup.members?.length || 1}</span>
                          </div>
                          <div className="leading-tight">
                            <span className="text-[10px] text-base-content/60 block">Share / head</span>
                            <span className="text-sm font-black text-secondary">{perMemberShare} BDT</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-bold text-base-content/60 block">Expense Ledger</span>
                          {selectedGroup.expenses?.length === 0 ? (
                            <div className="text-center py-6 text-xs text-base-content/50 border border-dashed border-base-300 rounded-2xl">
                              No expenses logged yet. Add one below!
                            </div>
                          ) : (
                            selectedGroup.expenses?.map(exp => (
                              <div key={exp.id} className="flex justify-between items-center p-3 rounded-2xl border border-base-300 bg-base-100">
                                <div>
                                  <h4 className="font-bold text-xs">{exp.title}</h4>
                                  <span className="text-[10px] text-base-content/50">Paid by: {exp.paidBy} &nbsp;•&nbsp; {exp.date}</span>
                                </div>
                                <span className="font-black text-sm text-primary">{exp.amount} BDT</span>
                              </div>
                            ))
                          )}
                        </div>

                        <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-base-200">
                          <input 
                            type="text" 
                            placeholder="e.g. Resort Deposit" 
                            className="input input-sm input-bordered flex-1 rounded-xl text-xs" 
                            value={newExpTitle}
                            onChange={(e) => setNewExpTitle(e.target.value)}
                            required
                          />
                          <input 
                            type="number" 
                            placeholder="Amount BDT" 
                            className="input input-sm input-bordered w-full sm:w-28 rounded-xl text-xs" 
                            value={newExpAmount}
                            onChange={(e) => setNewExpAmount(e.target.value)}
                            required
                          />
                          <select 
                            className="select select-sm select-bordered rounded-xl text-xs"
                            value={newExpPaidBy}
                            onChange={(e) => setNewExpPaidBy(e.target.value)}
                          >
                            <option value="">Paid By (Me)</option>
                            {selectedGroup.members?.map((m, idx) => (
                              <option key={idx} value={m.name}>{m.name}</option>
                            ))}
                          </select>
                          <button type="submit" className="btn btn-sm btn-primary text-white font-bold rounded-xl text-xs">Log Bill</button>
                        </form>
                      </div>
                    )}

                    {/* Tab: CHAT */}
                    {activeTab === "chat" && (
                      <div className="flex flex-col h-[350px]">
                        <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-base-200/50 rounded-2xl border border-base-300 mb-3">
                          {selectedGroup.messages?.length === 0 ? (
                            <div className="text-center py-10 text-xs text-base-content/40">
                              Welcome to the group chat! Start coordinating logistics here.
                            </div>
                          ) : (
                            selectedGroup.messages?.map(msg => {
                              const isMe = msg.sender?.id === currentUser?.id || msg.sender?.username === currentUser?.username;
                              return (
                                <div key={msg.id} className={`chat ${isMe ? "chat-end" : "chat-start"}`}>
                                  <div className="chat-image avatar">
                                    <div className="w-8 rounded-full border border-base-300">
                                      <img src={msg.sender?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"} alt={msg.sender?.name} />
                                    </div>
                                  </div>
                                  <div className="chat-header text-[10px] opacity-60">
                                    @{msg.sender?.username || "traveler"} &nbsp;<time className="text-[8px]">{msg.time}</time>
                                  </div>
                                  <div className={`chat-bubble text-xs ${isMe ? 'chat-bubble-primary text-white' : 'chat-bubble-neutral'}`}>
                                    {msg.text}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        <form onSubmit={handleSendGroupMessage} className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Type message to team..." 
                            className="input input-sm input-bordered flex-1 rounded-xl text-xs" 
                            value={newChatMessage}
                            onChange={(e) => setNewChatMessage(e.target.value)}
                            required
                          />
                          <button type="submit" className="btn btn-sm btn-primary text-white font-bold rounded-xl text-xs">Send</button>
                        </form>
                      </div>
                    )}

                    {/* Tab: ITINERARY */}
                    {activeTab === "itinerary" && (
                      <div className="space-y-4">
                        <span className="text-xs font-bold text-base-content/60 block pb-2 border-b border-base-200">Chronological Excursion Plan</span>
                        <div className="space-y-4">
                          {selectedGroup.itinerary?.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-start">
                              <div className="badge badge-primary py-2 px-3 rounded-lg font-black text-[10px]">{item.day}</div>
                              <div className="flex-1 bg-base-200 p-3 rounded-2xl border border-base-300 text-xs">
                                <p className="font-semibold text-base-content/85 leading-relaxed">{item.plan}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              </div>

              {/* Right Side: Expedition Approvals (for organizer) */}
              <div className="space-y-6">
                {(selectedGroup.organizer?.id === currentUser?.id || selectedGroup.organizer?.username === currentUser?.username) && selectedGroup.requests?.length > 0 && (
                  <div className="card bg-base-100 border border-base-200 p-5 rounded-3xl shadow-sm space-y-3">
                    <h3 className="font-bold text-sm text-warning flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" /> Expedition Approvals
                    </h3>
                    
                    <div className="space-y-2">
                      {selectedGroup.requests.map(req => (
                        <div key={req.id} className="p-3 bg-base-200 border border-base-300 rounded-2xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <img src={req.user?.avatar} className="w-7 h-7 rounded-full object-cover" alt="Requester" />
                            <div className="leading-tight">
                              <span className="text-xs font-bold block">{req.user?.name}</span>
                              <span className="text-[9px] text-base-content/50 block">@{req.user?.username}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleAcceptUser(selectedGroup.id, req.id)}
                              className="btn btn-xs btn-success text-white font-bold px-2 rounded-lg"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleRejectUser(selectedGroup.id, req.id)}
                              className="btn btn-xs btn-ghost text-error font-bold px-2 rounded-lg"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* IF USER IS NOT A MEMBER: SHOW DETAILS & DESCRIPTION PREVIEW CARD */
            <div className="card bg-base-100 border border-base-200 p-6 md:p-8 rounded-3xl shadow-lg space-y-6">
              
              {/* Header Title & Geotag */}
              <div className="border-b border-base-200 pb-5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="badge badge-primary font-bold text-xs px-3 py-1">Public Expedition Details</span>
                  <span className="text-xs text-base-content/60 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-info" /> {selectedGroup.travelDate}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-base-content">{selectedGroup.title}</h2>
                <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedGroup.destination}</span>
                </div>
              </div>

              {/* Creator / Organizer Profile Section */}
              <div className="bg-base-200/60 border border-base-300 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedGroup.organizer?.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=organizer"} 
                    alt={selectedGroup.organizer?.name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary" 
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-base-content">{selectedGroup.organizer?.name}</h4>
                      <span className="badge badge-warning text-[10px] font-bold text-slate-900">Expedition Organizer</span>
                    </div>
                    <span className="text-xs text-base-content/60 block">@{selectedGroup.organizer?.username || "organizer"}</span>
                  </div>
                </div>

                <Link 
                  to={`/profile/${selectedGroup.organizer?.id || selectedGroup.organizer?.username}`}
                  className="btn btn-xs btn-outline rounded-xl font-bold"
                >
                  View Creator Profile
                </Link>
              </div>

              {/* Members Joined Capacity */}
              <div className="space-y-3 bg-base-200/30 p-4 rounded-2xl border border-base-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-base-content flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" /> Members Capacity ({selectedGroup.members?.length || 1} / {selectedGroup.maxMembers} Joined)
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {selectedGroup.maxMembers - (selectedGroup.members?.length || 1)} Spots Left
                  </span>
                </div>

                <div className="w-full bg-base-300 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all" 
                    style={{ width: `${((selectedGroup.members?.length || 1) / selectedGroup.maxMembers) * 100}%` }}
                  />
                </div>

                {/* Member Avatars */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-base-content/60 font-semibold">Current Members:</span>
                  <div className="avatar-group -space-x-3 rtl:space-x-reverse">
                    {selectedGroup.members?.map((m, idx) => (
                      <div key={idx} className="avatar border-2 border-base-100 w-7 h-7 rounded-full tooltip" data-tip={m.name}>
                        <img src={m.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"} alt={m.name} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description & Logistics Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-base-200/50 p-4 rounded-2xl border border-base-200 space-y-1">
                  <span className="text-[10px] font-bold text-base-content/50 uppercase block">Estimated Budget</span>
                  <span className="font-black text-sm text-primary block">{selectedGroup.estimatedBudget} BDT</span>
                  <span className="text-[10px] text-base-content/60 block">Per member split share</span>
                </div>

                <div className="bg-base-200/50 p-4 rounded-2xl border border-base-200 space-y-1">
                  <span className="text-[10px] font-bold text-base-content/50 uppercase block">Transportation Mode</span>
                  <span className="font-bold text-xs text-base-content/90 block">{selectedGroup.transportation}</span>
                  <span className="text-[10px] text-base-content/60 block">Organized group route</span>
                </div>

                <div className="bg-base-200/50 p-4 rounded-2xl border border-base-200 space-y-1">
                  <span className="text-[10px] font-bold text-base-content/50 uppercase block font-semibold">Accommodation</span>
                  <span className="font-bold text-xs text-base-content/90 block">{selectedGroup.accommodationPlan || selectedGroup.accommodation}</span>
                  <span className="text-[10px] text-base-content/60 block">Reserved hotel / camping</span>
                </div>
              </div>

              {/* Itinerary Preview */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-base-content uppercase tracking-wider">Itinerary Outline Preview</h4>
                <div className="space-y-3">
                  {selectedGroup.itinerary?.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start bg-base-200/40 p-3 rounded-2xl border border-base-200">
                      <span className="badge badge-primary badge-sm font-bold text-[10px] mt-0.5">{item.day}</span>
                      <p className="text-xs text-base-content/85 leading-relaxed m-0">{item.plan}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Request to Join CTA */}
              <div className="pt-4 border-t border-base-200 flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedGroupId(null)} 
                  className="btn btn-ghost btn-md rounded-2xl text-xs font-bold"
                >
                  Back to List
                </button>

                {selectedGroup.requests?.some(r => r.user?.id === currentUser?.id || r.user?.username === currentUser?.username) ? (
                  <button disabled className="btn btn-neutral btn-md rounded-2xl font-bold text-xs px-6">
                    Join Request Sent (Pending Approval ⌛)
                  </button>
                ) : (selectedGroup.members?.length || 0) >= selectedGroup.maxMembers ? (
                  <button disabled className="btn btn-disabled btn-md rounded-2xl font-bold text-xs px-6">
                    Expedition Full
                  </button>
                ) : (
                  <button 
                    onClick={() => handleJoinRequest(selectedGroup.id)}
                    className="btn btn-primary btn-md rounded-2xl text-white font-bold text-xs px-6 shadow-lg shadow-primary/20"
                  >
                    Request to Join Expedition 🚀
                  </button>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* Plan Expedition Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-base-100 border border-base-300 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-lg text-base-content">Plan Group Expedition</h3>
            
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="form-control">
                <label className="label py-0.5"><span className="label-text text-xs font-bold">Expedition Name</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. Sajek Valley Trekking Tents" 
                  className="input input-sm input-bordered w-full rounded-xl text-xs" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label py-0.5"><span className="label-text text-xs font-bold">Destination</span></label>
                <select 
                  className="select select-sm select-bordered w-full rounded-xl text-xs"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                >
                  {MOCK_DESTINATIONS.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs font-bold">Travel Date</span></label>
                  <input 
                    type="date" 
                    className="input input-sm input-bordered w-full rounded-xl text-xs" 
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs font-bold">Max Members</span></label>
                  <input 
                    type="number" 
                    className="input input-sm input-bordered w-full rounded-xl text-xs" 
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs font-bold">Transport Method</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. Bus & Boat" 
                    className="input input-sm input-bordered w-full rounded-xl text-xs" 
                    value={transport}
                    onChange={(e) => setTransport(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs font-bold">Budget / head (BDT)</span></label>
                  <input 
                    type="number" 
                    className="input input-sm input-bordered w-full rounded-xl text-xs" 
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label py-0.5"><span className="label-text text-xs font-bold">Hotel / Accommodation Plan</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. Hotel Seagull & Camping" 
                  className="input input-sm input-bordered w-full rounded-xl text-xs" 
                  value={accommodation}
                  onChange={(e) => setAccommodation(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-base-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-sm btn-ghost flex-1 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary text-white font-bold flex-1 rounded-xl text-xs">Create Group</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
