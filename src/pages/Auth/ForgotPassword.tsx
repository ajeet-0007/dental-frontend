import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/api'
import { useAuthStore } from '@/stores/authStore'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, KeyRound, CheckCircle2 } from 'lucide-react'
import ReCaptchaWidget from '@/components/common/ReCaptchaWidget'
import OtpInput from '@/components/common/OtpInput'

type ForgotStep = 'email' | 'otp' | 'password' | 'success'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [step, setStep] = useState<ForgotStep>('email')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const sendOtpMutation = useMutation({
    mutationFn: (data: { email: string }) =>
      api.post('/auth/forgot-password', data, {
        headers: { Recaptcha: captchaToken },
      }),
    onSuccess: () => {
      setStep('otp')
      setCountdown(60)
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to send OTP')
    },
  })

  const verifyOtpMutation = useMutation({
    mutationFn: (data: { email: string; code: string }) =>
      api.post('/auth/verify-otp', { ...data, type: 'reset' }),
    onSuccess: () => {
      setStep('password')
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Invalid OTP')
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { email: string; code: string; newPassword: string }) =>
      api.post('/auth/reset-password', data),
    onSuccess: (response) => {
      const { user, accessToken, refreshToken } = response.data
      setAuth(user, accessToken, refreshToken)
      setStep('success')
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to reset password')
    },
  })

  const resendOtpMutation = useMutation({
    mutationFn: (data: { email: string }) =>
      api.post('/auth/forgot-password', data),
    onSuccess: () => {
      setCountdown(60)
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to resend OTP')
    },
  })

  const handleSendOtp = () => {
    setError('')
    if (!email) {
      setError('Please enter your email')
      return
    }
    sendOtpMutation.mutate({ email })
  }

  const handleVerifyOtp = (code: string) => {
    setError('')
    verifyOtpMutation.mutate({ email, code })
  }

  const handleResetPassword = () => {
    setError('')
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    resetPasswordMutation.mutate({
      email,
      code: '',
      newPassword,
    })
  }

  const handleResendOtp = () => {
    setError('')
    resendOtpMutation.mutate({ email })
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIEwgMCAxMCBMIDEwIDEwIE06IDEwIDExIEwgMSAxMSBMIDEgMTAgTCAxMCAxMCBaTSAxMSAxMCBMIDEwIDEwIEwgMTAgMTEgWiIgZmlsbD0ibm9uZSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMGUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-30"></div>
        
        <div className="relative z-10 p-8 flex flex-col justify-between w-full">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Dentalkart</h1>
                <p className="text-primary-200 text-xs">Your Trusted Dental Partner</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white leading-tight">
                Reset Your <span className="text-primary-200">Password</span>
              </h2>
              <p className="text-primary-100 text-sm mt-2">
                Don't worry, it happens to the best of us. We'll help you get back into your account.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z"/>
              </svg>
              <span className="font-bold">Dentalkart</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 lg:p-8">
            {/* Step: Email */}
            {step === 'email' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Forgot Password?</h2>
                  <p className="text-gray-500 mt-2 text-sm">
                    Enter your email address and we'll send you a verification code to reset your password.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm mb-4">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all bg-gray-50/50 text-gray-900 placeholder:text-gray-400 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ReCaptchaWidget onChange={setCaptchaToken} />
                  </div>

                  <button
                    onClick={handleSendOtp}
                    disabled={sendOtpMutation.isPending || !email}
                    className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 active:scale-[0.98] text-sm"
                  >
                    {sendOtpMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send OTP</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Step: OTP Verification */}
            {step === 'otp' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="h-8 w-8 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Enter Verification Code</h2>
                  <p className="text-gray-500 mt-2 text-sm">
                    We sent a 4-digit code to<br />
                    <span className="font-medium text-gray-700">{email}</span>
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm mb-4">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <OtpInput
                    length={4}
                    onComplete={handleVerifyOtp}
                    isLoading={verifyOtpMutation.isPending}
                  />

                  {verifyOtpMutation.isPending && (
                    <div className="flex items-center justify-center gap-2 text-primary-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Verifying...</span>
                    </div>
                  )}

                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-sm text-gray-500">
                        Resend OTP in <span className="font-medium text-primary-600">{countdown}s</span>
                      </p>
                    ) : (
                      <button
                        onClick={handleResendOtp}
                        disabled={resendOtpMutation.isPending}
                        className="text-sm text-primary-600 hover:text-primary-700 font-semibold disabled:opacity-50"
                      >
                        {resendOtpMutation.isPending ? 'Sending...' : 'Resend OTP'}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setStep('email')
                      setError('')
                    }}
                    className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Change Email
                  </button>
                </div>
              </>
            )}

            {/* Step: New Password */}
            {step === 'password' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Set New Password</h2>
                  <p className="text-gray-500 mt-2 text-sm">
                    Enter your new password below.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm mb-4">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      New Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full pl-11 pr-11 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all bg-gray-50/50 text-gray-900 placeholder:text-gray-400 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Minimum 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all bg-gray-50/50 text-gray-900 placeholder:text-gray-400 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleResetPassword}
                    disabled={resetPasswordMutation.isPending || !newPassword || !confirmPassword}
                    className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 active:scale-[0.98] text-sm"
                  >
                    {resetPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Resetting Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Step: Success */}
            {step === 'success' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Password Reset Successful!</h2>
                <p className="text-gray-500 mt-2 text-sm mb-6">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 active:scale-[0.98] text-sm"
                >
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Back to Login */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-xs text-gray-500">Remember your password?</span>
                </div>
              </div>
              
              <Link
                to="/login"
                className="mt-4 w-full py-3 border border-gray-200 text-gray-700 rounded-xl hover:border-primary-500 hover:text-primary-600 font-medium transition-all text-sm text-center block"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
