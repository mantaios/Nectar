"use client";
import { useEffect, useState } from "react";
import { db, auth } from "../../firebase"; 
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, orderBy } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ConnectPage() {
  const [activeTab, setActiveTab] = useState("activity");
  const [discovery, setDiscovery] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const router = useRouter();

  // Λειτουργία για υπολογισμό ώρας (Instagram style)
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return "now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const myDoc = await getDoc(doc(db, "users", user.uid));
      if (myDoc.exists()) setCurrentUserData(myDoc.data());

      const qMyPosts = query(collection(db, "reviews"), where("userId", "==", user.uid));
      const myPostsSnap = await getDocs(qMyPosts);
      let combinedActivity: any[] = [];

      for (const postDoc of myPostsSnap.docs) {
        const postData = postDoc.data();
        const postTitle = postData.name || "post";
        const postImg = postData.imageUrls?.[0];

        if (postData.likes) {
          for (const uid of postData.likes) {
            if (uid !== user.uid) {
              const uSnap = await getDoc(doc(db, "users", uid));
              const uData = uSnap.data();
              combinedActivity.push({
                type: "like",
                userName: uData?.displayName || "Someone",
                userPhoto: uData?.photoURL,
                userId: uid,
                postTitle: postTitle,
                postImg: postImg,
                postId: postDoc.id,
                date: postData.date || new Date().toISOString()
              });
            }
          }
        }

        if (postData.comments) {
          for (const comment of postData.comments) {
            if (comment.userName !== user.displayName) {
              const qCommUser = query(collection(db, "users"), where("displayName", "==", comment.userName));
              const commUserSnap = await getDocs(qCommUser);
              const commUserData = commUserSnap.docs[0]?.data();

              combinedActivity.push({
                type: "comment",
                userName: comment.userName,
                userPhoto: commUserData?.photoURL,
                text: comment.text,
                postTitle: postTitle,
                postImg: postImg,
                postId: postDoc.id,
                date: comment.date || new Date().toISOString()
              });
            }
          }
        }
      }
      
      // Ταξινόμηση: Τα πιο νέα πάνω-πάνω
      setActivity(combinedActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

      const qIn = query(collection(db, "friendRequests"), where("toId", "==", user.uid), where("status", "==", "pending"));
      const snapIn = await getDocs(qIn);
      setRequests(snapIn.docs.map(d => ({ id: d.id, ...d.data() })));

      const qOut = query(collection(db, "friendRequests"), where("fromId", "==", user.uid));
      const qFriends = query(collection(db, "friendRequests"), where("toId", "==", user.uid), where("status", "==", "accepted"));
      const [snapOut, snapFriends] = await Promise.all([getDocs(qOut), getDocs(qFriends)]);
      
      const interactedIds = new Set<string>();
      const pendingSentIds: string[] = [];
      snapOut.docs.forEach(d => {
        interactedIds.add(d.data().toId);
        if (d.data().status === "pending") pendingSentIds.push(d.data().toId);
      });
      snapFriends.docs.forEach(d => interactedIds.add(d.data().fromId));
      setSentRequests(pendingSentIds);

      const qUsers = query(collection(db, "users"), orderBy("displayName"));
      const snapUsers = await getDocs(qUsers);
      const allUsers = snapUsers.docs.map(d => ({ id: d.id, ...d.data() }));
      setDiscovery(allUsers.filter(u => u.id !== user.uid && (!interactedIds.has(u.id) || pendingSentIds.includes(u.id))));

    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (user) fetchData();
      else router.push("/auth");
    });
    return () => unsub();
  }, [router]);

  const handleAccept = async (req: any) => {
    try {
      await updateDoc(doc(db, "friendRequests", req.id), { status: "accepted" });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleAddFriend = async (targetUser: any) => {
    if (!auth.currentUser || !currentUserData) return;
    setSentRequests(prev => [...prev, targetUser.id]);
    try {
      await addDoc(collection(db, "friendRequests"), {
        fromId: auth.currentUser.uid,
        fromName: currentUserData.displayName || "User",
        toId: targetUser.id,
        toName: targetUser.displayName || "User",
        status: "pending",
        timestamp: new Date().toISOString()
      });
    } catch (err) { setSentRequests(prev => prev.filter(id => id !== targetUser.id)); }
  };

  return (
    <main className="min-h-screen bg-black text-white pb-24 font-sans selection:bg-amber-500/30">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-amber-600/5 blur-[120px] pointer-events-none"></div>

      <div className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.push("/")} className="w-10 h-10 flex items-center justify-center bg-zinc-950 rounded-xl border border-white/5 active:scale-90 transition-all text-zinc-400">←</button>
          <Link href="/" className="flex flex-col items-start active:scale-95 transition-transform">
            <h1 className="text-2xl font-black italic tracking-tighter text-white">Nectar</h1>
            <div className="h-[2px] w-6 bg-amber-500 rounded-full mt-[-2px]"></div>
          </Link>
        </div>

        <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-900 gap-1">
          {["activity", "requests", "discovery"].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all relative ${
                activeTab === tab ? "bg-amber-500 text-black shadow-lg" : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {tab}
              {tab === "requests" && requests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-black font-bold">
                  {requests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 relative z-10">
        {loading ? (
          <div className="text-center py-20 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse text-amber-500/50 italic">Refreshing Feed...</div>
        ) : (
          <div className="space-y-4">
            
            {activeTab === "activity" && (
                <div className="space-y-1">
                  {activity.length > 0 ? activity.map((act, i) => (
                    <Link href={`/post/${act.postId}`} key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-900/40 transition-all group">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-11 h-11 rounded-full bg-zinc-900 border border-white/5 overflow-hidden shrink-0">
                           {act.userPhoto ? <img src={act.userPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-black text-amber-500 bg-amber-500/5 uppercase">{act.userName.charAt(0)}</div>}
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[12px] leading-tight">
                            <span className="font-black text-white">@{act.userName.toLowerCase()}</span>
                            <span className="text-zinc-400 ml-1">
                                {act.type === 'like' ? 'liked your review.' : `commented: ${act.text}`}
                            </span>
                            <span className="text-zinc-600 ml-1 font-bold">{formatTimeAgo(act.date)}</span>
                          </p>
                          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter mt-1">{act.postTitle}</span>
                        </div>
                      </div>
                      {act.postImg && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/5 shrink-0 ml-2">
                           <img src={act.postImg} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </Link>
                  )) : (
                    <div className="text-center py-20 opacity-20 italic text-[10px] uppercase tracking-[0.5em]">Nothing yet</div>
                  )}
                </div>
            )}

            {activeTab === "requests" && requests.map(r => (
              <div key={r.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-[28px]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center font-black text-amber-500 border border-amber-500/20 uppercase text-xs">
                    {r.fromName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-sm text-white italic">@{r.fromName}</p>
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Connect Request</p>
                  </div>
                </div>
                <button onClick={() => handleAccept(r)} className="bg-amber-500 text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all">Accept</button>
              </div>
            ))}

            {activeTab === "discovery" && discovery.map(u => {
              const isSent = sentRequests.includes(u.id);
              return (
                <div key={u.id} className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-900 rounded-[28px] hover:bg-zinc-900/40 transition-all">
                  <Link href={`/profile?id=${u.id}`} className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden">
                      {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <span className="font-black text-amber-500 uppercase">{u.displayName?.charAt(0)}</span>}
                    </div>
                    <div>
                      <p className="font-black text-sm text-white italic">@{u.displayName}</p>
                      <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Taster</p>
                    </div>
                  </Link>
                  <button 
                    onClick={() => !isSent && handleAddFriend(u)} 
                    disabled={isSent} 
                    className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all ${
                      isSent ? "text-zinc-700 bg-transparent border border-zinc-900" : "bg-white text-black active:scale-95"
                    }`}
                  >
                    {isSent ? "Sent" : "Connect"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}