import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Loader2, Shield, Zap, Network, Eye } from "lucide-react";

/**
 * Baltimore Smart City Landing Page
 * Features:
 * - Video background with b-roll overlay
 * - Pre-filled admin credentials
 * - Baltimore branding with flag colors
 * - Smooth transitions and animations
 */
export default function Landing() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("admin@visium.com");
  const [password, setPassword] = useState("Baltimore2025");
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (user && !loading) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would trigger OAuth flow
    // For demo, we'll just redirect to dashboard
    setLocation("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-black/90 z-10" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? "opacity-30" : "opacity-0"
          }`}
          onLoadedData={() => setVideoLoaded(true)}
        >
          {/* Placeholder for b-roll video - user will provide actual video */}
          <source src="/videos/baltimore-city-broll.mp4" type="video/mp4" />
        </video>
        {/* Fallback gradient background if video doesn't load */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      </div>

      {/* Content */}
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Baltimore</h1>
              <p className="text-xs text-muted-foreground">Smart City Initiative</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Branding */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <h2 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Baltimore
                  <br />
                  <span className="text-primary">Smart City</span>
                  <br />
                  Command Center
                </h2>
                <p className="text-xl text-muted-foreground max-w-xl">
                  Real-time monitoring and analytics for Baltimore's intelligent infrastructure powered by Visium Technologies, WWT, and Ubicquia
                </p>
              </div>

              {/* Features */}
              <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50 backdrop-blur">
                  <Zap className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm">Real-Time Monitoring</h3>
                    <p className="text-xs text-muted-foreground">Live device status and alerts</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50 backdrop-blur">
                  <Network className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm">Network Analytics</h3>
                    <p className="text-xs text-muted-foreground">Comprehensive insights</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50 backdrop-blur">
                  <Eye className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm">Advanced Visualization</h3>
                    <p className="text-xs text-muted-foreground">Interactive maps and charts</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-card/50 backdrop-blur">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm">Cybersecurity</h3>
                    <p className="text-xs text-muted-foreground">TruContext protection</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Card */}
            <div className="flex justify-center lg:justify-end">
              <Card className="w-full max-w-md p-8 glass-gold golden-glow">
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold">Welcome Back</h3>
                    <p className="text-sm text-muted-foreground">
                      Sign in to access the command center
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@visium.com"
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="bg-background/50"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full golden-glow-hover transition-all duration-300"
                      size="lg"
                    >
                      Enter Dashboard
                    </Button>
                  </form>

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Demo Credentials Pre-filled
                      <br />
                      <span className="text-primary">admin@visium.com / Baltimore2025</span>
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">Powered by:</span>
            </div>
            <span>Visium Technologies</span>
            <span>•</span>
            <span>World Wide Technology</span>
            <span>•</span>
            <span>Ubicquia</span>
          </div>
        </footer>
      </div>

      {/* Animated particles effect (optional enhancement) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-primary/20 animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 rounded-full bg-primary/30 animate-pulse delay-100" />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-primary/25 animate-pulse delay-200" />
      </div>
    </div>
  );
}
