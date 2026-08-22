import React from "react";
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";

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

// Protected Layout Guard Component
function ProtectedLayout() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <>
      <Navbar />
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
      { path: "/map", element: <MapExplorer /> },
      { path: "/places", element: <Places /> },
      { path: "/plans", element: <TourPlans /> },
      { path: "/rankings", element: <Rankings /> },
      { path: "/groups", element: <GroupPlanner /> },
      { path: "/chats", element: <Messaging /> },
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
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
