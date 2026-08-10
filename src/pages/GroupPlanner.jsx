import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MOCK_GROUP_TOURS, MOCK_USERS } from "../data/mockData";
import { 
  Users, 
  MapPin, 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  MessageSquare, 
  Plus, 
  UserCheck, 
  Trash,
  PlusCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";

export default function GroupPlanner() {
  const { currentUser, addPoints } = useAuth();
  
  const [groups, setGroups] = useState(MOCK_GROUP_TOURS);
  const [activeGroupId, setActiveGroupId] = useState(MOCK_GROUP_TOURS[0].id);
  const [activeTab, setActiveTab] = useState("checklist"); // checklist, budget, chat, itinerary

  // Form states to create group
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [destination, setDestination] = useState("Cox's Bazar Beach");
  const [title, setTitle] = useState("");
  const [travelDate, setTravelDate] = useState("2026-12-01");
  const [budget, setBudget] = useState(10000);
  const [maxMembers, setMaxMembers] = useState(8);
  const [transport, setTransport] = useState("Bus");
  const [accommodation, setAccommodation] = useState("Sea Palace Hotel");

  // Interactive inputs for workspace
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  
  const [newExpTitle, setNewExpTitle] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpPaidBy, setNewExpPaidBy] = useState("");

  const [newChatMessage, setNewChatMessage] = useState("");

  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!title) return;

    const newGroup = {
      id: "group_" + Date.now(),
      title: title,
      destination: destination,
      travelDate: travelDate,
      estimatedBudget: Number(budget),
      maxMembers: Number(maxMembers),
      transportation: transport,
      accommodationPlan: accommodation,
      organizer: currentUser,
      members: [currentUser],
      requests: [],
      itinerary: [
        { day: "Day 1", plan: "Depart and check in. Welcome dinner." },
        { day: "Day 2", plan: "Sightseeing and local tours." },
        { day: "Day 3", plan: "Return journey." }
      ],
      checklist: [
        { id: "chk_101", task: "Book transport seats", completed: false, assignedTo: currentUser.name }
      ],
      expenses: [],
      messages: []
    };

    setGroups([...groups, newGroup]);
    setActiveGroupId(newGroup.id);
    setIsModalOpen(false);
    
    // Add points for organizing a group!
    addPoints(75);
    alert("🎉 Group Trip Created! You earned +75 Traveler Points.");
  };

  const handleJoinRequest = (groupId) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        // Add pending request
        const alreadyRequested = g.requests.some(r => r.user.id === currentUser.id);
        if (alreadyRequested) return g;
        return {
          ...g,
          requests: [
            ...g.requests,
            { id: "req_" + Date.now(), user: currentUser, status: "pending" }
          ]
        };
      }
      return g;
    }));
    alert("✉️ Join request sent to the organizer!");
  };

  // Organizer accepts user
  const handleAcceptUser = (groupId, requestId) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const req = g.requests.find(r => r.id === requestId);
        if (!req) return g;
        
        // Move user to members, remove from requests
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
    setGroups(prev => prev.map(g => {
      if (g.id === activeGroupId) {
        return {
          ...g,
          checklist: g.checklist.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
        };
      }
      return g;
    }));
    addPoints(5); // points for updating tasks
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    setGroups(prev => prev.map(g => {
      if (g.id === activeGroupId) {
        return {
          ...g,
          checklist: [
            ...g.checklist,
            {
              id: "task_" + Date.now(),
              task: newTaskText,
              completed: false,
              assignedTo: newTaskAssignee || currentUser.name
            }
          ]
        };
      }
      return g;
    }));
    setNewTaskText("");
    addPoints(10);
  };

  // Collaborative Expense Splits
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpTitle.trim() || !newExpAmount) return;

    setGroups(prev => prev.map(g => {
      if (g.id === activeGroupId) {
        return {
          ...g,
          expenses: [
            ...g.expenses,
            {
              id: "exp_" + Date.now(),
              title: newExpTitle,
              amount: Number(newExpAmount),
              paidBy: newExpPaidBy || currentUser.name,
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

  // Collaborative Chat
  const handleSendGroupMessage = (e) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    setGroups(prev => prev.map(g => {
      if (g.id === activeGroupId) {
        return {
          ...g,
          messages: [
            ...g.messages,
            {
              id: "gmsg_" + Date.now(),
              sender: currentUser,
              text: newChatMessage,
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

  // Calculations for split costs
  const totalSpent = activeGroup.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const perMemberShare = activeGroup.members.length > 0 ? Math.round(totalSpent / activeGroup.members.length) : 0;

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-6xl">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1">Group Expeditions</h1>
          <p className="text-sm text-base-content/60">Organize tours, split costs, assign team checklists, and chat in real-time.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary text-primary-content font-black rounded-xl capitalize shadow-lg border-none gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Plan Expedition
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left / Center: Active Workspace Console (Takes 2 Cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Active Group Header */}
          <div className="card bg-base-100 border border-base-200 p-4 md:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Active Workspace</span>
                <h2 className="text-xl font-black mt-0.5 mb-1">{activeGroup.title}</h2>
                <p className="text-xs text-base-content/60 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {activeGroup.destination} &nbsp;•&nbsp; 
                  <Calendar className="w-3.5 h-3.5" /> {activeGroup.travelDate}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-base-200 py-1.5 px-3 rounded-xl border border-base-300">
                <Users className="w-4 h-4 text-primary" />
                <div className="text-left leading-none">
                  <span className="text-[10px] text-base-content/60 block">Members</span>
                  <span className="text-xs font-bold">{activeGroup.members.length} / {activeGroup.maxMembers}</span>
                </div>
              </div>
            </div>

            {/* Members Avatar List */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-base-200">
              <span className="text-xs font-bold text-base-content/60 mr-2">Team:</span>
              <div className="avatar-group -space-x-4 rtl:space-x-reverse">
                {activeGroup.members.map(m => (
                  <Link key={m.id} to={`/profile/${m.id || m.username}`} className="avatar border-2 border-base-100 w-8 h-8 rounded-full tooltip hover:scale-110 transition-transform" data-tip={m.name}>
                    <img src={m.avatar} alt={m.name} />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Workspace Tab Panel */}
          <div className="card bg-base-100 border border-base-200 overflow-hidden shadow-sm flex-1 min-h-[400px]">
            
            {/* Tabs */}
            <div className="tabs tabs-boxed rounded-none bg-base-200 border-b border-base-300 p-1 flex flex-wrap gap-1">
              <button 
                onClick={() => setActiveTab("checklist")} 
                className={`tab tab-sm font-bold capitalize gap-1.5 ${activeTab === "checklist" ? "tab-active bg-primary text-primary-content font-black" : ""}`}
              >
                <CheckSquare className="w-3.5 h-3.5" /> Checklist
              </button>
              <button 
                onClick={() => setActiveTab("budget")} 
                className={`tab tab-sm font-bold capitalize gap-1.5 ${activeTab === "budget" ? "tab-active bg-primary text-primary-content font-black" : ""}`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Split-Expenses
              </button>
              <button 
                onClick={() => setActiveTab("chat")} 
                className={`tab tab-sm font-bold capitalize gap-1.5 ${activeTab === "chat" ? "tab-active bg-primary text-primary-content font-black" : ""}`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Chat Room
              </button>
              <button 
                onClick={() => setActiveTab("itinerary")} 
                className={`tab tab-sm font-bold capitalize gap-1.5 ${activeTab === "itinerary" ? "tab-active bg-primary text-primary-content font-black" : ""}`}
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
                    <span className="text-xs font-bold text-base-content/60">Collaborative Tasks</span>
                    <span className="text-xs font-bold text-primary">
                      {activeGroup.checklist?.filter(t => t.completed).length || 0} / {activeGroup.checklist?.length || 0} Completed
                    </span>
                  </div>

                  <div className="space-y-2">
                    {activeGroup.checklist?.map(task => (
                      <div 
                        key={task.id} 
                        onClick={() => toggleChecklist(task.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer ${task.completed ? 'bg-base-200/50 line-through text-base-content/40 border-base-200' : 'bg-base-100 hover:bg-base-200 border-base-300'}`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={task.completed} 
                            onChange={() => {}} // handled by parent onClick
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
                      className="input input-sm input-bordered flex-1 rounded-lg text-xs" 
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      required
                    />
                    <select 
                      className="select select-sm select-bordered rounded-lg text-xs"
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                    >
                      <option value="">Assignee (Default: Me)</option>
                      {activeGroup.members.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    <button type="submit" className="btn btn-sm btn-primary text-primary-content font-bold rounded-lg text-xs">Add Task</button>
                  </form>
                </div>
              )}

              {/* Tab: BUDGET & SPLITS */}
              {activeTab === "budget" && (
                <div className="space-y-4">
                  
                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-primary/10 border border-primary/20 p-3 rounded-xl text-center">
                    <div className="leading-tight">
                      <span className="text-[10px] text-base-content/60 block">Total Spent</span>
                      <span className="text-sm font-black text-primary">{totalSpent} BDT</span>
                    </div>
                    <div className="leading-tight border-x border-base-300">
                      <span className="text-[10px] text-base-content/60 block">Members</span>
                      <span className="text-sm font-black">{activeGroup.members.length}</span>
                    </div>
                    <div className="leading-tight">
                      <span className="text-[10px] text-base-content/60 block">Share / head</span>
                      <span className="text-sm font-black text-secondary">{perMemberShare} BDT</span>
                    </div>
                  </div>

                  {/* Expense List */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-base-content/60 block">Expense Ledger</span>
                    {activeGroup.expenses?.length === 0 ? (
                      <div className="text-center py-6 text-xs text-base-content/50 border border-dashed border-base-300 rounded-xl">
                        No expenses logged yet. Add one below!
                      </div>
                    ) : (
                      activeGroup.expenses?.map(exp => (
                        <div key={exp.id} className="flex justify-between items-center p-2.5 rounded-xl border border-base-300 bg-base-100">
                          <div>
                            <h4 className="font-bold text-xs">{exp.title}</h4>
                            <span className="text-[10px] text-base-content/50">Paid by: {exp.paidBy} &nbsp;•&nbsp; {exp.date}</span>
                          </div>
                          <span className="font-black text-sm text-primary">{exp.amount} BDT</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Expense Form */}
                  <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-base-200">
                    <input 
                      type="text" 
                      placeholder="e.g. Campfire BBQ Wood" 
                      className="input input-sm input-bordered flex-1 rounded-lg text-xs" 
                      value={newExpTitle}
                      onChange={(e) => setNewExpTitle(e.target.value)}
                      required
                    />
                    <input 
                      type="number" 
                      placeholder="Amount BDT" 
                      className="input input-sm input-bordered w-full sm:w-28 rounded-lg text-xs" 
                      value={newExpAmount}
                      onChange={(e) => setNewExpAmount(e.target.value)}
                      required
                    />
                    <select 
                      className="select select-sm select-bordered rounded-lg text-xs"
                      value={newExpPaidBy}
                      onChange={(e) => setNewExpPaidBy(e.target.value)}
                    >
                      <option value="">Paid By (Me)</option>
                      {activeGroup.members.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    <button type="submit" className="btn btn-sm btn-primary text-primary-content font-bold rounded-lg text-xs">Log Bill</button>
                  </form>
                </div>
              )}

              {/* Tab: CHAT */}
              {activeTab === "chat" && (
                <div className="flex flex-col h-[350px]">
                  
                  {/* Messages container */}
                  <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-base-200/50 rounded-xl border border-base-300 mb-3">
                    {activeGroup.messages?.length === 0 ? (
                      <div className="text-center py-10 text-xs text-base-content/40">
                        Welcome to the group chat! Start coordinating logistics here.
                      </div>
                    ) : (
                      activeGroup.messages?.map(msg => {
                        const isMe = msg.sender.id === currentUser.id;
                        return (
                          <div key={msg.id} className={`chat ${isMe ? "chat-end" : "chat-start"}`}>
                            <div className="chat-image avatar">
                              <div className="w-8 rounded-full border border-base-300">
                                <img src={msg.sender.avatar} alt={msg.sender.name} />
                              </div>
                            </div>
                            <div className="chat-header text-[10px] opacity-60">
                              @{msg.sender.username} &nbsp;<time className="text-[8px]">{msg.time}</time>
                            </div>
                            <div className={`chat-bubble text-xs ${isMe ? 'chat-bubble-primary text-white' : 'chat-bubble-neutral'}`}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Send chat form */}
                  <form onSubmit={handleSendGroupMessage} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Type message..." 
                      className="input input-sm input-bordered flex-1 rounded-lg text-xs" 
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-sm btn-primary text-primary-content font-bold rounded-lg text-xs">Send</button>
                  </form>

                </div>
              )}

              {/* Tab: ITINERARY */}
              {activeTab === "itinerary" && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-base-content/60 block pb-2 border-b border-base-200">Chronological Excursion Plan</span>
                  <div className="space-y-4">
                    {activeGroup.itinerary.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="badge badge-primary py-2 px-3 rounded font-black text-[10px]">{item.day}</div>
                        <div className="flex-1 bg-base-200 p-3 rounded-xl border border-base-300 text-xs">
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

        {/* Right Side: Available Groups & Organizers Requests Portal (1 Col) */}
        <div className="space-y-6">
          
          {/* Join Requests Manager for Organized Groups */}
          {groups.some(g => g.organizer.id === currentUser.id && g.requests.length > 0) && (
            <div className="card bg-base-100 border border-base-200 p-4 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-warning flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" /> Expedition Approvals
              </h3>
              
              <div className="space-y-2">
                {groups
                  .filter(g => g.organizer.id === currentUser.id)
                  .flatMap(g => g.requests.map(req => (
                    <div key={req.id} className="p-3 bg-base-200 border border-base-300 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <img src={req.user.avatar} className="w-7 h-7 rounded-full object-cover" alt="Requester" />
                        <div className="leading-tight">
                          <span className="text-xs font-bold block">{req.user.name}</span>
                          <span className="text-[9px] text-base-content/50 block">For: {g.title.substring(0, 20)}...</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleAcceptUser(g.id, req.id)}
                          className="btn btn-xs btn-success text-white font-bold px-2 rounded"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleRejectUser(g.id, req.id)}
                          className="btn btn-xs btn-ghost text-error font-bold px-2 rounded"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )))
                }
              </div>
            </div>
          )}

          {/* Directory of other groups */}
          <div className="card bg-base-100 border border-base-200 p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" /> Active Expeditions
            </h3>

            <div className="space-y-3">
              {groups.map(group => {
                const isActive = group.id === activeGroupId;
                const isOrganizer = group.organizer.id === currentUser.id;
                const isMember = group.members.some(m => m.id === currentUser.id);
                const hasRequested = group.requests?.some(r => r.user.id === currentUser.id);

                return (
                  <div 
                    key={group.id} 
                    onClick={() => setActiveGroupId(group.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-base-200 hover:bg-base-200'}`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs leading-snug m-0">{group.title}</h4>
                      {isOrganizer && <span className="badge badge-warning text-[9px] font-bold">Organizer</span>}
                      {!isOrganizer && isMember && <span className="badge badge-success text-white text-[9px] font-bold">Member</span>}
                      {hasRequested && <span className="badge badge-neutral text-[9px] font-bold">Requested</span>}
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-base-content/60">
                      <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {group.destination}</span>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-base-300 text-[10px]">
                      <span className="font-bold text-primary">{group.estimatedBudget} BDT / hd</span>
                      
                      {!isMember && !hasRequested && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinRequest(group.id);
                          }}
                          className="btn btn-xs btn-outline btn-primary rounded text-[9px]"
                        >
                          Request Join
                        </button>
                      )}
                      
                      {isMember && !isActive && (
                        <span className="text-xs text-primary flex items-center gap-0.5">
                          View <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Plan Expedition Dialog Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl max-w-md border border-base-300">
            <h3 className="font-black text-lg mb-4">Plan Group Expedition</h3>
            
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="form-control">
                <label className="label py-0.5"><span className="label-text text-xs font-bold">Expedition Name</span></label>
                <input 
                  type="text" 
                  placeholder="e.g. Sajek Valley Trekking Tents" 
                  className="input input-sm input-bordered w-full rounded-lg text-xs" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label py-0.5"><span className="label-text text-xs font-bold">Destination</span></label>
                <select 
                  className="select select-sm select-bordered w-full rounded-lg text-xs"
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
                    className="input input-sm input-bordered w-full rounded-lg text-xs" 
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs font-bold">Max Members</span></label>
                  <input 
                    type="number" 
                    className="input input-sm input-bordered w-full rounded-lg text-xs" 
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
                    className="input input-sm input-bordered w-full rounded-lg text-xs" 
                    value={transport}
                    onChange={(e) => setTransport(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label py-0.5"><span className="label-text text-xs font-bold">Budget / head (BDT)</span></label>
                  <input 
                    type="number" 
                    className="input input-sm input-bordered w-full rounded-lg text-xs" 
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
                  className="input input-sm input-bordered w-full rounded-lg text-xs" 
                  value={accommodation}
                  onChange={(e) => setAccommodation(e.target.value)}
                />
              </div>

              <div className="modal-action mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-sm btn-ghost rounded-lg text-xs">Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary text-primary-content font-bold rounded-lg text-xs">Create Group</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
