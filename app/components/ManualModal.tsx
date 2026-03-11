"use client";
import { useState } from "react";

interface ManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManualModal({ isOpen, onClose }: ManualModalProps) {
  const [lang, setLang] = useState<"GR" | "EN">("GR");

  if (!isOpen) return null;

  const content = {
    GR: {
      title: "Εγχειρίδιο Nectar",
      subtitle: "Οδηγός Χρήστη & Λειτουργίες",
      sections: [
        {
          title: "01. Προβολή Δημοσιεύσεων (View Post)",
          desc: "Κάθε ανάρτηση είναι μια πλήρης γαστρονομική ταυτότητα.",
          items: [
            "Badge System: Πάνω δεξιά βλέπεις την κατηγορία (π.χ. 🍕 Pizza) και το ποσό που ξοδεύτηκε.",
            "Likes: Πάτα την καρδιά ❤️ για Like. Πάτα στο κείμενο των likes για να δεις ποιοι χρήστες αντέδρασαν.",
            "Τοποθεσία: Κάτω από το όνομα χρήστη, το 📍 σου δείχνει πού βρίσκεται το μαγαζί.",
            "Tooltips: Κράτα πατημένο (Tap & Hold) οποιοδήποτε κουτάκι βαθμολογίας για να δεις την επεξήγησή του."
          ]
        },
        {
          title: "02. Δημιουργία & Επεξεργασία (Create & Edit)",
          desc: "Πλήρης έλεγχος των αναμνήσεών σου.",
          items: [
            "Media: Ανέβασε πολλές φωτογραφίες. Στο Edit, μπορείς να διαγράψεις παλιές (X) ή να προσθέσεις νέες (ένδειξη 'New').",
            "Food Wallet: Κατάγραψε το κόστος (€). Αυτό ενημερώνει το συνολικό σου budget στο προφίλ.",
            "Ratings: Σύρε τα αστέρια για τους 7 πυλώνες. Ο μέσος όρος υπολογίζεται αυτόματα.",
            "Edit Mode: Μπορείς να αλλάξεις τα πάντα (τοποθεσία, κείμενο, ratings) χωρίς να διαγράψεις το post."
          ]
        },
        {
          title: "03. Σύστημα Βαθμολογίας (7-Star Metrics)",
          desc: "Ανάλυση των 7 κριτηρίων:",
          ratings: [
            { t: "Food", d: "Γεύση και παρουσίαση πιάτου." },
            { t: "Service", d: "Ταχύτητα και ευγένεια προσωπικού." },
            { t: "Price", d: "Κόστος (1: Πολύ Ακριβό, 10: Πολύ Φτηνό)." },
            { t: "Decor", d: "Αισθητική και ατμόσφαιρα χώρου." },
            { t: "Variety", d: "Ποικιλία επιλογών στο μενού." },
            { t: "VFM", d: "Value for Money: Άξιζε τα χρήματα που έδωσες;" },
            { t: "Wait", d: "Χρόνος αναμονής για τραπέζι ή φαγητό." }
          ]
        },
        {
          title: "04. Σύνδεση & Φίλοι (Connect)",
          desc: "Το Nectar είναι μια κλειστή κοινότητα.",
          items: [
            "Αναζήτηση: Βρες φίλους από τη σελίδα Connect (👥).",
            "Requests: Στείλε 'Connect +' και περίμενε την αποδοχή.",
            "Home Feed: Μόλις συνδεθείς, θα βλέπεις τις κριτικές των φίλων σου στην αρχική σου σελίδα."
          ]
        },
        {
          title: "05. Προφίλ & Κάβα (The Cellar)",
          desc: "Η ψηφιακή σου βιβλιοθήκη γεύσεων.",
          items: [
            "Stats: Δες συνολικά Reviews, Photos και το Total Spent (€) όλων των εποχών.",
            "Cuisine Filter: Πάτα τα εικονίδια (🍣, 🍔) για να δεις μόνο συγκεκριμένα reviews.",
            "Top Rated: Φίλτραρε τα καλύτερα πιάτα της ιστορίας σου με ένα κλικ."
          ]
        }
      ]
    },
    EN: {
      title: "Nectar Manual",
      subtitle: "User Guide & Features",
      sections: [
        {
          title: "01. Viewing Posts",
          desc: "Each post is a complete culinary identity.",
          items: [
            "Badge System: Top right icons show category (e.g., 🍕 Pizza) and Amount Spent.",
            "Likes: Tap the heart ❤️ to like. Tap the 'X likes' text to see who reacted.",
            "Location: Below the username, the 📍 shows the establishment's area.",
            "Tooltips: Tap & Hold any rating pill to see its specific definition."
          ]
        },
        {
          title: "02. Create & Edit Mode",
          desc: "Total control over your food journal.",
          items: [
            "Media: Upload multiple photos. In Edit mode, delete (X) or add new ones (marked as 'New').",
            "Food Wallet: Log the cost (€). This automatically updates your total budget stats.",
            "Ratings: Slide stars for all 7 metrics. The average score is auto-calculated.",
            "Flexibility: Modify location, text, or ratings at any time without deleting the post."
          ]
        },
        {
          title: "03. The 7-Star Rating System",
          desc: "Deep dive into our metrics:",
          ratings: [
            { t: "Food", d: "Taste quality and presentation." },
            { t: "Service", d: "Staff efficiency and hospitality." },
            { t: "Price", d: "Cost level (1: Very Expensive, 10: Very Cheap)." },
            { t: "Decor", d: "Ambiance, lighting, and interior design." },
            { t: "Variety", d: "Range of menu options available." },
            { t: "VFM", d: "Value for Money: Was it worth the price?" },
            { t: "Wait", d: "Time spent waiting for a table or food." }
          ]
        },
        {
          title: "04. Connect & Discovery",
          desc: "Building your private food network.",
          items: [
            "Search: Find friends on the Connect (👥) page.",
            "Requests: Send a 'Connect +' invite. Users get notified on their home screen.",
            "Social Feed: Once connected, their reviews will appear on your Home Feed."
          ]
        },
        {
          title: "05. Profile & Cellar",
          desc: "Your personal history of flavors.",
          items: [
            "Stats: Track total Reviews, Photos, and Total Spent (€) over time.",
            "Cuisine Filter: Tap tags (🍣, 🍔) to filter yours or a friend's history.",
            "Top Rated: Switch views to find the absolute best experiences instantly."
          ]
        }
      ]
    }
  };

