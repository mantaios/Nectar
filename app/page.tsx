"use client";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, query, orderBy, onSnapshot, doc, getDoc, where } from "firebase/firestore";
import { signOut } from "firebase/auth"; 
import Post from "./components/Post";
import ManualModal from "./components/ManualModal"; // Προσθήκη Import
import Link from "next/link";
import { useRouter } from "next/navigation";


export default function Home() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showManual, setShowManual] = useState(false); // Προσθήκη State
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
    <div className="bg-black min-h-screen flex items-center justify-center">
      <div className="text-amber-500 font-black italic animate-pulse text-2xl tracking-tighter uppercase">
        Nectar...
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-slate-200 pb-24 relative overflow-x-hidden selection:bg-amber-500/30">
      
      {/* --- AMBIENT BACKGROUND GLOW --- */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-amber-600/[0.02] blur-[160px] rounded-full pointer-events-none z-0"></div>

      {/* --- LOGOUT MODAL --- */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)}></div>
          
          <div className="relative bg-[#111111] border border-white/10 p-8 rounded-[40px] text-center shadow-[0_0_50px_rgba(0,0,0,1)] max-w-[280px] animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5 relative border border-red-500/20">
               <span className="text-2xl">👋</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Log Out?</h3>
            <p className="text-[11px] text-slate-400 mb-8 leading-relaxed">End your session and sign out of Nectar.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={async () => { await signOut(auth); router.push("/auth"); }}
                className="w-full bg-red-600 text-white text-[11px] font-black py-4 rounded-2xl uppercase tracking-[0.2em] active:scale-95 transition-all shadow-lg shadow-red-900/20"
              >
                Sign Out
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(false)} 
                className="w-full bg-white/5 text-slate-300 text-[11px] font-black py-4 rounded-2xl uppercase tracking-[0.2em] active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <nav className="sticky top-0 bg-black/80 backdrop-blur-2xl z-50 px-6 py-5 border-b border-white/[0.05] flex justify-between items-center">
        <div className="flex flex-col">
            <h1 className="text-2xl font-black italic tracking-tighter text-white select-none">
                Nectar
            </h1>
            <div className="h-[2px] w-6 bg-amber-500 rounded-full mt-[-2px]"></div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* MANUAL BUTTON - ΠΡΟΣΘΗΚΗ ΕΔΩ */}
          <button 
            onClick={() => setShowManual(true)}
            className="w-10 h-10 flex items-center justify-center bg-white/[0.05] hover:bg-zinc-800 rounded-xl border border-white/5 transition-all duration-300"
          >
            <span className="text-lg">📖</span>
          </button>

          <Link href="/connect" className="w-10 h-10 flex items-center justify-center bg-white/[0.05] hover:bg-amber-500 rounded-xl border border-white/5 relative group transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400 group-hover:text-black transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-black">
                {pendingCount}
              </span>
            )}
          </Link>
          
          <Link href={`/profile?id=${user?.uid}`} className="active:scale-95 transition-transform duration-300">
            <div className="w-10 h-10 rounded-xl bg-white/5 p-[1px] border border-white/10 shadow-inner">
              <div className="w-full h-full rounded-[9px] bg-black flex items-center justify-center overflow-hidden">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} className="w-full h-full object-cover" alt="profile" />
                ) : (
                  <span className="text-amber-500 font-black text-xs uppercase">{user?.displayName?.charAt(0)}</span>
                )}
              </div>
            </div>
          </Link>

          <button 
            onClick={() => setShowLogoutConfirm(true)} 
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500/10 rounded-xl border border-white/5 text-slate-500 hover:text-red-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </nav>

      <div className="max-w-md mx-auto pt-10 px-6 relative z-10">
        
        {/* --- PREMIUM CREATE POST (SHARE EXPERIENCE) --- */}
        <Link href="/create-post" className="group block mb-16 relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600 to-amber-900 rounded-[26px] opacity-10 group-hover:opacity-30 blur-md transition duration-500"></div>
          
          <div className="relative bg-[#111111] border border-white/[0.08] p-5 rounded-[24px] flex items-center justify-between shadow-[0_15px_30px_rgba(0,0,0,0.4)] group-hover:bg-[#161616] group-active:scale-[0.98] transition-all duration-300">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-[0_5px_15px_rgba(217,119,6,0.2)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 text-black">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-base tracking-tight italic">Share Experience</span>
                <span className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mt-0.5">Post a new review</span>
              </div>
            </div>
            
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </div>
        </Link>

        {/* --- FEED SECTION --- */}
        <div className="space-y-16">
          {reviews.length > 0 ? (
            reviews.map((rev) => (
              <div key={rev.id} className="p-[1px] bg-gradient-to-b from-white/[0.08] to-transparent rounded-[32px]">
                <div className="bg-[#0D0D0D] rounded-[31px] overflow-hidden shadow-2xl">
                    <Post rev={rev} />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-32 border border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
               <span className="text-3xl block mb-4 opacity-20">✨</span>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600 italic">Starting the journey...</p>
            </div>
          )}
        </div>
      </div>

      {/* ΠΡΟΣΘΗΚΗ ΤΟΥ MODAL ΕΔΩ */}
      {showManual && (
        <ManualModal 
          isOpen={showManual} 
          onClose={() => setShowManual(false)} 
        />
      )}
    </main>
  );
}