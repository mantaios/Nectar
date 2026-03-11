"use client";
import { useEffect, useState } from "react";
import { db, auth } from "../../firebase"; 
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, getDoc, orderBy } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ConnectPage() {
  const [activeTab, setActiveTab] = useState("discovery");
  const [discovery, setDiscovery] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const router = useRouter();

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      // 1. Φέρνουμε τα δικά μας στοιχεία
      const myDoc = await getDoc(doc(db, "users", user.uid));
      if (myDoc.exists()) setCurrentUserData(myDoc.data());

      // 2. Incoming Requests (Ποιοι μας ζήτησαν φιλία)
      const qIn = query(collection(db, "friendRequests"), where("toId", "==", user.uid), where("status", "==", "pending"));
      const snapIn = await getDocs(qIn);
      setRequests(snapIn.docs.map(d => ({ id: d.id, ...d.data() })));

      // 3. Outgoing Requests (Πού έχουμε στείλει εμείς)
      const qOut = query(collection(db, "friendRequests"), where("fromId", "==", user.uid));
      const qFriends = query(collection(db, "friendRequests"), where("toId", "==", user.uid), where("status", "==", "accepted"));
      
      const [snapOut, snapFriends] = await Promise.all([getDocs(qOut), getDocs(qFriends)]);
      
      const interactedIds = new Set<string>();
      const pendingSentIds: string[] = [];

      // Όσοι έχουν ήδη αλληλεπίδραση μαζί μας (Φίλοι ή Pending)
      snapOut.docs.forEach(d => {
        interactedIds.add(d.data().toId);
        if (d.data().status === "pending") pendingSentIds.push(d.data().toId);
      });
      snapFriends.docs.forEach(d => interactedIds.add(d.data().fromId));
      
      setSentRequests(pendingSentIds);

      // 4. Discovery: Όλοι οι χρήστες εκτός από εμάς και τους φίλους μας
      const qUsers = query(collection(db, "users"), orderBy("displayName"));
      const snapUsers = await getDocs(qUsers);
      const allUsers = snapUsers.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Φιλτράρουμε ώστε να μην δείχνει εμάς και όσους είναι ήδη φίλοι
      // Αλλά αφήνουμε αυτούς που έχουμε στείλει "Pending" για να τους δείξουμε ως "Sent"
      setDiscovery(allUsers.filter(u => u.id !== user.uid && (!interactedIds.has(u.id) || pendingSentIds.includes(u.id))));

    } catch (err) { console.error("Error:", err); }
    setLoading(false);
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (user) fetchData();
      else router.push("/auth");
    });
    return () => unsub();
  }, [router]);

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
    } catch (err) { 
      setSentRequests(prev => prev.filter(id => id !== targetUser.id));
    }
  };

  const handleAccept = async (req: any) => {
    try {
      await updateDoc(doc(db, "friendRequests", req.id), { status: "accepted" });
      fetchData();
    } catch (err) { console.error(err); }
  };

  return (
    <main className="min-h-screen bg-black text-white pb-24 font-sans">
      {/* Header & Tabs */}
      <div className="p-6 border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.push("/")} className="w-10 h-10 flex items-center justify-center bg-zinc-900/50 rounded-xl border border-white/5">←</button>
          <h1 className="text-2xl font-black italic text-orange-500">Nectar</h1>
        </div>

        <div className="flex bg-zinc-900/40 p-1 rounded-2xl border border-white/5">
          {["requests", "discovery"].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all relative ${
                activeTab === tab ? "bg-orange-500 text-black shadow-lg" : "text-zinc-500"
              }`}
            >
              {tab}
              {tab === "requests" && requests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                  {requests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {loading ? (
          <div className="text-center py-20 text-[10px] font-black uppercase tracking-widest animate-pulse opacity-20">Searching...</div>
        ) : (
          <div className="space-y-3">
            
            {/* REQUESTS TAB */}
            {activeTab === "requests" && requests.map(r => (
              <div key={r.id} className="flex items-center justify-between p-4 bg-zinc-900/30 border border-white/5 rounded-[30px]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center font-black text-orange-500 uppercase">
                    {r.fromName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-sm">@{r.fromName}</p>
                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Incoming Request</p>
                  </div>
                </div>
                <button onClick={() => handleAccept(r)} className="bg-orange-500 text-black px-5 py-2 rounded-xl text-[9px] font-black uppercase">Accept</button>
              </div>
            ))}

            {/* DISCOVERY TAB */}
            {activeTab === "discovery" && discovery.map(u => {
              const isSent = sentRequests.includes(u.id);
              return (
                <div key={u.id} className="flex items-center justify-between p-4 bg-zinc-900/20 border border-white/5 rounded-[30px] transition-all hover:bg-zinc-900/40">
                  <Link href={`/profile?id=${u.id}`} className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                      {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <span className="font-black text-orange-500 uppercase">{u.displayName?.charAt(0)}</span>}
                    </div>
                    <div>
                      <p className="font-black text-sm">@{u.displayName}</p>
                      <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Reviewer</p>
                    </div>
                  </Link>
                  <button 
                    onClick={() => !isSent && handleAddFriend(u)} 
                    disabled={isSent} 
                    className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      isSent ? "bg-zinc-800 text-zinc-600" : "bg-orange-500 text-black active:scale-95"
                    }`}
                  >
                    {isSent ? "Sent" : "Add"}
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