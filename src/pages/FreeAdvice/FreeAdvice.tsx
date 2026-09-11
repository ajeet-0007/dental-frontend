import { useEffect, useState } from "react";
import {
  Wrench,
  Headphones,
  Send,
  ShieldCheck,
  MessageSquare,
  Stethoscope,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/api";
import { useAuthStore } from "@/stores/authStore";
import Seo from "@/components/seo/Seo";

const equipmentCategories = [
  "Dental Chair",
  "Autoclave / Sterilizer",
  "X-Ray / RVG",
  "Handpiece",
  "Airotor / Micromotor",
  "Suction / Compressor",
  "Curing Light",
  "Ultrasonic Scaler",
  "Endo Motor",
  "Dental Light",
  "Other",
];

const steps = [
  {
    title: "Describe Your Equipment Problem",
    desc: "Tell us which equipment is troubling you and what's not working — repair, maintenance, or how to use it.",
    Icon: MessageSquare,
    color: "from-sky-500 to-blue-500",
  },
  {
    title: "Get Free Expert Advice",
    desc: "Our dental equipment experts give you honest, zero-cost guidance on whether to repair or replace.",
    Icon: Headphones,
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Fix It Like a Pro",
    desc: "Apply the repair/usage tips we share — or buy genuine parts from Dentzoo and save big.",
    Icon: Wrench,
    color: "from-amber-500 to-orange-500",
  },
];

export default function FreeAdvice() {
  const { isAuthenticated, user } = useAuthStore();
  const [formData, setFormData] = useState({
    doctorName: "",
    clinicName: "",
    email: "",
    phone: "",
    equipmentName: "",
    equipmentCategory: "",
    equipmentBrand: "",
    problemDescription: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        doctorName: `${user.firstName} ${user.lastName}`.trim() || prev.doctorName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [isAuthenticated, user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        doctorName:
          formData.doctorName ||
          (isAuthenticated ? `${user?.firstName} ${user?.lastName}`.trim() : ""),
        email: formData.email || (isAuthenticated ? user?.email || "" : ""),
        ...(isAuthenticated && { userId: user?.id }),
      };
      await api.post("/advice-requests", payload);
      toast.success("Request submitted! Our experts will contact you with free advice soon.");
      setFormData({
        doctorName: "",
        clinicName: "",
        email: "",
        phone: "",
        equipmentName: "",
        equipmentCategory: "",
        equipmentBrand: "",
        problemDescription: "",
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message?.[0] || "Failed to submit. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Seo
        title="Free Equipment Advice for Dental Clinics | Dentzoo"
        description="Submit your dental equipment problem for FREE expert advice. Dentzoo helps doctors repair, use, and maintain autoclaves, X-rays, handpieces, suction motors and more — no charges, no obligations."
        canonical="/free-advice"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Free Dental Equipment Advice",
            provider: { "@type": "Organization", name: "Dentzoo" },
            description:
              "Free expert advice for repairing and using dental equipment. Doctors submit their equipment problems and get honest guidance on repair, maintenance, or usage.",
            areaServed: "IN",
          },
        ]}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-blue-600 to-indigo-700 py-12 md:py-16">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
          <div className="relative container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur text-white text-xs font-semibold uppercase tracking-widest rounded-full mb-5"
            >
              <ShieldCheck className="w-4 h-4" />
              100% Free · For Doctors
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight"
            >
              Free Equipment Advice for{" "}
              <span className="text-amber-300">Doctors</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-5 max-w-2xl mx-auto text-blue-100 md:text-lg leading-relaxed"
            >
              Struggling with a faulty autoclave, X-ray, suction motor or handpiece?
              Tell us your equipment problem and get{" "}
              <span className="font-semibold text-white">free expert advice</span> on
              how to repair it, maintain it, or use it — no charges, ever.
            </motion.p>
            <motion.a
              href="#advice-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 inline-flex items-center gap-2 px-7 py-3 bg-amber-400 text-gray-900 font-semibold rounded-xl hover:bg-amber-300 transition-colors shadow-lg shadow-amber-500/30"
            >
              <Stethoscope className="w-5 h-5" />
              Ask for Free Advice
            </motion.a>
          </div>
        </section>

        {/* How it works */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
                >
                  <step.Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1">
                  Step {index + 1}
                </p>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Info / FAQ side */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-5"
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Why Dentzoo free advice?
                  </h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  {[
                    "Honest guidance — often a simple repair beats a costly new machine.",
                    "Expert technicians who know dental equipment inside-out.",
                    "No charge, no obligation, no hidden costs. We help first, ask later.",
                    "If repair parts are needed, we source genuine spares at the best price.",
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    What kind of problems we solve
                  </h3>
                </div>
                <ul className="space-y-2.5 text-sm text-gray-600">
                  {[
                    "Equipment not working / switching off mid-procedure",
                    "Making strange noises, vibrations or overheating",
                    "Poor performance (weak suction, dark X-rays, slow handpiece)",
                    "Not sure how to set up, calibrate or use a new machine",
                    "When to repair vs. replace an old unit",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              id="advice-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-500 rounded-lg flex items-center justify-center shadow-md shadow-primary-500/20">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Submit Your Equipment Problem
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Doctor Name *
                    </label>
                    <input
                      type="text"
                      name="doctorName"
                      value={formData.doctorName}
                      onChange={handleChange}
                      placeholder="Dr. ..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Clinic Name
                    </label>
                    <input
                      type="text"
                      name="clinicName"
                      value={formData.clinicName}
                      onChange={handleChange}
                      placeholder="Your clinic"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@clinic.com"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Equipment Name *
                    </label>
                    <input
                      type="text"
                      name="equipmentName"
                      value={formData.equipmentName}
                      onChange={handleChange}
                      placeholder="e.g. Suction motor"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                      Equipment Category *
                    </label>
                    <select
                      name="equipmentCategory"
                      value={formData.equipmentCategory}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
                      required
                    >
                      <option value="">Select category</option>
                      {equipmentCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Brand / Model
                  </label>
                  <input
                    type="text"
                    name="equipmentBrand"
                    value={formData.equipmentBrand}
                    onChange={handleChange}
                    placeholder="e.g. Marathon / NSK"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Problem Description *
                  </label>
                  <textarea
                    name="problemDescription"
                    value={formData.problemDescription}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Describe the problem in detail — what's wrong, when it started, any error codes, sounds, or symptoms..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Get My Free Advice
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-400">
                  Free service for dental doctors. We reply within 24 business hours.
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}