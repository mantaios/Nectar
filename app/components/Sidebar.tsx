"use client";
import { db } from "../../firebase";
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { useState, useEffect } from "react";

interface SidebarProps {
  users: any[];
  currentUser: any;
}

export default function Sidebar({ users, currentUser }: SidebarProps) {
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [mySentRequests, setMySentRequests] = useState<string[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    // 1. Αιτήματα που περιμένουν αποδοχή (Incoming)
    const qIn = query(collection(db, "friendRequests"), where("toId", "==", currentUser.uid), where("status", "==", "pending"));
    const unsubIn = onSnapshot(qIn, (s) => setIncomingRequests(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    // 2. Αιτήματα που στείλαμε εμείς (Sent)
    const qOut = query(collection(db, "friendRequests"), where("fromId", "==", currentUser.uid));
    const unsubOut = onSnapshot(qOut, (s) => setMySentRequests(s.docs.map(d => d.data().toId)));

    // 3. Λίστα Φίλων (Όπου το status είναι "accepted")
    const qFriends = query(collection(db, "friendRequests"), where("status", "==", "accepted"));
    const unsubFriends = onSnapshot(qFriends, (s) => {
      const friends: any[] = [];
      s.docs.forEach(doc => {
        const data = doc.data();
        // Αν είμαι ο παραλήπτης, φίλος είναι ο αποστολέας
        if (data.toId === currentUser.uid) friends.push({ uid: data.fromId, name: data.fromName });
        // Αν είμαι ο αποστολέας, φίλος είναι ο παραλήπτης
        if (data.fromId === currentUser.uid) friends.push({ uid: data.toId, name: data.toName });
      });
      setFriendsList(friends);
    });

    return () => { unsubIn(); unsubOut(); unsubFriends(); };
  }, [currentUser]);

  const sendRequest = async (targetUser: any) => {
    await addDoc(collection(db, "friendRequests"), {
      fromId: currentUser.uid,
      fromName: currentUser.displayName,
      toId: targetUser.uid,
      toName: targetUser.username,
      status: "pending",
      timestamp: new Date()
    });
  };

  const acceptRequest = async (req: any) => {
    const reqRef = doc(db, "friendRequests", req.id);
    await updateDoc(reqRef, { status: "accepted" });
  };

  return (
    <aside className="w-full md:w-72 flex flex-col gap-6 sticky top-24 h-fit">
      
      {/* 1. Εισερχόμενα Αιτήματα (Πορτοκαλί κουτί) */}
      {incomingRequests.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
          <h2 className="text-orange-500 font-black text-[10px] mb-3 uppercase tracking-widest">Requests</h2>
          {incomingRequests.map(req => (
            <div key={req.id} className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold">@{req.fromName}</span>
              <button onClick={() => acceptRequest(req)} className="bg-orange-500 text-black text-[10px] px-3 py-1 rounded-full font-black hover:bg-white transition-all">ACCEPT</button>
            </div>
          ))}
        </div>
      )}

      {/* 2. ΛΙΣΤΑ ΦΙΛΩΝ (Εδώ βλέπεις αν είστε φίλοι!) */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
        <h2 className="text-zinc-500 font-black text-[10px] mb-4 uppercase tracking-widest italic">My Friends ({friendsList.length})</h2>
        <div className="flex flex-col gap-3">
          {friendsList.length > 0 ? (
            friendsList.map(f => (
              <div key={f.uid} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center text-[8px] text-green-500">●</div>
                <span className="text-xs font-bold text-zinc-300">@{f.name}</span>
              </div>
            ))
          ) : (
            <p className="text-[10px] text-zinc-600 italic">No friends yet...</p>
          )}
        </div>
      </div>

      {/* 3. Discovery List */}
      <div className="px-2">
        <h2 className="text-zinc-500 font-black text-[10px] mb-4 uppercase tracking-widest">Discovery</h2>
        <div className="flex flex-col gap-4">
          {users.filter(u => u.uid !== currentUser?.uid && !friendsList.some(f => f.uid === u.uid)).map((u) => {
            const isSent = mySentRequests.includes(u.uid);
            return (
              <div key={u.uid} className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-800 rounded-full border border-zinc-700 flex items-center justify-center text-[10px] font-bold uppercase group-hover:border-orange-500 transition-all">
                    {u.username?.charAt(0)}
                  </div>
                  <span className="text-xs font-bold group-hover:text-orange-500 transition-all">@{u.username}</span>
                </div>
                <button 
                  onClick={() => !isSent && sendRequest(u)}
                  disabled={isSent}
                  className={`text-[10px] font-black px-3 py-1 rounded-full border transition-all ${isSent ? 'border-zinc-800 text-zinc-600 cursor-default' : 'border-zinc-700 text-zinc-400 hover:border-orange-500 hover:text-orange-500'}`}
                >
                  {isSent ? "SENT" : "ADD"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}