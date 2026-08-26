import React from "react";
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PostProvider } from "./context/PostContext";
import Navbar from "./components/Navbar";
import AdminNavbar from "./components/AdminNavbar";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

// Pages
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import SocialFeed from "./pages/SocialFeed";
import MapExplorer from "./pages/MapExplorer";
import TourPlans from "./pages/TourPlans";
import GroupPlanner from "./pages/GroupPlanner";
import Messaging from "./pages/Messaging";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import AIBuilder from "./pages/AIBuilder";
import Places from "./pages/Places";
import UserProfile from "./pages/UserProfile";
import Rankings from "./pages/Rankings";
import CreatePost from "./pages/CreatePost";
import CreateGroupChat from "./pages/CreateGroupChat";

// Protected Layout Guard Component
function ProtectedLayout() {
  const { currentUser, globalBanner, clearGlobalBannerAlert } = useAuth();

  if (!currentUser) {
    return <Navigate to="/welcome" replace />;
  }

  const loginMode = localStorage.getItem("ts_login_mode") || "user";
  const isAdminAccount = currentUser.isAdmin || currentUser?.email?.toLowerCase().startsWith("admin");
  const showAdminNavbar = isAdminAccount && loginMode === "admin";

  const getBannerColor = (type) => {
    switch (type) {
      case 'error': return 'bg-error text-white';
      case 'warning': return 'bg-warning text-slate-900';
      case 'success': return 'bg-success text-white';
      default: return 'bg-info text-white';
    }
  };

  const getBannerIcon = (type) => {
    switch (type) {
      case 'error': return <XCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'success': return <CheckCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  return (
    <>
      {globalBanner && (
        <div className={`px-4 py-2 flex items-center justify-between text-sm font-bold shadow-md z-[60] relative ${getBannerColor(globalBanner.type)}`}>
          <div className="flex items-center gap-2">
            {getBannerIcon(globalBanner.type)}
            <span>{globalBanner.message}</span>
          </div>
          {isAdminAccount && (
            <button onClick={clearGlobalBannerAlert} className="btn btn-ghost btn-xs btn-circle opacity-70 hover:opacity-100">
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      {showAdminNavbar ? <AdminNavbar /> : <Navbar />}
      <div className="flex-1 bg-base-300">
        <Outlet />
      </div>
    </>
  );
}

// Router configuration using createBrowserRouter (React Router Data Router)
const router = createBrowserRouter([
  {
    path: "/welcome",
    element: <Welcome />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    element: <ProtectedLayout />,
    children: [
      { path: "/", element: <SocialFeed /> },
      { path: "/create-post", element: <CreatePost /> },
      { path: "/map", element: <MapExplorer /> },
      { path: "/places", element: <Places /> },
      { path: "/plans", element: <TourPlans /> },
      { path: "/rankings", element: <Rankings /> },
      { path: "/groups", element: <GroupPlanner /> },
      { path: "/chats", element: <Messaging /> },
      { path: "/chats/create-group", element: <CreateGroupChat /> },
      { path: "/ai-builder", element: <AIBuilder /> },
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/profile/:userId", element: <UserProfile /> },
      { path: "/admin", element: <AdminPanel /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

function App() {
  return (
    <AuthProvider>
      <PostProvider>
        <RouterProvider router={router} />
      </PostProvider>
    </AuthProvider>
  );
}

export default App;
