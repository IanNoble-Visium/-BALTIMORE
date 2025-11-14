import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { Loader2, Shield, Zap, Network, Eye } from "lucide-react";

/**
 * Baltimore Smart City Landing Page
 * Features:
 * - Video background with b-roll overlay
 * - Pre-filled admin credentials
 * - Baltimore branding with flag colors
 * - Smooth transitions and animations
 */
const VIDEO_SOURCES: string[] = [
  "/videos/_10_smart_202511140241_zlw1p.mp4",
  "/videos/_11_baltimore_202511140241_hvabn.mp4",
  "/videos/_12_data_202511140241_tse26.mp4",
  "/videos/_13_camden_202511140241_a0g2m.mp4",
  "/videos/_14_streetlevel_202511140241_qx0vh.mp4",
  "/videos/_15_digital_202511140242_pe6zz.mp4",
  "/videos/_16_network_202511140242_b0dr5.mp4",
  "/videos/_17_smart_202511140242_7p29c.mp4",
  "/videos/_18_traffic_202511140242_173ta.mp4",
  "/videos/_19_sensor_202511140242_2pfv9.mp4",
  "/videos/_1_baltimore_202511140217_duiow.mp4",
  "/videos/_1_baltimore_202511140217_dztg9.mp4",
  "/videos/_20_city_202511140242_l8b24.mp4",
  "/videos/_21_emergency_202511140242_7u9pc.mp4",
  "/videos/_22_weather_202511140242_1ysz1.mp4",
  "/videos/_23_pedestrian_202511140242_6sgt5.mp4",
  "/videos/_23_pedestrian_202511140242_jlzd7.mp4",
  "/videos/_24_infrastructure_202511140242_9c9bh.mp4",
  "/videos/_25_network_202511140242_ri4ye.mp4",
  "/videos/_26_solar_202511140242_gfnim.mp4",
  "/videos/_27_realtime_202511140242_9x8vs.mp4",
  "/videos/_28_maintenance_202511140242_n34ls.mp4",
  "/videos/_29_thermal_202511140242_8vk6c.mp4",
  "/videos/_2_baltimore_202511140217_ti1bm.mp4",
  "/videos/_2_baltimore_202511140217_zhlsy.mp4",
  "/videos/_30_5g_202511140242_eb7tk.mp4",
  "/videos/_31_city_202511140243_toeum.mp4",
  "/videos/_33_smart_202511140243_d72v0.mp4",
  "/videos/_33_smart_202511140301_urpjg.mp4",
  "/videos/_34_power_202511140301_zylns.mp4",
  "/videos/_35_community_202511140301_yqw76.mp4",
  "/videos/_36_ubicell_202511140301_0lw20.mp4",
  "/videos/_37_device_202511140301_chosg.mp4",
  "/videos/_37_device_202511140301_cipn0.mp4",
  "/videos/_38_led_202511140301_jp8c0.mp4",
  "/videos/_39_antenna_202511140301_rxnp0.mp4",
  "/videos/_3_battle_202511140217_69ge9.mp4",
  "/videos/_3_battle_202511140217_ms3hi.mp4",
  "/videos/_40_device_202511140301_va956.mp4",
  "/videos/_41_exploded_202511140301_uk8z0.mp4",
  "/videos/_42_data_202511140301_n6me4.mp4",
  "/videos/_43_weather_202511140301_b5tm7.mp4",
  "/videos/_44_night_202511140301_rpvqg.mp4",
  "/videos/_45_multidevice_202511140301_1rsn5.mp4",
  "/videos/_46_cybersecurity_202511140302_exqn5.mp4",
  "/videos/_47_historical_202511140302_iw0sk.mp4",
  "/videos/_48_sunrise_202511140302_echfv.mp4",
  "/videos/_49_collaborative_202511140302_rnvi6.mp4",
  "/videos/_4_smart_202511140217_gs3bw.mp4",
  "/videos/_4_smart_202511140218_8my5x.mp4",
  "/videos/_50_future_202511140302_zh61z.mp4",
  "/videos/_5_city_202511140217_s0mwv.mp4",
  "/videos/_5_city_202511140218_979q0.mp4",
  "/videos/_6_inner_202511140217_o384o.mp4",
  "/videos/_6_inner_202511140218_ti1bm.mp4",
  "/videos/_7_technology_202511140218_k2bdj.mp4",
  "/videos/_8_fiber_202511140218_oaw7q.mp4",
  "/videos/_9_baltimore_202511140241_eq6b7.mp4",
];


export default function Landing() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("admin@visium.com");
  const [password, setPassword] = useState("Baltimore2025");
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(() =>
    Math.floor(Math.random() * VIDEO_SOURCES.length),
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Redirect to dashboard if already authenticated
  const handleVideoLoaded = () => {
    console.log("[Landing] Video loaded", {
      index: currentVideoIndex,
      src: VIDEO_SOURCES[currentVideoIndex],
    });
    setVideoLoaded(true);
  };

  const handleVideoEnd = () => {
    console.log("[Landing] Video ended", {
      index: currentVideoIndex,
      src: VIDEO_SOURCES[currentVideoIndex],
    });

    // Pick a random next video, avoiding immediate repeats when possible
    setCurrentVideoIndex(prev => {
      if (VIDEO_SOURCES.length <= 1) return prev;

      let next = Math.floor(Math.random() * VIDEO_SOURCES.length);
      if (next === prev) {
        next = (next + 1) % VIDEO_SOURCES.length;
      }
      console.log("[Landing] Advancing to next random video", { from: prev, to: next });
      return next;
    });
  };

  const handleVideoError = () => {
    const video = videoRef.current;
    console.error("[Landing] Video error", {
      index: currentVideoIndex,
      src: VIDEO_SOURCES[currentVideoIndex],
      error: video?.error,
      networkState: video?.networkState,
      readyState: video?.readyState,
    });
    setVideoLoaded(false);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      // Ref not attached yet; effect will re-run once it is.
      return;
    }

    console.log("[Landing] Attempting to play video", {
      index: currentVideoIndex,
      src: VIDEO_SOURCES[currentVideoIndex],
      canPlayType: video.canPlayType("video/mp4"),
    });

    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          console.log("[Landing] video.play() resolved", {
            index: currentVideoIndex,
            src: VIDEO_SOURCES[currentVideoIndex],
          });
        })
        .catch((error) => {
          console.warn("[Landing] video.play() rejected", {
            index: currentVideoIndex,
            src: VIDEO_SOURCES[currentVideoIndex],
            error,
          });
          // Autoplay might be blocked; ignore for background video.
        });
    }
  }, [currentVideoIndex]);

  useEffect(() => {
    if (user && !loading) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const hasOAuthConfig = Boolean(
      import.meta.env.VITE_OAUTH_PORTAL_URL && import.meta.env.VITE_APP_ID,
    );

    if (hasOAuthConfig) {
      window.location.href = getLoginUrl();
    } else {
      setLocation("/dashboard");
    }
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
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Fallback gradient background if video doesn't load */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/70 to-black/80" />
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ${
            videoLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoadedData={handleVideoLoaded}
          onEnded={handleVideoEnd}
          onError={handleVideoError}
        >
          <source src={VIDEO_SOURCES[currentVideoIndex]} type="video/mp4" />
        </video>
        {/* Preload the next video off-screen for smoother transitions */}
        <video className="hidden" preload="auto" muted>
          <source
            src={VIDEO_SOURCES[(currentVideoIndex + 1) % VIDEO_SOURCES.length]}
            type="video/mp4"
          />
        </video>
        {/* Gradient overlay on top of video */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/55 to-black/70 z-10" />
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
