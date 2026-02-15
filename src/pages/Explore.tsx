import { useState, lazy, Suspense } from "react";
import { SidebarShell } from "@/components/SidebarShell";
import { SearchBar } from "@/components/SearchBar";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "@/contexts/PlayerContext";
import { Compass, TrendingUp, Music, Radio, Mic2, Headphones } from "lucide-react";

// Lazy load components
const AmbientBackground = lazy(() => import("@/components/AmbientBackground").then((m) => ({ default: m.AmbientBackground })));

const genres = [
{ id: "pop", name: "Pop", color: "from-pink-500 to-rose-500", icon: Music },
{ id: "hiphop", name: "Hip Hop", color: "from-yellow-500 to-orange-500", icon: Mic2 },
{ id: "rock", name: "Rock", color: "from-red-500 to-red-700", icon: Headphones },
{ id: "electronic", name: "Electronic", color: "from-blue-500 to-cyan-500", icon: Radio },
{ id: "rnb", name: "R&B", color: "from-purple-500 to-violet-500", icon: Music },
{ id: "jazz", name: "Jazz", color: "from-amber-500 to-yellow-600", icon: Music },
{ id: "classical", name: "Classical", color: "from-emerald-500 to-green-600", icon: Music },
{ id: "country", name: "Country", color: "from-orange-500 to-amber-600", icon: Music },
{ id: "latin", name: "Latin", color: "from-red-400 to-pink-600", icon: Music },
{ id: "metal", name: "Metal", color: "from-gray-600 to-gray-800", icon: Headphones },
{ id: "indie", name: "Indie", color: "from-teal-500 to-cyan-600", icon: Music },
{ id: "reggae", name: "Reggae", color: "from-green-500 to-yellow-500", icon: Music }];


const moods = [
{ id: "chill", name: "Chill", emoji: "😌" },
{ id: "workout", name: "Workout", emoji: "💪" },
{ id: "focus", name: "Focus", emoji: "🎯" },
{ id: "party", name: "Party", emoji: "🎉" },
{ id: "sleep", name: "Sleep", emoji: "😴" },
{ id: "romantic", name: "Romantic", emoji: "💕" },
{ id: "energize", name: "Energize", emoji: "⚡" },
{ id: "sad", name: "Sad", emoji: "😢" },
{ id: "commute", name: "Commute", emoji: "🚗" },
{ id: "study", name: "Study", emoji: "📚" },
{ id: "cooking", name: "Cooking", emoji: "🍳" },
{ id: "gaming", name: "Gaming", emoji: "🎮" }];


const Explore = () => {
  const [activeTab, setActiveTab] = useState("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { currentTrack } = usePlayer();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "home") navigate("/");
    if (tab === "library") navigate("/library");
  };

  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden relative">
      {/* Global Ambient Background */}
      <Suspense fallback={null}>
        <AmbientBackground />
      </Suspense>

      <SidebarShell activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <main className="flex-1 overflow-y-auto px-3 pb-16 md:pb-24 md:px-[75px]">
          {/* Header */}
          <div className="mb-8">
            <div className="gap-3 mb-2 flex items-center justify-center px-0">
              <Compass className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Explore</h1>
            </div>
            <p className="text-muted-foreground font-sans px-[375px] mx-0 pl-[350px] text-center">Discover new music and artists</p>
          </div>

          {/* Trending Section */}
          <section className="mb-10 rounded-2xl bg-[#1a1a1a]/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Trending Now</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {["Top 50 Global", "Viral Hits", "New Music Friday", "Discover Weekly", "Hot Hits", "Chill Vibes"].map((item, i) =>
              <div
                key={item}
                className="relative group cursor-pointer rounded-xl overflow-hidden aspect-square bg-gradient-to-br from-primary/30 to-primary/10 hover:brightness-110 transition-all">

                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-center px-4">{item}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Browse by Genre */}
          <section className="mb-10 rounded-2xl bg-[#1a1a1a]/30 p-5">
            <h2 className="text-xl font-semibold mb-4">Browse by Genre</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {genres.map((genre) =>
              <div
                key={genre.id}
                className={`relative group cursor-pointer rounded-xl overflow-hidden aspect-[2/1] bg-gradient-to-br ${genre.color} hover:brightness-110 transition-all`}>

                  <div className="absolute inset-0 flex items-center justify-between p-4">
                    <span className="text-lg font-bold text-white">{genre.name}</span>
                    <genre.icon className="w-8 h-8 text-white/70" />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Browse by Mood */}
          <section className="mb-10 rounded-2xl bg-[#1a1a1a]/30 p-5">
            <h2 className="text-xl font-semibold mb-4">Browse by Mood</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {moods.map((mood) =>
              <button
                key={mood.id}
                className="w-full px-4 py-3 rounded-full bg-[#1a1a1a] hover:bg-[#252525] transition-colors flex items-center justify-center gap-2">

                  <span className="text-xl">{mood.emoji}</span>
                  <span className="font-medium">{mood.name}</span>
                </button>
              )}
            </div>
          </section>

          {/* Charts */}
          <section className="mb-10 rounded-2xl bg-[#1a1a1a]/30 p-5">
            <h2 className="text-xl font-semibold mb-4">Charts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {["Top Songs", "Top Artists", "Top Albums", "Top Podcasts"].map((chart) =>
              <div
                key={chart}
                className="p-6 rounded-xl bg-[#1a1a1a] hover:bg-[#252525] transition-colors cursor-pointer">

                  <h3 className="font-semibold mb-2">{chart}</h3>
                  <p className="text-sm text-muted-foreground">Updated daily</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>);

};

export default Explore;