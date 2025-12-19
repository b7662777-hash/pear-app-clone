import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SearchBar } from "@/components/SearchBar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Library as LibraryIcon, Heart, Clock, ListMusic, Plus, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

const playlists = [
  { id: "liked", name: "Liked Songs", count: 0, icon: Heart, color: "bg-gradient-to-br from-purple-600 to-blue-500" },
  { id: "recent", name: "Recently Played", count: 0, icon: Clock, color: "bg-gradient-to-br from-green-600 to-emerald-500" },
];

const Library = () => {
  const [activeTab, setActiveTab] = useState("library");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "home") navigate("/");
    if (tab === "explore") navigate("/explore");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <main className="flex-1 overflow-y-auto px-6 pb-24">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <LibraryIcon className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Your Library</h1>
            </div>
            <p className="text-muted-foreground">Your music collection</p>
          </div>

          {!user && !loading ? (
            /* Not signed in state */
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                <Music className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Sign in to see your library</h2>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Create playlists, save songs, and see your listening history
              </p>
              <Button onClick={() => navigate("/auth")} className="rounded-full px-8">
                Sign in
              </Button>
            </div>
          ) : (
            <>
              {/* Quick Access */}
              <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <div className={`w-14 h-14 rounded-lg ${playlist.color} flex items-center justify-center`}>
                        <playlist.icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{playlist.name}</h3>
                        <p className="text-sm text-muted-foreground">{playlist.count} songs</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Playlists */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Playlists</h2>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Playlist
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {/* Empty state */}
                  <div className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors">
                    <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">New Playlist</span>
                  </div>
                </div>
              </section>

              {/* Artists */}
              <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Artists</h2>
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <p>Artists you follow will appear here</p>
                </div>
              </section>

              {/* Albums */}
              <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Albums</h2>
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <p>Albums you save will appear here</p>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Library;