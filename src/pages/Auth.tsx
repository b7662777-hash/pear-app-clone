import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff, Chrome, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Separator } from '@/components/ui/separator';
import { isPasswordBreached, formatBreachCount } from '@/lib/passwordSecurity';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import pearLogo from '@/assets/pear-music-logo.png';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const displayNameSchema = z.string().min(2, 'Display name must be at least 2 characters').max(50, 'Display name must be less than 50 characters').optional();

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signUp, signInWithGoogle } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupDisplayName, setSignupDisplayName] = useState('');

  const [loginErrors, setLoginErrors] = useState<{email?: string; password?: string}>({});
  const [signupErrors, setSignupErrors] = useState<{email?: string; password?: string; displayName?: string}>({});
  const [passwordBreachWarning, setPasswordBreachWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});

    const emailResult = emailSchema.safeParse(loginEmail);
    const passwordResult = passwordSchema.safeParse(loginPassword);

    if (!emailResult.success || !passwordResult.success) {
      setLoginErrors({
        email: emailResult.success ? undefined : emailResult.error.errors[0].message,
        password: passwordResult.success ? undefined : passwordResult.error.errors[0].message,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        let message = 'Failed to sign in';
        if (error.message.includes('Invalid login credentials')) {
          message = 'Invalid email or password';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'Please verify your email before signing in';
        }
        toast({ title: 'Sign in failed', description: message, variant: 'destructive' });
      } else {
        toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });
        // Use window.location for reliable redirect after auth
        window.location.href = '/';
        return;
      }
    } catch (err) {
      console.error('[Auth] Sign in error:', err);
      toast({ title: 'Sign in failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});
    setPasswordBreachWarning(null);

    const emailResult = emailSchema.safeParse(signupEmail);
    const passwordResult = passwordSchema.safeParse(signupPassword);
    const displayNameResult = signupDisplayName ? displayNameSchema.safeParse(signupDisplayName) : { success: true };

    if (!emailResult.success || !passwordResult.success || !displayNameResult.success) {
      setSignupErrors({
        email: emailResult.success ? undefined : emailResult.error.errors[0].message,
        password: passwordResult.success ? undefined : passwordResult.error.errors[0].message,
        displayName: displayNameResult.success ? undefined : (displayNameResult as any).error.errors[0].message,
      });
      return;
    }

    setIsSubmitting(true);

    const breachResult = await isPasswordBreached(signupPassword);
    if (breachResult.breached) {
      setPasswordBreachWarning(
        `This password has been found in ${formatBreachCount(breachResult.count)} data breaches. Please choose a different password for your security.`
      );
      setIsSubmitting(false);
      return;
    }

    const { error } = await signUp(signupEmail, signupPassword, signupDisplayName || undefined);

    if (error) {
      let message = 'Failed to create account';
      if (error.message.includes('already registered')) {
        message = 'This email is already registered. Try signing in instead.';
      } else if (error.message.includes('Password')) {
        message = error.message;
      }
      toast({ title: 'Sign up failed', description: message, variant: 'destructive' });
    } else {
      toast({ title: 'Account created!', description: 'Welcome to Pear Music.' });
      window.location.href = '/';
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img
              src={pearLogo}
              alt="Pear Music"
              className="h-16 w-16"
              width={64}
              height={64}
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Pear Music</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to save your playlists and favorites
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="login-email" type="email" placeholder="your@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pl-9" disabled={isSubmitting} />
                  </div>
                  {loginErrors.email && <p className="text-sm text-destructive">{loginErrors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-9 pr-9" disabled={isSubmitting} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginErrors.password && <p className="text-sm text-destructive">{loginErrors.password}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">or</span>
                </div>

                <Button type="button" variant="outline" className="w-full" onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    const result = await lovable.auth.signInWithOAuth("google", {
                      redirect_uri: window.location.origin,
                    });
                    if (result.error) {
                      toast({ title: 'Google sign in failed', description: String(result.error), variant: 'destructive' });
                    }
                    if (result.redirected) return;
                    window.location.href = '/';
                  } catch (err) {
                    toast({ title: 'Google sign in failed', description: 'An unexpected error occurred.', variant: 'destructive' });
                  } finally {
                    setIsSubmitting(false);
                  }
                }} disabled={isSubmitting}>
                  <Chrome className="mr-2 h-4 w-4" />
                  Continue with Google
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Display Name (optional)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-name" type="text" placeholder="Your Name" value={signupDisplayName} onChange={(e) => setSignupDisplayName(e.target.value)} className="pl-9" disabled={isSubmitting} />
                  </div>
                  {signupErrors.displayName && <p className="text-sm text-destructive">{signupErrors.displayName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-email" type="email" placeholder="your@email.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="pl-9" disabled={isSubmitting} />
                  </div>
                  {signupErrors.email && <p className="text-sm text-destructive">{signupErrors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="pl-9 pr-9" disabled={isSubmitting} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {signupErrors.password && <p className="text-sm text-destructive">{signupErrors.password}</p>}
                  {passwordBreachWarning && (
                    <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-destructive">{passwordBreachWarning}</p>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account...' : 'Create Account'}
                </Button>

                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">or</span>
                </div>

                <Button type="button" variant="outline" className="w-full" onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    const result = await lovable.auth.signInWithOAuth("google", {
                      redirect_uri: window.location.origin,
                    });
                    if (result.error) {
                      toast({ title: 'Google sign up failed', description: String(result.error), variant: 'destructive' });
                    }
                    if (result.redirected) return;
                    window.location.href = '/';
                  } catch (err) {
                    toast({ title: 'Google sign up failed', description: 'An unexpected error occurred.', variant: 'destructive' });
                  } finally {
                    setIsSubmitting(false);
                  }
                }} disabled={isSubmitting}>
                  <Chrome className="mr-2 h-4 w-4" />
                  Continue with Google
                </Button>
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground/60 mt-6">
            Made by <span className="font-semibold text-muted-foreground">Gojo-kun</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
