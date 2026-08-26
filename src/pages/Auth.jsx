import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MOCK_USERS } from "../data/mockData";
import { Lock, Mail, User, ArrowLeft, ShieldAlert, AlertTriangle, KeyRound, X } from "lucide-react";

function getFriendlyErrorMessage(err) {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address format (e.g. user@domain.com).";
    case "auth/missing-email":
      return "Please enter your email address or username.";
    case "auth/missing-password":
      return "Please enter your password.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email address already exists.";
    case "auth/weak-password":
      return "Password must be at least 6 characters long.";
    case "auth/admin-signup-disallowed":
      return err?.message || "Admin accounts cannot be registered via public signup. Please contact a system administrator.";
    case "auth/popup-closed-by-user":
      return "Sign in popup was closed before completing.";
    case "auth/popup-blocked":
      return "Sign-in popup was blocked by your browser. Please allow popups.";
    case "auth/operation-not-allowed":
      return "Sign in provider is not enabled in your Firebase Console.";
    default:
      return err?.message || "An authentication error occurred. Please try again.";
  }
}

function GoogleIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.28v3.15C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.28C.46 8.21 0 10.05 0 12s.46 3.79 1.28 5.42l4-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.58l4 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export default function Auth() {
  const { login, signup, loginWithGoogle, resetPassword, isMockAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        localStorage.setItem("ts_login_mode", "user");
        setSuccess("Success! Logging in...");
        setTimeout(() => navigate("/"), 800);
      } else {
        if (!name) {
          setError("Full name is required");
          setLoading(false);
          return;
        }
        await signup(email, password, name);
        localStorage.setItem("ts_login_mode", "user");
        setSuccess("Success! Account created.");
        setTimeout(() => navigate("/"), 800);
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
      setAdminError(getFriendlyErrorMessage(err));
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminQuickLogin = async () => {
    setAdminEmail("admin@laga.tour");
    setAdminPassword("admin");
    setAdminError("");
    setAdminLoading(true);
    try {
      await login("admin@laga.tour", "admin");
      localStorage.setItem("ts_login_mode", "admin");
      setIsAdminModalOpen(false);
      navigate("/admin");
    } catch (err) {
      setAdminError(getFriendlyErrorMessage(err));
    } finally {
      setAdminLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      localStorage.setItem("ts_login_mode", "user");
      setSuccess("Success! Signed in with Google.");
      setTimeout(() => navigate("/"), 800);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");
    if (!email) {
      setError("Please enter your email address above to reset your password.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess(`Password reset email sent to ${email}! Please check your inbox.`);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (mockUser) => {
    setError("");
    setLoading(true);
    try {
      await login(mockUser.username, "password");
      localStorage.setItem("ts_login_mode", "user");
      setSuccess(`Logging in as ${mockUser.name}...`);
      setTimeout(() => navigate("/"), 800);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 md:p-8 bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      
      {/* Soft aesthetic background glows */}
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
      <div className={`w-full max-w-md bg-slate-900/70 backdrop-blur-md border border-slate-800 p-8 md:p-10 rounded-3xl shadow-2xl relative z-10 space-y-6 my-auto ${error ? 'animate-shake' : ''}`}>
        
        {/* Brand Logo & Heading */}
        <div className="text-center space-y-3">
          <div className="flex justify-center items-center gap-2">
            <img src="/logo.png" className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 shadow" alt="Logo" />
            <span className="text-3xl font-bold text-amber-400 font-['Caveat']">Laga Tour</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white m-0">
              {isLogin ? "Welcome back" : "Start your journey"}
            </h2>
            <p className="text-xs text-slate-400">
              {isLogin ? "Access your travel maps and groups" : "Create an account to start sharing plans"}
            </p>
          </div>
        </div>

        {/* Dynamic Error Feedback Banner */}
        {error && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs py-3 px-3.5 rounded-2xl flex items-start gap-2.5 shadow-sm animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold block text-rose-200 text-[11px] uppercase tracking-wider mb-0.5">Authentication Failure</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="alert alert-success bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-xs py-2.5 px-3 rounded-xl">
            <span>{success}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="form-control">
              <label className="label py-0.5"><span className="label-text text-slate-300 text-xs font-semibold">Full Name</span></label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  className={`input input-sm h-11 bg-slate-950 border ${error && !name ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-amber-400'} text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-amber-400 w-full pl-10 rounded-xl text-xs transition-colors`} 
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError("");
                  }}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-control">
            <label className="label py-0.5"><span className="label-text text-slate-300 text-xs font-semibold">Email Address</span></label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
              <input 
                type="email" 
                placeholder="traveler@laga.tour" 
                className={`input input-sm h-11 bg-slate-950 border ${error ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-amber-400'} text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-amber-400 w-full pl-10 rounded-xl text-xs transition-colors`} 
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
              {isLogin && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-500" />
              <input 
                type="password" 
                placeholder="••••••••" 
                className={`input input-sm h-11 bg-slate-950 border ${error ? 'border-rose-500/80 focus:border-rose-500' : 'border-slate-800 focus:border-amber-400'} text-slate-100 placeholder-slate-600 focus:ring-1 focus:ring-amber-400 w-full pl-10 rounded-xl text-xs transition-colors`} 
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
            disabled={loading || googleLoading}
          >
            {loading ? <span className="loading loading-spinner text-slate-900"></span> : isLogin ? "Sign In with Email" : "Sign Up with Email"}
          </button>
        </form>

        <div className="divider text-[10px] text-slate-600 uppercase font-semibold">Or Continue With</div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="btn w-full h-11 min-h-0 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-3 transition-colors shadow"
        >
          {googleLoading ? (
            <span className="loading loading-spinner loading-xs text-slate-200"></span>
          ) : (
            <>
              <GoogleIcon className="w-5 h-5" />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Quick Logins for Testing */}
        <div className="pt-2">
          <div className="text-[10px] text-slate-500 text-center mb-2 font-medium">Quick Demo Traveler Profiles:</div>
          <div className="grid grid-cols-2 gap-2">
            {MOCK_USERS.slice(0, 2).map((mu) => (
              <button 
                key={mu.id}
                onClick={() => handleQuickLogin(mu)}
                className="flex items-center gap-2.5 p-2 bg-slate-950/60 border border-slate-800 rounded-xl text-left hover:border-slate-700 transition-colors"
              >
                <img src={mu.avatar} alt={mu.name} className="w-8 h-8 rounded-full object-cover border border-slate-800" />
                <div className="min-w-0 leading-tight">
                  <div className="text-[10px] font-bold text-slate-200 truncate">{mu.name}</div>
                  <div className="text-[9px] text-slate-500 truncate">{mu.league}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Login/Signup */}
        <div className="text-center pt-1">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold hover:underline"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>

        {isMockAuth && (
          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl text-center">
            <p className="text-[9px] text-slate-500 leading-normal">
              Running in offline mock mode. Connect your Firebase credentials in `.env` to bind live cloud accounts.
            </p>
          </div>
        )}

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
                    onChange={(e) => {
                      setAdminEmail(e.target.value);
                      if (adminError) setAdminError("");
                    }}
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
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      if (adminError) setAdminError("");
                    }}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={adminLoading}
                className="btn btn-warning text-slate-950 font-bold border-none rounded-xl w-full h-11 min-h-0 text-xs capitalize shadow-lg shadow-amber-500/10 mt-2"
              >
                {adminLoading ? <span className="loading loading-spinner text-slate-950"></span> : "Sign In to Admin Panel"}
              </button>
            </form>

            <div className="pt-2 text-center border-t border-slate-800">
              <span className="text-[10px] text-slate-500 block mb-2 font-medium">Demo Administrator Sign-In:</span>
              <button 
                onClick={handleAdminQuickLogin}
                className="btn btn-xs btn-outline border-slate-700 text-amber-400 hover:bg-slate-800 rounded-lg text-[10px] capitalize w-full"
              >
                Quick Admin Login (admin@laga.tour)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
