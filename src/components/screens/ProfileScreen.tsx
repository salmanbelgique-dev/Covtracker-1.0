import { useState, useRef, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Bell,
  Shield,
  Lock,
  CreditCard,
  Sun,
  Moon,
  Info,
  X,
  ChevronRight,
  ChevronLeft,
  Upload,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import appLogo from "@/assets/logo.png";
import cardBg from "@/assets/card-bg.png";
import logoSpectrocoin from "@/assets/logo-spectrocoin.png";
import logoNsave from "@/assets/logo-nsave.png";
import logoBybit from "@/assets/logo-bybit.png";
import logoKast from "@/assets/logo-kast.png";
import logoRedotpay from "@/assets/logo-redotpay.png";
import logoMyfin from "@/assets/logo-myfin.png";
import logoKrak from "@/assets/logo-krak.png";
import { useTheme } from "@/hooks/useTheme";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const EMAIL_STORAGE_KEY = "profile-email";
const DISPLAY_NAME_KEY = "profile-display-name";
const TAGLINE_KEY = "profile-tagline";
const PROFILE_PHOTO_KEY = "profile-photo-data";
const DEFAULT_EMAIL = "Dalebodi@gmail.com";
const DEFAULT_DISPLAY_NAME = "Covitch";
const DEFAULT_TAGLINE = "The Last Mischief-maker Of This Century";

const PAYMENT_METHODS_KEY = "profile-payment-methods";

export type PaymentMethod = {
  id: string;
  type: "visa" | "mastercard";
  name: string;
  last4: string;
  logoUrl?: string;
};

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "1", type: "visa", name: "K KAST Virtual", last4: "9138" },
  { id: "2", type: "mastercard", name: "Platinum", last4: "5678" }
];

export const SUGGESTED_CARDS = [
  { name: "SPECTROCOIN", category: "Crypto Wallet", iconColor: "bg-[#142661]", letter: "S", logoSrc: logoSpectrocoin },
  { name: "NSAVE", category: "Banking", iconColor: "bg-[#E60000]", letter: "N", logoSrc: logoNsave },
  { name: "BYBIT", category: "Crypto Exchange", iconColor: "bg-black", letter: "B", logoSrc: logoBybit },
  { name: "KAST", category: "Virtual Card", iconColor: "bg-black", letter: "K", logoSrc: logoKast },
  { name: "REDOTPAY", category: "Crypto Card", iconColor: "bg-[#E41F26]", letter: "R", logoSrc: logoRedotpay },
  { name: "MYFIN", category: "Finance App", iconColor: "bg-white", letter: "M", logoSrc: logoMyfin },
  { name: "KRAK", category: "Crypto Exchange", iconColor: "bg-black", letter: "K", logoSrc: logoKrak }
];

type ProfileSubView = "main" | "change-email" | "edit-profile" | "payment-methods";

const emailLooksValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const MAX_PHOTO_EDGE = 512;
const PHOTO_JPEG_QUALITY = 0.85;
/** GIFs skip canvas so animation is kept; cap size for localStorage */
const MAX_GIF_BYTES = 2 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("read-failed"));
    };
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}

function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("not-image"));
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_PHOTO_EDGE || height > MAX_PHOTO_EDGE) {
        if (width >= height) {
          height = Math.round((height * MAX_PHOTO_EDGE) / width);
          width = MAX_PHOTO_EDGE;
        } else {
          width = Math.round((width * MAX_PHOTO_EDGE) / height);
          height = MAX_PHOTO_EDGE;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("no-canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", PHOTO_JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("load-failed"));
    };
    img.src = objectUrl;
  });
}

async function processProfileImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("not-image");
  }
  if (file.type === "image/gif") {
    if (file.size > MAX_GIF_BYTES) {
      throw new Error("gif-too-large");
    }
    return readFileAsDataUrl(file);
  }
  return compressImageFile(file);
}

