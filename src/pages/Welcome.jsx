import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Compass, 
  MapPin, 
  Users, 
  Sparkles, 
  Trophy, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle,
  ShieldCheck,
  Map
} from "lucide-react";

export default function Welcome() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    if (currentUser) {
      navigate("/");
    } else {
      navigate("/auth");
    }
  };

  const features = [
    {
      icon: <Compass className="w-6 h-6 text-orange-400" />,
      title: "Social Travel Feed",
      desc: "Share your travel photos, videos, and stories. Tag tourist spots and discover hidden gems posted by other backpackers."
    },
    {
      icon: <Map className="w-6 h-6 text-sky-400" />,
      title: "Smart Interactive Map",
      desc: "Pins are dropped on OpenStreetMap automatically. Explore markers on the map to unlock community-shared tour budgets."
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-400" />,
      title: "Group Expedition Planner",
      desc: "Organize upcoming tours. Split bills dynamically, coordinate checklist tasks, and chat in the private team workspace."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-yellow-400" />,
      title: "Gemini AI Package Builder",
      desc: "Input your budget and destination, and let our Gemini AI integration compile detailed day-by-day itineraries."
    },
    {
      icon: <Trophy className="w-6 h-6 text-purple-400" />,
      title: "Traveler League System",
      desc: "Earn points by contributing budget reviews and verified media. Climb the ranks from Explorer to global Legend."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-rose-400" />,
      title: "AI Media Verification",
      desc: "Our automated analyzer compares photo geology against your geotag, filtering spam and verifying travel credibility."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      
      {/* Background radial glowing gradients */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[120px]" />

      {/* Header bar */}
      <header className="navbar bg-slate-900/80 backdrop-blur sticky top-0 z-50 border-b border-slate-800 px-6 md:px-12">
        <div className="navbar-start">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" className="h-10 w-10 rounded-full border border-slate-700 shadow" alt="Logo" />
            <span className="text-2xl font-bold tracking-wide text-amber-400 font-['Caveat']">Laga Tour</span>
          </Link>
        </div>
        <div className="navbar-end gap-3">
          {currentUser ? (
            <Link to="/" className="btn btn-sm btn-primary text-slate-900 font-bold rounded-lg px-4 border-none capitalize">
              Go to Feed <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link to="/auth" className="btn btn-sm btn-ghost text-slate-300 font-bold capitalize">Sign In</Link>
              <Link to="/auth" className="btn btn-sm btn-primary text-slate-900 font-bold rounded-lg px-4 border-none capitalize">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 md:px-12 py-16 md:py-28 flex flex-col items-center text-center space-y-6 relative z-10 max-w-4xl">
        <div className="badge badge-outline border-slate-700 text-amber-400 text-xs py-1.5 px-3.5 rounded-full font-semibold tracking-wider uppercase bg-slate-800/40">
          ✨ Introducing TourSphere 2.0
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight m-0">
          The Social Media Platform for <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 bg-clip-text text-transparent">Tour Planning</span>
        </h1>
        <p className="text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Connect with a global community of travelers. Map your journeys, draft shared expense splits, assign team checklist tasks, and discover AI-verified tourist destinations.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full justify-center">
          <button 
            onClick={handleStart}
            className="btn btn-primary text-slate-900 font-bold border-none rounded-xl px-8 py-3 h-auto min-h-0 text-sm capitalize shadow-lg shadow-orange-500/10 gap-2"
          >
            Start Planning Now <ArrowRight className="w-4 h-4" />
          </button>
          <a 
            href="#features"
            className="btn btn-outline border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl px-8 py-3 h-auto min-h-0 text-sm capitalize"
          >
            Learn Features
          </a>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="bg-slate-950/60 border-t border-slate-800/50 py-20 relative z-10">
        <div className="container mx-auto px-6 md:px-12 max-w-5xl space-y-12">
          
          <div className="text-center space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-white m-0">Everything You Need to Travel Smarter</h2>
            <p className="text-xs md:text-sm text-slate-400">Collaborate with friends, log budgets, and earn ranks based on verified travel contributions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, idx) => (
              <div 
                key={idx} 
                className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm"
              >
                <div className="space-y-4">
                  <div className="bg-slate-800/50 p-3 w-fit rounded-xl border border-slate-700/50">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-md text-white m-0">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* League ranks teaser */}
      <section className="py-20 border-t border-slate-800/50 relative z-10">
        <div className="container mx-auto px-6 md:px-12 max-w-4xl text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-white m-0">Rank Up Your Traveler Profile</h2>
            <p className="text-xs md:text-sm text-slate-400">Contribute reviews, share accurate budgets, and scale through the global ranks.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {["Explorer", "Adventurer", "Traveler", "Expert", "Legend"].map((rank, idx) => {
              const colors = [
                "bg-slate-800 text-slate-400 border-slate-700",
                "bg-sky-500/10 text-sky-400 border-sky-500/20",
                "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                "bg-amber-500/10 text-amber-400 border-amber-500/20",
                "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse font-bold"
              ];
              return (
                <div 
                  key={idx} 
                  className={`border py-2 px-4 rounded-xl text-xs md:text-sm flex items-center gap-1.5 ${colors[idx]}`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>{rank}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer footer-center p-8 bg-slate-950 border-t border-slate-900 text-slate-500 text-xs">
        <div>
          <div className="flex items-center gap-2 justify-center mb-2">
            <img src="/logo.png" className="h-6 w-6 rounded-full opacity-60" alt="Logo" />
            <span className="font-bold font-['Caveat'] text-lg text-amber-400/60">Laga Tour</span>
          </div>
          <p>© 2026 TourSphere / Laga Tour. All Rights Reserved. Exploring with passion.</p>
        </div>
      </footer>

    </div>
  );
}
