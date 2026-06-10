import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";

const COUNTRIES = [
  {
    code: "AE",
    name: "United Arab Emirates",
    dialCode: "+971",
    flag: "🇦🇪",
    maxLength: 9,
  },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷", maxLength: 9 },
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳", maxLength: 10 },
  {
    code: "US",
    name: "United States",
    dialCode: "+1",
    flag: "🇺🇸",
    maxLength: 10,
  },
  {
    code: "GB",
    name: "United Kingdom",
    dialCode: "+44",
    flag: "🇬🇧",
    maxLength: 10,
  },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", maxLength: 10 },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺", maxLength: 9 },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪", maxLength: 11 },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸", maxLength: 9 },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹", maxLength: 10 },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷", maxLength: 11 },
  {
    code: "SA",
    name: "Saudi Arabia",
    dialCode: "+966",
    flag: "🇸🇦",
    maxLength: 9,
  },
  { code: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬", maxLength: 10 },
  { code: "PK", name: "Pakistan", dialCode: "+92", flag: "🇵🇰", maxLength: 10 },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬", maxLength: 8 },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾", maxLength: 10 },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵", maxLength: 10 },
  {
    code: "KR",
    name: "South Korea",
    dialCode: "+82",
    flag: "🇰🇷",
    maxLength: 10,
  },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬", maxLength: 10 },
  {
    code: "ZA",
    name: "South Africa",
    dialCode: "+27",
    flag: "🇿🇦",
    maxLength: 9,
  },
];

export default function WhatsAppPanel({ isOpen, onClose, whatsappNumber }) {
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showCountryList, setShowCountryList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const panelRef = useRef(null);
  const searchRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Check if the click is on the WhatsApp orb button itself
        const orbBtn = e.target.closest(".orb-btn--whatsapp");
        if (!orbBtn) {
          onClose();
        }
      }
    };

    // Delay adding listener so the opening click doesn't immediately close
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen, onClose]);

  // Focus search when country list opens
  useEffect(() => {
    if (showCountryList && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showCountryList]);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleGetMessage = async () => {
    if (!phoneNumber.trim()) return;

    setStatus("sending");

    const fullNumber = `${selectedCountry.dialCode}${phoneNumber}`;
    console.log("[WhatsApp] Requesting message to:", fullNumber);

    try {
      const backendUrl = import.meta.env.VITE_WHATSAPP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/whatsappDemo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: fullNumber }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("[WhatsApp] Message sent successfully:", data);
        setStatus("sent");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        console.error("[WhatsApp] Backend error:", data.error);
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch (err) {
      console.error("[WhatsApp] Network error:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const handleMessageUs = () => {
    const number = whatsappNumber.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${number}`, "_blank", "noopener,noreferrer");
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length <= selectedCountry.maxLength) {
      setPhoneNumber(val);
    }
  };

  if (!isOpen) return null;

  return (
    <div ref={panelRef} className="whatsapp-panel">
      {/* Header */}
      <div className="whatsapp-panel-header">
        <div className="whatsapp-panel-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span>{t("whatsapp.title")}</span>
        </div>
      </div>

      {/* Body */}
      <div className="whatsapp-panel-body">
        {/* Phone input section */}
        <label className="whatsapp-panel-label">
          {t("whatsapp.enterNumber")}
        </label>
        <div className="whatsapp-phone-row">
          {/* Country selector */}
          <button
            type="button"
            className="whatsapp-country-btn"
            onClick={() => setShowCountryList(!showCountryList)}
            aria-label="Select country code"
          >
            <span className="whatsapp-country-flag">
              {selectedCountry.flag}
            </span>
            <span className="whatsapp-country-dial">
              {selectedCountry.dialCode}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`whatsapp-chevron ${showCountryList ? "rotated" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Phone number input */}
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder={t("whatsapp.phonePlaceholder")}
            className="whatsapp-phone-input"
            maxLength={selectedCountry.maxLength}
          />
        </div>

        {/* Country dropdown */}
        {showCountryList && (
          <div className="whatsapp-country-dropdown">
            <div className="whatsapp-country-search">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("whatsapp.searchCountry")}
                className="whatsapp-country-search-input"
              />
            </div>
            <div className="whatsapp-country-list">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  className={`whatsapp-country-item ${selectedCountry.code === country.code ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedCountry(country);
                    setShowCountryList(false);
                    setSearchQuery("");
                    setPhoneNumber("");
                  }}
                >
                  <span className="whatsapp-country-item-flag">
                    {country.flag}
                  </span>
                  <span className="whatsapp-country-item-name">
                    {country.name}
                  </span>
                  <span className="whatsapp-country-item-dial">
                    {country.dialCode}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="whatsapp-panel-actions">
          <button
            className="whatsapp-action-btn whatsapp-action-get"
            onClick={handleGetMessage}
            disabled={!phoneNumber.trim() || status === "sending"}
          >
            {status === "sending" ? (
              <span className="whatsapp-spinner" />
            ) : status === "sent" ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            )}
            <span>
              {status === "sent"
                ? t("whatsapp.messageSent")
                : status === "error"
                  ? t("whatsapp.error")
                  : t("whatsapp.getMsg")}
            </span>
          </button>

          <div className="whatsapp-divider">
            <span>{t("whatsapp.or")}</span>
          </div>

          <button
            className="whatsapp-action-btn whatsapp-action-msgus"
            onClick={handleMessageUs}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span>{t("whatsapp.messageUs")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
