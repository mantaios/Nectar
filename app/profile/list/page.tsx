"use client";
import { useEffect, useState, Suspense } from "react";
import { db } from "../../../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function FriendsListContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [friends, setFriends] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    const fetchFriends = async () => {
      try {
        const qSent = query(collection(db, "friendRequests"), where("fromId", "==", id), where("status", "==", "accepted"));
        const qReceived = query(collection(db, "friendRequests"), where("toId", "==", id), where("status", "==", "accepted"));
        
        const [sentSnap, receivedSnap] = await Promise.all([getDocs(qSent), getDocs(qReceived)]);
        const allDocs = [...sentSnap.docs, ...receivedSnap.docs];
        
        // UNIQUE MAP: Διαγράφει τα διπλότυπα και τα "ορφανά" requests
        const uniqueFriendsMap = new Map();

        for (const d of allDocs) {
          const data = d.data();
          const friendId = data.fromId === id ? data.toId : data.fromId;
          
          // Αν δεν έχουμε ήδη βάλει αυτόν τον φίλο στη λίστα
          if (!uniqueFriendsMap.has(friendId)) {
            const friendSnap = await getDoc(doc(db, "users", friendId));
            
            // ΕΛΕΓΧΟΣ: Μόνο αν ο λογαριασμός υπάρχει ακόμα στη Firestore
            if (friendSnap.exists()) {
              uniqueFriendsMap.set(friendId, { id: friendSnap.id, ...friendSnap.data() });
            }
          }
        }
        
        setFriends(Array.from(uniqueFriendsMap.values()));
      } catch (err) { 
        console.error("Error fetching friends:", err); 
      }
      setLoading(false);
    };
    fetchFriends();
  }, [id]);

  // Φιλτράρισμα βάσει της αναζήτησης (Search)
  const filteredFriends = friends.filter(f => 
    f.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-orange-500 font-black italic tracking-widest uppercase">
     Nectar ...
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white pb-10">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-xl hover:text-orange-500 transition-colors">←</button>
        <h1 className="font-black text-[10px] uppercase tracking-[0.3em] text-zinc-400">Friends List</h1>
      </div>

      <div className="max-w-md mx-auto px-6 pt-6">
        
        {/* Modern Search Bar */}
        <div className="relative mb-10 group">
          <div className="absolute inset-0 bg-orange-500/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
          <input 
            type="text" 
            placeholder="Search friends..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="relative w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-6 text-sm outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-600 font-medium"
          />
          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-lg grayscale group-focus-within:grayscale-0 transition-all">🔍</span>
        </div>

        {/* Friends Grid/List */}
        <div className="space-y-3">
          {filteredFriends.map((friend) => (
            <Link 
              href={`/profile?id=${friend.id}`} 
              key={friend.id}
              className="flex items-center gap-4 p-4 bg-zinc-900/30 rounded-[24px] border border-white/5 hover:bg-zinc-800/50 hover:border-orange-500/20 transition-all active:scale-[0.98] group"
            >
              {/* Profile Avatar */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-orange-600/20 to-yellow-500/20 p-[1.5px] group-hover:from-orange-600 group-hover:to-yellow-500 transition-all duration-500">
                <div className="w-full h-full rounded-full bg-black overflow-hidden border-2 border-black flex items-center justify-center">
                  {friend.photoURL ? (
                    <img src={friend.photoURL} alt="pfp" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-black text-orange-500 uppercase">{friend.displayName?.charAt(0)}</span>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="flex flex-col">
                <span className="font-black text-[15px] tracking-tight">{friend.displayName}</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 group-hover:text-orange-500/70 transition-colors">
                  @{friend.userName || "user"}
                </span>
              </div>

              {/* Arrow Indicator */}
              <div className="ml-auto w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 border border-white/5 text-zinc-600 group-hover:text-orange-500 group-hover:border-orange-500/20 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          ))}

          {/* Empty State */}
          {filteredFriends.length === 0 && !loading && (
            <div className="text-center py-24">
              <span className="text-3xl block mb-4 opacity-20">👥</span>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-800">No results found</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function FriendsListPage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen" />}>
      <FriendsListContent />
    </Suspense>
  );
}