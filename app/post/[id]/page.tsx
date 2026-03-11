"use client";
import { useEffect, useState } from "react";
import { db, auth } from "../../../firebase"; // Πρόσθεσα το auth για το avatar
import { doc, getDoc } from "firebase/firestore";
import Post from "../../components/Post";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function SinglePostPage() {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchPost = async () => {
      if (!params.id) return;
      try {
        const docRef = doc(db, "reviews", params.id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchPost();
  }, [params.id]);

  if (loading) return (
    <div className="bg-black min-h-screen flex items-center justify-center text-orange-500 font-black italic tracking-widest">
      NECTAR...
    </div>
  );

  if (!post) return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center text-white p-6 text-center">
      <span className="text-4xl mb-4">🍽️</span>
      <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mb-6">Post not found</p>
      <button 
        onClick={() => router.push("/")} 
        className="bg-white text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
      >
        Go Home
      </button>
    </div>
  );

  return (
  <main className="min-h-screen bg-black text-white pb-20">
    {/* --- CLEAN HEADER WITH ONLY LOGO --- */}
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/[0.03] px-6 py-5 flex items-center">
      <button 
        onClick={() => router.back()} 
        className="text-xl text-zinc-500 hover:text-orange-500 transition-colors mr-4"
      >
        ←
      </button>
      
      <h1 
        onClick={() => router.push("/")}
        className="font-black text-[14px] uppercase tracking-[0.3em] text-white italic cursor-pointer"
      >
        Nectar
      </h1>
    </header>

    <div className="max-w-[420px] mx-auto px-4 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Post rev={post} />
    </div>
  </main>
);
}