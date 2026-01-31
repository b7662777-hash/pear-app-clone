import { ListMusic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlaylists } from "@/hooks/usePlaylists";

export function SidebarPlaylists() {
  const navigate = useNavigate();
  const { playlists } = usePlaylists();

  if (playlists.length === 0) return null;

  return (
    <>
      {playlists.map(playlist => (
        <button 
          key={playlist.id}
          onClick={() => navigate('/library')} 
          className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] transition-all duration-200 text-left group"
        >
          <div className="w-11 h-11 rounded-lg glass-card-premium flex items-center justify-center flex-shrink-0">
            <ListMusic className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-foreground block truncate">{playlist.name}</span>
            <span className="text-xs text-muted-foreground">{playlist.song_count || 0} songs</span>
          </div>
        </button>
      ))}
    </>
  );
}

export default SidebarPlaylists;
