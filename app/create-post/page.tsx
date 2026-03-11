"use client";
import { useState } from "react";
import { auth, db, storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CreatePost() {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [restaurant, setRestaurant] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [location, setLocation] = useState(""); 
  const [amountSpent, setAmountSpent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Other");
  const [loading, setLoading] = useState(false);
  
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const router = useRouter();

  const categories = [
    "🍔 Burger", "🍕 Pizza", "🥙 Souvlaki", "🥪 Streetfood", "🍣 Sushi", "🍝 Italian", 
    "🥩 Steak", "🌮 Tacos", "🍦 Dessert", "☕ Coffee", "🍳 Brunch", "🐟 Seafood", 
    "🍜 Asian", "🥘 Taverna", "🍷 Bar"
  ];

  const [ratings, setRatings] = useState({
    food: 5, service: 5, price: 5, ambiance: 5, waiting: 5, variety: 5, vfm: 5
  });

  const ratingDescriptions: Record<string, string> = {
    food: "Quality and taste of the meal.",
    service: "Staff speed and politeness.",
    price: "Cost: Lower rating means higher prices!",
    ambiance: "Atmosphere and interior design.",
    waiting: "Time spent waiting for a table or food.",
    variety: "Range of options on the menu.",
    vfm: "Value for Money: Is the experience worth the price?"
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImages(selectedFiles);
      const filePreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews(filePreviews);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!restaurant || images.length === 0) {
        setErrorMessage(
            !restaurant ? "Please enter a restaurant name." : "Please add at least one photo of your meal."
        );
        setShowErrorModal(true);
        return;
    }

    setLoading(true);
    try {
      const uploadPromises = images.map(async (img) => {
        const storageRef = ref(storage, `posts/${Date.now()}_${img.name}`);
        await uploadBytes(storageRef, img);
        return getDownloadURL(storageRef);
      });

      const urls = await Promise.all(uploadPromises);
      const sum = Object.values(ratings).reduce((a, b) => a + b, 0);
      const avg = sum / 7;

      await addDoc(collection(db, "reviews"), {
        name: restaurant,
        review: reviewText,
        location: location, 
        amountSpent: Number(amountSpent) || 0,
        category: selectedCategory,
        imageUrls: urls,
        ratings: ratings,
        averageRating: avg,
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName,
        userPhoto: auth.currentUser?.photoURL,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
        likes: [],
        comments: []
      });

      setShowSuccessModal(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      console.error(err);
      setErrorMessage("Something went wrong during upload. Try again.");
      setShowErrorModal(true);
    }
    setLoading(false);
  };

  const StarRating = ({ label, cat }: { label: string, cat: keyof typeof ratings }) => (
    <div className="flex flex-col gap-3 bg-zinc-900/40 p-5 rounded-3xl border border-white/5 relative">
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{label}</span>
          <span className="text-[11px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg">{ratings[cat]}/10</span>
        </div>
        {/* ΜΟΝΙΜΟ DESCRIPTION ΧΩΡΙΣ HOVER */}
        <p className="text-[10px] text-zinc-500 font-medium leading-tight">
          {ratingDescriptions[cat]}
        </p>
      </div>
      <div className="flex justify-between items-center px-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <button 
            key={star} 
            type="button" 
            onClick={() => setRatings({...ratings, [cat]: star})}
            className={`text-lg transition-all active:scale-150 touch-manipulation ${star <= ratings[cat] ? "text-orange-500" : "text-zinc-800"}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white p-6 max-w-lg mx-auto font-sans pb-20">
      
      {/* ERROR MODAL */}
      {showErrorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowErrorModal(false)}></div>
          <div className="relative bg-[#12121A] border border-red-500/20 p-8 rounded-[40px] text-center shadow-2xl max-w-[280px] animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-500/20">
               <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2">Wait a second</h3>
            <p className="text-[11px] text-slate-400 mb-8 leading-relaxed px-2">{errorMessage}</p>
            <button onClick={() => setShowErrorModal(false)} className="w-full bg-white text-black text-[10px] font-black py-4 rounded-2xl uppercase tracking-widest active:scale-95 transition-all">Got it</button>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl"></div>
          <div className="relative text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(249,115,22,0.4)] animate-bounce">
               <span className="text-3xl text-black">✨</span>
            </div>
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">Nectar Shared</h2>
            <p className="text-zinc-500 text-xs mt-2 uppercase tracking-[0.2em]">Experience Posted!</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-10 sticky top-0 bg-black/80 backdrop-blur-md z-30 py-2">
        <button onClick={() => router.back()} className="text-zinc-500 font-bold text-sm">Cancel</button>
        <h1 className="text-xs font-black tracking-[0.4em] text-orange-500 uppercase italic">Nectar</h1>
        <button onClick={handleSubmit} disabled={loading} className={`font-black uppercase text-sm ${loading ? "text-zinc-800" : "text-orange-500 hover:text-orange-300"}`}>
          {loading ? "..." : "Post"}
        </button>
      </div>

      <div className="space-y-8">
        <label className="block w-full aspect-[4/5] bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-[40px] flex items-center justify-center cursor-pointer overflow-hidden relative shadow-2xl">
          {previews.length > 0 ? (
            <div className="flex overflow-x-auto snap-x snap-mandatory w-full h-full no-scrollbar">
              {previews.map((src, i) => <img key={i} src={src} className="flex-shrink-0 w-full h-full object-cover snap-center" alt="preview" />)}
            </div>
          ) : (
            <div className="text-center">
              <span className="text-5xl block mb-2 opacity-30">📸</span>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center px-4">Tap to add food photos</p>
            </div>
          )}
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
        </label>

        <div className="space-y-4">
          <input placeholder="Restaurant Name" className="w-full bg-transparent border-b border-zinc-900 py-4 text-2xl font-bold outline-none focus:border-orange-500 transition-all placeholder:text-zinc-900" onChange={e => setRestaurant(e.target.value)} />
          <textarea placeholder="How was the taste?..." className="w-full bg-transparent text-sm text-zinc-400 outline-none resize-none h-20 placeholder:text-zinc-800" onChange={e => setReviewText(e.target.value)} />
        </div>

        <div className="space-y-3">
          <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-1">Money Spent</h2>
          <div className="relative group">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 font-black">€</span>
             <input type="number" placeholder="0.00" className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-10 pr-4 text-xl font-black outline-none focus:border-orange-500 transition-all placeholder:text-zinc-800 shadow-inner" onChange={e => setAmountSpent(e.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-1">Location</h2>
          <div className="relative group">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">📍</span>
             <input 
               type="text" 
               placeholder="e.g. Athens, Greece" 
               className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-10 pr-4 text-sm font-bold outline-none focus:border-orange-500 transition-all placeholder:text-zinc-800 shadow-inner" 
               onChange={e => setLocation(e.target.value)} 
             />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 ml-1">Food Type</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button key={cat} type="button" onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${selectedCategory === cat ? "bg-orange-500 border-orange-500 text-black scale-105 shadow-lg shadow-orange-500/20" : "bg-zinc-900 border-white/5 text-zinc-500"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2 ml-1">Ratings (1-10)</h2>
          <StarRating label="Food" cat="food" />
          <StarRating label="Service" cat="service" />
          <StarRating label="Price" cat="price" />
          <StarRating label="Decoration" cat="ambiance" />
          <StarRating label="Variety" cat="variety" />
          <StarRating label="Value for Money" cat="vfm" />
          <StarRating label="Waiting" cat="waiting" />
        </div>
      </div>
    </main>
  );
}