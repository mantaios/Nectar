"use client";
import { useState } from "react";
// Σιγουρέψου ότι το path είναι σωστό ανάλογα με τη δομή του φακέλου σου
import { auth, db } from "../../firebase"; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AuthForm() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // Αυτό θα είναι το Full Name
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        // --- ΕΓΓΡΑΦΗ ---
        const res = await createUserWithEmailAndPassword(auth, email, password);
        
        // 1. Ενημέρωση του Firebase Auth Profile (για το σύστημα)
        await updateProfile(res.user, { 
          displayName: username 
        });
        
        // 2. Αποθήκευση στη Firestore (για το Nectar App)
        // Δημιουργούμε ένα clean username για αναζητήσεις (π.χ. "Petros X" -> "petrosx")
        const cleanUsername = username.toLowerCase().replace(/\s+/g, '');

        await setDoc(doc(db, "users", res.user.uid), {
          uid: res.user.uid,
          displayName: username, // Αυτό θα εμφανίζεται στα Posts (πηγή αλήθειας)
          username: cleanUsername, // Το nickname για το profile URL ή αναζήτηση
          email: email.toLowerCase(),
          photoURL: "", // Αρχικά κενό μέχρι να κάνει upload ο χρήστης
          bio: "Welcome to my food profile! 🍕", 
          joinedAt: new Date().toISOString()
        });

      } else {
        // --- ΣΥΝΔΕΣΗ ---
        await signInWithEmailAndPassword(auth, email, password);
      }

      // Μεταφορά στην αρχική σελίδα
      router.push("/"); 
      
    } catch (err: any) {
      console.error(err);
      // Εμφάνιση πιο φιλικού μηνύματος αν θες
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      {/* Διακοσμητικό Glow Background */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-orange-600/10 blur-[120px] pointer-events-none"></div>

      <div className="relative bg-zinc-900 p-8 rounded-[40px] border border-zinc-800 w-full max-w-sm shadow-2xl z-10">
        <div className="text-center mb-10">
            <h1 className="text-5xl font-black italic tracking-tighter text-orange-500 uppercase">Nectar</h1>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] mt-2 font-bold">The Digital Sommelier</p>
        </div>
        
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {isRegistering && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-4">Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. Petros Mantaios" 
                className="w-full bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-700 focus:border-orange-500 transition-all text-white placeholder:text-zinc-600" 
                onChange={e => setUsername(e.target.value)} 
                required 
              />
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-4">Email</label>
            <input 
              type="email" 
              placeholder="name@email.com" 
              className="w-full bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-700 focus:border-orange-500 transition-all text-white placeholder:text-zinc-600" 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-4">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-700 focus:border-orange-500 transition-all text-white placeholder:text-zinc-600" 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-black font-black py-5 rounded-2xl text-xs mt-4 transition-all active:scale-95 uppercase tracking-widest shadow-lg shadow-orange-900/20">
            {isRegistering ? "Create Account" : "Log In"}
          </button>
        </form>

        <div className="text-center mt-10 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
          {isRegistering ? "Already have an account?" : "New to Nectar?"}
          <button 
            type="button"
            onClick={() => setIsRegistering(!isRegistering)} 
            className="ml-2 text-orange-500 hover:text-orange-400 transition-colors"
          >
            {isRegistering ? "Log In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}