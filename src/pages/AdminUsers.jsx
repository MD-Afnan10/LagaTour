import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AdminUserModal from "../components/modals/AdminUserModal";
import AdminUserDetailsModal from "../components/modals/AdminUserDetailsModal";
import { 
  Users, 
  Search, 
  UserPlus, 
  UserX, 
  UserCheck, 
  ShieldAlert, 
  ShieldCheck, 
  Eye, 
  Edit, 
  Trash2, 
  Activity, 
  RefreshCw,
  Trophy,
  Filter,
  Copy,
  Check,
  MapPin,
  Mail,
  Phone,
  AlertCircle
} from "lucide-react";

export default function AdminUsers() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  // Notifications
  const [toastMsg, setToastMsg] = useState("");
  const [toastErr, setToastErr] = useState("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [userToConfirmStatus, setUserToConfirmStatus] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setToastErr("");
    try {
      const res = await api.getAdminUsers({
        search: searchTerm,
        status: statusFilter,
        role: roleFilter
      });
      if (res.success && Array.isArray(res.users)) {
        setUsers(res.users);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      setToastErr(err.message || "Failed to load travelers from database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, roleFilter]);

  // Handle Copy User ID
  const handleCopyId = (userId) => {
    if (userId) {
      navigator.clipboard?.writeText(userId);
      setCopiedId(userId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Toggle Ban / Suspend Status
  const handleToggleStatus = async (user) => {
    const currentStatus = (user.status || "active").toLowerCase();
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    const userId = user.id || user.user_id;

    try {
      await api.toggleUserStatus(userId, newStatus);
      setToastMsg(
        newStatus === "suspended"
          ? `🚫 Traveler @${user.username} has been SUSPENDED / BANNED.`
          : `✅ Traveler @${user.username} has been UNBANNED and restored to Active.`
      );
      setUserToConfirmStatus(null);
      
      // Update local state immediately
      setUsers(prev => prev.map(u => (u.id === userId || u.user_id === userId ? { ...u, status: newStatus } : u)));
      if (selectedUserDetails && (selectedUserDetails.id === userId || selectedUserDetails.user_id === userId)) {
        setSelectedUserDetails(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Error toggling status:", err);
      setToastErr(err.message || "Failed to update account status.");
    }
  };

  // Save / Update User (Create or Edit)
  const handleSaveUser = async (userData) => {
    try {
      if (editingUser) {
        const id = editingUser.id || editingUser.user_id;
        await api.updateAdminUser(id, userData);
        setToastMsg(`✅ Updated traveler profile for @${userData.username}`);
      } else {
        await api.createAdminUser(userData);
        setToastMsg(`✅ Registered new traveler account @${userData.username} in MySQL`);
      }
      setIsCreateModalOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      console.error("Save user error:", err);
      setToastErr(err.message || "Failed to save user account.");
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const userId = userToDelete.id || userToDelete.user_id;
    try {
      await api.deleteAdminUser(userId);
      setToastMsg(`🗑️ Deleted traveler account @${userToDelete.username} permanently.`);
      setUserToDelete(null);
      setUsers(prev => prev.filter(u => u.id !== userId && u.user_id !== userId));
      if (selectedUserDetails && (selectedUserDetails.id === userId || selectedUserDetails.user_id === userId)) {
        setSelectedUserDetails(null);
      }
    } catch (err) {
      console.error("Delete user error:", err);
      setToastErr(err.message || "Failed to delete user account.");
    }
  };

  // Statistics
  const userStats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => (u.status || "active").toLowerCase() === "active").length;
    const suspended = users.filter(u => (u.status || "").toLowerCase() === "suspended").length;
    const admins = users.filter(u => ["admin", "superadmin"].includes((u.role || "").toLowerCase())).length;
    return { total, active, suspended, admins };
  }, [users]);

  // Auth Protection Check
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
        <h2 className="text-2xl font-bold">Admin Authorization Required</h2>
        <p className="text-xs text-base-content/80">Only authorized platform administrators can manage traveler accounts.</p>
        <button onClick={() => navigate("/admin")} className="btn btn-warning btn-sm rounded-xl font-bold text-xs">
          Return to Admin Portal
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-6 max-w-6xl space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-base-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/admin" className="text-xs text-primary font-bold hover:underline">
              ← Admin Portal
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 flex items-center gap-2 text-base-content/95">
            <Users className="w-7 h-7 text-primary" /> Travelers & User Accounts Directory
          </h1>
          <p className="text-xs text-base-content/75 mt-0.5">
            Search with User ID or Username, inspect detailed traveler profiles, ban/suspend accounts, or create and edit users.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="btn btn-sm btn-ghost bg-base-200 text-base-content/80 hover:text-base-content rounded-xl text-xs font-bold gap-1.5"
            title="Reload from MySQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
            Refresh
          </button>

          <button
            onClick={() => {
              setEditingUser(null);
              setIsCreateModalOpen(true);
            }}
            className="btn btn-sm btn-primary rounded-xl text-xs font-bold gap-1.5 text-slate-900 shadow-md"
          >
            <UserPlus className="w-4 h-4" /> Add New Traveler
          </button>
        </div>
      </div>

      {/* Notifications */}
      {toastMsg && (
        <div className="alert alert-success bg-success/15 border border-success/30 text-success text-xs py-2.5 px-4 rounded-2xl flex justify-between items-center animate-in fade-in">
          <span className="font-bold">{toastMsg}</span>
          <button onClick={() => setToastMsg("")} className="btn btn-ghost btn-xs text-success p-0">✕</button>
        </div>
      )}
      {toastErr && (
        <div className="alert alert-error bg-error/15 border border-error/30 text-error text-xs py-2.5 px-4 rounded-2xl flex justify-between items-center animate-in fade-in">
          <span className="font-bold">{toastErr}</span>
          <button onClick={() => setToastErr("")} className="btn btn-ghost btn-xs text-error p-0">✕</button>
        </div>
      )}

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card bg-base-100 border border-base-200 p-3.5 shadow-sm text-center rounded-2xl">
          <span className="text-[10px] font-bold text-base-content/60 uppercase block">Total Travelers</span>
          <span className="text-2xl font-black text-primary mt-1 block font-mono">{userStats.total}</span>
        </div>
        <div className="card bg-base-100 border border-base-200 p-3.5 shadow-sm text-center rounded-2xl">
          <span className="text-[10px] font-bold text-base-content/60 uppercase block">Active Accounts</span>
          <span className="text-2xl font-black text-success mt-1 block font-mono">{userStats.active}</span>
        </div>
        <div className="card bg-base-100 border border-base-200 p-3.5 shadow-sm text-center rounded-2xl">
          <span className="text-[10px] font-bold text-base-content/60 uppercase block">Banned / Suspended</span>
          <span className="text-2xl font-black text-error mt-1 block font-mono">{userStats.suspended}</span>
        </div>
        <div className="card bg-base-100 border border-base-200 p-3.5 shadow-sm text-center rounded-2xl">
          <span className="text-[10px] font-bold text-base-content/60 uppercase block">Administrators</span>
          <span className="text-2xl font-black text-warning mt-1 block font-mono">{userStats.admins}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card bg-base-100 border border-base-200 p-4 shadow-sm rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          
          {/* Search Box: User ID or Username */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-base-content/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search with User ID, Username, or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-sm h-10 w-full pl-10 pr-4 bg-base-200/60 border-base-300 rounded-xl text-xs font-mono focus:border-primary"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/50 hover:text-base-content"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select select-sm h-10 w-full bg-base-200/60 border-base-300 rounded-xl text-xs"
            >
              <option value="All">All Account Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Suspended">Suspended / Banned Only</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="sm:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="select select-sm h-10 w-full bg-base-200/60 border-base-300 rounded-xl text-xs"
            >
              <option value="All">All Roles</option>
              <option value="User">Regular Travelers</option>
              <option value="Admin">Administrators Only</option>
            </select>
          </div>

        </div>
      </div>

      {/* Users Table */}
      <div className="card bg-base-100 border border-base-200 shadow-sm rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <span className="loading loading-spinner loading-md text-primary"></span>
            <p className="text-xs text-base-content/70">Fetching travelers from database...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-base-content/30 mx-auto" />
            <p className="font-bold text-sm text-base-content/90">No travelers found</p>
            <p className="text-xs text-base-content/60 max-w-sm mx-auto">
              No accounts matched your search "{searchTerm}". Try another user ID or clear filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("All");
                setRoleFilter("All");
              }}
              className="btn btn-xs btn-outline rounded-xl"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead className="bg-base-200/60 text-base-content/75 text-[11px] uppercase border-b border-base-200">
                <tr>
                  <th className="py-3 px-4">Traveler</th>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Contact & Location</th>
                  <th className="py-3 px-4">League & Points</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Role</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200 text-xs">
                {users.map((u) => {
                  const userId = u.id || u.user_id;
                  const isSuspended = (u.status || "active").toLowerCase() === "suspended";
                  const isAdminRole = ["admin", "superadmin"].includes((u.role || "").toLowerCase());

                  return (
                    <tr key={userId} className="hover:bg-base-200/40 transition-colors">
                      
                      {/* Traveler Profile */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`}
                            alt={u.name || u.username}
                            className="w-10 h-10 rounded-xl object-cover border border-base-300 bg-base-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-base-content/95 block truncate max-w-[140px]">
                              {u.name || u.username}
                            </span>
                            <span className="text-[11px] font-mono text-base-content/60 truncate block">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* User ID with Copy */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-base-200 text-base-content/85 px-2 py-0.5 rounded text-[11px] border border-base-300">
                            {userId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyId(userId)}
                            className="btn btn-ghost btn-xs p-1 text-base-content/50 hover:text-base-content"
                            title="Copy User ID"
                          >
                            {copiedId === userId ? (
                              <Check className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Contact & Location */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="text-base-content/85 flex items-center gap-1 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 text-base-content/40 shrink-0" />
                            {u.email || "No email"}
                          </span>
                          <span className="text-[11px] text-base-content/60 flex items-center gap-1 truncate max-w-[180px]">
                            <MapPin className="w-3 h-3 text-base-content/40 shrink-0" />
                            {[u.city, u.country].filter(Boolean).join(", ") || "Bangladesh"}
                          </span>
                        </div>
                      </td>

                      {/* League & Points */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-bold text-base-content/90">{u.league || "Explorer"}</span>
                          <span className="text-[11px] font-mono text-base-content/60">
                            ({u.points || 0} pts)
                          </span>
                        </div>
                      </td>

                      {/* Account Status Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className={`badge badge-xs font-bold py-2 px-2.5 ${
                          isSuspended ? "badge-error text-white" : "badge-success text-white"
                        }`}>
                          {isSuspended ? "Suspended" : "Active"}
                        </span>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className={`badge badge-xs font-bold uppercase py-2 px-2.5 ${
                          isAdminRole ? "badge-warning text-slate-900" : "badge-ghost text-base-content/70"
                        }`}>
                          {u.role || "user"}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* 1. View Detailed Data Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedUserDetails(u)}
                            className="btn btn-xs btn-ghost bg-base-200 hover:bg-base-300 text-base-content/85 rounded-lg gap-1 font-bold"
                            title="View Detailed Data"
                          >
                            <Eye className="w-3.5 h-3.5 text-info" />
                            <span className="hidden md:inline">Details</span>
                          </button>

                          {/* 2. Ban / Suspend or Unban Button */}
                          <button
                            type="button"
                            onClick={() => setUserToConfirmStatus(u)}
                            className={`btn btn-xs rounded-lg gap-1 font-bold ${
                              isSuspended 
                                ? "btn-success text-white" 
                                : "btn-outline btn-error hover:bg-error hover:text-white"
                            }`}
                            title={isSuspended ? "Unban Account" : "Ban / Suspend Account"}
                          >
                            {isSuspended ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Unban</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Ban</span>
                              </>
                            )}
                          </button>

                          {/* 3. Edit Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(u);
                              setIsCreateModalOpen(true);
                            }}
                            className="btn btn-xs btn-ghost text-base-content/70 hover:text-base-content p-1"
                            title="Edit User"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Delete Button */}
                          <button
                            type="button"
                            onClick={() => setUserToDelete(u)}
                            className="btn btn-xs btn-ghost text-error hover:bg-error/10 p-1"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: View Detailed User Data */}
      <AdminUserDetailsModal
        isOpen={Boolean(selectedUserDetails)}
        onClose={() => setSelectedUserDetails(null)}
        user={selectedUserDetails}
        onToggleStatus={(u) => handleToggleStatus(u)}
        onEdit={(u) => {
          setSelectedUserDetails(null);
          setEditingUser(u);
          setIsCreateModalOpen(true);
        }}
        onDelete={(u) => {
          setSelectedUserDetails(null);
          setUserToDelete(u);
        }}
      />

      {/* MODAL 2: Create / Edit User Form Modal */}
      <AdminUserModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSave={handleSaveUser}
      />

      {/* MODAL 3: Confirm Ban / Unban Modal */}
      {userToConfirmStatus && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-base-100 border border-base-300 rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                (userToConfirmStatus.status || "active").toLowerCase() === "suspended" 
                  ? "bg-success/10 text-success" 
                  : "bg-error/10 text-error"
              }`}>
                {(userToConfirmStatus.status || "active").toLowerCase() === "suspended" ? (
                  <UserCheck className="w-6 h-6" />
                ) : (
                  <UserX className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-lg font-bold text-base-content/95">
                {(userToConfirmStatus.status || "active").toLowerCase() === "suspended"
                  ? `Unban Traveler @${userToConfirmStatus.username}?`
                  : `Ban / Suspend Traveler @${userToConfirmStatus.username}?`
                }
              </h3>
              <p className="text-xs text-base-content/80 leading-relaxed">
                {(userToConfirmStatus.status || "active").toLowerCase() === "suspended"
                  ? `This will restore account access for @${userToConfirmStatus.username} (ID: ${userToConfirmStatus.id || userToConfirmStatus.user_id}). They will be able to log in and participate in tours.`
                  : `Are you sure you want to suspend @${userToConfirmStatus.username} (ID: ${userToConfirmStatus.id || userToConfirmStatus.user_id})? Suspended accounts cannot log in or publish posts.`
                }
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToConfirmStatus(null)}
                className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus(userToConfirmStatus)}
                className={`btn btn-sm flex-1 rounded-xl text-xs font-bold text-white shadow-md ${
                  (userToConfirmStatus.status || "active").toLowerCase() === "suspended"
                    ? "btn-success"
                    : "btn-error"
                }`}
              >
                {(userToConfirmStatus.status || "active").toLowerCase() === "suspended" ? "Confirm Unban" : "Confirm Ban"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Confirm Delete User Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-base-100 border border-base-300 rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-base-content/95">
                Permanently Delete User @{userToDelete.username}?
              </h3>
              <p className="text-xs text-base-content/80 leading-relaxed">
                This action is <strong className="text-error">irreversible</strong>. It will remove @{userToDelete.username} (ID: {userToDelete.id || userToDelete.user_id}) and related data from the MySQL database.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="btn btn-ghost btn-sm flex-1 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="btn btn-error btn-sm flex-1 rounded-xl text-xs font-bold text-white shadow-md"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
