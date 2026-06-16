import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/api'
import { useAuthStore } from '@/stores/authStore'
import { Shield, ShieldCheck, Loader2, Clock, CheckCircle2, Upload, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const STATE_DENTAL_COUNCILS = [
  'Andhra Pradesh State Dental Council',
  'Arunachal Pradesh State Dental Council',
  'Assam State Dental Council',
  'Bihar State Dental Council',
  'Chhatisgarh State Dental Council',
  'Dental Council of Chandigarh',
  'Delhi State Dental Council',
  'Goa State Dental Council',
  'Gujarat State Dental Council',
  'Haryana State Dental Council',
  'Himachal Pradesh State Dental Council',
  'Jharkhand State Dental Council',
  'J & K State Dental Council',
  'Karnataka State Dental Council',
  'Kerala State Dental Council',
  'Madhya Pradesh State Dental Council',
  'Maharashtra State Dental Council',
  'Meghalaya State Dental Council',
  'Mizoram State Registration Tribunal',
  'Manipur State Dental Council',
  'Nagaland State Dental Council',
  'Orissa State Dental Council',
  'State Dental Council, Puducherry',
  'Punjab State Dental Council',
  'Rajasthan State Dental Council',
  'Sikkim Dental Registration Tribunal',
  'Tamil Nadu State Dental Council',
  'Tripura State Dental Council',
  'Telangana Dental Council',
  'Uttar Pradesh State Dental Council',
  'Uttarakhand Dentists Registration Tribunals',
  'West Bengal State Dental Council',
]

export default function ProfessionalVerification() {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const redirectAfterVerification = sessionStorage.getItem('redirectAfterVerification')
  const [formData, setFormData] = useState({
    dentalRegistrationId: '',
    stateDentalCouncil: '',
  })

  const { data: statusData, isLoading, refetch } = useQuery({
    queryKey: ['professional-verification-status'],
    queryFn: () => api.get('/profile/verification'),
  })

  const submitMutation = useMutation({
    mutationFn: (data: any) => api.post('/profile/verification', data),
    onSuccess: (res) => {
      if (res.data.verified) {
        const currentUser = useAuthStore.getState().user
        if (currentUser) {
          useAuthStore.getState().setUser({ ...currentUser, isProfessionalVerified: true })
        }
        toast.success('Professional credentials verified successfully!')
        setShowForm(false)
      } else if (res.data.retryable) {
        toast.error(res.data.error || 'Verification failed. Please try again.')
      } else {
        toast.error(res.data.error || 'Could not verify credentials. Please check your registration ID.')
      }
      refetch()
    },
    onError: () => {
      toast.error('Failed to submit verification. Please try again.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitMutation.mutate({
      dentalRegistrationId: formData.dentalRegistrationId,
      stateDentalCouncil: formData.stateDentalCouncil,
    })
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-20 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  const status = statusData?.data
  const isVerified = status?.verified
  const professional = status?.professional

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white rounded-2xl p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isVerified ? 'bg-emerald-100' : 'bg-gray-100'}`}>
            {isVerified ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            ) : (
              <Shield className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Professional Verification</h3>
            <p className="text-sm text-gray-500">Verify your dental credentials</p>
          </div>
        </div>
        {!isVerified && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium text-sm transition-colors"
          >
            Verify Now
          </button>
        )}
      </div>

      {isVerified ? (
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800">Professionally Verified</p>
                <p className="text-sm text-emerald-600">
                  Verified via {professional?.verificationMethod === 'dci_idr' ? 'DCI Indian Dentists Register' : professional?.verificationMethod}
                  {professional?.verifiedAt && ` on ${new Date(professional.verifiedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                </p>
                {professional?.dentalRegistrationId && (
                  <p className="text-sm text-emerald-600 mt-1">
                    Registration ID: {professional.dentalRegistrationId} | {professional.stateDentalCouncil}
                  </p>
                )}
              </div>
            </div>
          </div>
          {redirectAfterVerification && (
            <button
              onClick={() => {
                const url = redirectAfterVerification
                sessionStorage.removeItem('redirectAfterVerification')
                navigate(url)
              }}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              Continue to Checkout
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : showForm ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Dental Council Registration ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.dentalRegistrationId}
              onChange={(e) => setFormData({ ...formData, dentalRegistrationId: e.target.value })}
              placeholder="e.g., A1234"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Enter the registration number from your State Dental Council</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              State Dental Council <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.stateDentalCouncil}
              onChange={(e) => setFormData({ ...formData, stateDentalCouncil: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">Select State Dental Council</option>
              {STATE_DENTAL_COUNCILS.map((council) => (
                <option key={council} value={council}>{council}</option>
              ))}
            </select>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700 flex items-center gap-2">
              <Clock className="h-4 w-4 flex-shrink-0" />
              Verification typically takes 5-10 seconds. We check your credentials against the DCI Indian Dentists Register.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Submit for Verification
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-gray-400" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Not Yet Verified</h4>
          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
            Verify your professional credentials to unlock exclusive benefits and build trust with your patients.
          </p>
          {professional?.verificationAttempts > 0 && (
            <div className="text-xs text-gray-400">
              {professional?.verificationAttempts} attempt{professional?.verificationAttempts > 1 ? 's' : ''} made
              {professional?.verificationError && ` — Last error: ${professional.verificationError}`}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
