import { useState } from 'react'
import { Mail, Phone, ChevronDown, ChevronUp } from 'lucide-react'
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
    answer: 'You can reach us through this support form, email us at support@dentalkart.com, or call us during business hours.'
  },
]

export default function HelpSupport() {
  const { isAuthenticated, user } = useAuthStore()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      if (isAuthenticated) {
        await api.post('/support', {
          ...formData,
          userId: user?.id,
        })
      }
      toast.success('Message sent! We will get back to you soon.')
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Help & Support</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FAQ Section */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-600 text-sm">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Us</h2>
          
          <div className="flex flex-col gap-3 mb-6">
            <a
              href="mailto:support@dentalkart.com"
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">support@dentalkart.com</span>
            </a>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Phone className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">+91 98765 43210</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={isAuthenticated ? `${user?.firstName} ${user?.lastName}` : formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isAuthenticated}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={isAuthenticated ? user?.email || '' : formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isAuthenticated}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Subject</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <div>
              <label className="block text-sm text-gray-600 mb-1">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}