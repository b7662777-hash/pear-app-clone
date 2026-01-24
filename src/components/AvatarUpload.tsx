import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null | undefined;
  displayName: string;
  onAvatarUpdated: (newUrl: string) => void;
}

export function AvatarUpload({ userId, currentAvatarUrl, displayName, onAvatarUpdated }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = () => {
    if (displayName) {
      return displayName.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get signed URL for private bucket (1 year expiry)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("avatars")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

      if (signedUrlError) throw signedUrlError;

      const avatarUrl = signedUrlData.signedUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      onAvatarUpdated(avatarUrl);
      toast.success("Avatar updated successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative group">
      <Avatar className="h-16 w-16">
        <AvatarImage src={currentAvatarUrl || undefined} alt={displayName} />
        <AvatarFallback className="bg-primary/20 text-primary font-medium text-lg">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
        aria-label="Upload new avatar"
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 text-white animate-spin" />
        ) : (
          <Camera className="h-5 w-5 text-white" />
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
