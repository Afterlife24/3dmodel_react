import {
  useState,
  useCallback,
  useEffect,
  useRef,
  lazy,
  Suspense,
} from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import Model from "./components/Model";
import Stage from "./components/Stage";
import TypewriterText from "./components/TypewriterText";
import AgentButtons from "./components/AgentButtons";
import NavBar from "./shared-components/NavBar";
import Footer from "./shared-components/Footer";
import CompanyDetailsModal from "./components/CompanyDetailsModal";
import { useLiveKit } from "./hooks/useLiveKit";
import { useScrollAnimations } from "./hooks/useScrollAnimations";
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
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 768,
  );
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const homeRef = useRef(null);

  const isHome = location.pathname === "/";

  // Scroll-triggered animations for agent sections
  useScrollAnimations(homeRef, isHome);

  // Track viewport size for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isAuthed = !isLoading && !!user;

  // LiveKit only connects when voice session is explicitly started
  const shouldConnect = isAuthed && voiceSessionStarted;

  const handleAnimationChange = useCallback((anim) => {
    setCurrentAnimation(anim);
  }, []);

  // "Talk to Me" button handler
  const handleTalkToMe = useCallback(async () => {
    if (!isAuthed) {
      navigate("/signup");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicDenied(false);
      setVoiceSessionStarted(true);
    } catch (err) {
      console.warn("[Mic] Permission denied:", err);
      setMicDenied(true);
    }
  }, [isAuthed, navigate]);

  useEffect(() => {
    if (isAuthed && isHome && !voiceSessionStarted) {
      const pending = sessionStorage.getItem("pendingTalkToMe");
      if (pending) {
        sessionStorage.removeItem("pendingTalkToMe");
        handleTalkToMe();
      }
    }
  }, [isAuthed, isHome, voiceSessionStarted, handleTalkToMe]);

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
      try {
        const parsed = new URL(url, window.location.origin);
        const section = parsed.searchParams.get("section");
        if (parsed.pathname === "/" && section) {
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
      } catch (_) {}
      navigate(url);
    },
    [navigate],
  );

  useEffect(() => {
    window.addEventListener("agent-navigate", handleAgentNavigate);
    return () =>
      window.removeEventListener("agent-navigate", handleAgentNavigate);
  }, [handleAgentNavigate]);

  useEffect(() => {
    const handleShowCompanyForm = () => setShowCompanyForm(true);
    window.addEventListener("show-company-form", handleShowCompanyForm);
    return () =>
      window.removeEventListener("show-company-form", handleShowCompanyForm);
  }, []);

  const {
    status,
    agentText,
    userText,
    errorMsg,
    isMicMuted,
    toggleMic,
    disconnect,
  } = useLiveKit({
    onAnimationChange: handleAnimationChange,
    enabled: shouldConnect,
  });

  const handleDisconnect = useCallback(() => {
    disconnect();
    setVoiceSessionStarted(false);
  }, [disconnect]);

  return (
    <div className="home-section" ref={homeRef}>
      {/* Shared NavBar on all pages */}
      <NavBar />

      {/* ═══════════════════ HOME PAGE ═══════════════════ */}
      {isHome && (
        <>
          {/* HERO SECTION — first viewport, scrolls with the page */}
          <section className="home-hero">
            {/* Hero text */}
            <div className="home-hero__text">
              <div className="hero-brand-text">AUTONOMIQ AI</div>
              <p className="hero-tagline hero-tagline-floating">
                {t("talkToMe.tagline")}
              </p>
            </div>

            {/* 3D Avatar in normal flow */}
            <div className="home-hero__avatar">
              <Stage />
              <Canvas
                camera={{ position: [0, 1, 3], fov: isMobile ? 45 : 50 }}
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
                  isWidget={false}
                />
              </Canvas>
            </div>

            {/* Agent speech bubble — mobile */}
            {voiceSessionStarted && agentText && (
              <div className="agent-speech-bubble-mobile">
                <TypewriterText
                  text={agentText}
                  speed={25}
                  className="agent-speech-text"
                />
              </div>
            )}

            {/* "Talk to Me" CTA */}
            {!voiceSessionStarted && (
              <div className="home-hero__cta">
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

            {/* Mic toggle + close button */}
            {voiceSessionStarted && (
              <div className="home-hero__cta">
                <div className="flex items-center gap-3">
                  <button
                    onClick={
                      status !== "connecting" && status !== "connected"
                        ? toggleMic
                        : undefined
                    }
                    className={`talk-to-me-btn ${isMicMuted ? "mic-btn-muted" : ""} ${status === "listening" ? "mic-btn-listening" : ""} ${status === "connecting" || status === "connected" ? "mic-btn-connecting" : ""}`}
                    aria-label={
                      isMicMuted ? "Unmute microphone" : "Mute microphone"
                    }
                    disabled={status === "connecting" || status === "connected"}
                  >
                    {status === "connecting" || status === "connected" ? (
                      <span
                        className="talk-btn-loader"
                        style={{ marginRight: 8 }}
                      />
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

                  <button
                    onClick={handleDisconnect}
                    className="disconnect-btn"
                    aria-label="End voice session"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

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

            {/* Agent speech bubble — desktop */}
            {voiceSessionStarted && agentText && (
              <div className="agent-speech-bubble agent-speech-bubble-desktop">
                <div className="agent-speech-tail" />
                <TypewriterText
                  text={agentText}
                  speed={25}
                  className="agent-speech-text"
                />
              </div>
            )}

            {/* WhatsApp + Calling agent orb buttons */}
            <AgentButtons
              whatsappUrl={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}`}
              callUrl={`tel:${import.meta.env.VITE_INBOUND_CALL_NUMBER}`}
            />

            {/* Connection error */}
            {voiceSessionStarted && status === "error" && (
              <div
                className="absolute z-30"
                style={{
                  top: "5rem",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                <div className="transcript-bubble error">
                  {errorMsg || "Connection error"}
                </div>
              </div>
            )}
          </section>

          {/* ═══ AGENT SECTIONS — scroll below hero ═══ */}

          {/* Web Agent — content left, image right */}
          <section className="agent-section">
            <div className="agent-section__inner">
              <div className="agent-section__text">
                <span className="agent-section__badge">AI Concierge</span>
                <h2 className="agent-section__title">Web Agent</h2>
                <p className="agent-section__desc">
                  An interactive 3D AI avatar that lives on your website —
                  guiding visitors, answering questions in real time, and
                  converting them into qualified leads through natural voice
                  conversations.
                </p>
                <ul className="agent-section__list">
                  <li>Guides visitors and opens pages automatically</li>
                  <li>Answers questions with natural voice</li>
                  <li>Reduces bounce rate and increases engagement</li>
                  <li>Converts visitors into qualified leads</li>
                  <li>24/7 availability with CRM integration</li>
                </ul>
              </div>
              <div className="agent-section__visual">
                <img
                  src="/assets/webagent_section.png"
                  alt="Web Agent"
                  className="agent-section__img"
                />
              </div>
            </div>
          </section>

          {/* Calling Agent — image left, content right */}
          <section className="agent-section">
            <div className="agent-section__inner agent-section__inner--reverse">
              <div className="agent-section__text">
                <span className="agent-section__badge">Voice AI</span>
                <h2 className="agent-section__title">Calling Agent</h2>
                <p className="agent-section__desc">
                  AI-powered outbound phone calls with a natural human voice.
                  Qualifies leads, schedules appointments, handles objections,
                  and transfers to a human — all without manual effort.
                </p>
                <ul className="agent-section__list">
                  <li>Natural voice with adaptive interruption handling</li>
                  <li>Lead qualification and appointment scheduling</li>
                  <li>Product explanations and sales follow-ups</li>
                  <li>Transfer to a human agent when needed</li>
                  <li>Voicemail detection and graceful hangup</li>
                </ul>
              </div>
              <div className="agent-section__visual">
                <img
                  src="/assets/calling_section.png"
                  alt="Calling Agent"
                  className="agent-section__img"
                />
              </div>
            </div>
          </section>

          {/* WhatsApp Agent — content left, image right */}
          <section className="agent-section">
            <div className="agent-section__inner">
              <div className="agent-section__text">
                <span className="agent-section__badge">Messaging AI</span>
                <h2 className="agent-section__title">WhatsApp Agent</h2>
                <p className="agent-section__desc">
                  Automated AI conversations on WhatsApp that handle support,
                  qualify leads, and drive sales — engaging customers on the
                  platform they already use every day.
                </p>
                <ul className="agent-section__list">
                  <li>Instant replies to customer inquiries</li>
                  <li>Multilingual support and FAQ handling</li>
                  <li>Order tracking and notifications</li>
                  <li>Lead generation and qualification</li>
                  <li>Seamless CRM and calendar integration</li>
                </ul>
              </div>
              <div className="agent-section__visual">
                <img
                  src="/assets/whatsapp_section.png"
                  alt="WhatsApp Agent"
                  className="agent-section__img"
                />
              </div>
            </div>
          </section>

          <Footer />
        </>
      )}

      {/* ═══════════════════ OTHER PAGES ═══════════════════ */}
      {/* 3D Avatar widget — visible only on non-home pages when voice session active */}
      {!isHome && isAuthed && voiceSessionStarted && (
        <div
          className="avatar-container"
          style={{
            position: "fixed",
            zIndex: 60,
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
          }}
        >
          <Canvas
            camera={{ position: [0, 1, 3], fov: 40 }}
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
            <pointLight
              position={[0, -1, 2]}
              intensity={0.6}
              color="#48e5ff"
              distance={5}
            />
            <Model
              currentAnimation={currentAnimation}
              setCurrentAnimation={setCurrentAnimation}
              isWidget={true}
            />
          </Canvas>

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

          <button
            onClick={() => navigate("/")}
            className="absolute inset-0 cursor-pointer"
            style={{ background: "transparent", border: "none", zIndex: 20 }}
            aria-label="Return to home"
          />
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

      {/* Company Details Modal */}
      {showCompanyForm && (
        <CompanyDetailsModal onClose={() => setShowCompanyForm(false)} />
      )}
    </div>
  );
}

export default App;
