"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { loginUser, clearError } from '@/store/slices/authSlice';
import { toggleThemeWithTransition } from '@/lib/theme-transition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Sun, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import logo from '@/assets/Sahel Jeddah Logo 2.png';

export function LoginForm() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ phone?: string; password?: string }>({});
  const [loginSuccess, setLoginSuccess] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.theme);
  const { toast } = useToast();

  useEffect(() => {
    const savedPhone = localStorage.getItem('rememberedPhone');
    const rememberMeStatus = localStorage.getItem('rememberMe') === 'true';

    if (rememberMeStatus && savedPhone) {
      setPhone(savedPhone);
      setRememberMe(true);
    }

    localStorage.removeItem('rememberedPassword');
  }, []);

  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [phone, password]);

  useEffect(() => {
    if (loginSuccess) {
      const timer = setTimeout(() => {
        router.replace('/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess, router]);

  const validate = useCallback((): boolean => {
    const errors: { phone?: string; password?: string } = {};

    if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [phone, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    dispatch(clearError());

    try {
      await dispatch(loginUser({ phone: phone.replace(/^0/, ''), password })).unwrap();

      if (rememberMe) {
        localStorage.setItem('rememberedPhone', phone);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedPhone');
        localStorage.removeItem('rememberMe');
      }

      setLoginSuccess(true);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: typeof err === 'string' ? err : "Incorrect phone number or password",
      });
    }
  };

  const handleToggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    toggleThemeWithTransition(e, dispatch);
  };

  const handleRememberMeChange = (checked: boolean | string) => {
    const isChecked = checked === true;
    setRememberMe(isChecked);

    if (!isChecked) {
      localStorage.removeItem('rememberedPhone');
      localStorage.removeItem('rememberMe');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
    if (validationErrors.phone) {
      setValidationErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (validationErrors.password) {
      setValidationErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-surface to-muted overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-10 rounded-full"
        onClick={handleToggleTheme}
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>

      <div
        className={`w-full max-w-md transition-all duration-700 ease-in-out ${loginSuccess
          ? 'opacity-0 scale-95 blur-sm pointer-events-none absolute'
          : 'opacity-100 scale-100'
          }`}
      >
        <Card className="shadow-2xl border-border/50 backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-24 h-24 flex items-center justify-center mb-2">
              <Image
                src={logo}
                alt="Sahel Jeddah Logo"
                width={100}
                height={100}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to Sahel Jeddah Dashboard
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`h-11 ${validationErrors.phone ? 'border-destructive' : ''}`}
                  placeholder="078xxxxxxxx"
                  required
                  autoFocus
                  autoComplete="tel"
                  disabled={isLoading}
                />
                {validationErrors.phone && (
                  <p className="text-sm text-destructive">{validationErrors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    className={`h-11 pr-10 ${validationErrors.password ? 'border-destructive' : ''}`}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-destructive">{validationErrors.password}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-1 pb-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={handleRememberMeChange}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Remember me
                </Label>
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-base transition-all hover:scale-[1.01]"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {loginSuccess && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              <div className="absolute inset-0 w-36 h-36 -m-2 rounded-full bg-primary/20 success-ping" />
              <div className="w-32 h-32 flex items-center justify-center success-logo-enter">
                <Image
                  src={logo}
                  alt="Sahel Jeddah Logo"
                  width={140}
                  height={140}
                  className="object-contain w-full h-full drop-shadow-lg"
                  priority
                />
              </div>
              <div className="absolute -bottom-1 -right-1 success-check">
                <div className="bg-green-500 rounded-full p-1.5 shadow-lg shadow-green-500/30">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="text-center success-text">
              <h2 className="text-2xl font-bold text-foreground">Welcome Back!</h2>
              <p className="text-sm text-muted-foreground mt-2">Preparing your dashboard...</p>
            </div>

            <div className="w-56 h-1.5 bg-muted rounded-full overflow-hidden success-bar">
              <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full success-bar-fill" />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .success-logo-enter {
          animation: logoEnter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .success-ping {
          animation: pingRing 1s ease-out 0.3s forwards;
          opacity: 0;
        }
        .success-check {
          animation: checkPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
        }
        .success-text {
          animation: textSlide 0.5s ease-out 0.4s both;
        }
        .success-bar {
          animation: barFade 0.3s ease-out 0.6s both;
        }
        .success-bar-fill {
          animation: barProgress 1.2s ease-in-out 0.7s forwards;
          width: 0%;
        }

        @keyframes logoEnter {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pingRing {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes checkPop {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes textSlide {
          0% { transform: translateY(12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes barFade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes barProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
