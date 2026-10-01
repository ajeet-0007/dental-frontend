import {
  BadgeCheck,
  Award,
  Stamp,
  ShieldCheck,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  PackageCheck,
  IndianRupee,
  Truck,
  Headphones,
} from "lucide-react";

export interface CompanyAddress {
  floor: string;
  building: string;
  street: string;
  locality: string;
  city: string;
  district: string;
  state: string;
  pin: string;
  country: string;
}

export interface CompanyStat {
  value: string;
  label: string;
}

export interface CompanyAward {
  name: string;
  desc: string;
  color: string;
  icon: typeof BadgeCheck;
}

export interface CompanyValueProp {
  title: string;
  desc: string;
  gradient: string;
  icon: typeof BadgeCheck;
}

export interface CompanyMilestone {
  year: string;
  title: string;
  desc: string;
}

export const COMPANY = {
  brandName: "Dentzoo",
  legalName: "MAMTA DEVI",
  tradeName: "SINGH DENTAL AND SURGICAL",
  tagline: "India's most trusted dental e-commerce platform",
  aboutBlurb:
    "India's most trusted dental e-commerce platform. Quality products, competitive prices, and reliable delivery for dental professionals nationwide.",
  gstin: "09BDQPD8206H1ZD",
  gstinLabel: "GSTIN",
  address: {
    floor: "Kheit No 287",
    building: "Ground Floor",
    street: "Dohra Chauraha, Pilibhit Bypass Road",
    locality: "Samrat Ashok Nagar",
    city: "Bareilly",
    district: "Bareilly",
    state: "Uttar Pradesh",
    pin: "243006",
    country: "India",
  } as CompanyAddress,
  contact: {
    phoneDisplay: "+91 9275226030",
    phone: "+919275226030",
    whatsapp: "919275226030",
    email: "support@dentzoo.com",
    hours: "10AM – 7PM, Monday to Saturday",
    replyTime: "We reply to every message within 24 business hours.",
  },
  socials: [
    {
      icon: Instagram,
      href: "https://www.instagram.com/dent.zoo?igsh=MTY4eHJzdzhrZ2hlaA%3D%3D",
      label: "Instagram",
    },
    {
      icon: Facebook,
      href: "https://www.facebook.com/profile.php?id=61592577323923",
      label: "Facebook",
    },
    { icon: Twitter, href: "https://x.com/Dentzooo", label: "Twitter" },
    { icon: Youtube, href: "https://www.youtube.com/@Dentzoo", label: "YouTube" },
    {
      icon: Linkedin,
      href: "https://www.linkedin.com/in/dentzoo-india-b18a66424/",
      label: "LinkedIn",
    },
  ],
  stats: [
    { value: "10+", label: "Years Experience" },
    { value: "500+", label: "Happy Clients" },
    { value: "50+", label: "Brand Partners" },
    { value: "1000+", label: "Products" },
  ] as CompanyStat[],
  awards: [
    {
      name: "ISO 9001:2015",
      desc: "Quality Management",
      color: "from-emerald-500 to-teal-500",
      icon: BadgeCheck,
    },
    {
      name: "GDP Approved",
      desc: "Good Distribution",
      color: "from-blue-500 to-cyan-500",
      icon: ShieldCheck,
    },
    {
      name: "CE Certified",
      desc: "Europe Compliance",
      color: "from-violet-500 to-purple-500",
      icon: Stamp,
    },
    {
      name: "Quality Assurance",
      desc: "Standard Verified",
      color: "from-amber-500 to-orange-500",
      icon: Award,
    },
  ] as CompanyAward[],
  valueProps: [
    {
      title: "100% Authentic Products",
      desc: "Every instrument, material and machine is sourced directly from authorised channels — no grey market, no substitutes, ever.",
      gradient: "from-primary-500 to-blue-500",
      icon: PackageCheck,
    },
    {
      title: "Best Prices for Clinics",
      desc: "We negotiate directly with manufacturers so dental practices get genuine equipment at prices that make sense for a clinic budget.",
      gradient: "from-emerald-500 to-teal-500",
      icon: IndianRupee,
    },
    {
      title: "Reliable Delivery Across India",
      desc: "Temperature-aware and insured shipping to practices in every state, so your clinic stays open and your patients stay treated.",
      gradient: "from-blue-500 to-cyan-500",
      icon: Truck,
    },
    {
      title: "Support That Knows Dental",
      desc: "Talk to people who understand autoclaves, X-rays and handpieces — not a call centre reading from a script.",
      gradient: "from-violet-500 to-purple-500",
      icon: Headphones,
    },
  ] as CompanyValueProp[],
  milestones: [] as CompanyMilestone[],
} as const;

export const ADDRESS_LINES: string[] = [
  COMPANY.address.floor,
  COMPANY.address.building,
  COMPANY.address.street,
  COMPANY.address.locality,
  `${COMPANY.address.city}, ${COMPANY.address.state} ${COMPANY.address.pin}`,
  COMPANY.address.country,
];

export const ADDRESS_INLINE = `${COMPANY.address.locality}, ${COMPANY.address.city}, ${COMPANY.address.state} ${COMPANY.address.pin}, ${COMPANY.address.country}`;

export const WHATSAPP_URL = `https://wa.me/${COMPANY.contact.whatsapp}`;
