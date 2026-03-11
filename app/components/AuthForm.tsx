"use client";
import { useState } from "react";
// Σιγουρέψου ότι το path είναι σωστό (../../ αν είναι εκτός app, ../ αν είναι εντός)
import { auth, db } from "../../firebase"; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation"; // 1. Εισαγωγή του Router

export default function AuthForm() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const router = useRouter(); // 2. Αρχικοποίηση του Router

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        // --- ΕΓΓΡΑΦΗ ---
        const res = await createUserWithEmailAndPassword(auth, email, password);
        
        // Ενημέρωση του Firebase Auth Profile
        await updateProfile(res.user, { 
          displayName: username 
        });
        
        // Αποθήκευση στη Firestore (Συλλογή users)
        // Χρησιμοποιούμε displayName και photoURL για να τα διαβάζει το Profile page
        await setDoc(doc(db, "users", res.user.uid), {
          uid: res.user.uid,
          displayName: username,
          email: email,
          photoURL: "", // Αρχικά κενό
          bio: "Welcome to my food profile!", // Default bio
          joinedAt: new Date().toISOString()
        });

      } else {
        // --- ΣΥΝΔΕΣΗ ---
        await signInWithEmailAndPassword(auth, email, password);
      }

      // 3. Η ΜΕΤΑΦΟΡΑ: Μόλις τελειώσει επιτυχώς το Auth, πήγαινε στην αρχική
      router.push("/"); 
      
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="bg-zinc-900 p-8 rounded-[32px] border border-zinc-800 w-full max-w-sm shadow-2xl">
        <h1 className="text-4xl font-serif italic mb-8 text-center text-orange-500">Nectar
        
        </h1>
        
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {isRegistering && (
            <input 
              type="text" 
              placeholder="Username " 
              className="bg-zinc-800 p-4 rounded-xl text-sm outline-none border border-zinc-700 focus:border-orange-500 transition-all text-white" 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          )}
          <input 
            type="email" 
            placeholder="Email" 
            className="bg-zinc-800 p-4 rounded-xl text-sm outline-none border border-zinc-700 focus:border-orange-500 transition-all text-white" 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="bg-zinc-800 p-4 rounded-xl text-sm outline-none border border-zinc-700 focus:border-orange-500 transition-all text-white" 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          
          <button type="submit" className="bg-orange-600 hover:bg-orange-500 font-black py-4 rounded-xl text-sm mt-2 transition-all active:scale-95 uppercase tracking-widest">
            {isRegistering ? "Create Account" : "Log In"}
          </button>
        </form>

        <div className="text-center mt-8 text-sm text-zinc-500">
          {isRegistering ? "Already have an account?" : "New to Nectar?"}
          <button 
            type="button"
            onClick={() => setIsRegistering(!isRegistering)} 
            className="ml-2 text-orange-500 font-bold hover:underline"
          >
            {isRegistering ? "Log In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}