import { useEffect, useState } from 'react'
import { Mail, Phone, ChevronDown, ChevronUp, LifeBuoy, MessageSquare, Clock, Send, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '@/api'
import { useAuthStore } from '@/stores/authStore'

const faqs = [
  {
    question: 'How do I track my order?',
    answer: 'You can track your order by visiting the Orders section in your profile. Click on any order to see its current status and tracking information.'
  },
  {
    question: 'What is the return policy?',
    answer: 'We offer a 7-day return policy for most products. Items must be unused and in original packaging. Contact support for return initiation.'
  },
  {
    question: 'How do I update my profile information?',
    answer: 'Go to My Profile in your account settings. Click the Edit button to update your name, phone number, and other details.'
  },
  {
    question: 'How can I add or remove addresses?',
    answer: 'Navigate to My Addresses in your profile. You can add new addresses, edit existing ones, or delete them from there.'
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept all major credit/debit cards, UPI, net banking, and wallet payments through our secure payment partners.'
  },
  {
    question: 'How do I contact customer support?',
    answer: 'You can reach us through this support form, email us at support@dentzoo.com, or call us during business hours.'
  },
]

export default function HelpSupport() {
  const { isAuthenticated, user } = useAuthStore()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user?.phone) {
      setFormData(prev => ({ ...prev, phone: user.phone }))
    }
  }, [isAuthenticated, user?.phone])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const payload = {
        name: isAuthenticated ? `${user?.firstName} ${user?.lastName}`.trim() : formData.name,
        email: isAuthenticated ? user?.email || '' : formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
        ...(isAuthenticated && { userId: user?.id }),
      }
      await api.post('/support', payload)
      toast.success('Message sent! We will get back to you soon.')
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (error) {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <LifeBuoy className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-1">We're here to help</p>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Help & Support</h2>
          </div>
        </motion.div>

        {/* Quick Contact Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
        >
          <a
            href="mailto:support@dentzoo.com"
            className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all duration-300"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-0.5">Email Us</p>
              <p className="text-sm font-medium text-gray-900">support@dentzoo.com</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
          </a>

          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-0.5">Call Us</p>
              <p className="text-sm font-medium text-gray-900">+91 8979353136</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>10AM - 7PM</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FAQ Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md shadow-amber-500/20">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h3>
            </div>
            <div className="space-y-2.5">
              {faqs.map((faq, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className={`border rounded-xl overflow-hidden transition-all duration-300 ${
                    openFaq === index ? 'border-violet-200 bg-violet-50/30' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className={`font-medium text-sm pr-4 ${openFaq === index ? 'text-violet-700' : 'text-gray-900'}`}>
                      {faq.question}
                    </span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      openFaq === index ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {openFaq === index ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                  <motion.div 
                    initial={false}
                    animate={{ height: openFaq === index ? 'auto' : 0, opacity: openFaq === index ? 1 : 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-500 rounded-lg flex items-center justify-center shadow-md shadow-primary-500/20">
                <Send className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Send us a Message</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Name</label>
                  <input
                    type="text"
                    value={isAuthenticated ? `${user?.firstName} ${user?.lastName}` : formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isAuthenticated}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    value={isAuthenticated ? user?.email || '' : formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isAuthenticated}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm transition-all"
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="order">Order Related</option>
                    <option value="payment">Payment Issue</option>
                    <option value="return">Return & Refund</option>
                    <option value="product">Product Inquiry</option>
                    <option value="account">Account Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  placeholder="Tell us how we can help you..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm resize-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-600/30 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
