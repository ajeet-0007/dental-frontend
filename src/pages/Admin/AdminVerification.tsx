import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/api'
import { ShieldCheck, Loader2, CheckCircle2, XCircle, RefreshCw, AlertCircle } from 'lucide-react'

export default function AdminVerification() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-verification-pending', page],
    queryFn: () => api.get(`/admin/verification/pending?page=${page}&limit=20`),
  })

  const approveMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/verification/approve/${userId}`),
    onSuccess: () => {
      toast.success('User approved successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-verification-pending'] })
    },
    onError: () => toast.error('Failed to approve user'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      api.post(`/admin/verification/reject/${userId}`, { reason }),
    onSuccess: () => {
      toast.success('User rejected')
      queryClient.invalidateQueries({ queryKey: ['admin-verification-pending'] })
      setShowRejectModal(false)
      setSelectedUser(null)
      setRejectReason('')
    },
    onError: () => toast.error('Failed to reject user'),
  })

  const reVerifyMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/verification/verify/${userId}`),
    onSuccess: (res) => {
      if (res.data.verified) {
        toast.success('Verification successful!')
      } else {
        toast.error(res.data.error || 'Verification failed')
      }
      queryClient.invalidateQueries({ queryKey: ['admin-verification-pending'] })
    },
    onError: () => toast.error('Verification request failed'),
  })

  const users = data?.data?.users || []
  const total = data?.data?.total || 0
  const limit = data?.data?.limit || 20

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Professional Verification Requests</h2>
          <p className="text-sm text-gray-500 mt-1">{total} pending verifications</p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl p-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">All Clear</h3>
          <p className="text-sm text-gray-500">No pending verification requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user: any) => (
            <div key={user.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-gray-900">{user.firstName} {user.lastName}</h4>
                    <span className="text-xs text-gray-500">{user.email}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span><span className="text-gray-400">Reg ID:</span> {user.dentalRegistrationId}</span>
                    <span><span className="text-gray-400">Council:</span> {user.stateDentalCouncil}</span>
                    {user.verificationAttempts > 0 && (
                      <span><span className="text-gray-400">Attempts:</span> {user.verificationAttempts}</span>
                    )}
                  </div>
                  {user.verificationError && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {user.verificationError}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => reVerifyMutation.mutate(user.id)}
                    disabled={reVerifyMutation.isPending}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium text-sm flex items-center gap-1.5 transition-colors"
                  >
                    {reVerifyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Verify
                  </button>
                  <button
                    onClick={() => approveMutation.mutate(user.id)}
                    disabled={approveMutation.isPending}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(user)
                      setShowRejectModal(true)
                    }}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}

          {total > limit && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: Math.ceil(total / limit) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    page === i + 1 ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject Verification</h3>
            <p className="text-sm text-gray-500 mb-4">
              Reject {selectedUser?.firstName} {selectedUser?.lastName}'s verification request
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => rejectMutation.mutate({ userId: selectedUser.id, reason: rejectReason })}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium text-sm"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedUser(null)
                  setRejectReason('')
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