const ProfileScreen = () => {
  const [showAbout, setShowAbout] = useState(false);
  const [subView, setSubView] = useState<ProfileSubView>("main");
  const [accountEmail, setAccountEmail] = useState(() => localStorage.getItem(EMAIL_STORAGE_KEY) ?? DEFAULT_EMAIL);
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem(DISPLAY_NAME_KEY) ?? DEFAULT_DISPLAY_NAME,
  );
  const [tagline, setTagline] = useState(() => localStorage.getItem(TAGLINE_KEY) ?? DEFAULT_TAGLINE);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(() => localStorage.getItem(PROFILE_PHOTO_KEY));
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
    const stored = localStorage.getItem(PAYMENT_METHODS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
          return parsed.map((s: string, i: number) => ({ id: i.toString(), type: s.toLowerCase().includes("visa") ? "visa" : "mastercard", name: s, last4: s.slice(-4) || "0000" }));
        }
        return parsed;
      } catch (e) {
        return DEFAULT_PAYMENT_METHODS;
      }
    }
    return DEFAULT_PAYMENT_METHODS;
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeCardId, setActiveCardId] = useState<string | "add-new">("add-new");

  // Detect centered card on scroll (snap-based carousel)
  const updateActiveCardFromScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const cardWidth = window.innerWidth < 640 ? window.innerWidth * 0.88 + 16 : 336;
    const index = Math.round(el.scrollLeft / cardWidth);
    // index 0..paymentMethods.length-1 are real cards, last index is ADD NEW
    const allIds = [...paymentMethods.map(p => p.id), "add-new"];
    const id = allIds[Math.min(index, allIds.length - 1)];
    if (id) setActiveCardId(id);
  };

  const scrollHorizontally = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth < 640 ? window.innerWidth * 0.88 + 16 : 336;
      scrollContainerRef.current.scrollBy({ 
        left: direction === 'right' ? scrollAmount : -scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  const [newCardName, setNewCardName] = useState("");
  const [newCardType, setNewCardType] = useState<'visa' | 'mastercard'>('visa');
  const [newCardLast4, setNewCardLast4] = useState("");
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const customLogoInputRef = useRef<HTMLInputElement>(null);

  const [showSuggestions, setShowSuggestions] = useState(false);

  const showLogoUpload = newCardName.trim().length > 0 && !SUGGESTED_CARDS.some(c => c.name.toLowerCase() === newCardName.trim().toLowerCase());

  // Load subscriptions to show recent transactions per card
  const allSubscriptions: Array<{id:string;name:string;cost:number;renewalDate:string;paymentMethod:string;logo?:string;color?:string}> = (() => {
    try { return JSON.parse(localStorage.getItem('subscriptions') ?? '[]'); } catch { return []; }
  })();

  const { theme, setTheme } = useTheme();

  const openPaymentMethods = () => {
    setNewCardLast4("");
    setCustomLogoUrl(null);
    setSubView("payment-methods");
  };

  const openChangeEmail = () => {
    setNewEmail("");
    setConfirmEmail("");
    setSubView("change-email");
  };

  const openEditProfile = () => {
    setEditDisplayName(displayName);
    setEditTagline(tagline);
    setEditPhotoUrl(profilePhotoUrl);
    setSubView("edit-profile");
  };

  const onPickPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await processProfileImageFile(file);
      setEditPhotoUrl(dataUrl);
    } catch (err) {
      if (err instanceof Error && err.message === "gif-too-large") {
        toast.error(`GIF must be under ${MAX_GIF_BYTES / (1024 * 1024)} MB to save locally.`);
      } else {
        toast.error("Could not use that image. Try another file.");
      }
    }
  };

  const saveProfile = () => {
    const name = editDisplayName.trim();
    const line = editTagline.trim();

    if (!name) {
      toast.error("Display name cannot be empty.");
      return;
    }

    const samePhoto = (editPhotoUrl ?? "") === (profilePhotoUrl ?? "");
    if (name === displayName && line === tagline && samePhoto) {
      toast.message("No changes to save.");
      setSubView("main");
      return;
    }

    localStorage.setItem(DISPLAY_NAME_KEY, name);
    localStorage.setItem(TAGLINE_KEY, line);
    setDisplayName(name);
    setTagline(line);

    if (!samePhoto) {
      if (editPhotoUrl) {
        localStorage.setItem(PROFILE_PHOTO_KEY, editPhotoUrl);
      } else {
        localStorage.removeItem(PROFILE_PHOTO_KEY);
      }
      setProfilePhotoUrl(editPhotoUrl);
    }

    window.dispatchEvent(new Event("app-profile-updated"));
    toast.success("Profile updated.");
    setSubView("main");
  };

  const saveEmail = () => {
    const next = newEmail.trim();
    const confirm = confirmEmail.trim();

    if (!emailLooksValid(next)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (next !== confirm) {
      toast.error("New email addresses do not match.");
      return;
    }
    if (next.toLowerCase() === accountEmail.trim().toLowerCase()) {
      toast.message("This is already your email.");
      setSubView("main");
      return;
    }

    localStorage.setItem(EMAIL_STORAGE_KEY, next);
    setAccountEmail(next);
    toast.success("Email updated.");
    setSubView("main");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 pt-6 pb-28"
    >
      <AnimatePresence mode="wait">
        {subView === "change-email" ? (
          <motion.div
            key="change-email"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <button
              type="button"
              onClick={() => setSubView("main")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1"
            >
              <ChevronLeft size={20} />
              Back
            </button>
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Mail size={22} className="text-primary" />
                Change Email
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Current: <span className="text-foreground font-medium">{accountEmail}</span>
              </p>
            </div>
            <div className="glass-card p-4 space-y-4 rounded-2xl">
              <div className="space-y-1.5">
                <Label htmlFor="new-email">New email</Label>
                <Input
                  id="new-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-email">Confirm new email</Label>
                <Input
                  id="confirm-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                />
              </div>
              <Button type="button" className="w-full" onClick={saveEmail}>
                Save email
              </Button>
            </div>
          </motion.div>
        ) : subView === "edit-profile" ? (
          <motion.div
            key="edit-profile"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <button
              type="button"
              onClick={() => setSubView("main")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1"
            >
              <ChevronLeft size={20} />
              Back
            </button>
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <User size={22} className="text-primary" />
                Edit Profile
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Update how you appear on your profile.</p>
            </div>
            <div className="glass-card p-4 space-y-4 rounded-2xl">
              <div className="space-y-3">
                <Label>Profile photo</Label>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-full overflow-hidden glow-shadow ring-2 ring-border">
                    <img
                      src={editPhotoUrl ?? appLogo}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    id="profile-photo-input"
                    onChange={onPickPhoto}
                  />
                  <div className="flex w-full gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <Upload size={16} />
                      Upload
                    </Button>
                    {editPhotoUrl ? (
                      <Button type="button" variant="ghost" className="flex-1" onClick={() => setEditPhotoUrl(null)}>
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    JPG, PNG, or WebP are resized. GIFs stay animated (max {MAX_GIF_BYTES / (1024 * 1024)} MB).
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tagline">Tagline</Label>
                <Textarea
                  id="tagline"
                  placeholder="Short line under your name"
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  maxLength={200}
                  className="min-h-[88px] resize-none"
                />
              </div>
              <Button type="button" className="w-full" onClick={saveProfile}>
                Save profile
              </Button>
            </div>
          </motion.div>
        ) : subView === "payment-methods" ? (
          <motion.div
            key="payment-methods"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <button
              type="button"
              onClick={() => setSubView("main")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1"
            >
              <ChevronLeft size={20} />
              Back
            </button>
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <CreditCard size={22} className="text-primary" />
                Payment Methods
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Manage your payment methods.</p>
            </div>

            {/* Horizontal Scroll List of Cards */}
            <div className="relative -mx-5 px-5">
              {/* Left Navigation Arrow */}
              {paymentMethods.length > 0 && (
                <button 
                  onClick={() => scrollHorizontally('left')}
                  className="absolute left-6 sm:left-10 top-[40%] -translate-y-1/2 w-10 h-10 rounded-full bg-background/40 dark:bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-xl z-20 hover:bg-background/60 transition-all hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="text-foreground drop-shadow-md ml-[-2px]" size={24} />
                </button>
              )}

              <div 
                ref={scrollContainerRef}
                onScroll={updateActiveCardFromScroll}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory py-3 hide-scrollbar -mx-5 px-5"
              >
                {/* Left Spacer */}
              <div className="w-[calc(6vw-16px)] sm:w-[calc(50%-160px-16px)] shrink-0" />
              
              {paymentMethods.map((pm) => (
                <div 
                  key={pm.id}
                  onClick={() => setActiveCardId(pm.id)}
                  className={`w-[88vw] sm:w-[320px] shrink-0 snap-center aspect-video rounded-[18px] relative overflow-hidden group shadow-[0_20px_40px_-5px_rgb(0,0,0,0.8)] border transform-gpu bg-[#0a0510] cursor-pointer transition-all duration-200 ${activeCardId === pm.id ? 'border-primary/80 ring-2 ring-primary/30 shadow-[0_0_20px_4px_rgba(138,43,226,0.25)]' : 'border-white/20'}`}
                >
                  <img 
                    src={cardBg} 
                    alt="Card Background" 
                    className="absolute inset-0 w-full h-full object-cover scale-[1.15] pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/10 opacity-40 pointer-events-none mix-blend-overlay" />
                  <div className="absolute inset-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.1),inset_1px_0_1px_rgba(255,255,255,0.1),inset_-1px_0_1px_rgba(255,255,255,0.1)] rounded-[18px] pointer-events-none" />
                  <div className="absolute inset-x-5 inset-y-5 flex flex-col justify-between z-10 text-white">
                    <div className="flex justify-between items-start">
                      <span className="font-bold tracking-widest text-lg flex items-center gap-1.5 drop-shadow-md text-white/95">
                        {pm.logoUrl ? (
                          <span className="flex items-center gap-2.5 mt-2">
                            <img src={pm.logoUrl} alt={pm.name} className="h-[36px] w-auto object-contain shrink-0" />
                            <span className={`text-[24px] tracking-widest font-extrabold drop-shadow-md leading-none pt-0.5 ${pm.name.toUpperCase().includes('KRAK') ? 'text-[#FF4842]' : 'text-white'}`}>
                              {pm.name.toUpperCase()}
                            </span>
                          </span>
                        ) : (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="drop-shadow-md" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                               <path d="M4 4v16M4 12l8-8M4 12l8 8" />
                            </svg>
                            {pm.name}
                          </>
                        )}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = paymentMethods.filter(p => p.id !== pm.id);
                          setPaymentMethods(updated);
                          localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(updated));
                          if (activeCardId === pm.id) setActiveCardId("add-new");
                          toast.success("Card removed");
                        }} 
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-white/10"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </div>
                    <div className="flex justify-between items-end pb-1">
                      <div className="flex items-center gap-2 drop-shadow-md text-white/90">
                        <span className="text-2xl mt-1.5 tracking-[0.1em]">••••</span>
                        <span className="font-mono text-[22px] tracking-wider font-light">{pm.last4}</span>
                        <span className="text-[11px] font-medium tracking-wide px-2.5 py-[3px] rounded-full border border-white/30 opacity-90 transform -translate-y-0.5 ml-1">
                          Virtual
                        </span>
                      </div>
                      <div className="text-right flex flex-col items-end leading-none">
                        {pm.type === 'visa' ? (
                          <span className="text-[30px] font-black tracking-tighter italic drop-shadow-lg text-white/95 leading-[1] mt-0.5 mr-0.5">VISA</span>
                        ) : (
                          <svg className="h-[26px] w-auto drop-shadow-sm mt-0.5" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="12" fill="#EA001B"/>
                            <circle cx="28" cy="12" r="12" fill="#F7A000"/>
                            <path d="M20 22.4A11.9 11.9 0 0024 12a11.9 11.9 0 00-4-10.4A11.9 11.9 0 0016 12a11.9 11.9 0 004 10.4z" fill="#FF5E00"/>
                          </svg>
                        )}
                        <span className="text-[10px] font-semibold tracking-widest uppercase opacity-80 mt-1.5 drop-shadow-sm">Platinum</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Card Button */}
              <button 
                onClick={() => setActiveCardId("add-new")}
                className={`w-[88vw] sm:w-[320px] shrink-0 snap-center aspect-video rounded-2xl relative overflow-hidden group transition-all active:scale-[0.98] ${activeCardId === 'add-new' ? 'ring-2 ring-primary/30 shadow-[0_0_20px_4px_rgba(138,43,226,0.25)]' : ''}`}
              >
                <div className="absolute -left-10 -top-10 w-32 h-32 bg-purple-500/30 rounded-full blur-[40px] group-hover:bg-purple-500/50 transition-colors" />
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-pink-500/30 rounded-full blur-[40px] group-hover:bg-pink-500/50 transition-colors" />
                <div className="absolute inset-0 m-1 rounded-[14px] bg-background/30 dark:bg-white/5 backdrop-blur-xl border border-border/40 shadow-sm group-hover:bg-background/50 dark:group-hover:bg-white/10 transition-colors flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-background/50 dark:bg-white/10 backdrop-blur-2xl border border-border/50 shadow-md flex items-center justify-center group-hover:scale-110 group-hover:bg-background/70 dark:group-hover:bg-white/20 transition-all duration-300">
                    <Plus size={28} className="text-foreground drop-shadow-sm" />
                  </div>
                  <span className="text-sm font-bold text-foreground tracking-widest uppercase drop-shadow-sm">Add New Card</span>
                </div>
              </button>

              {/* Right Spacer */}
              <div className="w-[calc(6vw-16px)] sm:w-[calc(50%-160px-16px)] shrink-0" />
              </div>

              {/* Right Navigation Arrow */}
              {paymentMethods.length > 0 && (
                <button 
                  onClick={() => scrollHorizontally('right')}
                  className="absolute right-6 sm:right-10 top-[40%] -translate-y-1/2 w-10 h-10 rounded-full bg-background/40 dark:bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-xl z-20 hover:bg-background/60 transition-all hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="text-foreground drop-shadow-md ml-[2px]" size={24} />
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {activeCardId === "add-new" ? (
                <motion.div key="add-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="glass-card p-4 space-y-4 rounded-2xl">
                  <h3 className="text-sm font-semibold text-foreground">Add New Credit Card</h3>
                  <div className="space-y-1.5 z-30 relative">
                    <Label htmlFor="new-card-name">Card Name</Label>
                    <div className="relative">
                      <Input
                        id="new-card-name"
                        type="text"
                        autoComplete="off"
                        placeholder="e.g. KAST Virtual"
                        value={newCardName}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onChange={(e) => {
                          setNewCardName(e.target.value);
                          setShowSuggestions(true);
                          if (SUGGESTED_CARDS.some(c => c.name.toLowerCase() === e.target.value.trim().toLowerCase())) {
                            setCustomLogoUrl(null);
                          }
                        }}
                        className="focus-visible:ring-[#8A2BE2] focus-visible:border-[#8A2BE2] transition-all bg-background"
                      />
                      <AnimatePresence>
                        {showSuggestions && newCardName.trim().length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-[#1C1A24] border border-white/10 rounded-xl overflow-hidden z-50 p-1 shadow-2xl"
                          >
                            {SUGGESTED_CARDS.filter(c => c.name.toLowerCase().includes(newCardName.trim().toLowerCase())).length > 0 ? (
                              SUGGESTED_CARDS.filter(c => c.name.toLowerCase().includes(newCardName.trim().toLowerCase())).map((card) => (
                                <div 
                                  key={card.name}
                                  onClick={() => { setNewCardName(card.name); setCustomLogoUrl(card.logoSrc || null); setShowSuggestions(false); }}
                                  className="flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors group"
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0 p-1 ${card.iconColor}`}>
                                    {card.logoSrc ? <img src={card.logoSrc} alt={card.name} className="w-full h-full object-contain" /> : <span className="text-white font-bold text-[15px]">{card.letter}</span>}
                                  </div>
                                  <div className="flex flex-col text-left">
                                    <span className="text-[13px] font-semibold text-white tracking-wide leading-tight">{card.name}</span>
                                    <span className="text-[10px] text-white/50 leading-tight">{card.category}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-center flex flex-col items-center">
                                <span className="text-xs font-medium text-white/70">Custom Card recognized</span>
                                <span className="text-[10px] text-[#8A2BE2] mt-0.5 tracking-wide">Ready for custom logo upload below</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Card Type</Label>
                      <div className="flex gap-2 h-10">
                        <button type="button" onClick={() => setNewCardType('visa')} className={`flex flex-1 items-center justify-center rounded-lg transition-colors border ${newCardType === 'visa' ? 'border-[#1434CB] bg-[#1434CB]/10 text-[#1434CB] dark:text-[#5e7eff] dark:border-[#5e7eff] dark:bg-[#5e7eff]/10' : 'border-border bg-input/50 text-muted-foreground grayscale opacity-60'}`}>
                          <span className="text-[17px] font-black tracking-tighter italic leading-none pt-[1px]">VISA</span>
                        </button>
                        <button type="button" onClick={() => setNewCardType('mastercard')} className={`flex flex-1 items-center justify-center rounded-lg transition-colors border ${newCardType === 'mastercard' ? 'border-[#FF5E00] bg-[#FF5E00]/10' : 'border-border bg-input/50 grayscale opacity-60'}`}>
                          <svg className="h-[20px] w-auto" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="12" fill="#EA001B"/><circle cx="28" cy="12" r="12" fill="#F7A000"/>
                            <path d="M20 22.4A11.9 11.9 0 0024 12a11.9 11.9 0 00-4-10.4A11.9 11.9 0 0016 12a11.9 11.9 0 004 10.4z" fill="#FF5E00"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new-card-last4">Last 4 Digits</Label>
                      <Input id="new-card-last4" type="text" maxLength={4} placeholder="9138" value={newCardLast4}
                        onChange={(e) => setNewCardLast4(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (!newCardName.trim() || newCardLast4.length < 4) return;
                            const updated = [...paymentMethods, { id: Date.now().toString(), type: newCardType, name: newCardName.trim(), last4: newCardLast4, logoUrl: customLogoUrl || undefined }];
                            setPaymentMethods(updated); localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(updated));
                            setNewCardName(""); setNewCardLast4(""); setCustomLogoUrl(null); toast.success("Card added to wallet!");
                          }
                        }}
                      />
                    </div>
                    {showLogoUpload && (
                      <div className="space-y-1.5 col-span-2 animate-in fade-in slide-in-from-top-1 duration-300 pb-1">
                        <Label>Custom Logo</Label>
                        <input type="file" accept="image/*" className="hidden" ref={customLogoInputRef}
                          onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { const url = await processProfileImageFile(file); setCustomLogoUrl(url); } catch { toast.error("Failed to process logo"); } }}
                        />
                        <div onClick={() => customLogoInputRef.current?.click()} className="w-full h-14 rounded-lg border border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-input/50 transition-colors group overflow-hidden relative">
                          {customLogoUrl ? <img src={customLogoUrl} alt="Custom Logo" className="h-8 object-contain z-10 drop-shadow-sm" /> : <div className="flex flex-col items-center text-muted-foreground group-hover:text-foreground transition-colors mt-1"><Upload size={16} className="mb-0.5" /><span className="text-[10px] uppercase font-bold tracking-wider">Upload Logo</span></div>}
                          {customLogoUrl && <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20"><span className="text-xs font-semibold">Change Logo</span></div>}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button type="button" className="w-full mt-2" onClick={() => {
                    if (!newCardName.trim() || newCardLast4.length < 4) { toast.error("Please fill out the name and 4-digit number."); return; }
                    const newId = Date.now().toString();
                    const updated = [...paymentMethods, { id: newId, type: newCardType, name: newCardName.trim(), last4: newCardLast4, logoUrl: customLogoUrl || undefined }];
                    setPaymentMethods(updated); localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(updated));
                    setNewCardName(""); setNewCardLast4(""); setCustomLogoUrl(null);
                    setActiveCardId(newId);
                    toast.success("Card added to wallet!");
                  }}>Add Card</Button>
                </motion.div>
              ) : (() => {
                const activeCard = paymentMethods.find(p => p.id === activeCardId);
                if (!activeCard) return null;
                const oldLabel = `${activeCard.type.charAt(0).toUpperCase() + activeCard.type.slice(1)} ${activeCard.last4}`;
                const newLabel = `${activeCard.name} \u2022\u2022\u2022\u2022 ${activeCard.last4}`;
                const linked = allSubscriptions.filter(s =>
                  s.paymentMethod === oldLabel ||
                  s.paymentMethod === newLabel ||
                  s.paymentMethod === activeCard.name
                );
                return (
                  <motion.div key={`txns-${activeCardId}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="glass-card p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
                      <span className="text-xs text-muted-foreground">{activeCard.name} •••• {activeCard.last4}</span>
                    </div>
                    {linked.length === 0 ? (
                      <div className="flex flex-col items-center py-6 gap-2">
                        <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
                          <CreditCard size={20} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No transactions yet for this card</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {linked.map((s) => (
                          <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.color ?? '#6366f1' }}>
                                {s.logo ? <img src={s.logo} alt={s.name} className="w-6 h-6 object-contain rounded" /> : <span className="text-white font-bold text-sm">{s.name.charAt(0)}</span>}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{s.name}</p>
                                <p className="text-xs text-muted-foreground">{s.renewalDate ? new Date(s.renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-foreground">${s.cost.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="profile-main"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
      <div className="flex flex-col items-center gap-2">
        <div className="w-20 h-20 rounded-full overflow-hidden glow-shadow">
          <img
            src={profilePhotoUrl ?? appLogo}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-lg font-bold text-foreground">{displayName}</h2>
        <p className="text-xs text-muted-foreground text-center px-2">{tagline}</p>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground mb-2">Account Settings</h3>
        {[
          { icon: User, label: "Edit Profile" as const, onClick: openEditProfile },
          { icon: Mail, label: "Change Email" as const, onClick: openChangeEmail },
          { icon: Bell, label: "Notification Settings" as const },
        ].map((item) => (
          <button
            type="button"
            key={item.label}
            onClick={item.onClick}
            className="w-full glass-card px-4 py-3.5 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} className="text-muted-foreground" />
              <span className="text-sm text-foreground">{item.label}</span>
            </div>
            <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground mb-2">Security</h3>
        <div className="glass-card px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-muted-foreground" />
            <span className="text-sm text-foreground">Face ID Verification</span>
          </div>
          <div className="w-10 h-6 bg-primary rounded-full relative">
            <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-primary-foreground rounded-full" />
          </div>
        </div>
        <button className="w-full glass-card px-4 py-3.5 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <Lock size={18} className="text-muted-foreground" />
            <span className="text-sm text-foreground">Change Password</span>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground mb-2">App Settings</h3>
        <button onClick={openPaymentMethods} className="w-full glass-card px-4 py-3.5 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <CreditCard size={18} className="text-muted-foreground" />
            <span className="text-sm text-foreground">Payment Methods</span>
          </div>
          <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
        <div className="glass-card px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <Moon size={18} className="text-muted-foreground" />
            ) : (
              <Sun size={18} className="text-muted-foreground" />
            )}
            <span className="text-sm text-foreground">Theme</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{theme === "dark" ? "Dark" : "Light"}</span>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`w-10 h-6 rounded-full relative transition-colors ${theme === "dark" ? "bg-primary" : "bg-muted-foreground/30"}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-primary-foreground rounded-full transition-transform ${theme === "dark" ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground mb-2">Support</h3>
        <button
          onClick={() => setShowAbout(true)}
          className="w-full glass-card px-4 py-3.5 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Info size={18} className="text-muted-foreground" />
            <span className="text-sm text-foreground">About App</span>
          </div>
          <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </div>

      <button className="w-full border border-border rounded-xl py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        Logout
      </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAbout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAbout(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card p-6 rounded-2xl max-w-sm w-full space-y-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowAbout(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden">
                  <img src={appLogo} alt="App Logo" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-base font-bold text-foreground">About App</h3>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-6">
                <p>
                  This app helps you track all your subscriptions and payments in one place. Stay on top of your
                  recurring expenses, monitor spending trends, and never miss a payment again.
                </p>
                <div className="space-y-1">
                  <p className="text-foreground font-medium">Name : CovTraker</p>
                  <p className="text-foreground font-medium">Version : 1.0</p>
                </div>
              </div>
              <div className="pt-2 border-t border-border space-y-1">
                <p className="text-xs text-muted-foreground text-center">
                  Created by <span className="text-foreground font-semibold">COVITCH C.E.A</span>
                </p>
                <p className="text-xs text-muted-foreground text-center leading-snug">
                  <span className="text-foreground font-semibold">
                    The Last Mischief-maker Of This Century
                  </span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfileScreen;
