import React, { createContext, useContext, useState, useEffect } from "react";
import { MOCK_POSTS } from "../data/mockData";

const PostContext = createContext();

export function usePosts() {
  return useContext(PostContext);
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
    const saved = localStorage.getItem("ts_posts");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved posts", e);
      }
    }
    return MOCK_POSTS.map(p => ({
      ...p,
      video: p.video || "",
      hasLiked: p.hasLiked || false,
      hasSaved: p.hasSaved || false,
      isHidden: p.isHidden || false
    }));
  });

  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem("ts_reports");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved reports", e);
      }
    }
    return INITIAL_REPORTS;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("ts_posts", JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem("ts_reports", JSON.stringify(reports));
  }, [reports]);

  // Create Post with multiple images and videos
  const createPost = (postData) => {
    const rawImages = postData.images || (postData.image ? [postData.image] : []);
    const rawVideos = postData.videos || (postData.video ? [postData.video] : []);

    const newPost = {
      id: "post_" + Date.now(),
      author: postData.author,
      images: rawImages,
      videos: rawVideos,
      image: rawImages[0] || "",
      video: rawVideos[0] || "",
      caption: postData.caption || "",
      destination: postData.destination || "General Exploration",
      likes: 0,
      comments: [],
      hasLiked: false,
      hasSaved: false,
      isHidden: false,
      time: "Just now"
    };

    setPosts(prev => [newPost, ...prev]);
    return newPost;
  };

  // Toggle Like (Replaces upvote/downvote)
  const toggleLikePost = (postId) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = post.hasLiked;
        return {
          ...post,
          hasLiked: !isLiked,
          likes: isLiked ? Math.max(0, post.likes - 1) : post.likes + 1
        };
      }
      return post;
    }));
  };

  // Save/Bookmark Post
  const toggleSavePost = (postId) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          hasSaved: !post.hasSaved
        };
      }
      return post;
    }));
  };

  // Add Comment
  const addComment = (postId, user, text) => {
    if (!text.trim()) return;
    const newComment = {
      id: "c_" + Date.now(),
      user: typeof user === "string" ? user : user?.username || "traveler",
      avatar: typeof user === "object" ? user?.avatar : undefined,
      text: text.trim(),
      time: "Just now"
    };

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...(post.comments || []), newComment]
        };
      }
      return post;
    }));
  };

  // Report Post (Takes optional reporter name/handle and reason)
  const reportPost = (postId, reporterInput, reasonInput) => {
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ", " + now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const newReport = {
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
      reporter: reporterInput?.trim() || "Anonymous Traveler",
      reason: reasonInput?.trim() || "Inappropriate or misleading content",
      timestamp: formattedTime,
      status: "pending"
    };

    setReports(prev => [newReport, ...prev]);
  };

  // Admin Actions: Hide post
  const hidePost = (postId) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, isHidden: true };
      }
      return post;
    }));
  };

  // Admin Actions: Make post visible (Unhide)
  const makePostVisible = (postId) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, isHidden: false };
      }
      return post;
    }));
  };

  // Admin Actions: Dismiss / Delete report
  const dismissReport = (reportId) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  const value = {
    posts,
    reports,
    createPost,
    toggleLikePost,
    toggleSavePost,
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
