import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, X } from "lucide-react";

const PHONE_NUMBER = "+918979353136";
const WHATSAPP_NUMBER = "918979353136";

export default function ContactWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.a
              key="whatsapp"
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 320, damping: 24, delay: 0.05 }}
              className="flex items-center gap-3 bg-white rounded-2xl pl-3 pr-5 py-2.5 shadow-lg shadow-black/10 ring-1 ring-black/5 hover:shadow-xl hover:-translate-y-0.5 transition-all group"
              aria-label="Chat on WhatsApp"
              title="Chat on WhatsApp"
            >
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-md shadow-green-500/40">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </span>
              <span className="text-left">
                <span className="block text-sm font-semibold text-gray-800">WhatsApp</span>
                <span className="block text-xs text-gray-500">Chat with us now</span>
              </span>
            </motion.a>

            <motion.a
              key="call"
              href={`tel:${PHONE_NUMBER}`}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 320, damping: 24, delay: 0.12 }}
              className="flex items-center gap-3 bg-white rounded-2xl pl-3 pr-5 py-2.5 shadow-lg shadow-black/10 ring-1 ring-black/5 hover:shadow-xl hover:-translate-y-0.5 transition-all group"
              aria-label="Call now"
              title="Call +91 8979353136"
            >
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/40">
                <Phone className="h-5 w-5" fill="currentColor" />
              </span>
              <span className="text-left">
                <span className="block text-sm font-semibold text-gray-800">Call Now</span>
                <span className="block text-xs text-gray-500">+91 8979353136</span>
              </span>
            </motion.a>
          </>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.9 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-600/40 ring-2 ring-white/10 hover:shadow-blue-500/50 transition-shadow"
        aria-label={isOpen ? "Close contact options" : "Contact us"}
        title="Contact us"
      >
        {!isOpen && (
          <motion.span
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-blue-500"
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isOpen ? "close" : "open"}
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="relative flex items-center justify-center"
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <motion.span
                className="relative flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Phone className="h-6 w-6" strokeWidth={2.5} />
              </motion.span>
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
