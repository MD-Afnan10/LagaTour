import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { 
  Lock, 
  Mail, 
  User, 
  ArrowLeft, 
  ShieldAlert, 
  AlertTriangle, 
  KeyRound, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function Auth() {
  const authContext = useAuth();
  const { login, signup, sendVerificationCode, resetPassword } = authContext;
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'login' | 'signup' | 'forgot_password'
  const [authMode, setAuthMode] = useState("login");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // OTP Verification States
  const [signupStep, setSignupStep] = useState(1); // 1: Info input, 2: OTP verification
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState(1); // 1: Email input, 2: OTP + New Password

  // Live OTP Assistance / Preview
  const [activeOtpHint, setActiveOtpHint] = useState("");
  const [emailPreviewUrl, setEmailPreviewUrl] = useState("");

  // Timer & UI Feedback
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Discreet Admin Portal state
  const shouldAutoOpenAdmin = location.state?.openAdmin || new URLSearchParams(location.search).get("admin") === "true";
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(shouldAutoOpenAdmin);
  const [adminEmail, setAdminEmail] = useState("admin@laga.tour");
  const [adminPassword, setAdminPassword] = useState("admin");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (shouldAutoOpenAdmin) {
      setIsAdminModalOpen(true);
    }
  }, [shouldAutoOpenAdmin]);

  // Resend Countdown Timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle User Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await login(email, password);
      localStorage.setItem("ts_login_mode", "user");
      setSuccess("Success! Logging in...");
      setTimeout(() => navigate("/"), 600);
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send Signup OTP Code
  const handleRequestSignupCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const sendFn = sendVerificationCode || authContext.sendVerification || api.sendVerificationCode;
      const res = await sendFn(email, "signup");
      setSuccess(`Verification code sent to ${email}!`);
      if (res?.devCode) {
        setActiveOtpHint(res.devCode);
      }
      if (res?.previewUrl) {
        setEmailPreviewUrl(res.previewUrl);
      }
      setSignupStep(2);
      setResendTimer(60);
    } catch (err) {
      setError(err.message || "Failed to send verification code. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Complete Verified Signup
  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    setLoading(true);
    try {
      await signup(name, email, password, otpCode.trim());
      localStorage.setItem("ts_login_mode", "user");
      setSuccess("Account verified and created successfully! Redirecting...");
      setTimeout(() => navigate("/"), 800);
    } catch (err) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Resend Verification Code
  const handleResendCode = async (purpose = "signup") => {
    if (resendTimer > 0) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await sendVerificationCode(email, purpose);
      setSuccess(`A fresh verification code was sent to ${email}!`);
      if (res?.devCode) {
        setActiveOtpHint(res.devCode);
      }
      if (res?.previewUrl) {
        setEmailPreviewUrl(res.previewUrl);
      }
      setResendTimer(60);
    } catch (err) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request Password Reset Code
  const handleRequestForgotCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !email.includes("@")) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await sendVerificationCode(email, "forgot_password");
      setSuccess(`Reset verification code sent to ${email}!`);
      if (res?.devCode) {
        setActiveOtpHint(res.devCode);
      }
      if (res?.previewUrl) {
        setEmailPreviewUrl(res.previewUrl);
      }
      setForgotStep(2);
      setResendTimer(60);
    } catch (err) {
      setError(err.message || "No account found with this email address.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit New Password with OTP
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit reset code sent to your email.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, otpCode.trim(), newPassword);
      setSuccess("Password reset successfully! You can now log in with your new password.");
      setTimeout(() => {
        setAuthMode("login");
        setForgotStep(1);
        setOtpCode("");
        setPassword("");
        setSuccess("");
        setActiveOtpHint("");
        setEmailPreviewUrl("");
      }, 1500);
    } catch (err) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Admin Portal Submission
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError("");
    setAdminLoading(true);

    try {
      await login(adminEmail, adminPassword);
      localStorage.setItem("ts_login_mode", "admin");
      setIsAdminModalOpen(false);
      navigate("/admin");
    } catch (err) {
      setAdminError(err.message || "Invalid administrator credentials.");
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 md:p-8 bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      
      {/* Background aesthetic glows */}
      <div className="absolute top-[-20%] left-[20%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[100px]" />

      {/* Return to Landing link */}
      <div className="w-full max-w-5xl flex justify-start z-20 pt-2">
        <Link 
          to="/welcome" 
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Back to features
        </Link>
      </div>

      {/* Centered Auth Card */}
      <div className={`w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 md:p-10 rounded-3xl shadow-2xl relative z-10 space-y-6 my-auto ${error ? 'animate-shake' : ''}`}>
        
        {/* Brand Logo & Heading */}
        <div className="text-center space-y-3">
          <div className="flex justify-center items-center gap-2">
            <img src="/logo.png" className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 shadow" alt="Logo" />
            <span className="text-3xl font-bold text-amber-400 font-['Caveat']">Laga Tour</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white m-0">
              {authMode === "login" && "Welcome back"}
              {authMode === "signup" && (signupStep === 1 ? "Start your journey" : "Verify your Email")}
              {authMode === "forgot_password" && (forgotStep === 1 ? "Reset Password" : "Enter Reset Code")}
            </h2>
            <p className="text-xs text-slate-400">
              {authMode === "login" && "Access your travel maps, social feeds, and groups"}
              {authMode === "signup" && (signupStep === 1 ? "Create an account to share plans and stories" : "Input the 6-digit verification code sent to your email")}
              {authMode === "forgot_password" && (forgotStep === 1 ? "We will send an OTP code to verify your email" : "Set your new secure password")}
            </p>
          </div>
        </div>

        {/* Error Feedback Banner */}
        {error && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs py-3 px-3.5 rounded-2xl flex items-start gap-2.5 shadow-sm animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-snug flex-1">
              <span className="font-bold block text-rose-200 text-[11px] uppercase tracking-wider mb-0.5">
                {error.toLowerCase().includes("already exists") ? "Account Notice" : "Authentication Notice"}
              </span>
              <span>{error}</span>
              {error.toLowerCase().includes("already exists") && (
                <div className="mt-2 pt-2 border-t border-rose-500/20 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setAuthMode("login");
                      setError("");
                    }}
                    className="btn btn-xs btn-primary text-slate-900 font-bold rounded-lg"
                  >
                    👉 Go to Sign In
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setAuthMode("forgot_password");
                      setForgotStep(1);
                      setError("");
                    }}
                    className="btn btn-xs btn-ghost text-amber-300 font-bold underline"
                  >
                    Reset Password
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="alert alert-success bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-xs py-2.5 px-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. LOGIN FORM */}
        {/* ======================================================== */}
        {authMode === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label py-0.5"><span className="label-text text-slate-300 text-xs font-semibold">Email or Username</span></label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="traveler@laga.tour or aria_travels" 
                  className="input input-sm h-11 bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-amber-400 w-full pl-10 rounded-xl text-xs transition-colors" 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <div className="flex justify-between items-center py-0.5">
                <span className="label-text text-slate-300 text-xs font-semibold">Password</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("forgot_password");
                    setForgotStep(1);
                    setError("");
                    setSuccess("");
                    setActiveOtpHint("");
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input input-sm h-11 bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-amber-400 w-full pl-10 rounded-xl text-xs transition-colors" 
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary text-slate-900 font-bold border-none rounded-xl w-full h-11 min-h-0 text-xs capitalize mt-4 shadow-lg shadow-orange-500/10"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner text-slate-900"></span> : "Sign In"}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* 2. SIGNUP FORM - STEP 1 (Details) & STEP 2 (Email OTP) */}
        {/* ======================================================== */}
        {authMode === "signup" && signupStep === 1 && (
          <form onSubmit={handleRequestSignupCode} className="space-y-4">
            <div className="form-control">
              <label className="label py-0.5"><span className="label-text text-slate-300 text-xs font-semibold">Full Name</span></label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Aria Jahan" 
                  className="input input-sm h-11 bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-amber-400 w-full pl-10 rounded-xl text-xs transition-colors" 
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError("");
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label py-0.5"><span className="label-text text-slate-300 text-xs font-semibold">Email Address</span></label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="email" 
                  placeholder="aria@laga.tour" 
                  className="input input-sm h-11 bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-amber-400 w-full pl-10 rounded-xl text-xs transition-colors" 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label py-0.5"><span className="label-text text-slate-300 text-xs font-semibold">Create Password (min. 6 characters)</span></label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input input-sm h-11 bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-amber-400 w-full pl-10 rounded-xl text-xs transition-colors" 
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary text-slate-900 font-bold border-none rounded-xl w-full h-11 min-h-0 text-xs capitalize mt-4 shadow-lg shadow-orange-500/10 flex items-center justify-center gap-1.5"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner text-slate-900"></span>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* SIGNUP STEP 2: ENTER OTP CODE */}
        {authMode === "signup" && signupStep === 2 && (
          <form onSubmit={handleCompleteSignup} className="space-y-4">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center space-y-1">
              <span className="text-[11px] text-amber-300 font-semibold block">Email Ownership Verification</span>
              <p className="text-[10px] text-slate-300">
                We sent a 6-digit code to <strong className="text-white">{email}</strong>.
              </p>
            </div>

            {/* Direct OTP Helper Banner */}
            {activeOtpHint && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 p-3 rounded-2xl flex items-center justify-between gap-2">
                <div className="leading-tight">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Your Verification Code</span>
                  <span className="text-base font-mono font-black text-white tracking-widest">{activeOtpHint}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setOtpCode(activeOtpHint)} 
                  className="btn btn-xs btn-primary text-slate-900 font-bold rounded-xl shadow-sm gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Fill
                </button>
              </div>
            )}

            {/* Test Email Preview Link */}
            {emailPreviewUrl && (
              <div className="text-center">
                <a 
                  href={emailPreviewUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[11px] text-sky-400 hover:text-sky-300 underline font-semibold inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Open Email Inbox Web View
                </a>
              </div>
            )}

            <div className="form-control text-center">
              <label className="label py-1 justify-center">
                <span className="label-text text-slate-300 text-xs font-bold uppercase tracking-wider">6-Digit Verification Code</span>
              </label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="123456" 
                className="input input-lg h-14 bg-slate-950 border border-amber-500/40 text-amber-400 text-center font-mono font-black text-2xl tracking-[0.4em] rounded-2xl focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 w-full"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/[^0-9]/g, ""));
                  if (error) setError("");
                }}
                required
                autoFocus
              />
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <button 
                type="button" 
                onClick={() => {
                  setSignupStep(1);
                  setError("");
                }}
                className="text-slate-400 hover:text-slate-200 underline text-[11px]"
              >
                Change Email / Details
              </button>

              <button 
                type="button" 
                onClick={() => handleResendCode("signup")}
                disabled={resendTimer > 0 || loading}
                className={`text-[11px] font-bold ${resendTimer > 0 ? "text-slate-500" : "text-amber-400 hover:text-amber-300 underline"}`}
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend Code"}
              </button>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary text-slate-900 font-bold border-none rounded-xl w-full h-11 min-h-0 text-xs capitalize mt-4 shadow-lg shadow-orange-500/10 flex items-center justify-center gap-1.5"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner text-slate-900"></span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Email & Create Account</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* 3. FORGOT PASSWORD FLOW */}
        {/* ======================================================== */}
        {authMode === "forgot_password" && forgotStep === 1 && (
          <form onSubmit={handleRequestForgotCode} className="space-y-4">
            <div className="form-control">
              <label className="label py-0.5"><span className="label-text text-slate-300 text-xs font-semibold">Registered Email Address</span></label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="email" 
                  placeholder="aria@laga.tour" 
                  className="input input-sm h-11 bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-amber-400 w-full pl-10 rounded-xl text-xs transition-colors" 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary text-slate-900 font-bold border-none rounded-xl w-full h-11 min-h-0 text-xs capitalize mt-4 shadow-lg shadow-orange-500/10 flex items-center justify-center gap-1.5"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner text-slate-900"></span> : "Send Reset Code to Email"}
            </button>

            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={() => {
                  setAuthMode("login");
                  setError("");
                }}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {authMode === "forgot_password" && forgotStep === 2 && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            
            {/* Direct OTP Helper Banner */}
            {activeOtpHint && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 p-3 rounded-2xl flex items-center justify-between gap-2">
                <div className="leading-tight">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Your Reset Code</span>
                  <span className="text-base font-mono font-black text-white tracking-widest">{activeOtpHint}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setOtpCode(activeOtpHint)} 
                  className="btn btn-xs btn-primary text-slate-900 font-bold rounded-xl shadow-sm gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Fill
                </button>
              </div>
            )}

            <div className="form-control text-center">
              <label className="label py-0.5 justify-center">
                <span className="label-text text-slate-300 text-xs font-bold uppercase tracking-wider">6-Digit Code from Email</span>
              </label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="123456" 
                className="input input-md h-12 bg-slate-950 border border-amber-500/40 text-amber-400 text-center font-mono font-bold text-xl tracking-[0.3em] rounded-xl focus:border-amber-400 w-full"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/[^0-9]/g, ""));
                  if (error) setError("");
                }}
                required
                autoFocus
              />
            </div>

            <div className="form-control">
              <label className="label py-0.5"><span className="label-text text-slate-300 text-xs font-semibold">New Password (min. 6 characters)</span></label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="input input-sm h-11 bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-amber-400 w-full pl-10 rounded-xl text-xs transition-colors" 
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError("");
                  }}
                  required
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <button 
                type="button" 
                onClick={() => setForgotStep(1)}
                className="text-slate-400 hover:text-slate-200 underline text-[11px]"
              >
                Change Email
              </button>

              <button 
                type="button" 
                onClick={() => handleResendCode("forgot_password")}
                disabled={resendTimer > 0 || loading}
                className={`text-[11px] font-bold ${resendTimer > 0 ? "text-slate-500" : "text-amber-400 hover:text-amber-300 underline"}`}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
              </button>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary text-slate-900 font-bold border-none rounded-xl w-full h-11 min-h-0 text-xs capitalize mt-4 shadow-lg shadow-orange-500/10 flex items-center justify-center gap-1.5"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner text-slate-900"></span> : "Reset Password & Log In"}
            </button>
          </form>
        )}

        {/* Toggle Login / Signup */}
        <div className="text-center pt-1">
          {authMode === "login" ? (
            <button 
              onClick={() => {
                setAuthMode("signup");
                setSignupStep(1);
                setError("");
                setSuccess("");
                setActiveOtpHint("");
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold hover:underline"
            >
              Don't have an account? Sign Up
            </button>
          ) : (
            <button 
              onClick={() => {
                setAuthMode("login");
                setSignupStep(1);
                setForgotStep(1);
                setError("");
                setSuccess("");
                setActiveOtpHint("");
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold hover:underline"
            >
              Already have an account? Sign In
            </button>
          )}
        </div>

      </div>

      {/* Footer with Discreet Admin Access Link */}
      <footer className="w-full text-center py-4 z-20">
        <button
          onClick={() => {
            setAdminError("");
            setIsAdminModalOpen(true);
          }}
          className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors font-medium flex items-center justify-center gap-1.5 mx-auto hover:underline"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
          <span>Staff & Admin Access 🔒</span>
        </button>
      </footer>

      {/* Discreet Admin Login Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5 relative ${adminError ? 'animate-shake' : ''}`}>
            
            <button 
              onClick={() => setIsAdminModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">System Administrator Portal</h3>
              <p className="text-xs text-slate-400">
                Restricted staff entry. Admin accounts must use the <span className="text-amber-400 font-bold">admin@</span> email prefix.
              </p>
            </div>

            {adminError && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs py-2.5 px-3 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label py-0.5"><span className="label-text text-slate-300 text-xs font-semibold">Admin Email Address</span></label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input 
                    type="email" 
                    placeholder="admin@laga.tour" 
                    className="input input-sm h-11 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 w-full pl-10 rounded-xl text-xs" 
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label py-0.5"><span className="label-text text-slate-300 text-xs font-semibold">Admin Passcode</span></label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="input input-sm h-11 bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 w-full pl-10 rounded-xl text-xs" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-warning text-slate-950 font-bold border-none rounded-xl w-full h-11 min-h-0 text-xs capitalize mt-2 shadow-lg shadow-amber-500/10"
                disabled={adminLoading}
              >
                {adminLoading ? <span className="loading loading-spinner text-slate-950"></span> : "Authenticate Admin Access"}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
