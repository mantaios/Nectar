"use client";
import { useEffect, useState } from "react";
import { db, auth, storage } from "../../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

export default function EditProfile() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Χρησιμοποιούμε τον Observer για να σιγουρευτούμε ότι ο χρήστης έχει φορτώσει
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
        router.push("/auth"); // Αν δεν είναι συνδεδεμένος, στείλτον στο login
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Λειτουργία για Αλλαγή Φωτογραφίας
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      // Ενημέρωση στη βάση αμέσως για τη φωτό
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        photoURL: url
      });
      
      setUserProfile((prev: any) => ({ ...prev, photoURL: url }));
      console.log("Image updated successfully");
    } catch (err) {
      console.error("Upload error:", err);
    }
    setUploading(false);
  };

  // Η ΛΕΙΤΟΥΡΓΙΑ ΤΟΥ DONE
  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.error("No user found during save");
      return;
    }

    if (!newName.trim()) {
      alert("Username is required!");
      return;
    }

    setSaving(true);
    console.log("Starting save process for UID:", user.uid);

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: newName.trim(),
        bio: newBio.trim()
      });
      
      console.log("Save successful!");
      // Ανακατεύθυνση πίσω στο προφίλ με το ID του χρήστη
      router.push(`/profile?id=${user.uid}`);
      router.refresh(); 
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Κάτι πήγε στραβά στην αποθήκευση.");
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-orange-500 font-black italic animate-pulse">DISHLY...</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10 sticky top-0 bg-black py-2 z-10 border-b border-zinc-900/50">
          <button onClick={() => router.back()} className="text-zinc-500 text-sm font-bold uppercase tracking-tighter">Cancel</button>
          <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Settings</h1>
          <button 
            onClick={handleSave} 
            disabled={saving || uploading}
            className={`text-sm font-black uppercase tracking-widest ${saving ? "text-zinc-700" : "text-orange-500 hover:text-orange-400"}`}
          >
            {saving ? "Saving..." : "Done"}
          </button>
        </div>

        {/* Profile Image Section */}
        <div className="flex flex-col items-center gap-6 mb-12">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full bg-zinc-900 border-2 border-zinc-800 overflow-hidden flex items-center justify-center shadow-2xl shadow-orange-500/10">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} className="w-full h-full object-cover" alt="avatar" />
              ) : (
                <span className="text-4xl font-black text-zinc-800">{newName?.charAt(0)}</span>
              )}
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          <label className="cursor-pointer bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-6 py-2 rounded-full transition-all active:scale-95">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Change Photo</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={uploading} />
          </label>
        </div>

        {/* Inputs */}
        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest ml-2 italic">Username</label>
            <input 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl p-5 text-sm outline-none focus:border-orange-500 transition-all font-medium"
              placeholder="Your username..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest ml-2 italic">Bio</label>
            <textarea 
              value={newBio} 
              onChange={(e) => setNewBio(e.target.value)} 
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-900 rounded-2xl p-5 text-sm outline-none focus:border-orange-500 transition-all resize-none font-medium"
              placeholder="Tell the world about your taste..."
            />
          </div>
        </div>
      </div>
    </main>
  );
}