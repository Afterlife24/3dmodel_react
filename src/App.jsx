import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import Model from "./components/Model";
import Stage from "./components/Stage";
import TypewriterText from "./components/TypewriterText";
import AgentButtons from "./components/AgentButtons";
import NavBar from "./shared-components/NavBar";
import { useLiveKit } from "./hooks/useLiveKit";
import { useAuth } from "./contexts/AuthContext";
import { useLanguage } from "./contexts/LanguageContext";

// Lazy-loaded pages — reduces initial bundle, speeds up first paint
const About = lazy(() => import("./pages/About"));
const AIAssistants = lazy(() => import("./pages/AIAssistants"));
const AdditionalServices = lazy(() => import("./pages/AdditionalServices"));
const Blog = lazy(() => import("./pages/Blog"));
const Careers = lazy(() => import("./pages/Careers"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CompanyDetails = lazy(() => import("./pages/CompanyDetails"));

function App() {
  const [currentAnimation, setCurrentAnimation] = useState("idle");
  const [voiceSessionStarted, setVoiceSessionStarted] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 768,
  );
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();

  // Track viewport size for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isHome = location.pathname === "/";
  const isAuthed = !isLoading && !!user;

  // LiveKit only connects when voice session is explicitly started
  const shouldConnect = isAuthed && voiceSessionStarted;

  const handleAnimationChange = useCallback((anim) => {
    setCurrentAnimation(anim);
  }, []);

  // "Talk to Me" button handler
  const handleTalkToMe = useCallback(async () => {
    // If not authenticated, redirect to signup
    if (!isAuthed) {
      navigate("/signup");
      return;
    }

    // Request microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Permission granted — stop the test stream and start the voice session
      stream.getTracks().forEach((track) => track.stop());
      setMicDenied(false);
      setVoiceSessionStarted(true);
    } catch (err) {
      console.warn("[Mic] Permission denied:", err);
      setMicDenied(true);
    }
  }, [isAuthed, navigate]);

  // If user just came back from signup/login and voiceSessionStarted was pending,
  // auto-trigger the mic request
  useEffect(() => {
    if (isAuthed && isHome && !voiceSessionStarted) {
      const pending = sessionStorage.getItem("pendingTalkToMe");
      if (pending) {
        sessionStorage.removeItem("pendingTalkToMe");
        handleTalkToMe();
      }
    }
  }, [isAuthed, isHome, voiceSessionStarted, handleTalkToMe]);

  // When redirecting to signup, mark intent so we auto-start after auth
  const handleTalkToMeWithIntent = useCallback(() => {
    if (!isAuthed) {
      sessionStorage.setItem("pendingTalkToMe", "true");
    }
    handleTalkToMe();
  }, [isAuthed, handleTalkToMe]);

  // Handle agent navigation events
  const handleAgentNavigate = useCallback(
    (event) => {
      const url = event.detail.url;
      console.log("[App] Agent navigation event:", url);

      // Parse query params — handle section-based navigation on home path
      // In this app, "/" is just the avatar landing. Sections need to map to actual routes.
      try {
        const parsed = new URL(url, window.location.origin);
        const section = parsed.searchParams.get("section");

        if (parsed.pathname === "/" && section) {
          // Map home-page sections to actual routes in this app
          const sectionRouteMap = {
            services: "/solutions",
            vision: "/about",
            testimonials: "/about",
            voice: "/ai-assistants",
            calling: "/ai-assistants",
            web: "/ai-assistants",
            whatsapp: "/ai-assistants",
            "meet-assistants": "/ai-assistants",
            demo: "/ai-assistants",
            "ai-workforce": "/ai-assistants",
            "whatsapp-agent": "/ai-assistants",
            "web-agent": "/ai-assistants",
            industries: "/ai-assistants",
          };
          const targetRoute = sectionRouteMap[section] || "/";
          navigate(targetRoute);
          return;
        }
      } catch (_) {
        // URL parsing failed — fall through to direct navigate
      }

      navigate(url);
    },
    [navigate],
  );

  useEffect(() => {
    window.addEventListener("agent-navigate", handleAgentNavigate);
    return () =>
      window.removeEventListener("agent-navigate", handleAgentNavigate);
  }, [handleAgentNavigate]);

  // All pages are public — only the voice agent requires auth
  // No auth gate for navigation

  const { status, agentText, userText, errorMsg, isMicMuted, toggleMic } =
    useLiveKit({
      onAnimationChange: handleAnimationChange,
      enabled: shouldConnect,
    });

  return (
    <div className="home-section">
      {/* Shared NavBar on all pages */}
      <NavBar />

      {/* Hero text group — brand name + tagline in a flex column, auto-spaced */}
      {isHome && (
        <div className="hero-text-group" aria-hidden="true">
          <div className="hero-brand-text">AUTONOMIQ AI</div>
          <p className="hero-tagline hero-tagline-floating">
            {t("talkToMe.tagline")}
          </p>
        </div>
      )}

      {/* 3D Avatar — always visible on home; gated by auth+voiceSession for widget mode */}
      {(isHome || (isAuthed && voiceSessionStarted)) && (
        <div
          className="avatar-container"
          style={{
            position: "fixed",
            transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            zIndex: isHome ? 12 : 60,
            // Home: constrained to middle area, leaving room for hero text + CTA
            // Other pages: small corner widget
            ...(isHome
              ? {
                  top: isMobile ? "20%" : "15%",
                  bottom: isMobile ? "12%" : "8%",
                  left: isMobile ? "5%" : "15%",
                  right: isMobile ? "5%" : "15%",
                  borderRadius: 0,
                  width: "auto",
                  height: "auto",
                }
              : {
                  bottom: 0,
                  right: 0,
                  width: "clamp(220px, 55vw, 300px)",
                  height: "clamp(280px, 70vw, 380px)",
                  borderRadius: 0,
                  border: "none",
                  boxShadow: "none",
                  overflow: "visible",
                  background: "transparent",
                  backdropFilter: "none",
                }),
          }}
        >
          {/* Stage only visible on home */}
          {isHome && <Stage />}

          <Canvas
            camera={{
              position: [0, 1, 3],
              fov: isHome ? 50 : 40,
            }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 12,
              background: "transparent",
            }}
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: "high-performance",
            }}
          >
            <ambientLight intensity={0.8} color="#e0f7ff" />
            <directionalLight
              position={[3, 5, 4]}
              intensity={2.0}
              color="#ffffff"
            />
            <directionalLight
              position={[-3, 2, -1]}
              intensity={0.8}
              color="#48e5ff"
            />
            <directionalLight
              position={[0, 2, -4]}
              intensity={1.0}
              color="#48e5ff"
            />
            <pointLight
              position={[0, -1, 2]}
              intensity={0.6}
              color="#48e5ff"
              distance={5}
            />
            <pointLight
              position={[0, 3, 1]}
              intensity={0.5}
              color="#ffffff"
              distance={6}
            />
            <Model
              currentAnimation={currentAnimation}
              setCurrentAnimation={setCurrentAnimation}
              isWidget={!isHome}
            />
          </Canvas>

          {/* Status indicator dot on widget mode */}
          {!isHome && (
            <div
              className="absolute top-2 right-2"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background:
                  status === "listening" || status === "speaking"
                    ? "#48e5ff"
                    : "#2a4050",
                boxShadow:
                  status === "listening" || status === "speaking"
                    ? "0 0 4px #48e5ff"
                    : "none",
              }}
            />
          )}

          {/* Click to go home when in widget mode */}
          {!isHome && (
            <button
              onClick={() => navigate("/")}
              className="absolute inset-0 cursor-pointer"
              style={{ background: "transparent", border: "none" }}
              aria-label="Return to home"
            />
          )}
        </div>
      )}

      {/* "Talk to Me" CTA — shown on home when voice session NOT started */}
      {isHome && !voiceSessionStarted && (
        <div
          className="absolute z-30 flex flex-col items-center gap-2 sm:gap-3 px-4"
          style={{
            bottom: "clamp(1%, 3vh, 5%)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: "600px",
          }}
        >
          {micDenied && (
            <div
              className="transcript-bubble error"
              style={{ marginBottom: 8 }}
            >
              {t("talkToMe.micDenied")}
            </div>
          )}
          <button
            onClick={handleTalkToMeWithIntent}
            className="talk-to-me-btn talk-btn-cta"
            aria-label={t("talkToMe.button")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: 8 }}
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            {t("talkToMe.button")}
          </button>
        </div>
      )}

      {/* Mic toggle + user transcript — shown on home when voice session IS active */}
      {isHome && voiceSessionStarted && (
        <div
          className="fixed z-30 flex flex-col items-center gap-2 sm:gap-3 px-4"
          style={{
            bottom: "clamp(1.5rem, 4vh, 3rem)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: "480px",
          }}
        >
          {/* Mic toggle button — shows connection states then listening/muted */}
          <button
            onClick={
              status !== "connecting" && status !== "connected"
                ? toggleMic
                : undefined
            }
            className={`talk-to-me-btn ${isMicMuted ? "mic-btn-muted" : ""} ${status === "listening" ? "mic-btn-listening" : ""} ${status === "connecting" || status === "connected" ? "mic-btn-connecting" : ""}`}
            aria-label={isMicMuted ? "Unmute microphone" : "Mute microphone"}
            disabled={status === "connecting" || status === "connected"}
          >
            {/* Icon changes based on state */}
            {status === "connecting" || status === "connected" ? (
              <span className="talk-btn-loader" style={{ marginRight: 8 }} />
            ) : isMicMuted ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: 8 }}
              >
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: 8 }}
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
            {/* Status text */}
            {status === "connecting"
              ? "Initializing..."
              : status === "connected"
                ? "Connecting..."
                : status === "speaking"
                  ? t("talkToMe.listening")
                  : isMicMuted
                    ? t("talkToMe.muted")
                    : t("talkToMe.listening")}
          </button>

          {/* User transcript — below the mic button (desktop only, too congested on mobile) */}
          {userText && (
            <div className="user-transcript-bubble hidden sm:block">
              <span className="user-transcript-label">You</span>
              <TypewriterText
                text={userText}
                speed={20}
                className="user-transcript-text"
              />
            </div>
          )}
        </div>
      )}

      {/* Agent speech bubble — at model head level */}
      {isHome && voiceSessionStarted && agentText && (
        <div className="agent-speech-bubble">
          <div className="agent-speech-tail" />
          <TypewriterText
            text={agentText}
            speed={25}
            className="agent-speech-text"
          />
        </div>
      )}

      {/* WhatsApp + Calling agent orb buttons — home only */}
      {isHome && (
        <AgentButtons
          whatsappUrl={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}`}
          callUrl={`tel:${import.meta.env.VITE_INBOUND_CALL_NUMBER}`}
        />
      )}

      {/* Connection error */}
      {isHome && voiceSessionStarted && status === "error" && (
        <div
          className="fixed z-30"
          style={{ top: "5rem", left: "50%", transform: "translateX(-50%)" }}
        >
          <div className="transcript-bubble error">
            {errorMsg || "Connection error"}
          </div>
        </div>
      )}

      {/* Page content — shown when not on home */}
      {!isHome && (
        <div
          className="fixed left-0 right-0 bottom-0 z-20 overflow-y-auto"
          style={{ top: "64px" }}
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <div
                  className="talk-btn-loader"
                  style={{ width: 24, height: 24 }}
                />
              </div>
            }
          >
            <Routes>
              <Route path="/about" element={<About />} />
              <Route path="/ai-assistants" element={<AIAssistants />} />
              <Route path="/solutions" element={<AdditionalServices />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/company-details" element={<CompanyDetails />} />
            </Routes>
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default App;
