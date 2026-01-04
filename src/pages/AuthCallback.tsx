import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Music } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const errorParam = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        if (errorParam) {
          console.error('OAuth error:', errorParam, errorDescription);
          navigate('/auth', { replace: true });
          return;
        }

        if (code) {
          // Exchange code for session (PKCE flow)
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Session exchange error:', error);
            navigate('/auth', { replace: true });
            return;
          }
        }

        // Check if we already have a session (hash fragment flow)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/', { replace: true });
          return;
        }

        // No code and no session, redirect to auth
        navigate('/auth', { replace: true });
      } catch (error) {
        console.error('Callback error:', error);
        navigate('/auth', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="p-4 rounded-full bg-primary/10 mb-4 animate-pulse">
        <Music className="h-10 w-10 text-primary" />
      </div>
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
