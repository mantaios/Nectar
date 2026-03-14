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
      <nav className="sticky top-0 bg-zinc-900/80 backdrop-blur-xl z-50 px-6 py-5 border-b border-white/10 flex justify-between items-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col relative group">
            <h1 className="text-2xl font-black italic tracking-tighter text-white select-none group-hover:text-amber-500 transition-colors duration-300">
                Nectar
            </h1>
            <div className="h-[3px] w-8 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mt-[-2px] shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowManual(true)}
            className="w-10 h-10 flex items-center justify-center bg-white/[0.03] hover:bg-zinc-800 rounded-xl border border-white/5 transition-all duration-300 active:scale-90"
          >
            <span className="text-lg">📖</span>
          </button>

          <Link href="/connect" className="w-10 h-10 flex items-center justify-center bg-white/[0.03] hover:bg-amber-500 rounded-xl border border-white/5 relative group transition-all duration-300 active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-400 group-hover:text-black transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-zinc-900 animate-bounce">
                {pendingCount}
              </span>
            )}
          </Link>
          
          <Link href={`/profile?id=${user?.uid}`} className="active:scale-90 transition-transform duration-300">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-white/5 p-[1px] border border-white/10">
              <div className="w-full h-full rounded-[9px] bg-zinc-900 flex items-center justify-center overflow-hidden">
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
            className="w-10 h-10 flex items-center justify-center bg-white/[0.03] hover:bg-red-500/10 rounded-xl border border-white/5 text-slate-500 hover:text-red-500 transition-colors active:scale-90"
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
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-transparent rounded-[30px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          <div className="relative bg-zinc-900/40 backdrop-blur-md border border-white/10 p-6 rounded-[28px] flex items-center justify-between overflow-hidden shadow-2xl group-hover:border-amber-500/30 group-hover:bg-zinc-900/60 group-active:scale-[0.97] transition-all duration-500">
            
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

            <div className="flex items-center gap-5 relative z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500 blur-md opacity-20 group-hover:opacity-50 transition-opacity"></div>
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-7 h-7 text-black">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col">
                <h2 className="text-white font-black text-lg tracking-tight italic group-hover:text-amber-500 transition-colors">
                  Share Experience
                </h2>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.15em]">
                    Post a new review
                  </span>
                </div>
              </div>
            </div>

            <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center group-hover:bg-amber-500 group-hover:border-amber-500 transition-all duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 text-amber-500 group-hover:text-black transition-colors">
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

      {showManual && (
        <ManualModal 
          isOpen={showManual} 
          onClose={() => setShowManual(false)} 
        />
      )}
    </main>
  );
}