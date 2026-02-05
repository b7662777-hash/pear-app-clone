 import { useState, useEffect, useRef } from "react";
 import { usePlayer } from "@/contexts/PlayerContext";
import { useYouTubeMusic, SyncedLyricLine, LyricsData } from "@/hooks/useYouTubeMusic";
 import { cn } from "@/lib/utils";
 import { Play, Music } from "lucide-react";
 import { optimizeImageUrl } from "@/lib/imageUtils";
 
 type Tab = "upnext" | "lyrics" | "related";
 
 export function RightPanel() {
   const { currentTrack, queue, playTrack, currentTime, seekTo } = usePlayer();
   const [activeTab, setActiveTab] = useState<Tab>("upnext");
   const { fetchSyncedLyrics } = useYouTubeMusic();
   const [lyrics, setLyrics] = useState<SyncedLyricLine[]>([]);
   const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
   const lyricsContainerRef = useRef<HTMLDivElement>(null);
   const activeLineRef = useRef<HTMLDivElement>(null);
 
   // Fetch lyrics when track changes
   useEffect(() => {
     if (currentTrack && activeTab === "lyrics") {
       setIsLoadingLyrics(true);
       fetchSyncedLyrics(currentTrack.title, currentTrack.artist)
        .then((result: LyricsData | undefined[] | undefined) => {
          if (result && 'lyrics' in result && result.lyrics) {
            setLyrics(result.lyrics);
          } else {
            setLyrics([]);
          }
         })
         .finally(() => setIsLoadingLyrics(false));
     }
  }, [currentTrack?.id, activeTab, fetchSyncedLyrics, currentTrack?.title, currentTrack?.artist]);
 
   // Find active lyric line
   const activeIndex = lyrics.findIndex((line, index) => {
     const nextLine = lyrics[index + 1];
     return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
   });
 
   // Auto-scroll to active line
   useEffect(() => {
     if (activeLineRef.current && lyricsContainerRef.current) {
       const container = lyricsContainerRef.current;
       const activeLine = activeLineRef.current;
       
       const containerRect = container.getBoundingClientRect();
       const lineRect = activeLine.getBoundingClientRect();
       
       const scrollOffset = lineRect.top - containerRect.top - containerRect.height / 3;
       
       container.scrollTo({
         top: container.scrollTop + scrollOffset,
         behavior: "smooth",
       });
     }
   }, [activeIndex]);
 
   if (!currentTrack) return null;
 
   // Get current track index in queue
   const currentIndex = queue.findIndex(t => t.videoId === currentTrack.videoId);
   const upNextTracks = queue.slice(currentIndex + 1, currentIndex + 6);
 
   return (
     <div className="w-80 h-full flex flex-col bg-[#0f0f0f] border-l border-white/[0.08]">
       {/* Tabs */}
       <div className="flex border-b border-white/[0.08]">
         {(["upnext", "lyrics", "related"] as Tab[]).map((tab) => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={cn(
               "flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors",
               activeTab === tab
                 ? "text-white border-b-2 border-white"
                 : "text-white/50 hover:text-white/70"
             )}
           >
             {tab === "upnext" ? "UP NEXT" : tab.toUpperCase()}
           </button>
         ))}
       </div>
 
       {/* Content */}
       <div className="flex-1 overflow-hidden">
         {/* UP NEXT Tab */}
         {activeTab === "upnext" && (
           <div className="h-full overflow-y-auto p-4 space-y-2">
             {upNextTracks.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-white/40">
                 <Music className="w-12 h-12 mb-3" />
                 <p className="text-sm">No tracks in queue</p>
               </div>
             ) : (
               upNextTracks.map((track, index) => (
                 <div
                   key={`${track.videoId}-${index}`}
                   onClick={() => playTrack(track, queue)}
                   className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.08] cursor-pointer group transition-colors"
                 >
                   <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                     <img
                       src={optimizeImageUrl(track.image, 80)}
                       alt={track.title}
                       className="w-full h-full object-cover"
                     />
                     <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Play className="w-4 h-4 text-white fill-white" />
                     </div>
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium text-white truncate">{track.title}</p>
                     <p className="text-xs text-white/50 truncate">{track.artist}</p>
                   </div>
                 </div>
               ))
             )}
           </div>
         )}
 
         {/* LYRICS Tab */}
         {activeTab === "lyrics" && (
           <div ref={lyricsContainerRef} className="h-full overflow-y-auto p-6">
             {isLoadingLyrics ? (
               <div className="flex items-center justify-center h-full">
                 <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
               </div>
             ) : lyrics.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-white/40">
                 <Music className="w-12 h-12 mb-3" />
                 <p className="text-sm">No lyrics available</p>
               </div>
             ) : (
               <div className="space-y-6 pb-20">
                 {lyrics.map((line, index) => {
                   const isActive = index === activeIndex;
                   const isPast = index < activeIndex;
                   
                   return (
                     <div
                       key={`${line.time}-${index}`}
                       ref={isActive ? activeLineRef : null}
                       onClick={() => seekTo(line.time)}
                       className={cn(
                         "text-xl font-semibold leading-relaxed cursor-pointer transition-all duration-300 text-left",
                         isActive && "text-white text-2xl",
                         isPast && "text-white/30",
                         !isActive && !isPast && "text-white/50 hover:text-white/70"
                       )}
                     >
                       {line.text || "♪"}
                     </div>
                   );
                 })}
               </div>
             )}
           </div>
         )}
 
         {/* RELATED Tab */}
         {activeTab === "related" && (
           <div className="h-full overflow-y-auto p-4 space-y-2">
             {queue.slice(0, 10).map((track, index) => (
               <div
                 key={`related-${track.videoId}-${index}`}
                 onClick={() => playTrack(track, queue)}
                 className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.08] cursor-pointer group transition-colors"
               >
                 <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                   <img
                     src={optimizeImageUrl(track.image, 80)}
                     alt={track.title}
                     className="w-full h-full object-cover"
                   />
                   <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Play className="w-4 h-4 text-white fill-white" />
                   </div>
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium text-white truncate">{track.title}</p>
                   <p className="text-xs text-white/50 truncate">{track.artist}</p>
                 </div>
               </div>
             ))}
           </div>
         )}
       </div>
     </div>
   );
 }
 
 export default RightPanel;