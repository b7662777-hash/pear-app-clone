import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Music, Shield, Headphones, Star, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import pearLogo from "@/assets/pear-music-logo.png";

const WELCOME_SEEN_KEY = "pear-music-welcome-seen";

const features = [
  { icon: Headphones, label: "All Music, Unlimited", description: "Stream millions of songs for free" },
  { icon: Sparkles, label: "Ad-Free Experience", description: "No interruptions, pure music" },
  { icon: Shield, label: "Full Security", description: "Your data is safe and encrypted" },
  { icon: Star, label: "Playlists & Favorites", description: "Save and organize your music" },
];

export function WelcomePopup() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const seen = localStorage.getItem(WELCOME_SEEN_KEY);
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(WELCOME_SEEN_KEY, "true");
    setOpen(false);
  };

  const handleSignUp = () => {
    localStorage.setItem(WELCOME_SEEN_KEY, "true");
    setOpen(false);
    navigate("/auth");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader className="text-center items-center space-y-3">
          <img
            src={pearLogo}
            alt="Pear Music"
            className="h-16 w-16 mx-auto"
            width={64}
            height={64}
          />
          <DialogTitle className="text-2xl font-bold">
            Welcome to Pear Music
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Sign up to unlock all features
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleSignUp} className="w-full">
            Sign Up Free
          </Button>
          <Button variant="ghost" onClick={() => {
            localStorage.setItem(WELCOME_SEEN_KEY, "true");
            localStorage.setItem("pear-music-guest-mode", "true");
            setOpen(false);
          }} className="w-full text-muted-foreground">
            Sign up later
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 pt-2">
          Made by <span className="font-semibold text-muted-foreground">Gojo-kun</span>
        </p>
      </DialogContent>
    </Dialog>
  );
}
