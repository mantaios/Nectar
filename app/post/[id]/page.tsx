"use client";
import { useEffect, useState } from "react";
import { db, auth } from "../../../firebase"; 
import { doc, onSnapshot } from "firebase/firestore";
import Post from "../../components/Post";
import { useRouter, useParams } from "next/navigation";

export default function SinglePostPage() {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!params.id) return;

    // Σύνδεση Live με το έγγραφο στη Firestore
    const docRef = doc(db, "reviews", params.id as string);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        // Το post υπάρχει, το εμφανίζουμε
        setPost({ id: docSnap.id, ...docSnap.data() });
        setLoading(false);
      } else {
        // Το post διαγράφηκε ή δεν υπάρχει
        // Αν ο χρήστης είναι συνδεδεμένος, τον στέλνουμε στο προφίλ του
        if (auth.currentUser) {
          router.push(`/profile?id=${auth.currentUser.uid}`);
        } else {
          router.push("/");
        }
      }
    }, (err) => {
      console.error("Error fetching post:", err);
      setLoading(false);
    });

    return () => unsubscribe(); // Κλείνουμε το snapshot όταν φεύγουμε από τη σελίδα
  }, [params.id, router]);

  if (loading) return (
    <div className="bg-black min-h-screen flex items-center justify-center text-orange-500 font-black italic tracking-[0.3em] uppercase animate-pulse">
      NECTAR...
    </div>
  );

  // Αν το post είναι null (επειδή διαγράφηκε), δεν δείχνουμε τίποτα μέχρι να γίνει το redirect
  if (!post) return null;

  return (
    <main className="min-h-screen bg-black text-white pb-20 selection:bg-orange-500/30">
      
      {/* Header - Minimal & Clean */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/[0.03] px-6 py-5 flex items-center justify-between">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 flex items-center justify-center bg-zinc-900/50 border border-white/5 rounded-xl text-xl text-zinc-500 hover:text-orange-500 active:scale-90 transition-all"
        >
          ←
        </button>
        
        <div 
          onClick={() => router.push("/")}
          className="flex flex-col items-center cursor-pointer active:opacity-70 transition-opacity"
        >
          <h1 className="font-black text-[18px] italic tracking-tighter text-white select-none">
            Nectar
          </h1>
          <div className="h-[2px] w-5 bg-orange-500 rounded-full mt-[-2px]"></div>
        </div>

        <div className="w-10"></div> {/* Spacer για να κεντραριστεί το Logo */}
      </header>

      {/* Post Container */}
      <div className="max-w-[420px] mx-auto px-4 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <Post rev={post} />
      </div>

      {/* Διακριτικό background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-orange-500/5 blur-[120px] pointer-events-none -z-10"></div>
    </main>
  );
}