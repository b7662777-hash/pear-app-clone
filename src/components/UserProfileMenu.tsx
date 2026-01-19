import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Trash2, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth, Profile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AvatarUpload } from "./AvatarUpload";

interface UserProfileMenuProps {
  user: { id?: string; email?: string; user_metadata?: { avatar_url?: string; picture?: string } } | null;
  profile: Profile | null;
  onProfileUpdate?: () => void;
}

export function UserProfileMenu({ user, profile, onProfileUpdate }: UserProfileMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const currentAvatarUrl = localAvatarUrl || profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const handleAvatarUpdated = (newUrl: string) => {
    setLocalAvatarUrl(newUrl);
    onProfileUpdate?.();
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
    setIsLoggingOut(false);
    setShowLogoutDialog(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      // Delete profile first (RLS policy allows this)
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

      if (profileError) {
        throw profileError;
      }

      // Sign out user (account deletion requires admin API, so we sign out after deleting profile)
      await signOut();
      
      toast.success("Your profile has been deleted. Contact support to fully remove your account.");
      navigate("/auth");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    return profile?.display_name || user?.email?.split("@")[0] || "User";
  };

  if (!user) {
    return (
      <button
        onClick={() => navigate("/auth")}
        className="ml-2 px-4 py-2 rounded-full bg-[hsl(0,70%,45%)] text-white text-sm font-medium hover:bg-[hsl(0,70%,40%)] transition-colors"
        aria-label="Sign in to your account"
      >
        Sign in
      </button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
            <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
              <AvatarImage 
                src={currentAvatarUrl || undefined} 
                alt={getDisplayName()} 
              />
              <AvatarFallback className="bg-primary/20 text-primary font-medium text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="flex items-center gap-3 p-3">
            {user?.id && (
              <AvatarUpload
                userId={user.id}
                currentAvatarUrl={currentAvatarUrl}
                displayName={getDisplayName()}
                onAvatarUpdated={handleAvatarUpdated}
              />
            )}
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{getDisplayName()}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Account Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your profile
              and remove your data from our servers. Your listening history and
              preferences will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
