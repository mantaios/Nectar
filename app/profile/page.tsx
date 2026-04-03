"use client";
import { useEffect, useState, Suspense } from "react";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, doc, getDoc, orderBy, addDoc, serverTimestamp, onSnapshot, updateDoc } from "firebase/firestore";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

// --- ΟΡΙΣΜΟΣ BADGES ΜΕ ΠΕΡΙΓΡΑΦΕΣ ---
const RANKS = [
  { id: "newcomer", name: "Newcomer", icon: "🌱", req: 0, desc: "Just started the Nectar journey." },
  { id: "taster", name: "Apprentice", icon: "🍋", req: 10, desc: "Developing a taste for fine details." },
  { id: "scout", name: "Flavor Scout", icon: "🔍", req: 20, desc: "Always hunting for the next best spot." },
  { id: "explorer", name: "Food Explorer", icon: "🍕", req: 30, desc: "A dedicated hunter of great flavors." },
  { id: "connoisseur", name: "Connoisseur", icon: "🍷", req: 40, desc: "Knows exactly what makes a dish perfect." },
  { id: "critic", name: "Culinary Critic", icon: "🎩", req: 50, desc: "A respected voice in the local scene." },
  { id: "expert", name: "Nectar Expert", icon: "💎", req: 60, desc: "Master of gastronomic evaluation." },
  { id: "elite", name: "Elite Taster", icon: "🎖️", req: 70, desc: "Only the best reviews from the best." },
  { id: "legend", name: "Nectar Legend", icon: "👑", req: 80, desc: "The ultimate authority on taste." },
  { id: "oracle", name: "The Gastronomist", icon: "🔮", req: 90, desc: "You don't just eat, you define what's good." },
  { id: "god", name: "Nectar God", icon: "🌌", req: 100, desc: "The final boss of the culinary world." },
];
const MASTERIES = [
  { id: "burger_lord", name: "Burger Lord", icon: "🍔", req: 10, cat: "🍔 Burger", desc: "True expert in patties and buns." },
  { id: "pizza_pro", name: "Pizza Pro", icon: "🍕", req: 10, cat: "🍕 Pizza", desc: "Master of the perfect slice." },
  { id: "souvlaki_king", name: "Souvlaki King", icon: "🌯", req: 10, cat: "🌯 Souvlaki", desc: "King of the mid-day feast." },
  { id: "sushi_sensei", name: "Sushi Sensei", icon: "🍣", req: 10, cat: "🍣 Sushi", desc: "The art of raw elegance." },
  { id: "steak_master", name: "Steak Master", icon: "🥩", req: 10, cat: "🥩 Steak", desc: "Connoisseur of premium cuts." },
  { id: "brunch_elite", name: "Brunch Elite", icon: "🍳", req: 10, cat: "🍳 Brunch", desc: "King of the mid-day feast." },
];

function ProfileContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [friendsCount, setFriendsCount] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "top">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<"none" | "pending" | "friends">("none");
  const [showBadgesModal, setShowBadgesModal] = useState(false);

  const router = useRouter();
  const currentUser = auth.currentUser;

  const foodTags = ["🍔 Burger", "🍕 Pizza", "🌯 Souvlaki", "🥪 Streetfood", "🍣 Sushi", "🍝 Italian", "🥩 Steak", "🌮 Tacos", "🍦 Dessert", "☕ Coffee", "🍳 Brunch", "🐟 Seafood", "🍜 Asian", "🥘 Taverna", "🍷 Bar"];

  useEffect(() => {
    if (!id || !currentUser) return;

    const fetchProfileData = async () => {
      try {
        const userRef = doc(db, "users", id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setUserProfile(userSnap.data());

        if (currentUser.uid !== id) {
          const qReq1 = query(collection(db, "friendRequests"), where("fromId", "==", currentUser.uid), where("toId", "==", id));
          const qReq2 = query(collection(db, "friendRequests"), where("fromId", "==", id), where("toId", "==", currentUser.uid));
          const [snap1, snap2] = await Promise.all([getDocs(qReq1), getDocs(qReq2)]);
          const allReqs = [...snap1.docs, ...snap2.docs];
          if (allReqs.length > 0) {
            const reqData = allReqs[0].data();
            if (reqData.status === "accepted") setFriendStatus("friends");
            else setFriendStatus("pending");
          } else setFriendStatus("none");
        }

        const qSent = query(collection(db, "friendRequests"), where("fromId", "==", id), where("status", "==", "accepted"));
        const qReceived = query(collection(db, "friendRequests"), where("toId", "==", id), where("status", "==", "accepted"));
        const [sentSnap, receivedSnap] = await Promise.all([getDocs(qSent), getDocs(qReceived)]);
        setFriendsCount(sentSnap.size + receivedSnap.size);
      } catch (error) { console.error(error); }
    };
    
    fetchProfileData();

    const qPosts = query(collection(db, "reviews"), where("userId", "==", id), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(qPosts, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(fetchedPosts);
      setTotalPhotos(fetchedPosts.reduce((acc, post: any) => acc + (post.imageUrls?.length || 0), 0));
      setTotalSpent(fetchedPosts.reduce((acc, post: any) => acc + (Number(post.amountSpent) || 0), 0));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, currentUser]);

  const selectBadge = async (badgeId: string) => {
    if (currentUser?.uid !== id) return;
    try {
      await updateDoc(doc(db, "users", id), { activeBadge: badgeId });
      setUserProfile((p: any) => ({ ...p, activeBadge: badgeId }));
    } catch (err) { console.error(err); }
  };

  const handleAddFriend = async () => {
    if (!currentUser || !id || friendStatus !== "none") return;
    try {
      await addDoc(collection(db, "friendRequests"), {
        fromId: currentUser.uid,
        fromName: currentUser.displayName || "User",
        toId: id,
        status: "pending",
        createdAt: serverTimestamp()
      });
      setFriendStatus("pending");
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-amber-500 font-black italic tracking-widest uppercase animate-pulse">Nectar...</div>;

  const isMyProfile = currentUser?.uid === id;
  let filtered = [...posts];
  if (selectedTag) {
    filtered = filtered.filter((p: any) => p.category?.trim() === selectedTag.trim());
  }
  
  const displayedPosts = filter === "top" ? [...filtered].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)) : filtered;
  const currentBadge = [...RANKS, ...MASTERIES].find(b => b.id === userProfile?.activeBadge) || RANKS[0];

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-zinc-400 pb-10 relative overflow-x-hidden selection:bg-amber-500/30">
      
      {/* --- AMBIENT GLOW SYSTEM --- */}
      <div className="fixed top-[-15%] left-1/2 -translate-x-1/2 w-[120%] h-[600px] bg-amber-500/[0.12] blur-[140px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed top-0 left-[-10%] w-[500px] h-full bg-amber-600/[0.04] blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed top-0 right-[-10%] w-[500px] h-full bg-orange-500/[0.04] blur-[120px] pointer-events-none z-0"></div>

      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-5 sticky top-0 bg-black/60 backdrop-blur-3xl z-50 border-b border-white/[0.08] shadow-2xl">
        <button onClick={() => router.push("/")} className="text-xl text-zinc-400 hover:text-amber-500 transition-colors">←</button>
        
        <Link href="/" className="flex flex-col items-start active:scale-95 transition-transform">
            <h1 className="text-2xl font-black italic tracking-tighter text-white">Nectar</h1>
            <div className="h-[2px] w-6 bg-amber-500 rounded-full mt-[-2px]"></div>
        </Link>

        <button 
            onClick={() => setShowBadgesModal(true)} 
            className="w-11 h-11 flex items-center justify-center bg-zinc-900 border border-white/10 rounded-2xl shadow-lg active:scale-90 transition-all text-2xl"
        >
            <span>🏅</span>
        </button>
      </nav>

      {/* BADGES MODAL */}
      {showBadgesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setShowBadgesModal(false)}></div>
          <div className="relative bg-zinc-950 border border-white/10 w-full max-w-sm rounded-[40px] shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="flex flex-col">
                <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-amber-500 italic">The Vault</h3>
                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">Select your legacy</span>
              </div>
              <button onClick={() => setShowBadgesModal(false)} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-zinc-500 text-sm">✕</button>
            </div>

            <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
               {/* RANKS SECTION */}
               <div className="space-y-4">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] border-l-2 border-amber-500/30 pl-3">Global Ranks</p>
                  {RANKS.map(b => {
                    const unlocked = posts.length >= b.req;
                    const isSelected = userProfile?.activeBadge === b.id;
                    return (
                      <div 
                        key={b.id} 
                        onClick={() => unlocked && isMyProfile && selectBadge(b.id)} 
                        className={`p-4 rounded-[24px] border transition-all duration-300 ${isSelected ? "bg-amber-500/10 border-amber-500/40" : "bg-zinc-900/40 border-white/5"} ${unlocked ? "cursor-pointer hover:bg-zinc-900/60" : "cursor-default border-zinc-900/30"}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{b.icon}</span>
                          <div className="flex-1 min-w-0 text-left">
                            <p className={`text-[11px] font-black uppercase tracking-tight ${isSelected ? "text-amber-500" : "text-white"}`}>{b.name}</p>
                            <p className="text-[9px] font-medium text-zinc-500 leading-tight mt-0.5">{b.desc}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {unlocked ? (
                                <span className="text-[7px] font-black text-green-500/80 uppercase">Unlocked</span>
                            ) : (
                                <p className="text-[8px] font-black text-zinc-700 uppercase">{posts.length}/{b.req}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
               </div>

               <div className="space-y-4">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] border-l-2 border-amber-500/30 pl-3">Cuisine Mastery</p>
                  {MASTERIES.map(b => {
                    const count = posts.filter(p => p.category === b.cat).length;
                    const unlocked = count >= b.req;
                    const isSelected = userProfile?.activeBadge === b.id;
                    return (
                      <div 
                        key={b.id} 
                        onClick={() => unlocked && isMyProfile && selectBadge(b.id)} 
                        className={`p-4 rounded-[24px] border transition-all duration-300 ${isSelected ? "bg-amber-500/10 border-amber-500/40" : "bg-zinc-900/40 border-white/5"} ${unlocked ? "cursor-pointer hover:bg-zinc-900/60" : "cursor-default border-zinc-900/30"}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{b.icon}</span>
                          <div className="flex-1 min-w-0 text-left">
                            <p className={`text-[11px] font-black uppercase tracking-tight ${isSelected ? "text-amber-500" : "text-white"}`}>{b.name}</p>
                            <p className="text-[9px] font-medium text-zinc-500 leading-tight mt-0.5">{b.desc}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {unlocked ? (
                                <span className="text-[7px] font-black text-green-500/80 uppercase">Unlocked</span>
                            ) : (
                                <p className="text-[8px] font-black text-zinc-700 uppercase">{count}/{b.req}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto px-6 pt-6 relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="relative group p-[2px] rounded-full bg-gradient-to-tr from-amber-600 to-amber-900 shadow-2xl shadow-amber-500/10">
            <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center overflow-hidden border-[3px] border-black">
              {userProfile?.photoURL ? <img src={userProfile.photoURL} className="w-full h-full object-cover" /> : <span className="text-4xl font-black text-amber-500 uppercase">{userProfile?.displayName?.charAt(0)}</span>}
            </div>
          </div>
          
          <div className="mt-4 flex flex-col items-center gap-1">
            <h1 className="text-2xl font-black tracking-tighter text-white italic leading-none">{userProfile?.displayName}</h1>
            
            <div className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 px-3 py-1 rounded-full backdrop-blur-md">
                <span className="text-sm">{currentBadge.icon}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 italic">{currentBadge.name}</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 mt-2 tracking-wide font-medium max-w-[250px] text-center italic leading-relaxed">{userProfile?.bio || "Savoring every moment. 🍕"}</p>
        </div>

        {/* STATS GRID - REMOVED SPENT */}
        <div className="grid grid-cols-3 gap-2 py-4 border-y border-white/5 mb-6 text-center bg-zinc-950/30 rounded-xl backdrop-blur-sm">
            <div><span className="block text-sm font-black text-white">{posts.length}</span><span className="text-[8px] uppercase tracking-widest text-zinc-600 font-black">Posts</span></div>
            <div><span className="block text-sm font-black text-white">{totalPhotos}</span><span className="text-[8px] uppercase tracking-widest text-zinc-600 font-black">Photos</span></div>
            <Link href={`/profile/list?id=${id}`}><span className="block text-sm font-black text-amber-500">{friendsCount}</span><span className="text-[8px] uppercase tracking-widest text-zinc-600 font-black">Friends</span></Link>
        </div>

        <div className="flex gap-3 mb-6">
          {isMyProfile ? (
            <Link href="/profile/edit" className="flex-1 bg-white text-black py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg active:scale-95 transition-all">Edit Profile</Link>
          ) : (
            <button onClick={handleAddFriend} disabled={friendStatus !== "none"} className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 ${friendStatus === "friends" ? "bg-zinc-900 text-green-500 border border-green-500/20" : friendStatus === "pending" ? "bg-zinc-900 text-zinc-700 italic" : "bg-amber-600 text-black shadow-lg"}`}>
                {friendStatus === "friends" ? "Connected" : friendStatus === "pending" ? "Pending..." : "Connect +"}
            </button>
          )}
          <button onClick={() => setFilter(filter === "all" ? "top" : "all")} className={`flex-1 border py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === "top" ? "bg-zinc-900 border-amber-600 text-amber-500" : "bg-black border-white/10 text-zinc-600 hover:text-white"}`}>
            {filter === "top" ? "Latest Posts" : "Top Rated"}
          </button>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {foodTags.map((tag) => (
              <button key={tag} onClick={() => setSelectedTag(tag === selectedTag ? null : tag)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border transition-all whitespace-nowrap ${selectedTag === tag ? "bg-amber-600 border-amber-600 text-black shadow-lg" : "bg-zinc-900/40 border-white/5 text-zinc-600 hover:border-zinc-700"}`}>{tag}</button>
            ))}
          </div>
        </div>

        {/* --- GRID WITH NEW WRAPPERS --- */}
        <div className="grid grid-cols-3 gap-3 animate-in fade-in duration-700">
          {displayedPosts.map((post: any) => (
            <Link key={post.id} href={`/post/${post.id}`} className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden relative group border border-white/[0.05] shadow-xl hover:border-amber-500/30 transition-all">
              <img src={post.imageUrls?.[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" alt="post" />
              
              {/* Rating Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                 <div className="bg-amber-500/90 backdrop-blur-md text-[9px] text-black font-black px-1.5 py-0.5 rounded-md w-fit flex items-center gap-0.5 shadow-lg shadow-black/20">
                    {post.averageRating?.toFixed(1)} <span className="text-[7px]">★</span>
                 </div>
              </div>
              
              {/* Image Stack Indicator (Optional Visual) */}
              {post.imageUrls?.length > 1 && (
                <div className="absolute top-2 right-2 flex gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-white/50 shadow-sm"></div>
                  <div className="w-1 h-1 rounded-full bg-white/50 shadow-sm"></div>
                </div>
              )}
            </Link>
          ))}
        </div>
        
        {displayedPosts.length === 0 && (
          <div className="py-20 text-center opacity-30 italic text-[10px] uppercase tracking-[0.5em] font-black">Empty Cellar</div>
        )}
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen" />}>
      <ProfileContent />
    </Suspense>
  );
}