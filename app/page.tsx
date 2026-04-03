"use client";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, orderBy, onSnapshot, doc, getDoc, where } from "firebase/firestore";
import { signOut } from "firebase/auth"; 
import Post from "./components/Post";
import ManualModal from "./components/ManualModal"; 
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showManual, setShowManual] = useState(false); 
  const router = useRouter();

  useEffect(() => {
    let unsubRequests: () => void;
    let unsubDocs: () => void;

    const unsubAuth = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        router.push("/auth");
        setLoadingAuth(false);
      } else {
        setUser(u);
        const userRef = doc(db, "users", u.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) setUserData(snap.data());

        const qRequests = query(
          collection(db, "friendRequests"), 
          where("toId", "==", u.uid), 
          where("status", "==", "pending")
        );
        unsubRequests = onSnapshot(qRequests, (snap) => {
          setPendingCount(snap.size);
        });

        const qPosts = query(collection(db, "reviews"), orderBy("date", "desc"));
        unsubDocs = onSnapshot(qPosts, (snap) => {
          setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoadingAuth(false);
        });
      }
    });

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubRequests) unsubRequests();
      if (unsubDocs) unsubDocs();
    };
  }, [router]);

  if (loadingAuth) return (
    <div className="bg-[#050505] min-h-screen flex items-center justify-center">
      <div className="text-amber-400 font-black italic animate-pulse text-3xl tracking-[0.4em] uppercase drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
        NECTAR
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white pb-24 relative overflow-x-hidden selection:bg-amber-500/40">
      
      {/* --- AMBIENT GLOW SYSTEM --- */}
      <div className="fixed top-[-15%] left-1/2 -translate-x-1/2 w-[120%] h-[600px] bg-amber-500/[0.12] blur-[140px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed top-0 left-[-10%] w-[500px] h-full bg-amber-600/[0.04] blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed top-0 right-[-10%] w-[500px] h-full bg-orange-500/[0.04] blur-[120px] pointer-events-none z-0"></div>

      {/* --- FIXED HEADER --- */}
      <nav className="fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-3xl z-[100] px-6 py-6 border-b border-white/[0.12] flex justify-between items-center shadow-2xl">
        <div className="flex flex-col cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <h1 className="text-2xl font-black italic tracking-tighter text-white hover:text-amber-400 transition-colors">
                Nectar
            </h1>
            <div className="h-[4px] w-10 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 rounded-full mt-[-2px] shadow-[0_0_15px_rgba(245,158,11,0.8)]"></div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => setShowManual(true)} className="w-12 h-12 flex items-center justify-center bg-white/[0.08] hover:bg-white/[0.15] rounded-2xl border border-white/10 transition-all shadow-lg">
            <span className="text-xl">📖</span>
          </button>

          <Link href="/connect" className="w-12 h-12 flex items-center justify-center bg-white/[0.08] hover:bg-amber-500 rounded-2xl border border-white/10 relative group transition-all shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-white group-hover:text-black transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-black shadow-xl animate-pulse">
                {pendingCount}
              </span>
            )}
          </Link>
          
          <Link href={`/profile?id=${user?.uid}`} className="hover:scale-105 transition-transform">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 p-[2px] shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center overflow-hidden">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} className="w-full h-full object-cover" alt="profile" />
                ) : (
                  <span className="text-amber-400 font-black text-base uppercase">{user?.displayName?.charAt(0)}</span>
                )}
              </div>
            </div>
          </Link>

          <button onClick={() => setShowLogoutConfirm(true)} className="w-12 h-12 flex items-center justify-center bg-white/[0.08] hover:bg-red-500 group rounded-2xl border border-white/10 transition-all shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </nav>

      <div className="max-w-md mx-auto pt-32 px-6 relative z-10">
        <Link href="/create-post" className="group block mb-16 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-600 rounded-[35px] blur-2xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
          <div className="relative bg-zinc-900/80 backdrop-blur-2xl border border-white/20 p-8 rounded-[35px] flex items-center justify-between shadow-2xl group-hover:border-amber-400/50 transition-all duration-300">
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-[0_10px_20px_rgba(245,158,11,0.4)] group-hover:scale-110 transition-transform duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3.5} stroke="currentColor" className="w-9 h-9 text-black">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h2 className="text-white font-black text-xl tracking-tight italic">Share Experience</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_12px_#fbbf24]"></span>
                  <span className="text-amber-400/80 text-[11px] font-black uppercase tracking-[0.2em]">Add Review</span>
                </div>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-amber-400 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-6 h-6 text-amber-500 group-hover:text-black transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </div>
        </Link>

        {/* FEED SECTION - ΔΙΟΡΘΩΣΗ: Αφαίρεση background και περιττών κλάσεων */}
        <div className="space-y-12">
          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <div key={rev.id} className="relative">
                {/* Το Post component διαχειρίζεται το δικό του στυλ τώρα */}
                <Post rev={rev} />
              </div>
            ))
          ) : (
            <div className="text-center py-32 border border-white/10 rounded-[50px] bg-white/[0.03] backdrop-blur-md">
               <span className="text-6xl block mb-6 animate-bounce">🍯</span>
              <p className="text-[12px] font-black uppercase tracking-[0.4em] text-amber-500/50 italic">Brewing content...</p>
            </div>
          )}
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowLogoutConfirm(false)}></div>
          <div className="relative bg-zinc-900 border border-white/20 p-10 rounded-[45px] text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-[320px] animate-in zoom-in-95">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
               <span className="text-3xl">🚪</span>
            </div>
            <h3 className="text-xl font-black text-white mb-2 italic uppercase tracking-tight">Sign Out?</h3>
            <p className="text-[12px] text-zinc-400 mb-8 font-medium">Ready to leave the hive?</p>
            <div className="flex flex-col gap-3">
              <button onClick={async () => { await signOut(auth); router.push("/auth"); }} className="w-full bg-red-600 hover:bg-red-500 text-white text-[11px] font-black py-4.5 rounded-2xl uppercase tracking-[0.2em] transition-all shadow-lg shadow-red-900/40">Logout</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-black py-4.5 rounded-2xl uppercase tracking-[0.2em] transition-all">Stay</button>
            </div>
          </div>
        </div>
      )}

      {showManual && (
        <ManualModal 
          isOpen={showManual} 
          onClose={() => setShowManual(false)} 
        />
      )}
    </main>
  );
}