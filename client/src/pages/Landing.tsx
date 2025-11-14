import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import { Loader2, Shield, Zap, Network, Eye } from "lucide-react";

type TransitionType =
  | "crossfade"
  | "fade-to-black"
  | "quick-cut"
  | "slow-dissolve"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "zoom-out-in"
  | "zoom-in-out"
  | "wipe-left"
  | "wipe-right";

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

function createShuffledSequence(length: number, avoidFirst?: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);

  // Fisher–Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // If requested, avoid having the first element equal to avoidFirst
  if (avoidFirst !== undefined && arr.length > 1 && arr[0] === avoidFirst) {
    const swapIndex = 1 + Math.floor(Math.random() * (arr.length - 1));
    [arr[0], arr[swapIndex]] = [arr[swapIndex], arr[0]];
  }

  return arr;
}

function getRandomTransition(): TransitionType {
  const transitions: TransitionType[] = [
    "crossfade",
    "fade-to-black",
    "quick-cut",
    "slow-dissolve",
    "slide-left",
    "slide-right",
    "slide-up",
    "slide-down",
    "zoom-out-in",
    "zoom-in-out",
    "wipe-left",
    "wipe-right",
  ];
  return transitions[Math.floor(Math.random() * transitions.length)];
}

 
export default function Landing() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("admin@visium.com");
  const [password, setPassword] = useState("Baltimore2025");
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [nextVideoLoaded, setNextVideoLoaded] = useState(false);
  const [sequence, setSequence] = useState<number[]>(() =>
    createShuffledSequence(VIDEO_SOURCES.length),
  );
  const [transitionType, setTransitionType] = useState<TransitionType>(() =>
    getRandomTransition(),
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const nextVideoRef = useRef<HTMLVideoElement | null>(null);

  const currentVideoIndex = sequence[0] ?? 0;
  const nextVideoIndex = sequence[1] ?? currentVideoIndex;

  // Redirect to dashboard if already authenticated
  const handleVideoLoaded = () => {
    console.log("[Landing] Current video loaded", {
      index: currentVideoIndex,
      src: VIDEO_SOURCES[currentVideoIndex],
      transitionType,
    });
    setVideoLoaded(true);
    setIsTransitioning(false);
  };

  const handleNextVideoLoaded = () => {
    console.log("[Landing] Next video loaded", {
      index: nextVideoIndex,
      src: VIDEO_SOURCES[nextVideoIndex],
    });
    setNextVideoLoaded(true);
  };

  const handleVideoEnd = () => {
    console.log("[Landing] Video ended", {
      index: currentVideoIndex,
      src: VIDEO_SOURCES[currentVideoIndex],
      transitionType,
    });

    // Select a new random transition for the next change
    const newTransition = getRandomTransition();
    setTransitionType(newTransition);
    console.log("[Landing] Selected transition", { type: newTransition });

    // Handle transition based on type
    if (newTransition === "quick-cut") {
      // Instant transition - no fade
      setVideoLoaded(false);
      setIsTransitioning(true);
      setSequence((prev) => {
        if (prev.length <= 1) {
          const last = prev[0] ?? currentVideoIndex;
          const nextSeq = createShuffledSequence(VIDEO_SOURCES.length, last);
          console.log("[Landing] Resetting playlist", { last, nextSeq });
          return nextSeq;
        }
        const [current, ...rest] = prev;
        console.log("[Landing] Advancing to next video in playlist", {
          from: current,
          to: rest[0],
        });
        return rest;
      });
    } else if (
      newTransition === "crossfade" ||
      newTransition === "slow-dissolve" ||
      newTransition.startsWith("slide") ||
      newTransition.startsWith("zoom") ||
      newTransition.startsWith("wipe")
    ) {
      // Crossfade-style transitions - need next video ready
      if (nextVideoLoaded) {
        setIsTransitioning(true);
        // Start playing the next video immediately
        const nextVideo = nextVideoRef.current;
        if (nextVideo) {
          nextVideo.currentTime = 0;
          const playPromise = nextVideo.play();
          if (playPromise && typeof playPromise.then === "function") {
            playPromise.catch((error) => {
              console.warn("[Landing] Next video.play() rejected", { error });
            });
          }
        }
        // Advance sequence after transition duration
        const transitionDuration = newTransition === "slow-dissolve" ? 2800 : 
                                   newTransition.startsWith("slide") ? 1200 :
                                   newTransition.startsWith("zoom") ? 1800 :
                                   newTransition.startsWith("wipe") ? 1000 : 1500;
        setTimeout(() => {
          setSequence((prev) => {
            if (prev.length <= 1) {
              const last = prev[0] ?? currentVideoIndex;
              const nextSeq = createShuffledSequence(VIDEO_SOURCES.length, last);
              console.log("[Landing] Resetting playlist", { last, nextSeq });
              return nextSeq;
            }
            const [current, ...rest] = prev;
            console.log("[Landing] Advancing to next video in playlist", {
              from: current,
              to: rest[0],
            });
            return rest;
          });
          setVideoLoaded(false);
          setNextVideoLoaded(false);
        }, transitionDuration);
      } else {
        // Fallback to fade-to-black if next video not ready
        console.log("[Landing] Next video not ready, falling back to fade-to-black");
        setVideoLoaded(false);
        setIsTransitioning(true);
        const transitionDuration = 1500;
        setTimeout(() => {
          setSequence((prev) => {
            if (prev.length <= 1) {
              const last = prev[0] ?? currentVideoIndex;
              const nextSeq = createShuffledSequence(VIDEO_SOURCES.length, last);
              console.log("[Landing] Resetting playlist", { last, nextSeq });
              return nextSeq;
            }
            const [current, ...rest] = prev;
            console.log("[Landing] Advancing to next video in playlist", {
              from: current,
              to: rest[0],
            });
            return rest;
          });
        }, transitionDuration);
      }
    } else {
      // Fade-to-black transition (default)
      setVideoLoaded(false);
      setIsTransitioning(true);
      const transitionDuration = 1500;
      setTimeout(() => {
        setSequence((prev) => {
          if (prev.length <= 1) {
            const last = prev[0] ?? currentVideoIndex;
            const nextSeq = createShuffledSequence(VIDEO_SOURCES.length, last);
            console.log("[Landing] Resetting playlist", { last, nextSeq });
            return nextSeq;
          }
          const [current, ...rest] = prev;
          console.log("[Landing] Advancing to next video in playlist", {
            from: current,
            to: rest[0],
          });
          return rest;
        });
      }, transitionDuration);
    }
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
      return;
    }

    console.log("[Landing] Attempting to play current video", {
      index: currentVideoIndex,
      src: VIDEO_SOURCES[currentVideoIndex],
      transitionType,
      canPlayType: video.canPlayType("video/mp4"),
    });

    video.pause();
    video.currentTime = 0;
    video.load();

    const playPromise = video.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          console.log("[Landing] Current video.play() resolved", {
            index: currentVideoIndex,
            src: VIDEO_SOURCES[currentVideoIndex],
          });
        })
        .catch((error) => {
          console.warn("[Landing] Current video.play() rejected", {
            index: currentVideoIndex,
            src: VIDEO_SOURCES[currentVideoIndex],
            error,
          });
        });
    }
  }, [currentVideoIndex, transitionType]);

  // Always preload the next video for smoother transitions
  useEffect(() => {
    const nextVideo = nextVideoRef.current;
    if (!nextVideo || nextVideoIndex === currentVideoIndex) {
      return;
    }

    console.log("[Landing] Preloading next video", {
      index: nextVideoIndex,
      src: VIDEO_SOURCES[nextVideoIndex],
    });
    nextVideo.load();
    setNextVideoLoaded(false);
  }, [nextVideoIndex, currentVideoIndex]);

  useEffect(() => {
    const hasOAuthConfig = Boolean(
      import.meta.env.VITE_OAUTH_PORTAL_URL && import.meta.env.VITE_APP_ID,
    );

    if (!hasOAuthConfig) return;
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

  // Helper function to get transition duration
  const getTransitionDuration = (): string => {
    switch (transitionType) {
      case "quick-cut":
        return "duration-0";
      case "slow-dissolve":
        return "duration-[2800ms]";
      case "crossfade":
        return "duration-[1500ms]";
      case "fade-to-black":
        return "duration-[1500ms]";
      case "slide-left":
      case "slide-right":
      case "slide-up":
      case "slide-down":
        return "duration-[1200ms]";
      case "zoom-out-in":
      case "zoom-in-out":
        return "duration-[1800ms]";
      case "wipe-left":
      case "wipe-right":
        return "duration-[1000ms]";
      default:
        return "duration-[1500ms]";
    }
  };

  // Helper function to get transition classes for current video
  const getCurrentVideoClasses = (): string => {
    const baseClasses = "absolute inset-0 w-full h-full object-cover";
    const duration = getTransitionDuration();

    if (isTransitioning) {
      switch (transitionType) {
        case "quick-cut":
          return `${baseClasses} opacity-0 ${duration}`;
        case "crossfade":
        case "slow-dissolve":
          return `${baseClasses} opacity-0 ${duration} transition-opacity`;
        case "fade-to-black":
          return `${baseClasses} opacity-0 ${duration} transition-opacity`;
        case "slide-left":
          return `${baseClasses} opacity-0 -translate-x-full ${duration} transition-all`;
        case "slide-right":
          return `${baseClasses} opacity-0 translate-x-full ${duration} transition-all`;
        case "slide-up":
          return `${baseClasses} opacity-0 -translate-y-full ${duration} transition-all`;
        case "slide-down":
          return `${baseClasses} opacity-0 translate-y-full ${duration} transition-all`;
        case "zoom-out-in":
          return `${baseClasses} opacity-0 scale-150 ${duration} transition-all`;
        case "zoom-in-out":
          return `${baseClasses} opacity-0 scale-50 ${duration} transition-all`;
        case "wipe-left":
          return `${baseClasses} opacity-0 -translate-x-full ${duration} transition-all`;
        case "wipe-right":
          return `${baseClasses} opacity-0 translate-x-full ${duration} transition-all`;
        default:
          return `${baseClasses} opacity-0 ${duration} transition-opacity`;
      }
    }

    return `${baseClasses} ${videoLoaded ? "opacity-100" : "opacity-0"} ${duration} transition-opacity`;
  };

  // Helper function to get transition classes for next video (for crossfade transitions)
  const getNextVideoClasses = (): string => {
    const baseClasses = "absolute inset-0 w-full h-full object-cover";
    const duration = getTransitionDuration();

    if (isTransitioning) {
      switch (transitionType) {
        case "crossfade":
        case "slow-dissolve":
          return `${baseClasses} opacity-100 ${duration} transition-opacity z-10`;
        case "slide-left":
          return `${baseClasses} opacity-100 translate-x-0 ${duration} transition-all z-10`;
        case "slide-right":
          return `${baseClasses} opacity-100 translate-x-0 ${duration} transition-all z-10`;
        case "slide-up":
          return `${baseClasses} opacity-100 translate-y-0 ${duration} transition-all z-10`;
        case "slide-down":
          return `${baseClasses} opacity-100 translate-y-0 ${duration} transition-all z-10`;
        case "zoom-out-in":
          return `${baseClasses} opacity-100 scale-100 ${duration} transition-all z-10`;
        case "zoom-in-out":
          return `${baseClasses} opacity-100 scale-100 ${duration} transition-all z-10`;
        case "wipe-left":
          return `${baseClasses} opacity-100 translate-x-0 ${duration} transition-all z-10`;
        case "wipe-right":
          return `${baseClasses} opacity-100 translate-x-0 ${duration} transition-all z-10`;
        default:
          return `${baseClasses} opacity-0 ${duration} transition-opacity`;
      }
    }

    // Initial state for next video (off-screen or hidden) - prepare for transition
    switch (transitionType) {
      case "slide-left":
        return `${baseClasses} opacity-0 translate-x-full ${duration} transition-all`;
      case "slide-right":
        return `${baseClasses} opacity-0 -translate-x-full ${duration} transition-all`;
      case "slide-up":
        return `${baseClasses} opacity-0 translate-y-full ${duration} transition-all`;
      case "slide-down":
        return `${baseClasses} opacity-0 -translate-y-full ${duration} transition-all`;
      case "zoom-out-in":
        return `${baseClasses} opacity-0 scale-50 ${duration} transition-all`;
      case "zoom-in-out":
        return `${baseClasses} opacity-0 scale-150 ${duration} transition-all`;
      case "wipe-left":
        return `${baseClasses} opacity-0 translate-x-full ${duration} transition-all`;
      case "wipe-right":
        return `${baseClasses} opacity-0 -translate-x-full ${duration} transition-all`;
      default:
        return `${baseClasses} opacity-0 ${duration} transition-opacity`;
    }
  };

  // Determine if we need to render the next video element
  const needsNextVideoElement =
    isTransitioning &&
    (transitionType === "crossfade" ||
      transitionType === "slow-dissolve" ||
      transitionType.startsWith("slide") ||
      transitionType.startsWith("zoom") ||
      transitionType.startsWith("wipe"));

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Fallback gradient background if video doesn't load */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/70 to-black/80" />
        
        {/* Current Video */}
        <video
          key={currentVideoIndex}
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          src={VIDEO_SOURCES[currentVideoIndex]}
          className={getCurrentVideoClasses()}
          onLoadedData={handleVideoLoaded}
          onEnded={handleVideoEnd}
          onError={handleVideoError}
        />

        {/* Next Video - Always in DOM for preloading, visible during crossfade transitions */}
        <video
          key={`next-${nextVideoIndex}`}
          ref={nextVideoRef}
          autoPlay={needsNextVideoElement}
          muted
          playsInline
          preload="auto"
          src={VIDEO_SOURCES[nextVideoIndex]}
          className={needsNextVideoElement ? getNextVideoClasses() : "hidden"}
          onLoadedData={handleNextVideoLoaded}
          onError={() => {
            console.error("[Landing] Next video error", {
              index: nextVideoIndex,
              src: VIDEO_SOURCES[nextVideoIndex],
            });
          }}
        />

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