  const active = content[lang];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative bg-[#0A0A0A] w-full max-w-2xl max-h-[90vh] rounded-[40px] border border-white/10 overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* FIXED HEADER */}
        <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between bg-[#0D0D0D]">
          <div className="min-w-0 flex-1">
            <h2 className="font-black italic text-orange-500 uppercase tracking-widest text-sm truncate">{active.title}</h2>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1 truncate">{active.subtitle}</p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0 ml-4">
            {/* LANGUAGE SWITCHER */}
            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              <button onClick={() => setLang("GR")} className={`px-2 py-1 rounded text-[9px] font-black transition-all ${lang === "GR" ? "bg-orange-500 text-black" : "text-zinc-500"}`}>GR</button>
              <button onClick={() => setLang("EN")} className={`px-2 py-1 rounded text-[9px] font-black transition-all ${lang === "EN" ? "bg-orange-500 text-black" : "text-zinc-500"}`}>EN</button>
            </div>
            {/* ΔΙΟΡΘΩΜΕΝΟ ΚΟΥΜΠΙ X */}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white shrink-0">✕</button>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-8 py-10 space-y-12 no-scrollbar pb-20 text-white">
          {active.sections.map((s, idx) => (
            <section key={idx} className="space-y-4">
              <h3 className="text-xl font-black uppercase italic tracking-tight text-white border-l-2 border-orange-500 pl-4">{s.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">{s.desc}</p>
              
              {s.items && (
                <ul className="space-y-3">
                  {s.items.map((item, i) => (
                    <li key={i} className="flex gap-3 items-start text-xs text-zinc-300">
                      <span className="text-orange-500 font-black">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {s.ratings && (
                <div className="grid grid-cols-1 gap-3">
                  {s.ratings.map((r, i) => (
                    <div key={i} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <span className="text-orange-500 font-black text-[9px] uppercase tracking-widest block mb-1">{r.t}</span>
                      <p className="text-[11px] text-zinc-500 leading-tight">{r.d}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}

          <div className="pt-10 text-center border-t border-white/5">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Nectar • Petros Mantaios</p>
          </div>
        </div>
      </div>
    </div>
  );
}