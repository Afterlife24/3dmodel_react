/**
 * AgentButtons — the PNG IS the full 3D button artwork.
 * We render it large and wrap it in a glow environment that matches
 * the dark-space / neon-blue background baked into the images.
 */

import { useState, useCallback, useRef } from "react";
import WhatsAppPanel from "./WhatsAppPanel";
import CallingPanel from "./CallingPanel";

function OrbButton({
  onClick,
  onMouseEnter,
  onMouseLeave,
  href,
  variant,
  ariaLabel,
  iconSrc,
  iconAlt,
  label,
}) {
  const Tag = onClick ? "button" : href ? "a" : "button";
  const props = onClick
    ? { onClick, type: "button" }
    : href
      ? { href, target: "_blank", rel: "noopener noreferrer" }
      : { type: "button" };

  return (
    <Tag
      {...props}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`orb-btn orb-btn--${variant}`}
      aria-label={ariaLabel}
    >
      {/* ambient space-glow halo behind the PNG */}
      <span className="orb-halo" aria-hidden="true" />

      {/* the full 3D button PNG */}
      <img src={iconSrc} alt={iconAlt} className="orb-png" draggable="false" />

      {/* ground reflection streak */}
      <span className="orb-ground" aria-hidden="true" />

      {/* text label */}
      <span className="orb-label">{label}</span>
    </Tag>
  );
}

export default function AgentButtons({ whatsappUrl, callUrl }) {
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [callingOpen, setCallingOpen] = useState(false);
  const whatsappTimer = useRef(null);
  const callingTimer = useRef(null);

  // Detect if device supports hover (desktop vs touch)
  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  const toggleWhatsapp = useCallback(() => {
    setWhatsappOpen((prev) => !prev);
    setCallingOpen(false);
  }, []);

  const toggleCalling = useCallback(() => {
    setCallingOpen((prev) => !prev);
    setWhatsappOpen(false);
  }, []);

  const closeWhatsapp = useCallback(() => {
    setWhatsappOpen(false);
  }, []);

  const closeCalling = useCallback(() => {
    setCallingOpen(false);
  }, []);

  // Hover handlers — open immediately, close with a short delay
  // so user can move cursor from orb to panel without it closing
  const handleWhatsappEnter = useCallback(() => {
    if (isTouchDevice) return;
    if (whatsappTimer.current) clearTimeout(whatsappTimer.current);
    setWhatsappOpen(true);
    setCallingOpen(false);
  }, [isTouchDevice]);

  const handleWhatsappLeave = useCallback(() => {
    if (isTouchDevice) return;
    whatsappTimer.current = setTimeout(() => setWhatsappOpen(false), 300);
  }, [isTouchDevice]);

  const handleWhatsappPanelEnter = useCallback(() => {
    if (whatsappTimer.current) clearTimeout(whatsappTimer.current);
  }, []);

  const handleWhatsappPanelLeave = useCallback(() => {
    if (isTouchDevice) return;
    whatsappTimer.current = setTimeout(() => setWhatsappOpen(false), 300);
  }, [isTouchDevice]);

  const handleCallingEnter = useCallback(() => {
    if (isTouchDevice) return;
    if (callingTimer.current) clearTimeout(callingTimer.current);
    setCallingOpen(true);
    setWhatsappOpen(false);
  }, [isTouchDevice]);

  const handleCallingLeave = useCallback(() => {
    if (isTouchDevice) return;
    callingTimer.current = setTimeout(() => setCallingOpen(false), 300);
  }, [isTouchDevice]);

  const handleCallingPanelEnter = useCallback(() => {
    if (callingTimer.current) clearTimeout(callingTimer.current);
  }, []);

  const handleCallingPanelLeave = useCallback(() => {
    if (isTouchDevice) return;
    callingTimer.current = setTimeout(() => setCallingOpen(false), 300);
  }, [isTouchDevice]);

  // Extract the WhatsApp number from the URL for the panel
  const whatsappNumber = whatsappUrl
    ? whatsappUrl.replace(/.*wa\.me\//, "").replace(/[^0-9+]/g, "")
    : "";

  // Extract inbound call number
  const inboundNumber = callUrl ? callUrl.replace(/^tel:/, "") : "+1234567890";

  return (
    <div className="agent-btns-wrap" aria-label="Contact agent buttons">
      <OrbButton
        onClick={isTouchDevice ? toggleWhatsapp : undefined}
        onMouseEnter={handleWhatsappEnter}
        onMouseLeave={handleWhatsappLeave}
        variant="whatsapp"
        ariaLabel="Chat on WhatsApp"
        iconSrc="/assets/whatsapp.png"
        iconAlt="WhatsApp Agent"
        label="Chat on WhatsApp"
      />

      <WhatsAppPanel
        isOpen={whatsappOpen}
        onClose={closeWhatsapp}
        whatsappNumber={whatsappNumber}
        onMouseEnter={handleWhatsappPanelEnter}
        onMouseLeave={handleWhatsappPanelLeave}
      />

      <OrbButton
        onClick={isTouchDevice ? toggleCalling : undefined}
        onMouseEnter={handleCallingEnter}
        onMouseLeave={handleCallingLeave}
        variant="calling"
        ariaLabel="Call Us"
        iconSrc="/assets/calling.png"
        iconAlt="Calling Agent"
        label="Call Us"
      />

      <CallingPanel
        isOpen={callingOpen}
        onClose={closeCalling}
        inboundNumber={inboundNumber}
        onMouseEnter={handleCallingPanelEnter}
        onMouseLeave={handleCallingPanelLeave}
      />
    </div>
  );
}
