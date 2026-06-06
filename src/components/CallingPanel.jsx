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

export default function CallingPanel({
  isOpen,
  onClose,
  inboundNumber,
  onMouseEnter,
  onMouseLeave,
}) {
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showCountryList, setShowCountryList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [callStatus, setCallStatus] = useState("idle"); // idle | calling | called | error
  const panelRef = useRef(null);
  const searchRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        const orbBtn = e.target.closest(".orb-btn--calling");
        if (!orbBtn) {
          onClose();
        }
      }
    };

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

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(inboundNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn("[Calling] Clipboard copy failed:", err);
    }
  };

  const handleCallMe = () => {
    if (!phoneNumber.trim()) return;

    setCallStatus("calling");

    const fullNumber = `${selectedCountry.dialCode}${phoneNumber}`;
    console.log("[Calling] Requesting outbound call to:", fullNumber);

    // TODO: Call your backend to dispatch the outbound call
    setTimeout(() => {
      setCallStatus("called");
      setTimeout(() => setCallStatus("idle"), 3000);
    }, 1500);
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length <= selectedCountry.maxLength) {
      setPhoneNumber(val);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="calling-panel"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header */}
      <div className="calling-panel-header">
        <div className="calling-panel-title">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#48e5ff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
          </svg>
          <span>{t("calling.title")}</span>
        </div>
      </div>

      {/* Body */}
      <div className="calling-panel-body">
        {/* Outbound — We'll call you (on top) */}
        <div className="calling-section">
          <label className="calling-panel-label">
            {t("calling.outboundLabel")}
          </label>
          <div className="calling-phone-row">
            <button
              type="button"
              className="calling-country-btn"
              onClick={() => setShowCountryList(!showCountryList)}
              aria-label="Select country code"
            >
              <span className="calling-country-flag">
                {selectedCountry.flag}
              </span>
              <span className="calling-country-dial">
                {selectedCountry.dialCode}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`calling-chevron ${showCountryList ? "rotated" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder={t("calling.phonePlaceholder")}
              className="calling-phone-input"
              maxLength={selectedCountry.maxLength}
            />
          </div>

          {/* Country dropdown */}
          {showCountryList && (
            <div className="calling-country-dropdown">
              <div className="calling-country-search">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("calling.searchCountry")}
                  className="calling-country-search-input"
                />
              </div>
              <div className="calling-country-list">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    className={`calling-country-item ${selectedCountry.code === country.code ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedCountry(country);
                      setShowCountryList(false);
                      setSearchQuery("");
                      setPhoneNumber("");
                    }}
                  >
                    <span className="calling-country-item-flag">
                      {country.flag}
                    </span>
                    <span className="calling-country-item-name">
                      {country.name}
                    </span>
                    <span className="calling-country-item-dial">
                      {country.dialCode}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Call Me button */}
          <button
            className="calling-action-btn"
            onClick={handleCallMe}
            disabled={!phoneNumber.trim() || callStatus === "calling"}
          >
            {callStatus === "calling" ? (
              <span className="calling-spinner" />
            ) : callStatus === "called" ? (
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
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
            )}
            <span>
              {callStatus === "called"
                ? t("calling.callInitiated")
                : t("calling.callMe")}
            </span>
          </button>
        </div>

        <div className="calling-divider">
          <span>{t("calling.or")}</span>
        </div>

        {/* Inbound — Call us directly (on bottom) */}
        <div className="calling-section">
          <label className="calling-panel-label">
            {t("calling.inboundLabel")}
          </label>
          <button className="calling-inbound-btn" onClick={handleCopyNumber}>
            <span className="calling-inbound-number">{inboundNumber}</span>
            {copied ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#48e5ff"
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
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
            )}
            <span className="calling-copy-hint">
              {copied ? t("calling.copied") : t("calling.callUs")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
