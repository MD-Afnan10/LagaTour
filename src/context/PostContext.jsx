import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { MOCK_POSTS } from "../data/mockData";
import api from "../services/api";

const PostContext = createContext();

export function usePosts() {
  const context = useContext(PostContext);
  return context || {};
}

const INITIAL_REPORTS = [
  {
    id: "rep_1",
    postId: "post_2",
    post: {
      id: "post_2",
      author: { name: "Nabil Ahmed", username: "nabil_wanderer", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" },
      image: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=800",
      video: "",
      caption: "Woke up above the clouds today in Sajek Valley. ☁️🏕️ The morning breeze and lush green mountain peaks are absolutely worth the bumpy Chander Gari ride!",
      destination: "Sajek Valley"
    },
    reporter: "sadia_expeditions",
    reason: "Contains potentially dangerous cliff trekking tips without safety warnings.",
    timestamp: "2 hours ago",
    status: "pending"
  }
];

export function PostProvider({ children }) {
  const [posts, setPosts] = useState(() => {
    return MOCK_POSTS.map(p => ({
      ...p,
      video: p.video || "",
      shares: p.shares || 0,
      saves: p.saves || 0,
      hasLiked: p.hasLiked || false,
      hasSaved: p.hasSaved || false,
      isHidden: p.isHidden || false
    }));
  });

  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [isLoading, setIsLoading] = useState(false);
  const [backendActive, setBackendActive] = useState(false);

  // Load posts and reports from backend MySQL
  const loadPostsFromBackend = useCallback(async (userId = null) => {
    try {
      setIsLoading(true);
      const fetchedPosts = await api.fetchPosts(userId, true);
      if (fetchedPosts && Array.isArray(fetchedPosts) && fetchedPosts.length > 0) {
        setPosts(fetchedPosts);
        setBackendActive(true);
      }
    } catch (err) {
      console.warn("Could not load posts from Node.js backend:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadReportsFromBackend = useCallback(async () => {
    try {
      const fetchedReports = await api.fetchReports();
      if (fetchedReports && Array.isArray(fetchedReports)) {
        setReports(fetchedReports);
      }
    } catch (err) {
      console.warn("Could not load reports from Node.js backend:", err.message);
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("ts_current_user");
    let userId = null;
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        userId = parsed.id || parsed.user_id;
      } catch {
        // Ignored
      }
    }
    loadPostsFromBackend(userId);
    loadReportsFromBackend();
  }, [loadPostsFromBackend, loadReportsFromBackend]);

  // Create Post with multiple images and videos
  const createPost = async (postData) => {
    const rawImages = postData.images || (postData.image ? [postData.image] : []);
    const rawVideos = postData.videos || (postData.video ? [postData.video] : []);

    const localNewPost = {
      id: "post_" + Date.now(),
      author: postData.author,
      images: rawImages,
      videos: rawVideos,
      image: rawImages[0] || "",
      video: rawVideos[0] || "",
      caption: postData.caption || "",
      destination: postData.destination || "General Exploration",
      likes: 0,
      shares: 0,
      saves: 0,
      comments: [],
      hasLiked: false,
      hasSaved: false,
      isHidden: false,
      time: "Just now",
      createdAt: new Date().toISOString()
    };

    // Optimistic UI update
    setPosts(prev => [localNewPost, ...prev]);

    // Send to Node.js / MySQL backend
    try {
      const savedPost = await api.createPost({
        author: postData.author,
        caption: postData.caption,
        images: rawImages,
        videos: rawVideos,
        destination: postData.destination || "General Exploration",
        isPublic: true
      });

      if (savedPost) {
        setPosts(prev => prev.map(p => p.id === localNewPost.id ? savedPost : p));
        return savedPost;
      }
    } catch (err) {
      console.warn("Backend createPost failed, kept local copy:", err.message);
    }

    return localNewPost;
  };

  // Toggle Like
  const toggleLikePost = async (postId, user) => {
    // 1. Optimistic update
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = post.hasLiked;
        return {
          ...post,
          hasLiked: !isLiked,
          likes: isLiked ? Math.max(0, (post.likes || 0) - 1) : (post.likes || 0) + 1
        };
      }
      return post;
    }));

    // 2. Call backend
    try {
      const res = await api.likePost(postId, user);
      if (res && res.success) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              hasLiked: res.hasLiked,
              likes: res.likes
            };
          }
          return post;
        }));
      }
    } catch (err) {
      console.warn("Backend toggleLike failed:", err.message);
    }
  };

  // Save/Bookmark Post
  const toggleSavePost = async (postId, user) => {
    // 1. Optimistic update
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isSaved = post.hasSaved;
        return {
          ...post,
          hasSaved: !isSaved,
          saves: isSaved ? Math.max(0, (post.saves || 0) - 1) : (post.saves || 0) + 1
        };
      }
      return post;
    }));

    // 2. Call backend
    try {
      const res = await api.savePost(postId, user);
      if (res && res.success) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              hasSaved: res.hasSaved,
              saves: res.saves
            };
          }
          return post;
        }));
      }
    } catch (err) {
      console.warn("Backend toggleSave failed:", err.message);
    }
  };

  // Share Post
  const sharePost = async (postId) => {
    // 1. Optimistic update
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          shares: (post.shares || 0) + 1
        };
      }
      return post;
    }));

    // 2. Call backend
    try {
      const res = await api.sharePost(postId);
      if (res && res.success) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              shares: res.shares
            };
          }
          return post;
        }));
        return res;
      }
    } catch (err) {
      console.warn("Backend sharePost failed:", err.message);
    }

    return { success: true, shares: 1 };
  };

  // Add Comment
  const addComment = async (postId, user, text) => {
    if (!text.trim()) return;

    const localComment = {
      id: "c_" + Date.now(),
      user: typeof user === "string" ? user : user?.username || "traveler",
      avatar: typeof user === "object" ? user?.avatar : undefined,
      text: text.trim(),
      time: "Just now"
    };

    // 1. Optimistic update
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...(post.comments || []), localComment]
        };
      }
      return post;
    }));

    // 2. Call backend
    try {
      const savedComment = await api.commentPost(postId, user, text);
      if (savedComment) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: (post.comments || []).map(c => c.id === localComment.id ? savedComment : c)
            };
          }
          return post;
        }));
      }
    } catch (err) {
      console.warn("Backend addComment failed:", err.message);
    }
  };

  // Report Post
  const reportPost = async (postId, user, reporterInput, reasonInput) => {
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ", " + now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const localReport = {
      id: "rep_" + Date.now(),
      postId: targetPost.id,
      post: {
        id: targetPost.id,
        author: targetPost.author,
        image: targetPost.image,
        video: targetPost.video,
        caption: targetPost.caption,
        destination: targetPost.destination
      },
      reporter: reporterInput?.trim() || user?.name || user?.username || "Anonymous Traveler",
      reason: reasonInput?.trim() || "Inappropriate or misleading content",
      timestamp: formattedTime,
      status: "pending"
    };

    setReports(prev => [localReport, ...prev]);

    // Send to backend
    try {
      await api.reportPost(postId, user, reasonInput, reporterInput);
      await loadReportsFromBackend();
    } catch (err) {
      console.warn("Backend reportPost failed:", err.message);
    }
  };

  // User Action: Update a Post
  const updatePost = async (postId, postData) => {
    // 1. Optimistic update
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          caption: postData.caption !== undefined ? postData.caption : post.caption,
          images: postData.images || post.images,
          image: (postData.images && postData.images[0]) || post.image,
          videos: postData.videos || post.videos,
          video: (postData.videos && postData.videos[0]) || post.video,
          isPublic: postData.isPublic !== undefined ? postData.isPublic : post.isPublic,
          isHidden: postData.isPublic !== undefined ? !postData.isPublic : post.isHidden
        };
      }
      return post;
    }));

    // 2. Send to backend MySQL
    try {
      await api.updatePost(postId, postData);
    } catch (err) {
      console.warn("Backend updatePost failed:", err.message);
    }
  };

  // User Action: Delete a Post permanently
  const deletePost = async (postId) => {
    // 1. Optimistic removal
    setPosts(prev => prev.filter(post => post.id !== postId));

    // 2. Delete from MySQL
    try {
      await api.deletePost(postId);
    } catch (err) {
      console.warn("Backend deletePost failed:", err.message);
    }
  };

  // User/Admin Action: Toggle Visibility (Private / Public)
  const togglePostVisibility = async (postId, isPublic) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isPublic: isPublic,
          isHidden: !isPublic
        };
      }
      return post;
    }));

    try {
      await api.updatePostVisibility(postId, isPublic);
    } catch (err) {
      console.warn("Backend togglePostVisibility failed:", err.message);
    }
  };

  // Admin Actions: Hide post
  const hidePost = async (postId) => {
    await togglePostVisibility(postId, false);
  };

  // Admin Actions: Make post visible (Unhide)
  const makePostVisible = async (postId) => {
    await togglePostVisibility(postId, true);
  };

  // Admin Actions: Dismiss / Delete report
  const dismissReport = async (reportId) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    try {
      await api.dismissReport(reportId);
    } catch (err) {
      console.warn("Backend dismissReport failed:", err.message);
    }
  };

  const value = {
    posts,
    reports,
    isLoading,
    backendActive,
    loadPostsFromBackend,
    loadReportsFromBackend,
    createPost,
    updatePost,
    deletePost,
    togglePostVisibility,
    toggleLikePost,
    toggleSavePost,
    sharePost,
    addComment,
    reportPost,
    hidePost,
    makePostVisible,
    dismissReport
  };

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
}
