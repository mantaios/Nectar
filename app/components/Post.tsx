"use client";
import { useState, useEffect } from "react";
import { auth, db, storage } from "../../firebase";
import { doc, deleteDoc, updateDoc, arrayUnion, arrayRemove, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";

export default function Post({ rev }: any) {
  const currentUser = auth.currentUser;
  const [showHeart, setShowHeart] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [livePhoto, setLivePhoto] = useState<string | null>(null);

  // --- LIKES MODAL STATES ---
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likedByUsers, setLikedByUsers] = useState<any[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  // --- STATES FOR EDIT & DELETE ---
  const [isEditing, setIsEditing] = useState(false);
  const [editReview, setEditReview] = useState(rev.review);
  const [editRatings, setEditRatings] = useState(rev.ratings || { food: 5, service: 5, price: 5, ambiance: 5, waiting: 5, variety: 5, vfm: 5 });
  const [editCategory, setEditCategory] = useState(rev.category || "Other");
  const [editAmount, setEditAmount] = useState(rev.amountSpent || "");
  const [editLocation, setEditLocation] = useState(rev.location || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(rev.imageUrls || []);

  const categories = ["🍔 Burger", "🍕 Pizza", "🥙 Souvlaki", "🥪 Streetfood", "🍣 Sushi", "🍝 Italian", "🥩 Steak", "🌮 Tacos", "🍦 Dessert", "☕ Coffee", "🍳 Brunch", "🐟 Seafood", "🍜 Asian", "🥘 Taverna", "🍷 Bar"];

  const postLikes = rev.likes || [];
  const postComments = rev.comments || [];
  const isLiked = postLikes.includes(currentUser?.uid || "");
  const commentsCount = postComments.length;

  // Εξηγήσεις για τα Ratings
  const ratingDescriptions: Record<string, string> = {
    Food: "Quality and taste of the meal.",
    Service: "Staff speed and politeness.",
    Price: "Cost: Lower rating means higher prices!",
    Decor: "Atmosphere and interior design.",
    Variety: "Range of options on the menu.",
    VFM: "Value for Money: Is it worth the cost?",
    Wait: "Waiting time for food or table."
  };

  useEffect(() => {
    const fetchUserPhoto = async () => {
      if (!rev.userPhoto && rev.userId) {
        try {
          const userRef = doc(db, "users", rev.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) setLivePhoto(userSnap.data().photoURL);
        } catch (err) { console.error(err); }
      }
    };
    fetchUserPhoto();
  }, [rev.userId, rev.userPhoto]);

  const fetchLikedUsers = async () => {
    if (postLikes.length === 0) return;
    setLoadingLikes(true);
    setShowLikesModal(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("__name__", "in", postLikes.slice(0, 10)));
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLikedByUsers(users);
    } catch (err) { console.error(err); }
    setLoadingLikes(false);
  };

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setNewPreviews(prev => [...prev, ...previews]);
    }
  };

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(img => img !== url));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdate = async () => {
    if (existingImages.length === 0 && newImages.length === 0) {
        return alert("You must have at least one photo!");
    }
    setIsUpdating(true);
    try {
      let finalUrls = [...existingImages];
      if (newImages.length > 0) {
        const uploadPromises = newImages.map(async (img) => {
          const storageRef = ref(storage, `posts/${rev.id}_${Date.now()}_${img.name}`);
          await uploadBytes(storageRef, img);
          return getDownloadURL(storageRef);
        });
        const uploadedUrls = await Promise.all(uploadPromises);
        finalUrls = [...finalUrls, ...uploadedUrls];
      }
      const sum = Object.values(editRatings).reduce((a: any, b: any) => Number(a || 0) + Number(b || 0), 0) as number;
      await updateDoc(doc(db, "reviews", rev.id), {
        review: editReview,
        ratings: editRatings,
        category: editCategory,
        amountSpent: Number(editAmount) || 0,
        location: editLocation,
        imageUrls: finalUrls,
        averageRating: sum / 7
      });
      setIsEditing(false);
      setNewImages([]);
      setNewPreviews([]);
    } catch (err) { console.error(err); }
    setIsUpdating(false);
  };

  const handleLike = async () => {
    if (!currentUser) return;
    const postRef = doc(db, "reviews", rev.id);
    if (!isLiked) {
      await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) });
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    } else {
      await updateDoc(postRef, { likes: arrayRemove(currentUser.uid) });
    }
  };

  return (
    <div className="relative bg-[#0A0A0A] mb-12 max-w-[420px] mx-auto rounded-[32px] border border-white/[0.05] pb-8 overflow-hidden shadow-2xl font-sans text-white">
      
      {/* LIKES MODAL */}
      {showLikesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-white">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowLikesModal(false)}></div>
          <div className="relative bg-[#121212] border border-white/10 w-full max-w-[300px] rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Liked by</h3>
                <button onClick={() => setShowLikesModal(false)} className="text-zinc-500 text-xs">✕</button>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-4 space-y-4">
                {loadingLikes ? <div className="text-center py-4 text-[10px] font-black text-orange-500 animate-pulse">LOADING...</div> : 
                 likedByUsers.map((user) => (
                    <Link key={user.id} href={`/profile?id=${user.id}`} onClick={() => setShowLikesModal(false)} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-white/5">
                            {user.photoURL && <img src={user.photoURL} className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-[12px] font-bold text-zinc-200 group-hover:text-orange-500 transition-colors">@{user.displayName}</span>
                    </Link>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-6 text-center">
          <div className="bg-zinc-900 border border-white/5 p-8 rounded-[40px] shadow-2xl max-w-[280px]">
            <span className="text-4xl mb-4 block">🗑️</span>
            <h3 className="text-sm font-black uppercase text-white mb-2 tracking-widest">Delete Post?</h3>
            <div className="flex flex-col gap-3 mt-6">
              <button onClick={() => deleteDoc(doc(db, "reviews", rev.id))} className="w-full bg-white text-black text-[10px] font-black py-4 rounded-2xl uppercase">Confirm</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-full bg-zinc-800 text-zinc-400 text-[10px] font-black py-4 rounded-2xl uppercase">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-4">
        <Link href={`/profile?id=${rev.userId}`} className="flex items-center gap-3 flex-1 group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-yellow-400 p-[1.5px] shrink-0">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center border border-black overflow-hidden shadow-inner">
              {rev.userPhoto || livePhoto ? <img src={rev.userPhoto || livePhoto} className="w-full h-full object-cover" alt="user" /> : <span className="text-[10px] font-black text-orange-500 uppercase">{rev.userName?.charAt(0)}</span>}
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-black tracking-tight text-zinc-200 group-hover:text-orange-500 transition-colors truncate">@{rev.userName}</span>
            {rev.location && <span className="text-[10px] font-bold text-zinc-500 tracking-tight truncate flex items-center gap-0.5">📍 {rev.location}</span>}
          </div>
        </Link>
        
        {currentUser?.uid === rev.userId && (
          <div className="flex gap-4">
             <button onClick={() => setIsEditing(!isEditing)} className="text-[10px] font-black uppercase text-zinc-500 hover:text-orange-500 tracking-widest">{isEditing ? "Cancel" : "Edit"}</button>
             <button onClick={() => setShowDeleteConfirm(true)} className="text-[10px] font-black uppercase text-zinc-500 hover:text-red-500 tracking-widest">Delete</button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="relative aspect-square w-full bg-black overflow-hidden" onDoubleClick={handleLike}>
          <div className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar shadow-inner">
            {rev.imageUrls?.map((url: string, i: number) => <img key={i} src={url} className="w-full h-full object-cover flex-shrink-0 snap-center" alt="food" />)}
          </div>
          {showHeart && <div className="absolute inset-0 flex items-center justify-center animate-[ping_0.6s_ease-in-out] pointer-events-none text-8xl">❤️</div>}
        </div>
      ) : (
        <div className="px-5 space-y-4 animate-in fade-in">
          <label className="block w-full h-28 bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center cursor-pointer group">
            <div className="text-center">
                <span className="text-2xl block mb-1">📸</span>
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Add More Photos</span>
            </div>
            <input type="file" multiple className="hidden" onChange={handleNewImages} accept="image/*" />
          </label>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {existingImages.map((url, i) => (
              <div key={`ex-${i}`} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-white/10 group/img">
                <img src={url} className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-opacity" alt="existing" />
                <button onClick={() => removeExistingImage(url)} className="absolute top-1 right-1 bg-black/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-black hover:bg-red-500">✕</button>
              </div>
            ))}
            {newPreviews.map((src, i) => (
              <div key={`new-${i}`} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 border-orange-500 shadow-lg animate-in zoom-in-75">
                <img src={src} className="w-full h-full object-cover" alt="new" />
                <button onClick={() => removeNewImage(i)} className="absolute top-1 right-1 bg-black/80 text-orange-500 rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-black">✕</button>
                <div className="absolute top-1 left-1 bg-orange-500 text-black px-1 py-0.5 rounded text-[7px] font-black uppercase">New</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-6 py-5">
        {isEditing ? (
          <div className="space-y-6 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest ml-1">Amount Spent</span>
                    <input type="number" value={editAmount} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-orange-500 font-black outline-none" onChange={(e) => setEditAmount(e.target.value)} placeholder="0.00 €" />
                </div>
                <div className="space-y-2">
                    <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest ml-1">Location</span>
                    <input type="text" value={editLocation} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-zinc-300 font-bold outline-none" onChange={(e) => setEditLocation(e.target.value)} placeholder="Athens..." />
                </div>
            </div>
            <textarea value={editReview} onChange={(e) => setEditReview(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs text-zinc-300 outline-none h-24" rows={3} placeholder="Update your review..." />
            
            <div className="space-y-2">
                <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest ml-1">Change Category</span>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {categories.map((cat) => (
                      <button key={cat} type="button" onClick={() => setEditCategory(cat)}
                        className={`px-3 py-2 rounded-full text-[9px] font-black uppercase border transition-all whitespace-nowrap ${editCategory === cat ? "bg-orange-500 border-orange-500 text-black" : "bg-black border-white/5 text-zinc-600"}`}>
                        {cat}
                      </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
              <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest ml-1">Update Ratings</span>
              {['food', 'service', 'price', 'ambiance', 'variety', 'vfm', 'waiting'].map((cat) => (
                <div key={cat} className="flex flex-col gap-2 bg-black/40 p-3 rounded-xl border border-white/5 group/rating">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">{cat === 'ambiance' ? 'Decoration' : cat}</span>
                    <span className="text-[10px] font-black text-orange-500">{editRatings[cat] || 0}/10</span>
                  </div>
                  <div className="flex justify-between">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button key={star} type="button" onClick={() => setEditRatings({...editRatings, [cat]: star})} className={`text-sm active:scale-125 transition-transform ${star <= (editRatings[cat] || 0) ? "text-orange-500" : "text-zinc-900"}`}>★</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleUpdate} disabled={isUpdating} className="w-full bg-orange-500 text-black text-[10px] font-black py-4 rounded-2xl uppercase tracking-widest shadow-lg shadow-orange-500/20">{isUpdating ? "UPDATING..." : "SAVE CHANGES"}</button>
          </div>
        ) : (
          /* VIEW MODE */
          <>
            <div className="flex items-center gap-2 mb-5">
              {/* BIG LIKE BUTTON - text-4xl */}
              <button onClick={handleLike} className={`text-4xl transition-all active:scale-125 ${isLiked ? "text-red-500 scale-110" : "text-white opacity-60 hover:opacity-100"}`}>{isLiked ? "❤️" : "♡"}</button>
              <div className="flex-1 flex items-center gap-2 justify-end">
                {rev.category && (
                  <div className="h-8 px-3 flex items-center bg-zinc-900 border border-white/5 rounded-full whitespace-nowrap">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{rev.category.split(' ')[1] || rev.category}</span>
                  </div>
                )}
                {rev.amountSpent > 0 && (
                  <div className="h-8 px-3 flex items-center bg-green-500/10 border border-green-500/20 rounded-full whitespace-nowrap">
                    <span className="text-[10px] font-black text-green-500">€{rev.amountSpent}</span>
                  </div>
                )}
                <div className="h-8 px-3 flex items-center bg-orange-500 text-black rounded-full shadow-lg whitespace-nowrap">
                   <span className="text-[11px] font-black">{rev.averageRating?.toFixed(1)} ★</span>
                </div>
              </div>
            </div>

            <button onClick={fetchLikedUsers} disabled={postLikes.length === 0} className="text-[11px] font-black text-zinc-500 mb-4 ml-1 hover:text-white transition-colors">{postLikes.length} likes</button>

            <div className="space-y-1 mb-6 border-l-2 border-orange-500/20 pl-4">
              <p className="text-[13px] leading-snug">
                <span className="font-black text-zinc-200">@{rev.userName}</span>
                <span className="font-black italic text-orange-500 uppercase tracking-tighter mx-2">{rev.name}</span>
              </p>
              {rev.review && <p className="text-[12px] text-zinc-400 font-medium italic leading-relaxed break-words italic">&quot;{rev.review}&quot;</p>}
            </div>

            {/* RATINGS WITH HOVER & TAP DESCRIPTION (NEW FUNCTIONALITY) */}
            <div className="grid grid-cols-2 gap-2 pt-6 border-t border-white/[0.03] relative italic">
              {[
                { label: 'Food', val: rev.ratings?.food },
                { label: 'Service', val: rev.ratings?.service },
                { label: 'Price', val: rev.ratings?.price },
                { label: 'Decor', val: rev.ratings?.ambiance },
                { label: 'Variety', val: rev.ratings?.variety },
                { label: 'VFM', val: rev.ratings?.vfm },
                { label: 'Wait', val: rev.ratings?.waiting }
              ].map((item) => (
                <div key={item.label} className="group relative cursor-help active:z-50">
                  
                  {/* TOOLTIP POPUP - WORKS ON HOVER (PC) AND TAP (MOBILE) */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block group-active:block w-32 bg-[#1a1a1a] text-[9px] text-zinc-300 p-2 rounded-lg border border-white/10 shadow-2xl z-50 text-center animate-in fade-in zoom-in duration-200 pointer-events-none transition-all">
                    <span className="font-black text-orange-500 block mb-1 uppercase tracking-tighter">{item.label}</span>
                    {ratingDescriptions[item.label] || "Experience factor."}
                  </div>

                  <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] rounded-full px-3 h-9 hover:bg-white/[0.08] active:bg-white/10 transition-colors">
                    <span className="text-[7px] font-black uppercase text-zinc-500 tracking-widest group-hover:text-orange-500 group-active:text-orange-500 transition-colors">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1 min-w-[35px] justify-end">
                      <span className="text-[10px] font-black text-zinc-200 leading-none">{item.val || 0}</span>
                      <span className="text-[9px] text-orange-500 leading-none shrink-0">★</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* COMMENTS SECTION */}
        <div className="space-y-3 border-t border-white/[0.03] pt-5 mt-6">
          {commentsCount > 0 && (
            <button onClick={() => setShowAllComments(!showAllComments)} className="text-[10px] text-zinc-600 font-black uppercase tracking-widest hover:text-orange-500 px-1 transition-colors">
              {showAllComments ? "Hide comments" : `View all ${commentsCount} comments`}
            </button>
          )}

          {showAllComments && (
            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
              {postComments.map((c: any, i: number) => (
                <p key={i} className="text-[11px] leading-tight flex gap-2 bg-white/[0.02] p-2 rounded-lg break-words">
                  <span className="font-black text-zinc-500 shrink-0">@{c.userName}</span>
                  <span className="text-zinc-400">{c.text}</span>
                </p>
              ))}
            </div>
          )}

          <form onSubmit={async (e) => {
              e.preventDefault();
              if (!commentText.trim()) return;
              await updateDoc(doc(db, "reviews", rev.id), {
                comments: arrayUnion({ userName: currentUser?.displayName || "User", text: commentText, date: new Date().toISOString() })
              });
              setCommentText("");
              setShowAllComments(true);
            }} className="flex items-center bg-black rounded-2xl border border-white/5 px-4 py-1 shadow-inner">
            <input placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="bg-transparent text-[11px] w-full py-3 outline-none text-zinc-300" />
            {commentText && <button type="submit" className="text-orange-500 text-[10px] font-black uppercase ml-2 tracking-widest active:scale-90 transition-transform">Post</button>}
          </form>
        </div>
      </div>
    </div>
  );
}