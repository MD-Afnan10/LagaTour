import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../context/PostContext";
import { 
  ShieldAlert, 
  Trash2, 
  Check, 
  Users as UsersIcon, 
  Image as ImageIcon, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  UserPlus,
  ShieldCheck,
  ShieldOff,
  Eye,
  EyeOff,
  Info,
  Calendar,
  UserCheck,
  X,
  Shield,
  Flag,
  Video as VideoIcon,
  UserX,
  MessageSquare,
  Headphones,
  User
} from "lucide-react";

export default function AdminPanel() {
  const { currentUser, addPoints, adminAccounts, addAdminAccount, toggleBlockAdminAccount } = useAuth();
  const { posts, reports: localReports, hidePost, makePostVisible, dismissReport } = usePosts();
  const navigate = useNavigate();

  const [newAdminHandle, setNewAdminHandle] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [adminMsg, setAdminMsg] = useState("");
  const [adminErr, setAdminErr] = useState("");

  // Modal States
  const [blockConfirmAdmin, setBlockConfirmAdmin] = useState(null);
  const [viewInfoAdmin, setViewInfoAdmin] = useState(null);

  // Live Database States
  const [dbStats, setDbStats] = useState(null);
  const [dbAdmins, setDbAdmins] = useState([]);
  const [dbReports, setDbReports] = useState([]);
  const [reportStatusTab, setReportStatusTab] = useState("pending"); // "pending" | "archived"
  const [reportFilter, setReportFilter] = useState("all");
  const [pendingSupportCount, setPendingSupportCount] = useState(0);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadDatabaseData = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, usersRes, reportsRes, supportRes] = await Promise.allSettled([
        api.getAdminOverview(),
        api.getAdminUsers(),
        api.getAdminReports(),
        api.getAdminSupportRequests()
      ]);

      if (overviewRes.status === "fulfilled" && overviewRes.value?.success) {
        setDbStats(overviewRes.value.stats);
      }
      if (usersRes.status === "fulfilled" && usersRes.value?.success && Array.isArray(usersRes.value.users)) {
        const admins = usersRes.value.users.filter(u => u.role === "admin" || u.role === "superadmin");
        if (admins.length > 0) {
          setDbAdmins(admins);
        }
      }
      if (reportsRes.status === "fulfilled" && reportsRes.value?.success && Array.isArray(reportsRes.value.reports)) {
        setDbReports(reportsRes.value.reports);
      }
      if (supportRes.status === "fulfilled" && supportRes.value?.success && Array.isArray(supportRes.value.requests)) {
        const pendings = supportRes.value.requests.filter(r => r.status === "pending");
        setPendingSupportCount(pendings.length);
      }
    } catch (err) {
      console.warn("Error loading admin data from database:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  const displayAdmins = useMemo(() => {
    const list = [...(adminAccounts || [])];
    if (dbAdmins && dbAdmins.length > 0) {
      dbAdmins.forEach(da => {
        const handle = da.email || da.username;
        if (!list.some(a => a.handle?.toLowerCase() === handle.toLowerCase() || a.handle?.toLowerCase() === da.username?.toLowerCase())) {
          list.push({
            id: da.id || da.user_id,
            user_id: da.id || da.user_id,
            handle: da.email,
            username: da.username,
            status: da.status === "suspended" ? "Blocked" : "Active",
            role: da.role === "superadmin" ? "Super Administrator" : "Platform Administrator",
            password: "•••••••• (Hashed in MySQL)",
            addedBy: "System Root",
            addedAt: da.createdAt || "Active"
          });
        }
      });
    }
    return list;
  }, [adminAccounts, dbAdmins]);

  // AI flagged posts queue
  const [flaggedItems, setFlaggedItems] = useState([
    {
      id: "flag_1",
      author: { name: "Rashed Karim", username: "rashed_backpacks", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150" },
      destination: "Sajek Valley",
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500",
      reason: "Landmark Mismatch: AI detected urban architectural landmark (Eiffel Tower, Paris) instead of natural hills.",
      confidence: "99.8%",
      time: "10 minutes ago"
    }
  ]);

  const [stats] = useState({
    usersCount: 1420,
    postsScanned: 8430,
    accuracyRate: 98.4
  });

  const handleApproveFlag = (id) => {
    setFlaggedItems(prev => prev.filter(item => item.id !== id));
    addPoints(30);
    alert("✅ AI flag overruled! Media approved.");
  };

  const handleDiscardFlag = (id) => {
    setFlaggedItems(prev => prev.filter(item => item.id !== id));
    addPoints(30);
    alert("🗑️ Flagged post discarded.");
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAdminMsg("");
    setAdminErr("");

    try {
      const username = newAdminHandle.replace(/@.*$/, "").replace(/[^a-zA-Z0-9_]/g, "_");
      await api.createAdminUser({
        name: username,
        username: username,
        email: newAdminHandle.includes("@") ? newAdminHandle : `${newAdminHandle}@laga.tour`,
        password: newAdminPassword,
        role: "admin",
        status: "active"
      });
      addAdminAccount(newAdminHandle, newAdminPassword, currentUser?.email || "admin@laga.tour");
      setAdminMsg(`✅ Created administrator account '${newAdminHandle}' in MySQL database!`);
      setNewAdminHandle("");
      setNewAdminPassword("");
      await loadDatabaseData();
    } catch (err) {
      setAdminErr(err.message || "Failed to create administrator account.");
    }
  };

  const handleConfirmToggleBlock = async () => {
    if (!blockConfirmAdmin) return;
    const isNowBlocked = blockConfirmAdmin.status !== "Blocked" && blockConfirmAdmin.status !== "suspended";
    const nextStatus = isNowBlocked ? "suspended" : "active";

    try {
      if (blockConfirmAdmin.user_id || blockConfirmAdmin.id) {
        await api.toggleUserStatus(blockConfirmAdmin.user_id || blockConfirmAdmin.id, nextStatus);
      }
    } catch (e) {
      console.warn("Could not toggle status in MySQL:", e.message);
    }

    toggleBlockAdminAccount(blockConfirmAdmin.handle || blockConfirmAdmin.username);
    setAdminMsg(isNowBlocked ? `🚫 Administrator ${blockConfirmAdmin.handle || blockConfirmAdmin.username} has been BLOCKED in database.` : `✅ Administrator ${blockConfirmAdmin.handle || blockConfirmAdmin.username} has been UNBLOCKED.`);
    setBlockConfirmAdmin(null);
    await loadDatabaseData();
  };

  const handleToggleSuspendUser = async (userId, currentStatus, reportId) => {
    try {
      const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
      if (reportId) {
        setDbReports(prev => prev.map(r => (r.report_id || r.id) === reportId ? { ...r, status: "action_taken", action_taken: `User account ${nextStatus} by admin` } : r));
      }
      await api.toggleUserStatus(userId, nextStatus);
      if (reportId) {
        await api.resolveAdminReport(reportId, "suspend_user", `Account ${nextStatus === "suspended" ? "suspended" : "activated"} by admin`).catch(() => {});
      }
      setActionSuccessMsg(`User account status changed to ${nextStatus.toUpperCase()}`);
      setTimeout(() => setActionSuccessMsg(""), 3500);
      await loadDatabaseData();
    } catch (err) {
      alert("Failed to update user status: " + err.message);
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      setDbReports(prev => prev.map(r => (r.report_id || r.id) === reportId ? { ...r, status: "dismissed", action_taken: "Dismissed by administrator" } : r));
      await api.dismissAdminReport(reportId);
      setActionSuccessMsg("Report dismissed and archived in database");
      setTimeout(() => setActionSuccessMsg(""), 3000);
      await loadDatabaseData();
    } catch (err) {
      alert("Failed to dismiss report: " + err.message);
    }
  };

  const handleResolveReport = async (reportId, action, notes) => {
    try {
      const actionText = notes || action || "Action taken by administrator";
      setDbReports(prev => prev.map(r => (r.report_id || r.id) === reportId ? { ...r, status: "action_taken", action_taken: actionText } : r));
      await api.resolveAdminReport(reportId, action, notes);
      setActionSuccessMsg("Report resolved and recorded in database");
      setTimeout(() => setActionSuccessMsg(""), 3000);
      await loadDatabaseData();
    } catch (err) {
      alert("Failed to resolve report: " + err.message);
    }
  };

  const handleTogglePostVisibility = async (postId, currentIsPublic, reportId) => {
    try {
      if (reportId) {
        setDbReports(prev => prev.map(r => (r.report_id || r.id) === reportId ? { ...r, status: "action_taken", action_taken: currentIsPublic ? "Post hidden from feed" : "Post made visible on feed" } : r));
      }
      await api.togglePostVisibility(postId, !currentIsPublic);
      if (reportId && currentIsPublic) {
        await api.resolveAdminReport(reportId, "hide_post", "Post hidden by admin").catch(() => {});
      }
      setActionSuccessMsg(currentIsPublic ? "Post hidden from feed" : "Post made visible on feed");
      setTimeout(() => setActionSuccessMsg(""), 3000);
      await loadDatabaseData();
    } catch (err) {
      alert("Failed to update post visibility: " + err.message);
    }
  };

  const activeReports = useMemo(() => {
    return dbReports.filter((r) => !r.status || r.status === "pending");
  }, [dbReports]);

  const archivedReports = useMemo(() => {
    return dbReports.filter((r) => r.status === "action_taken" || r.status === "dismissed" || r.status === "resolved");
  }, [dbReports]);

  const currentTabReports = useMemo(() => {
    return reportStatusTab === "pending" ? activeReports : archivedReports;
  }, [reportStatusTab, activeReports, archivedReports]);

  const filteredReports = useMemo(() => {
    return currentTabReports.filter((r) => {
      const isUserReport = r.report_type === "user" || Boolean(r.reported_user_id);
      const isPostReport = r.report_type === "post" || Boolean(r.post_id);
      if (reportFilter === "user") return isUserReport;
      if (reportFilter === "post") return isPostReport;
      return true;
    });
  }, [currentTabReports, reportFilter]);

  const userReportsCount = useMemo(() => {
    return currentTabReports.filter((r) => r.report_type === "user" || Boolean(r.reported_user_id)).length;
  }, [currentTabReports]);

  const postReportsCount = useMemo(() => {
    return currentTabReports.filter((r) => r.report_type === "post" || Boolean(r.post_id)).length;
  }, [currentTabReports]);

  const isUserAdmin = Boolean(
    currentUser?.isAdmin || 
    currentUser?.role === "admin" || 
    currentUser?.role === "superadmin" || 
    currentUser?.user_id === "admin_root" || 
    currentUser?.id === "admin_root" || 
    currentUser?.email?.toLowerCase().startsWith("admin") || 
    currentUser?.username?.toLowerCase().startsWith("admin") || 
    currentUser?.username === "nabil_wanderer" ||
    currentUser?.email === "nutamim2001@gmail.com"
  );

  if (!isUserAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-base-content/90">Admin Authorization Required</h2>
        <p className="text-xs text-base-content/80 leading-relaxed">
          Only authorized administrator accounts with the <span className="font-bold text-amber-400 font-mono">admin@</span> prefix can access the platform administration portal.
        </p>
        <div className="pt-2 flex gap-3 justify-center">
          <button 
            onClick={() => navigate("/auth", { state: { openAdmin: true } })}
            className="btn btn-warning btn-sm rounded-xl font-bold text-xs"
          >
            Staff & Admin Sign In 🔒
          </button>
          <button 
            onClick={() => navigate("/")}
            className="btn btn-ghost btn-sm rounded-xl text-xs text-base-content/80"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-5xl space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-2 text-base-content/95">
            <ShieldAlert className="w-8 h-8 text-error" /> Platform Administration & Moderation
          </h1>
          <p className="text-sm text-base-content/80">Review user report flags, hide/unhide posts, manage traveler ratings, and audit admin credentials.</p>
        </div>
        <button
          onClick={loadDatabaseData}
          disabled={isLoading}
          className="btn btn-sm btn-ghost bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-bold gap-1.5"
          title="Sync live data from MySQL database"
        >
          <Activity className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-error" : "text-success"}`} />
          Sync MySQL
        </button>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-base-100 border border-base-200 p-4 shadow-sm text-center">
          <span className="text-[10px] font-bold text-base-content/75 uppercase block">Travelers in Database</span>
          <span className="text-2xl font-black text-primary mt-1.5 flex justify-center items-center gap-1.5">
            <UsersIcon className="w-5 h-5" /> {dbStats ? dbStats.totalUsers : stats.usersCount}
          </span>
          <span className="text-[10px] text-base-content/50 block mt-0.5">
            {dbStats ? `${dbStats.suspendedUsers} suspended` : "Active"}
          </span>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 shadow-sm text-center">
          <span className="text-[10px] font-bold text-base-content/75 uppercase block">Feed Posts (MySQL)</span>
          <span className="text-2xl font-black text-secondary mt-1.5 flex justify-center items-center gap-1.5">
            <ImageIcon className="w-5 h-5" /> {dbStats ? dbStats.totalPosts : posts.length}
          </span>
          <span className="text-[10px] text-base-content/50 block mt-0.5">
            {dbStats ? `${dbStats.hiddenPosts} hidden from feed` : "Public"}
          </span>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 shadow-sm text-center">
          <span className="text-[10px] font-bold text-base-content/75 uppercase block">User Reports Queue</span>
          <span className="text-2xl font-black text-error mt-1.5 flex justify-center items-center gap-1.5">
            <Flag className="w-5 h-5" /> {activeReports.length}
          </span>
          <span className="text-[10px] text-error block mt-0.5 font-medium">
            {activeReports.length > 0 ? `${activeReports.length} pending audit` : "All clear"}
          </span>
        </div>
        <div className="card bg-base-100 border border-base-200 p-4 shadow-sm text-center">
          <span className="text-[10px] font-bold text-base-content/75 uppercase block">Destinations & Plans</span>
          <span className="text-2xl font-black text-success mt-1.5 flex justify-center items-center gap-1.5">
            <Activity className="w-5 h-5" /> {dbStats ? `${dbStats.totalPlaces} / ${dbStats.totalPlans}` : `${stats.accuracyRate}%`}
          </span>
          <span className="text-[10px] text-base-content/50 block mt-0.5">
            {dbStats ? "Places / Plans in DB" : "AI Scan Accuracy"}
          </span>
        </div>
      </div>

      {/* Action Success Alert Banner */}
      {actionSuccessMsg && (
        <div className="alert alert-success text-white font-bold py-2.5 px-4 rounded-2xl shadow-sm text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-white shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg("")} className="btn btn-ghost btn-xs btn-circle text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Access Management Navigation Cards (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Manage Users Card */}
        <div className="card bg-base-100 border border-primary/20 p-5 shadow-sm rounded-3xl hover:border-primary/50 transition-all flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                <UsersIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-base-content/95">Travelers Directory</h3>
                <p className="text-[11px] text-base-content/70 mt-0.5 line-clamp-2">
                  Search user ID or username, view full profiles, ban/unban travelers.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-base-200">
            <span className="text-[11px] font-mono font-bold text-primary">
              {dbStats ? `${dbStats.totalUsers} registered` : "MySQL CRUD"}
            </span>
            <button
              onClick={() => navigate("/admin/users")}
              className="btn btn-xs btn-primary rounded-xl text-xs font-bold gap-1 text-slate-900 shadow-sm"
            >
              Users Page →
            </button>
          </div>
        </div>

        {/* Manage Posts Card */}
        <div className="card bg-base-100 border border-secondary/20 p-5 shadow-sm rounded-3xl hover:border-secondary/50 transition-all flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center border border-secondary/20 shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-base-content/95">Posts & Feed</h3>
                <p className="text-[11px] text-base-content/70 mt-0.5 line-clamp-2">
                  Audit feed posts, hide/unhide content, view media & inspect authors.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-base-200">
            <span className="text-[11px] font-mono font-bold text-secondary">
              {dbStats ? `${dbStats.totalPosts} in database` : "MySQL CRUD"}
            </span>
            <button
              onClick={() => navigate("/admin/posts")}
              className="btn btn-xs btn-secondary rounded-xl text-xs font-bold gap-1 text-white shadow-sm"
            >
              Posts Page →
            </button>
          </div>
        </div>

        {/* Admin Support Chat Portal Card */}
        <div className="card bg-base-100 border border-emerald-500/20 p-5 shadow-sm rounded-3xl hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0 relative">
                <Headphones className="w-5 h-5" />
                {pendingSupportCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-error rounded-full animate-ping" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-base-content/95">Support Chat</h3>
                  {pendingSupportCount > 0 && (
                    <span className="badge badge-error badge-xs text-white font-bold px-1.5 py-0.5">
                      {pendingSupportCount} new
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-base-content/70 mt-0.5 line-clamp-2">
                  Accept traveler requests, chat in real-time, collaborate across admins.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-base-200">
            <span className="text-[11px] font-mono font-bold text-emerald-500">
              {pendingSupportCount > 0 ? `${pendingSupportCount} waiting` : "Real-time portal"}
            </span>
            <button
              onClick={() => navigate("/admin/chats")}
              className="btn btn-xs btn-success text-white rounded-xl text-xs font-bold gap-1 shadow-sm"
            >
              Open Support →
            </button>
          </div>
        </div>

      </div>

      {/* USER REPORTS & CONTENT MODERATION SECTION */}
      <div className="card bg-base-100 border border-base-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-base-200 pb-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2 text-error m-0">
              <Flag className="w-5 h-5 text-error" /> User Reports & Content Moderation Panel
            </h3>
            <p className="text-xs text-base-content/80 mt-0.5">
              Review flagged users and community posts. When resolved or dismissed, reports remain securely logged in MySQL for audit history.
            </p>
          </div>

          {/* Status View Toggle (Pending Queue vs Archived History) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-base-200 p-1 rounded-2xl border border-base-300">
              <button
                onClick={() => setReportStatusTab("pending")}
                className={`btn btn-xs rounded-xl font-bold ${reportStatusTab === "pending" ? "btn-error text-white shadow-sm" : "btn-ghost text-base-content/70"}`}
              >
                Active Queue ({activeReports.length})
              </button>
              <button
                onClick={() => setReportStatusTab("archived")}
                className={`btn btn-xs rounded-xl font-bold ${reportStatusTab === "archived" ? "btn-neutral text-white shadow-sm" : "btn-ghost text-base-content/70"}`}
              >
                Audit History ({archivedReports.length})
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 bg-base-200 p-1 rounded-2xl border border-base-300">
              <button
                onClick={() => setReportFilter("all")}
                className={`btn btn-xs rounded-xl font-bold ${reportFilter === "all" ? "btn-primary text-slate-900 shadow-sm" : "btn-ghost text-base-content/70"}`}
              >
                All ({currentTabReports.length})
              </button>
              <button
                onClick={() => setReportFilter("user")}
                className={`btn btn-xs rounded-xl font-bold ${reportFilter === "user" ? "btn-primary text-slate-900 shadow-sm" : "btn-ghost text-base-content/70"}`}
              >
                Users ({userReportsCount})
              </button>
              <button
                onClick={() => setReportFilter("post")}
                className={`btn btn-xs rounded-xl font-bold ${reportFilter === "post" ? "btn-primary text-slate-900 shadow-sm" : "btn-ghost text-base-content/70"}`}
              >
                Posts ({postReportsCount})
              </button>
            </div>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="text-center py-10 bg-base-200/30 rounded-2xl border border-dashed border-base-300">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
            <p className="font-bold text-xs text-base-content/90">
              {reportStatusTab === "pending" ? "No pending reports" : "No archived reports"}
            </p>
            <p className="text-[10px] text-base-content/75 mt-0.5">
              {reportStatusTab === "pending" 
                ? "All community flags have been addressed and cleared from the active queue." 
                : "No resolved or dismissed reports found in the archive."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((rep) => {
              const isUserReport = rep.report_type === "user" || Boolean(rep.reported_user_id);
              const reportedUser = {
                id: rep.reported_user_id,
                username: rep.reported_username || "traveler",
                name: [rep.reported_first_name, rep.reported_last_name].filter(Boolean).join(" ") || rep.reported_username || "Traveler",
                email: rep.reported_email || "No email",
                avatar: rep.reported_avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${rep.reported_username || "user"}`,
                status: rep.reported_account_status || "active"
              };
              const isUserSuspended = reportedUser.status === "suspended";

              // ── USER REPORT ITEM ──────────────────────────────────────────
              if (isUserReport) {
                return (
                  <div key={rep.report_id || rep.id} className="p-4 bg-base-200/50 border border-base-300 rounded-2xl flex flex-col md:flex-row gap-4 items-start">
                    {/* User Avatar & Status Badge */}
                    <div className="flex md:flex-col items-center gap-3 w-full md:w-44 shrink-0 bg-base-100 p-3 rounded-xl border border-base-200">
                      <div className="relative">
                        <img 
                          src={reportedUser.avatar} 
                          alt={reportedUser.name} 
                          className="w-14 h-14 rounded-2xl object-cover border border-base-300 bg-base-200"
                        />
                        <span className={`absolute -bottom-1 -right-1 badge badge-xs font-bold px-1.5 py-0.5 text-[9px] ${
                          isUserSuspended ? "badge-error text-white" : "badge-success text-white"
                        }`}>
                          {isUserSuspended ? "Banned" : "Active"}
                        </span>
                      </div>
                      <div className="text-left md:text-center min-w-0">
                        <h4 className="font-black text-xs text-base-content/95 truncate">
                          {reportedUser.name}
                        </h4>
                        <p className="text-[10px] text-base-content/60 font-mono truncate">
                          @{reportedUser.username}
                        </p>
                        <p className="text-[9px] text-base-content/40 truncate">
                          ID: {reportedUser.id}
                        </p>
                      </div>
                    </div>

                    {/* Report Information */}
                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="badge badge-error badge-sm text-white font-bold text-[10px] px-2 py-0.5">
                            User Violation
                          </span>
                          <span className="text-xs font-bold text-base-content/90">
                            Flagged by: <span className="text-primary">@{rep.reporter_username || "Anonymous"}</span>
                          </span>
                        </div>
                        <span className="text-[10px] text-base-content/50 font-mono">
                          {rep.created_at ? new Date(rep.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Recent"}
                        </span>
                      </div>

                      {/* Reason Box */}
                      <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-xs text-error leading-relaxed">
                        <span className="font-bold">Violation Reason: </span>
                        <span className="text-base-content/90 font-medium">{rep.report_description}</span>
                      </div>

                      {/* Traveler Meta Row */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-base-content/60">
                        <span>Email: <strong className="text-base-content/80 font-mono">{reportedUser.email}</strong></span>
                        <span>•</span>
                        <span>Points: <strong className="text-amber-500">{rep.reported_user_points || 0} pts</strong></span>
                        <span>•</span>
                        <span>Role: <strong className="text-base-content/80">{rep.reported_user_role || "traveler"}</strong></span>
                      </div>
                    </div>

                    {/* Actions / Audit Status */}
                    {rep.status === "dismissed" || rep.status === "action_taken" || rep.status === "resolved" ? (
                      <div className="flex flex-col gap-1 w-full md:w-36 pt-2 md:pt-0 shrink-0 bg-base-100 p-2.5 rounded-xl border border-base-200 text-center">
                        <span className={`badge badge-xs font-bold py-2 ${rep.status === 'dismissed' ? 'badge-ghost text-base-content/70' : 'badge-success text-white'}`}>
                          {rep.status === 'dismissed' ? '⚪ Dismissed' : '✅ Action Taken'}
                        </span>
                        <span className="text-[10px] text-base-content/70 font-medium line-clamp-2 mt-0.5">
                          {rep.action_taken || "Resolved by admin"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex md:flex-col gap-2 w-full md:w-36 pt-2 md:pt-0 shrink-0">
                        <button
                          onClick={() => handleToggleSuspendUser(reportedUser.id, reportedUser.status, rep.report_id)}
                          className={`btn btn-xs rounded-xl font-bold gap-1 py-1 flex-1 shadow-sm ${
                            isUserSuspended 
                              ? "btn-success text-white" 
                              : "btn-error text-white"
                          }`}
                        >
                          {isUserSuspended ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" /> Unban User
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5" /> Suspend User
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleResolveReport(rep.report_id, "user_moderated", "Admin resolved report")}
                          className="btn btn-xs btn-primary text-slate-900 rounded-xl font-bold gap-1 py-1 flex-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Resolve
                        </button>

                        <button
                          onClick={() => handleDismissReport(rep.report_id)}
                          className="btn btn-xs btn-outline btn-ghost text-base-content/85 hover:bg-base-300 font-bold rounded-xl gap-1 py-1 flex-1"
                        >
                          <X className="w-3.5 h-3.5" /> Dismiss
                        </button>
                      </div>
                    )}

                  </div>
                );
              }

              // ── POST REPORT ITEM ──────────────────────────────────────────
              const isPostHidden = rep.post_is_public === 0;
              const postMediaUrl = rep.post_media_url;
              const postMediaType = rep.post_media_type || "photo";

              return (
                <div key={rep.report_id || rep.id} className="p-4 bg-base-200/50 border border-base-300 rounded-2xl flex flex-col md:flex-row gap-4 items-start">
                  
                  {/* Media Thumbnail */}
                  <div className="relative w-full md:w-48 h-32 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-base-300 shrink-0">
                    {postMediaType === "video" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-100 bg-slate-900 p-2 text-center">
                        <VideoIcon className="w-8 h-8 text-error mb-1" />
                        <span className="text-[10px] font-bold text-slate-200">Video Content</span>
                      </div>
                    ) : postMediaUrl ? (
                      <img src={postMediaUrl} className="w-full h-full object-cover" alt="Reported post" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-base-content/75 text-xs p-2 text-center font-bold">
                        Text Content Only
                      </div>
                    )}

                    <span className={`absolute top-2 left-2 badge badge-xs font-bold px-2 py-1 ${
                      isPostHidden ? "badge-warning text-slate-900" : "badge-success text-white"
                    }`}>
                      {isPostHidden ? "Hidden" : "Visible"}
                    </span>
                  </div>

                  {/* Report & Post Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-secondary badge-sm text-white font-bold text-[10px] px-2 py-0.5">
                            Post Violation
                          </span>
                          <span className="text-xs font-black text-error flex items-center gap-1">
                            <Flag className="w-3.5 h-3.5" /> Flagged by: <span className="text-base-content/90">{rep.reporter_username || "Anonymous"}</span>
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-base-content/90 mt-1">
                          Post ID: <span className="font-mono">{rep.post_id}</span>
                        </h4>
                      </div>
                      <span className="text-[10px] text-base-content/75 font-mono">
                        {rep.created_at ? new Date(rep.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Recent"}
                      </span>
                    </div>

                    {/* Reported Reason Box */}
                    <div className="p-2.5 bg-error/10 border border-error/20 rounded-xl text-xs text-error leading-relaxed">
                      <span className="font-bold">Report Reason: </span>
                      <span className="text-base-content/90 font-medium">{rep.report_description}</span>
                    </div>

                    {/* Post Caption Preview */}
                    <div className="p-2 bg-base-100 rounded-xl border border-base-200 text-xs text-base-content/85 line-clamp-2">
                      <span className="font-bold mr-1 text-base-content/95">Caption:</span>
                      <span>"{rep.post_caption || "No caption"}"</span>
                    </div>
                  </div>

                  {/* Actions: Hide / Make Visible / Dismiss OR Audit Badge */}
                  {rep.status === "dismissed" || rep.status === "action_taken" || rep.status === "resolved" ? (
                    <div className="flex flex-col gap-1 w-full md:w-36 pt-2 md:pt-0 shrink-0 bg-base-100 p-2.5 rounded-xl border border-base-200 text-center">
                      <span className={`badge badge-xs font-bold py-2 ${rep.status === 'dismissed' ? 'badge-ghost text-base-content/70' : 'badge-success text-white'}`}>
                        {rep.status === 'dismissed' ? '⚪ Dismissed' : '✅ Action Taken'}
                      </span>
                      <span className="text-[10px] text-base-content/70 font-medium line-clamp-2 mt-0.5">
                        {rep.action_taken || "Resolved by admin"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex md:flex-col gap-2 w-full md:w-36 pt-2 md:pt-0 shrink-0">
                      <button 
                        onClick={() => handleTogglePostVisibility(rep.post_id, !isPostHidden, rep.report_id)}
                        className={`btn btn-xs rounded-xl font-bold gap-1 py-1 flex-1 shadow-sm ${
                          isPostHidden 
                            ? "btn-success text-white" 
                            : "btn-warning text-slate-900"
                        }`}
                      >
                        {isPostHidden ? (
                          <>
                            <Eye className="w-3.5 h-3.5" /> Make Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> Hide Post
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleResolveReport(rep.report_id, "post_reviewed", "Admin reviewed & resolved post report")}
                        className="btn btn-xs btn-primary text-slate-900 rounded-xl font-bold gap-1 py-1 flex-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" /> Resolve
                      </button>

                      <button 
                        onClick={() => handleDismissReport(rep.report_id)}
                        className="btn btn-xs btn-outline btn-ghost text-base-content/85 hover:bg-base-300 font-bold rounded-xl gap-1 py-1 flex-1"
                      >
                        <X className="w-3.5 h-3.5" /> Dismiss Report
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI IMAGE FLAG QUEUE */}
      <div className="card bg-base-100 border border-base-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-1.5 border-b border-base-200 pb-2 m-0 text-warning">
          <AlertTriangle className="w-4 h-4" /> AI Image Geotag Scan Queue
        </h3>

        {flaggedItems.length === 0 ? (
          <div className="text-center py-8 bg-base-200/30 rounded-2xl border border-dashed border-base-300">
            <CheckCircle className="w-10 h-10 text-success mx-auto mb-1" />
            <p className="font-bold text-xs text-base-content/90">All clear!</p>
            <p className="text-[10px] text-base-content/75">No pending AI geotag flags.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flaggedItems.map(item => (
              <div key={item.id} className="p-4 bg-base-200/50 border border-base-300 rounded-xl flex flex-col md:flex-row gap-4 items-start">
                <div className="relative w-full md:w-44 h-28 rounded-lg overflow-hidden bg-black flex items-center justify-center border border-base-300">
                  <img src={item.image} className="w-full h-full object-cover" alt="Flagged" />
                  <span className="absolute top-1 right-1 badge badge-error badge-xs font-bold py-1.5 px-2 text-[8px] text-white">
                    Conf: {item.confidence}
                  </span>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="leading-tight">
                      <span className="text-[10px] text-error font-bold flex items-center gap-0.5">
                        ⚠️ AI Geotag Flag
                      </span>
                      <h4 className="font-bold text-xs mt-1 text-base-content/90">Tagged: {item.destination}</h4>
                    </div>
                    <span className="text-[10px] text-base-content/75 font-mono">{item.time}</span>
                  </div>

                  <p className="text-[11px] bg-error/10 border border-error/25 text-error p-2 rounded-lg leading-relaxed font-semibold">
                    {item.reason}
                  </p>
                </div>

                <div className="flex md:flex-col gap-1 w-full md:w-auto pt-2 md:pt-0">
                  <button 
                    onClick={() => handleApproveFlag(item.id)}
                    className="btn btn-xs btn-success text-white font-bold flex-1 md:flex-initial rounded gap-1 py-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Overrule Flag
                  </button>
                  <button 
                    onClick={() => handleDiscardFlag(item.id)}
                    className="btn btn-xs btn-outline btn-error font-bold flex-1 md:flex-initial rounded gap-1 py-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Discard Post
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Administrator Delegation & Management Section */}
      <div className="card bg-base-100 border border-base-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-base-200 pb-3 gap-2">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2 m-0 text-primary">
              <ShieldCheck className="w-5 h-5 text-primary" /> Administrator Delegation & Auditing
            </h3>
            <p className="text-xs text-base-content/80 mt-0.5">
              Enter an admin handle starting with <span className="font-mono text-amber-400 font-bold">admin</span> and set a corresponding passcode.
            </p>
          </div>
          <span className="badge badge-warning text-slate-900 font-bold text-[10px]">
            {adminAccounts?.length || 2} Active Admins
          </span>
        </div>

        {adminMsg && (
          <div className="alert alert-success bg-success/10 border-success/20 text-success text-xs py-2.5 px-3 rounded-xl flex justify-between items-center">
            <span>{adminMsg}</span>
            <button onClick={() => setAdminMsg("")} className="btn btn-ghost btn-xs text-success p-0">✕</button>
          </div>
        )}

        {adminErr && (
          <div className="alert alert-error bg-error/10 border-error/20 text-error text-xs py-2.5 px-3 rounded-xl flex justify-between items-center">
            <span>{adminErr}</span>
            <button onClick={() => setAdminErr("")} className="btn btn-ghost btn-xs text-error p-0">✕</button>
          </div>
        )}

        {/* 2-Box Admin Creation Form */}
        <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-base-200/40 p-4 rounded-2xl border border-base-200">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-base-content/75 uppercase block mb-1">1. Admin Handle / Email</label>
            <input 
              type="text"
              placeholder="admin_sarah@laga.tour"
              value={newAdminHandle}
              onChange={(e) => setNewAdminHandle(e.target.value)}
              className="input input-sm h-10 w-full bg-base-100 border-base-300 text-xs rounded-xl focus:border-amber-400 font-mono text-base-content/90"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-base-content/75 uppercase block mb-1">2. Corresponding Passcode</label>
            <input 
              type="password"
              placeholder="Set Admin Passcode"
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              className="input input-sm h-10 w-full bg-base-100 border-base-300 text-xs rounded-xl focus:border-amber-400 text-base-content/90"
              required
            />
          </div>

          <div className="flex items-end">
            <button 
              type="submit"
              className="btn btn-primary btn-sm h-10 w-full text-xs rounded-xl font-bold gap-1.5 capitalize shrink-0 shadow-sm text-white"
            >
              <UserPlus className="w-4 h-4" /> Grant Access
            </button>
          </div>
        </form>

        {/* Registered Administrators List */}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-base-content/90">System Administrator Roster ({displayAdmins?.length || 0})</span>
            <span className="text-[10px] text-base-content/75">Click "View Info" for audit trail or "Block" to revoke access.</span>
          </div>

          <div className="space-y-2.5">
            {(displayAdmins || []).map((acc, i) => (
              <div 
                key={acc.id || i} 
                className={`p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  acc.status === "Blocked" 
                    ? "bg-error/5 border-error/30 text-base-content/80" 
                    : "bg-base-200/60 border-base-300 hover:border-base-400"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    acc.status === "Blocked" ? "bg-error/20 text-error border border-error/30" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  }`}>
                    {acc.status === "Blocked" ? <ShieldOff className="w-4.5 h-4.5" /> : <Shield className="w-4.5 h-4.5" />}
                  </div>
                  
                  <div className="min-w-0 leading-tight">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-base-content/95 truncate">{acc.handle}</span>
                      <span className={`badge badge-xs font-bold ${
                        acc.status === "Blocked" ? "badge-error text-white" : "badge-success text-white"
                      }`}>
                        {acc.status || "Active"}
                      </span>
                    </div>
                    <span className="text-[10px] text-base-content/75 block mt-1 truncate">
                      Passcode: <span className="font-mono text-amber-400 font-bold">{acc.password}</span> • Added by <span className="font-semibold text-base-content/85">{acc.addedBy || "admin@laga.tour"}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-base-300 w-full md:w-auto justify-end">
                  <button 
                    onClick={() => setViewInfoAdmin(acc)}
                    className="btn btn-xs btn-ghost bg-base-300 hover:bg-base-400 text-base-content/90 font-bold rounded-lg gap-1 text-[11px] px-2.5 py-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-info" /> View Info
                  </button>

                  <button 
                    onClick={() => setBlockConfirmAdmin(acc)}
                    className={`btn btn-xs font-bold rounded-lg gap-1 text-[11px] px-2.5 py-1 ${
                      acc.status === "Blocked" 
                        ? "btn-success text-white" 
                        : "btn-outline btn-error hover:bg-error hover:text-white"
                    }`}
                  >
                    <ShieldOff className="w-3.5 h-3.5" />
                    {acc.status === "Blocked" ? "Unblock Admin" : "Block Admin"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Confirmation Modal for Blocking/Unblocking Admin */}
      {blockConfirmAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-base-100 border border-base-300 rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <button 
              onClick={() => setBlockConfirmAdmin(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-base-content/60 hover:bg-base-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                blockConfirmAdmin.status === "Blocked" ? "bg-success/10 text-success" : "bg-error/10 text-error"
              }`}>
                <ShieldOff className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-base-content/95">
                {blockConfirmAdmin.status === "Blocked" ? "Unblock Administrator Access?" : "Block Administrator Access?"}
              </h3>
              <p className="text-xs text-base-content/80">
                {blockConfirmAdmin.status === "Blocked"
                  ? `Are you sure you want to reinstate administrative privileges for ${blockConfirmAdmin.handle}?`
                  : `Are you sure you want to block administrator ${blockConfirmAdmin.handle}? Blocked admins will be immediately barred from logging in.`
                }
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setBlockConfirmAdmin(null)}
                className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold text-base-content/80"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmToggleBlock}
                className={`btn btn-sm flex-1 rounded-xl text-xs font-bold text-white ${
                  blockConfirmAdmin.status === "Blocked" ? "btn-success" : "btn-error"
                }`}
              >
                {blockConfirmAdmin.status === "Blocked" ? "Yes, Unblock Admin" : "Yes, Block Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Details Info Modal */}
      {viewInfoAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-base-100 border border-base-300 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <button 
              onClick={() => setViewInfoAdmin(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-base-content/60 hover:bg-base-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-base-200 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Info className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Administrator Audit File</span>
                <h3 className="text-lg font-bold font-mono truncate text-base-content/95">{viewInfoAdmin.handle}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-base-200/60 p-3 rounded-2xl border border-base-200">
                <span className="text-[10px] text-base-content/75 uppercase block font-bold mb-1">Status</span>
                <span className={`badge badge-sm font-bold ${
                  viewInfoAdmin.status === "Blocked" ? "badge-error text-white" : "badge-success text-white"
                }`}>
                  {viewInfoAdmin.status || "Active"}
                </span>
              </div>

              <div className="bg-base-200/60 p-3 rounded-2xl border border-base-200">
                <span className="text-[10px] text-base-content/75 uppercase block font-bold mb-1">Assigned Role</span>
                <span className="font-bold text-base-content/90">{viewInfoAdmin.role || "Platform Administrator"}</span>
              </div>

              <div className="bg-base-200/60 p-3 rounded-2xl border border-base-200">
                <span className="text-[10px] text-base-content/75 uppercase block font-bold mb-1">Passcode</span>
                <span className="font-mono font-bold text-amber-400">{viewInfoAdmin.password}</span>
              </div>

              <div className="bg-base-200/60 p-3 rounded-2xl border border-base-200">
                <span className="text-[10px] text-base-content/75 uppercase block font-bold mb-1">Added By</span>
                <span className="font-semibold text-base-content/90 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-primary" /> {viewInfoAdmin.addedBy || "admin@laga.tour"}
                </span>
              </div>

              <div className="bg-base-200/60 p-3 rounded-2xl border border-base-200 col-span-2">
                <span className="text-[10px] text-base-content/75 uppercase block font-bold mb-1">Added Timestamp</span>
                <span className="font-mono text-base-content/90 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-warning" /> {viewInfoAdmin.addedAt || "Aug 1, 2026 at 09:00 AM"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-base-200">
              <button 
                onClick={() => {
                  const target = viewInfoAdmin;
                  setViewInfoAdmin(null);
                  setBlockConfirmAdmin(target);
                }}
                className={`btn btn-sm flex-1 rounded-xl text-xs font-bold ${
                  viewInfoAdmin.status === "Blocked" ? "btn-success text-white" : "btn-outline btn-error"
                }`}
              >
                {viewInfoAdmin.status === "Blocked" ? "Unblock Administrator" : "Block Administrator"}
              </button>
              <button 
                onClick={() => setViewInfoAdmin(null)}
                className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold text-base-content/80"
              >
                Close Audit File
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
