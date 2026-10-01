import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  Store,
  Trophy,
} from "lucide-react";
import api from "@/api";
import Seo from "@/components/seo/Seo";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/components/seo/seoConstants";
import { buildOrganizationJsonLd } from "@/components/seo/seoHelpers";
import { ADDRESS_INLINE, ADDRESS_LINES, COMPANY } from "@/constants/company";

function countFrom(data: unknown): number | null {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === "object" && "data" in data) {
    const nested = (data as { data?: unknown }).data;
    if (Array.isArray(nested)) return nested.length;
  }
  return null;
}

export default function About() {
  const { data: brandsData } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await api.get("/brands");
      return response.data;
    },
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await api.get("/departments");
      return response.data;
    },
  });

  const { data: productsTotal } = useQuery({
    queryKey: ["products", "total-count"],
    queryFn: async () => {
      const response = await api.get("/products", { params: { page: 1, limit: 1 } });
      return Number(response.data?.total) || 0;
    },
  });

  const brandCount = countFrom(brandsData);
  const departmentCount = countFrom(departmentsData);

  const liveStats = [
    {
      value: productsTotal ? productsTotal.toLocaleString("en-IN") : null,
      fallback: COMPANY.stats[3].value,
      label: COMPANY.stats[3].label,
    },
    {
      value: brandCount ? String(brandCount) : null,
      fallback: COMPANY.stats[2].value,
      label: COMPANY.stats[2].label,
    },
    {
      value: departmentCount ? String(departmentCount) : null,
      fallback: COMPANY.stats[1].value,
      label: "Departments Served",
    },
    {
      value: COMPANY.stats[0].value,
      fallback: COMPANY.stats[0].value,
      label: COMPANY.stats[0].label,
    },
  ];

  return (
    <>
      <Seo
        title="About Dentzoo | India's Trusted Online Dental Store"
        description="Learn about Dentzoo — Bareilly's online dental store for authentic equipment, instruments, materials and consumables. 100% genuine brands, best prices and reliable delivery across India."
        canonical="/about"
        jsonLd={[
          buildOrganizationJsonLd(),
          {
            "@context": "https://schema.org",
            "@type": "Store",
            name: COMPANY.legalName,
            alternateName: [COMPANY.tradeName, COMPANY.brandName],
            legalName: COMPANY.legalName,
            url: SITE_URL,
            image: absoluteUrl("/og-image.png"),
            telephone: COMPANY.contact.phoneDisplay,
            email: COMPANY.contact.email,
            priceRange: "₹₹",
            currenciesAccepted: "INR",
            paymentAccepted: "Cash, UPI, Cards, Net Banking",
            address: {
              "@type": "PostalAddress",
              streetAddress: `${COMPANY.address.floor}, ${COMPANY.address.building}, ${COMPANY.address.street}, ${COMPANY.address.locality}`,
              addressLocality: COMPANY.address.city,
              addressRegion: COMPANY.address.state,
              postalCode: COMPANY.address.pin,
              addressCountry: "IN",
            },
            areaServed: { "@type": "Country", name: "India" },
            description: COMPANY.aboutBlurb,
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
              <Store className="w-4 h-4" />
              {SITE_NAME} · Est. Bareilly, UP
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight"
            >
              About <span className="text-amber-300">{COMPANY.brandName}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-5 max-w-2xl mx-auto text-blue-100 md:text-lg leading-relaxed"
            >
              {COMPANY.aboutBlurb}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-7 py-3 bg-amber-400 text-gray-900 font-semibold rounded-xl hover:bg-amber-300 transition-colors shadow-lg shadow-amber-500/30"
              >
                <Store className="w-5 h-5" />
                Browse the Catalog
              </Link>
              <Link
                to="/help"
                className="inline-flex items-center gap-2 px-7 py-3 bg-white/15 backdrop-blur text-white font-semibold rounded-xl hover:bg-white/25 transition-colors border border-white/20"
              >
                <MessageCircle className="w-5 h-5" />
                Talk to Us
              </Link>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Our Story */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-center mb-10 md:mb-14"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">
                    Who We Are
                  </p>
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
                    Built by people who know dental
                  </h2>
                </div>
              </div>
              <div className="space-y-4 text-sm md:text-base text-gray-600 leading-relaxed">
                <p>
                  {COMPANY.brandName} began with a simple frustration: dental practices across
                  India were overpaying for equipment and running low on consumables, because
                  there was no reliable way to source genuine stock online.
                </p>
                <p>
                  We set out to change that. Today we supply dental professionals with
                  everything from autoclaves, X-ray machines and dental chairs to endodontic
                  files, impression materials and daily consumables — sourced only through
                  authorised channels, backed by proper documentation, and shipped to clinics in
                  every state.
                </p>
                <p>
                  We are based in Bareilly, Uttar Pradesh, and we work the way we would want a
                  supplier to work for our own clinic: honest pricing, honest product
                  descriptions, and support that picks up the phone.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <BadgeCheck className="w-6 h-6 text-primary-600 mb-2" />
                <p className="text-sm font-semibold text-gray-900">Authorised supply only</p>
                <p className="text-xs text-gray-500 mt-1">
                  Every product traced to its manufacturer.
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <MapPin className="w-6 h-6 text-emerald-600 mb-2" />
                <p className="text-sm font-semibold text-gray-900">Nationwide delivery</p>
                <p className="text-xs text-gray-500 mt-1">Insured shipping to every state.</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <Phone className="w-6 h-6 text-violet-600 mb-2" />
                <p className="text-sm font-semibold text-gray-900">Real human support</p>
                <p className="text-xs text-gray-500 mt-1">{COMPANY.contact.hours}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <Trophy className="w-6 h-6 text-amber-600 mb-2" />
                <p className="text-sm font-semibold text-gray-900">Quality certified</p>
                <p className="text-xs text-gray-500 mt-1">Standards we are audited against.</p>
              </div>
            </div>
          </motion.section>

          {/* Stats */}
          <section className="px-4 md:px-6 py-8 md:py-10 bg-gradient-to-b from-white via-gray-50/80 to-white rounded-3xl border border-gray-100 shadow-sm mb-10 md:mb-14">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-1">
                  By The Numbers
                </p>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
                  Dentzoo in Numbers
                </h2>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 px-4">
              {liveStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    {stat.value ?? stat.fallback}
                    {stat.value && stat.label === "Products" ? "+" : ""}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="mb-10 md:mb-14">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <BadgeCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">
                  Our Promise
                </p>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
                  Why Dentzoo
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {COMPANY.valueProps.map((prop, index) => (
                <motion.div
                  key={prop.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200 transition-all duration-300"
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${prop.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <prop.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{prop.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{prop.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Timeline */}
          {COMPANY.milestones.length > 0 && (
            <section className="mb-10 md:mb-14">
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-1">
                    Our Journey
                  </p>
                  <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
                    How We Got Here
                  </h2>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <div className="relative border-l-2 border-primary-100 ml-2 space-y-8">
                  {COMPANY.milestones.map((milestone, index) => (
                    <motion.div
                      key={milestone.year}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative pl-6 md:pl-8"
                    >
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gradient-to-br from-primary-500 to-blue-500 ring-4 ring-primary-50" />
                      <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">
                        {milestone.year}
                      </p>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">
                        {milestone.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{milestone.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Registered Address + GSTIN */}
          <section className="mb-10 md:mb-14">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center shadow-lg shadow-slate-500/20">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-1">
                  Legal Details
                </p>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
                  Registered Office
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-2">
                      Business Address
                    </p>
                    <address className="not-italic text-sm text-gray-600 leading-relaxed">
                      {ADDRESS_LINES.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </address>
                    <p className="mt-3 text-xs text-gray-400">{ADDRESS_INLINE}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                    <BadgeCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
                      Business Identity
                    </p>
                    <dl className="space-y-2 text-sm">
                      <div className="flex items-baseline gap-3">
                        <dt className="text-gray-500 w-24 flex-shrink-0">Legal Name</dt>
                        <dd className="font-medium text-gray-900 truncate">{COMPANY.legalName}</dd>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <dt className="text-gray-500 w-24 flex-shrink-0">Trade Name</dt>
                        <dd className="font-medium text-gray-900">{COMPANY.tradeName}</dd>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <dt className="text-gray-500 w-24 flex-shrink-0">Brand</dt>
                        <dd className="font-medium text-gray-900">{COMPANY.brandName}</dd>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <dt className="text-gray-500 w-24 flex-shrink-0">{COMPANY.gstinLabel}</dt>
                        <dd className="font-mono font-medium text-gray-900 break-all">
                          {COMPANY.gstin}
                        </dd>
                      </div>
                      <div className="flex items-baseline gap-3">
                        <dt className="text-gray-500 w-24 flex-shrink-0">State</dt>
                        <dd className="font-medium text-gray-900">
                          {COMPANY.address.state} ({COMPANY.gstin.slice(0, 2)})
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                    href={`tel:${COMPANY.contact.phone}`}
                    className="group flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-white hover:shadow-md transition-all duration-300"
                  >
                    <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-0.5">
                        Call Us
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {COMPANY.contact.phoneDisplay}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {COMPANY.contact.hours}
                      </p>
                    </div>
                  </a>
                  <a
                    href={`mailto:${COMPANY.contact.email}`}
                    className="group flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-white hover:shadow-md transition-all duration-300"
                  >
                    <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-110 transition-transform">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-0.5">
                        Email Us
                      </p>
                      <p className="text-sm font-medium text-gray-900 break-all">
                        {COMPANY.contact.email}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{COMPANY.contact.replyTime}</p>
                    </div>
                  </a>
                </div>
              </motion.div>
            </div>
          </section>

          {/* CTA */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-blue-600 to-indigo-700 px-6 py-10 md:py-12 text-center mb-8"
          >
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-12 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight mb-3">
                Not sure what you need?
              </h2>
              <p className="max-w-xl mx-auto text-blue-100 text-sm md:text-base leading-relaxed mb-7">
                Tell us about your equipment problem or your clinic requirements and our team
                will get back to you with an honest recommendation — free of charge.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/help"
                  className="inline-flex items-center gap-2 px-7 py-3 bg-amber-400 text-gray-900 font-semibold rounded-xl hover:bg-amber-300 transition-colors shadow-lg shadow-amber-500/30"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contact Our Team
                </Link>
                <Link
                  to="/free-advice"
                  className="inline-flex items-center gap-2 px-7 py-3 bg-white/15 backdrop-blur text-white font-semibold rounded-xl hover:bg-white/25 transition-colors border border-white/20"
                >
                  Request Free Advice
                </Link>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </>
  );
}
