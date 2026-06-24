import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { Globe, LogOut, User, Menu, X } from "lucide-react";

const LANGUAGES = [
  { code: "en" as const, label: "English" },
  { code: "fr" as const, label: "Français" },
  { code: "ar" as const, label: "العربية" },
];

const NAV_LINKS = [
  { path: "/about", key: "nav.about" },
  { path: "/ai-assistants", key: "nav.teams" },
  { path: "/solutions", key: "nav.solutions" },
  { path: "/book-appointment", key: "nav.bookAppointment" },
];

export default function NavBar() {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();

  const isRTL = language === "ar";

  return (
    <nav
      className={`fixed top-0 w-full z-50 px-3 sm:px-4 md:px-6 py-3 md:py-4 flex justify-between items-center navbar-glass ${isRTL ? "flex-row-reverse" : ""}`}
    >
      {/* Logo */}
      <Link
        to="/"
        className={`flex items-center gap-2 md:gap-3 shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <img
          src="/assets/logo.jpeg"
          alt="logo"
          className="w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded object-cover"
        />
        <span className="text-white font-bold tracking-tight text-xl sm:text-2xl md:text-3xl">
          Autonomiq
        </span>
      </Link>

      {/* Right side: Nav links + Language + Auth (all in same row) */}
      <div
        className={`flex gap-2 items-center ${isRTL ? "flex-row-reverse" : ""}`}
      >
        {/* Page links (desktop) — pill style matching language/auth */}
        <div
          className={`hidden xl:flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-2 text-sm font-medium rounded-full border backdrop-blur-md transition-colors ${
                location.pathname === link.path
                  ? "text-cyan-400 bg-white/15 border-cyan-500/30"
                  : "text-gray-300 bg-white/10 border-white/20 hover:bg-white/20 hover:text-white"
              }`}
            >
              {t(link.key)}
            </Link>
          ))}
        </div>

        {/* Divider (desktop only) */}
        <div className="hidden xl:block w-px h-6 bg-white/15 mx-1" />

        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
            aria-label="Change language"
            data-testid="language-switcher"
          >
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300" />
            <span className="text-sm font-medium text-gray-300 hidden md:inline">
              {LANGUAGES.find((l) => l.code === language)?.label}
            </span>
          </button>

          {showLanguageMenu && (
            <div
              className={`absolute top-12 bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl p-2 w-40 z-50 ${isRTL ? "left-0" : "right-0"}`}
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLanguageMenu(false);
                  }}
                  className={`w-full px-4 py-2 rounded-xl transition-colors ${lang.code === "ar" ? "text-right" : "text-left"} ${language === lang.code ? "bg-black/10 font-bold" : "hover:bg-black/5"}`}
                  data-testid={`language-option-${lang.code}`}
                >
                  <span className="text-sm text-gray-700">{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Auth */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <User className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-gray-300 max-w-[100px] truncate hidden md:inline">
                {user.name}
              </span>
            </button>
            {showUserMenu && (
              <div
                className={`absolute top-12 bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl p-2 w-40 z-50 ${isRTL ? "left-0" : "right-0"}`}
              >
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 rounded-xl transition-colors flex items-center gap-2 text-left hover:bg-black/5"
                >
                  <LogOut className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {t("auth.nav.logout")}
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`flex gap-1.5 sm:gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <Link
              to="/login"
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-colors whitespace-nowrap"
            >
              {t("auth.nav.login")}
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-cyan-500 to-blue-600 rounded-full hover:from-cyan-400 hover:to-blue-500 transition-all hidden md:block"
            >
              {t("auth.nav.signup")}
            </Link>
          </div>
        )}

        {/* Mobile menu toggle */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="xl:hidden flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-colors"
          aria-label="Toggle menu"
        >
          {showMobileMenu ? (
            <X className="w-4 h-4 text-gray-300" />
          ) : (
            <Menu className="w-4 h-4 text-gray-300" />
          )}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {showMobileMenu && (
        <div
          className={`absolute top-full right-3 mt-2 w-44 bg-[#0a1828]/95 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-2 flex flex-col gap-0.5 xl:hidden z-50 shadow-2xl animate-dropdown ${isRTL ? "right-auto left-3" : ""}`}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setShowMobileMenu(false)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? "text-cyan-400 bg-white/10"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {t(link.key)}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
