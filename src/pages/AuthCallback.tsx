import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Music } from 'lucide-react';

export default function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const errorParam = url.searchParams.get('error');

        if (errorParam) {
          console.error('OAuth error:', errorParam, url.searchParams.get('error_description'));
          window.location.href = '/auth';
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Session exchange error:', error);
            window.location.href = '/auth';
            return;
          }
        }

        // Check if we already have a session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          window.location.href = '/';
          return;
        }

        window.location.href = '/auth';
      } catch (error) {
        console.error('Callback error:', error);
        window.location.href = '/auth';
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="p-4 rounded-full bg-primary/10 mb-4 animate-pulse">
        <Music className="h-10 w-10 text-primary" />
      </div>
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
