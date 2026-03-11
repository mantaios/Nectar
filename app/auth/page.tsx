"use client";
import AuthForm from "../components/AuthForm"; // Εδώ καλούμε τη φόρμα που ήδη έχεις!

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <AuthForm /> 
    </main>
  );
}