import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";

import { AvatarUpload } from "@/components/AvatarUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Display name must be at least 2 characters")
  .max(50, "Display name must be less than 50 characters");

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading, updateProfile, fetchProfile } = useAuth();

  const defaultName = useMemo(() => {
    if (profile?.display_name) return profile.display_name;
    if (user?.email) return user.email.split("@")[0] || "";
    return "";
  }, [profile?.display_name, user?.email]);

  const [displayName, setDisplayName] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!dirty) setDisplayName(defaultName);
  }, [defaultName, dirty]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading…</div>
      </main>
    );
  }

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = displayNameSchema.safeParse(displayName);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid display name");
      return;
    }

    setSaving(true);
    const { error: updateError } = await updateProfile({ display_name: parsed.data });

    if (updateError) {
      toast({
        title: "Update failed",
        description: updateError.message,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    toast({ title: "Profile updated" });
    setDirty(false);
    setSaving(false);
  };

  const storedAvatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const currentAvatarUrl = localAvatarUrl || storedAvatarUrl;

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto w-full max-w-xl px-4 py-8">
        <header className="mb-6 flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Profile</h1>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <AvatarUpload
                userId={user.id}
                currentAvatarUrl={currentAvatarUrl}
                displayName={defaultName || "User"}
                onAvatarUpdated={(newUrl) => {
                  setLocalAvatarUrl(newUrl);
                  fetchProfile(user.id, user.user_metadata);
                }}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{defaultName || "User"}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => {
                    setDirty(true);
                    setDisplayName(e.target.value);
                  }}
                  placeholder="Your name"
                  disabled={saving}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving || !dirty}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
