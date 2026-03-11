"use client";
import { useEffect, useState, Suspense } from "react";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, doc, getDoc, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

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

  const router = useRouter();
  const currentUser = auth.currentUser;

  const foodTags = [
    "🍔 Burger", "🍕 Pizza", "🥙 Souvlaki", "🥪 Streetfood", "🍣 Sushi", "🍝 Italian", 
    "🥩 Steak", "🌮 Tacos", "🍦 Dessert", "☕ Coffee", "🍳 Brunch", "🐟 Seafood", 
    "🍜 Asian", "🥘 Taverna", "🍷 Bar"
  ];

  useEffect(() => {
    if (!id || !currentUser) return;

    const fetchProfileData = async () => {
      try {
        const userRef = doc(db, "users", id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setUserProfile(userSnap.data());

        const qPosts = query(collection(db, "reviews"), where("userId", "==", id), orderBy("date", "desc"));
        const postsSnap = await getDocs(qPosts);
        const fetchedPosts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setPosts(fetchedPosts);
        setTotalPhotos(fetchedPosts.reduce((acc, post: any) => acc + (post.imageUrls?.length || 0), 0));
        setTotalSpent(fetchedPosts.reduce((acc, post: any) => acc + (Number(post.amountSpent) || 0), 0));

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
      setLoading(false);
    };
    fetchProfileData();
  }, [id, currentUser]);

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

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-amber-500 font-black italic tracking-widest uppercase animate-pulse">
      Nectar...
    </div>
  );

  const isMyProfile = currentUser?.uid === id;
  let filtered = [...posts];
  if (selectedTag) filtered = filtered.filter((p: any) => p.category === selectedTag);
  const displayedPosts = filter === "top" 
    ? [...filtered].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)) 
    : filtered;

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-300 pb-10 selection:bg-amber-500/30">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-amber-600/5 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-5 sticky top-0 bg-[#050505]/60 backdrop-blur-xl z-50 border-b border-white/[0.03]">
        <button onClick={() => router.push("/")} className="text-xl hover:text-amber-500 transition-colors">←</button>
        <h2 className="font-black text-[9px] uppercase tracking-[0.4em] text-zinc-500">{userProfile?.userName || "Profile"}</h2>
        <div className="w-8"></div>
      </nav>

      <div className="max-w-xl mx-auto px-6 pt-10 relative z-10">
        
        {/* Profile Info */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative group p-[2px] rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400/20 shadow-2xl shadow-amber-500/10">
            <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center overflow-hidden border-[3px] border-[#050505]">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} className="w-full h-full object-cover" alt="avatar" />
              ) : (
                <span className="text-4xl font-black text-amber-500 uppercase">{userProfile?.displayName?.charAt(0)}</span>
              )}
            </div>
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tighter text-white uppercase italic">{userProfile?.displayName}</h1>
          <p className="text-[11px] text-zinc-500 mt-2 tracking-wide font-medium max-w-[250px] text-center italic">{userProfile?.bio || "No bio yet. 🍕"}</p>
        </div>

        {/* Minimalist Stats Bar */}
        <div className="grid grid-cols-4 gap-2 py-6 border-y border-white/[0.03] mb-10 text-center">
            <div>
                <span className="block text-sm font-black text-white">{posts.length}</span>
                <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold">Posts</span>
            </div>
            <div>
                <span className="block text-sm font-black text-white">{totalPhotos}</span>
                <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold">Photos</span>
            </div>
            <Link href={`/profile/list?id=${id}`}>
                <span className="block text-sm font-black text-amber-500">{friendsCount}</span>
                <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold">Friends</span>
            </Link>
            <div>
                <span className="block text-sm font-black text-green-500/80">€{totalSpent}</span>
                <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold">Spent</span>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-10">
          {isMyProfile ? (
            <Link href="/profile/edit" className="flex-1 bg-white text-black py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-amber-500 transition-all active:scale-95 shadow-xl shadow-white/5">Edit Profile</Link>
          ) : (
            <button 
              onClick={handleAddFriend}
              disabled={friendStatus !== "none"}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                friendStatus === "friends" ? "bg-zinc-800 text-green-500/70 border border-green-500/10" : 
                friendStatus === "pending" ? "bg-zinc-900 text-zinc-600 italic" : "bg-amber-600 text-black shadow-lg shadow-amber-600/10"
              }`}
            >
              {friendStatus === "friends" ? "Connected" : friendStatus === "pending" ? "Pending..." : "Connect +"}
            </button>
          )}
          
          <button onClick={() => setFilter(filter === "all" ? "top" : "all")} className={`flex-1 border py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === "top" ? "bg-amber-600 border-amber-600 text-black shadow-lg shadow-amber-600/10" : "bg-[#111] border-white/5 text-zinc-500 hover:text-white"}`}>
            {filter === "top" ? "Latest Posts" : "Top Rated"}
          </button>
        </div>

        {/* Cuisine Selector */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {foodTags.map((tag) => (
              <button 
                key={tag} 
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)} 
                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border transition-all whitespace-nowrap ${selectedTag === tag ? "bg-amber-600 border-amber-600 text-black" : "bg-[#0A0A0A] border-white/5 text-zinc-600"}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-3 gap-[2px] animate-in fade-in duration-700 bg-white/[0.02] p-[1px] rounded-2xl overflow-hidden border border-white/[0.03]">
          {displayedPosts.map((post: any) => (
            <Link key={post.id} href={`/post/${post.id}`} className="aspect-square bg-zinc-900 overflow-hidden relative group">
              <img src={post.imageUrls?.[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" alt="post" />
              
              {/* Discrete Rating Overlay */}
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-[8px] text-amber-500 font-black px-1.5 py-0.5 rounded border border-amber-500/10">
                {post.averageRating?.toFixed(1)}
              </div>

              {/* Ultra-Discrete Money Indicator */}
              {post.amountSpent > 0 && (
                <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
              )}
            </Link>
          ))}
        </div>
        
        {displayedPosts.length === 0 && (
          <div className="py-20 text-center opacity-20 italic text-[10px] uppercase tracking-[0.5em]">Empty Cellar</div>
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