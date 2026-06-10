/**
 * AgentButtons — the PNG IS the full 3D button artwork.
 * Panels open on CLICK only (no hover-to-open) for consistency
 * across all devices and to avoid accidental triggers.
 */

import { useState, useCallback } from "react";
import WhatsAppPanel from "./WhatsAppPanel";
import CallingPanel from "./CallingPanel";

function OrbButton({ onClick, variant, ariaLabel, iconSrc, iconAlt, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
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
    </button>
  );
}

export default function AgentButtons({ whatsappUrl, callUrl }) {
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [callingOpen, setCallingOpen] = useState(false);

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

  // Extract the WhatsApp number from the URL for the panel
  const whatsappNumber = whatsappUrl
    ? whatsappUrl.replace(/.*wa\.me\//, "").replace(/[^0-9+]/g, "")
    : "";

  // Extract inbound call number
  const inboundNumber = callUrl ? callUrl.replace(/^tel:/, "") : "+1234567890";

  return (
    <div className="agent-btns-wrap" aria-label="Contact agent buttons">
      <OrbButton
        onClick={toggleWhatsapp}
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
      />

      <OrbButton
        onClick={toggleCalling}
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
      />
    </div>
  );
}
