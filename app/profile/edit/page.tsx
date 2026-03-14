"use client";
import { useEffect, useState } from "react";
import { db, auth, storage } from "../../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";

export default function EditProfile() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            setUserProfile(data);
            setNewName(data.displayName || "");
            setNewBio(data.bio || "");
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
        setLoading(false);
      } else {
        router.push("/auth");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      // Ενημέρωση στη Firestore
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        photoURL: url
      });
      
      // Ενημέρωση στο Firebase Auth (για συγχρονισμό)
      await updateProfile(auth.currentUser, { photoURL: url });
      
      setUserProfile((prev: any) => ({ ...prev, photoURL: url }));
    } catch (err) {
      console.error("Upload error:", err);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user || !newName.trim()) return;

    setSaving(true);
    try {
      // 1. Ενημέρωση στη Firestore (Η πηγή αλήθειας για τα Posts)
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: newName.trim(),
        bio: newBio.trim(),
        // Ενημερώνουμε και το clean username αν θες να αλλάζει το search handle
        username: newName.trim().toLowerCase().replace(/\s+/g, '')
      });

      // 2. Ενημέρωση στο Firebase Auth Profile
      await updateProfile(user, { 
        displayName: newName.trim() 
      });
      
      router.push(`/profile?id=${user.uid}`);
      router.refresh(); 
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Κάτι πήγε στραβά.");
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-orange-500 font-black italic animate-pulse text-2xl tracking-tighter uppercase">Nectar...</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans">
       {/* Background Glow */}
       <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-orange-600/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-md mx-auto relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-12 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-10 border-b border-white/5">
          <button onClick={() => router.back()} className="text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
          <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Edit Profile</h1>
          <button 
            onClick={handleSave} 
            disabled={saving || uploading}
            className={`text-[10px] font-black uppercase tracking-widest ${saving ? "text-zinc-700" : "text-orange-500 hover:text-orange-400"}`}
          >
            {saving ? "Saving..." : "Done"}
          </button>
        </div>

        {/* Profile Image Section */}
        <div className="flex flex-col items-center gap-6 mb-16">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-tr from-orange-600 to-yellow-400 rounded-full blur opacity-20"></div>
            <div className="relative w-32 h-32 rounded-full bg-zinc-900 border-4 border-black overflow-hidden flex items-center justify-center shadow-2xl">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} className="w-full h-full object-cover" alt="avatar" />
              ) : (
                <span className="text-5xl font-black text-zinc-800 uppercase">{newName?.charAt(0)}</span>
              )}
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-3 rounded-2xl transition-all active:scale-95">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Change Photo</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={uploading} />
          </label>
        </div>

        {/* Inputs */}
        <div className="space-y-10">
          <div className="space-y-3">
            <label className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] ml-2">Full Name</label>
            <input 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              className="w-full bg-zinc-900/50 border border-white/5 rounded-[24px] p-6 text-sm outline-none focus:border-orange-500/50 focus:bg-zinc-900 transition-all font-bold text-white placeholder:text-zinc-700"
              placeholder="How should we call you?"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] ml-2">Bio</label>
            <textarea 
              value={newBio} 
              onChange={(e) => setNewBio(e.target.value)} 
              rows={4}
              className="w-full bg-zinc-900/50 border border-white/5 rounded-[24px] p-6 text-sm outline-none focus:border-orange-500/50 focus:bg-zinc-900 transition-all resize-none font-medium text-zinc-300 placeholder:text-zinc-700"
              placeholder="Share your culinary philosophy..."
            />
          </div>
        </div>
      </div>
    </main>
  );
}