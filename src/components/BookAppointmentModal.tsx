import { useState } from "react";

interface CompanyData {
  companyName: string;
  industry: string;
  companySize: string;
  website: string;
  country: string;
  phoneNumber: string;
  address: string;
  description: string;
  email: string;
}

interface BookAppointmentModalProps {
  onClose: () => void;
}

export default function BookAppointmentModal({
  onClose,
}: BookAppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState<CompanyData>({
    companyName: "",
    industry: "",
    companySize: "",
    website: "",
    country: "",
    phoneNumber: "",
    address: "",
    description: "",
    email: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const AUTH_API =
        import.meta.env.VITE_AUTH_API || "http://localhost:5000/api/auth";
      const API_URL = AUTH_API.replace(/\/auth$/, "");

      const response = await fetch(`${API_URL}/company-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } else {
        const text = await response.text();
        data = { error: "Server returned non-JSON response: " + text };
      }

      if (!response.ok) {
        const errorMsg =
          data.error || data.message || `Server error: ${response.status}`;
        throw new Error(errorMsg);
      }

      setSuccess("We've received your information, our team will contact you shortly.");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.6)" }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl"
        style={{ background: "rgba(15, 22, 41, 0.95)" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10"
          aria-label="Close form"
        >
          ✕
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Get Started with Autonomiq
            </h2>
            <p className="text-gray-400 text-sm">
              Tell us about your business so our team can reach out with a
              tailored solution
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1 text-white">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 text-sm"
                placeholder="your@email.com"
              />
            </div>

            {/* Two-column grid for shorter fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium mb-1 text-white">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 text-sm"
                  placeholder="Your company name"
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium mb-1 text-white">
                  Industry <span className="text-red-400">*</span>
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                >
                  <option value="" className="bg-gray-800">
                    Select industry
                  </option>
                  <option value="Technology" className="bg-gray-800">
                    Technology
                  </option>
                  <option value="Healthcare" className="bg-gray-800">
                    Healthcare
                  </option>
                  <option value="Finance" className="bg-gray-800">
                    Finance
                  </option>
                  <option value="Retail" className="bg-gray-800">
                    Retail
                  </option>
                  <option value="Education" className="bg-gray-800">
                    Education
                  </option>
                  <option value="Real Estate" className="bg-gray-800">
                    Real Estate
                  </option>
                  <option value="Manufacturing" className="bg-gray-800">
                    Manufacturing
                  </option>
                  <option value="Hospitality" className="bg-gray-800">
                    Hospitality
                  </option>
                  <option value="Other" className="bg-gray-800">
                    Other
                  </option>
                </select>
              </div>

              {/* Company Size */}
              <div>
                <label className="block text-sm font-medium mb-1 text-white">
                  Company Size <span className="text-red-400">*</span>
                </label>
                <select
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                >
                  <option value="" className="bg-gray-800">
                    Select size
                  </option>
                  <option value="1-10" className="bg-gray-800">
                    1-10 employees
                  </option>
                  <option value="11-50" className="bg-gray-800">
                    11-50 employees
                  </option>
                  <option value="51-200" className="bg-gray-800">
                    51-200 employees
                  </option>
                  <option value="201-500" className="bg-gray-800">
                    201-500 employees
                  </option>
                  <option value="501+" className="bg-gray-800">
                    501+ employees
                  </option>
                </select>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium mb-1 text-white">
                  Country <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 text-sm"
                  placeholder="Your country"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium mb-1 text-white">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 text-sm"
                  placeholder="+1 234 567 8900"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium mb-1 text-white">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 text-sm"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium mb-1 text-white">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 text-sm"
                placeholder="Business address"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1 text-white">
                Business Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 resize-none text-sm"
                placeholder="Tell us about your business..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2.5 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-2.5 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-medium transition-all text-white text-sm"
              >
                Maybe Later
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-5 py-2.5 bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
              >
                {loading ? "Saving..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
