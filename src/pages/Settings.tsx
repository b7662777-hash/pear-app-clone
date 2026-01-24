import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Settings as SettingsIcon, Radio, Music2, Webhook, ExternalLink, Check, X, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { AmbientBackground } from '@/components/AmbientBackground';
import { Sidebar } from '@/components/Sidebar';

// Discord webhook integration
function DiscordIntegration() {
  const [enabled, setEnabled] = useState(() => {
    const stored = localStorage.getItem('discord_settings');
    return stored ? JSON.parse(stored).enabled : false;
  });
  const [webhookUrl, setWebhookUrl] = useState(() => {
    const stored = localStorage.getItem('discord_settings');
    return stored ? JSON.parse(stored).webhookUrl || '' : '';
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleSave = async () => {
    if (enabled && webhookUrl) {
      setTesting(true);
      setTestResult(null);
      
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '✅ Connected to Music App',
              description: 'Now Playing updates will appear here!',
              color: 0x1DB954,
              timestamp: new Date().toISOString(),
            }],
          }),
        });

        if (response.ok) {
          setTestResult('success');
          localStorage.setItem('discord_settings', JSON.stringify({ enabled, webhookUrl }));
          toast.success('Discord webhook connected!');
        } else {
          setTestResult('error');
          toast.error('Invalid webhook URL');
        }
      } catch {
        setTestResult('error');
        toast.error('Failed to connect webhook');
      }
      
      setTesting(false);
    } else {
      localStorage.setItem('discord_settings', JSON.stringify({ enabled: false, webhookUrl: null }));
      toast.success('Discord integration disabled');
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#5865F2] flex items-center justify-center">
            <Webhook className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Discord Webhook</CardTitle>
            <CardDescription>Share now playing to a Discord channel</CardDescription>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) => {
              setEnabled(checked);
              if (!checked) {
                localStorage.setItem('discord_settings', JSON.stringify({ enabled: false, webhookUrl: null }));
              }
            }}
          />
        </div>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="bg-background/50"
            />
            <p className="text-xs text-muted-foreground">
              Create a webhook in your Discord server settings → Integrations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={testing || !webhookUrl}>
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Save & Test'
              )}
            </Button>
            {testResult === 'success' && <Check className="w-5 h-5 text-green-500" />}
            {testResult === 'error' && <X className="w-5 h-5 text-red-500" />}
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-sm">
            <Info className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <p className="text-muted-foreground">
              This sends "Now Playing" embeds to your Discord channel. For true Discord Rich Presence, 
              the app needs to run as a desktop application.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Last.fm integration
function LastFmIntegration() {
  const [searchParams] = useSearchParams();
  const [settings, setSettings] = useState(() => {
    const stored = localStorage.getItem('lastfm_settings');
    return stored ? JSON.parse(stored) : { enabled: false, sessionKey: null, username: null };
  });
  const [connecting, setConnecting] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    if (token && !settings.sessionKey) {
      handleCallback(token);
    }
  }, [searchParams]);

  const handleConnect = () => {
    setConnecting(true);
    // Redirect to Last.fm auth
    const apiKey = 'YOUR_LASTFM_API_KEY'; // This should come from edge function
    const callbackUrl = `${window.location.origin}/settings`;
    window.location.href = `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${encodeURIComponent(callbackUrl)}`;
  };

  const handleCallback = async (token: string) => {
    // In a real implementation, this would call the edge function
    // For now, we'll show a placeholder
    toast.info('Last.fm integration requires API keys. Add LASTFM_API_KEY and LASTFM_SHARED_SECRET to your backend secrets.');
    setConnecting(false);
  };

  const handleDisconnect = () => {
    setSettings({ enabled: false, sessionKey: null, username: null });
    localStorage.setItem('lastfm_settings', JSON.stringify({ enabled: false, sessionKey: null, username: null }));
    toast.success('Disconnected from Last.fm');
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D51007] flex items-center justify-center">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Last.fm Scrobbling</CardTitle>
            <CardDescription>Track your listening history</CardDescription>
          </div>
          {settings.username ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-500 flex items-center gap-1">
                <Check className="w-4 h-4" />
                {settings.username}
              </span>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.username ? (
          <>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Connected as <strong>{settings.username}</strong></span>
              </div>
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="scrobble-toggle">Enable Scrobbling</Label>
              <Switch
                id="scrobble-toggle"
                checked={settings.enabled}
                onCheckedChange={(checked) => {
                  const newSettings = { ...settings, enabled: checked };
                  setSettings(newSettings);
                  localStorage.setItem('lastfm_settings', JSON.stringify(newSettings));
                }}
              />
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Connect your Last.fm account to automatically scrobble tracks as you listen.
            </p>
            <Button onClick={handleConnect} disabled={connecting} className="gap-2">
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Connect Last.fm
                </>
              )}
            </Button>
          </>
        )}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-sm">
          <Info className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
          <p className="text-muted-foreground">
            Tracks are scrobbled after 50% playback or 4 minutes, following Last.fm guidelines.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Media Session settings
function MediaSessionSettings() {
  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem('media_session_enabled') !== 'false';
  });

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    localStorage.setItem('media_session_enabled', String(checked));
    toast.success(checked ? 'Media keys enabled' : 'Media keys disabled');
  };

  const isSupported = 'mediaSession' in navigator;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Music2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Media Keys</CardTitle>
            <CardDescription>Control playback with keyboard media keys</CardDescription>
          </div>
          <Switch
            checked={enabled && isSupported}
            onCheckedChange={handleToggle}
            disabled={!isSupported}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isSupported ? (
          <p className="text-sm text-muted-foreground">
            Use your keyboard's Play/Pause, Next, and Previous keys to control music playback. 
            Works with system media controls on Windows, macOS, and Linux.
          </p>
        ) : (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-sm">
            <X className="w-4 h-4 mt-0.5 text-destructive flex-shrink-0" />
            <p className="text-destructive">
              Media Session API is not supported in your browser.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div className="min-h-screen bg-background text-foreground flex relative overflow-hidden">
      <AmbientBackground />
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
          </div>

          {/* Integrations */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Integrations</h2>
            <div className="space-y-4">
              <MediaSessionSettings />
              <LastFmIntegration />
              <DiscordIntegration />
            </div>
          </section>

          <Separator className="bg-border/50" />

          {/* About */}
          <section>
            <h2 className="text-lg font-semibold mb-4">About</h2>
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Inspired by <strong>th-ch/YouTube Music Desktop</strong></p>
                  <p>Features: YouTube Music playback, synced lyrics, ambient mode, downloads, and social integrations.</p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-2"
                    >
                      <a href="https://github.com/th-ch/youtube-music" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        View Original Project
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
