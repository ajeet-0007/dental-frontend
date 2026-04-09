import { Trash2 } from 'lucide-react'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Address?',
  message = 'Are you sure you want to delete this address? This action cannot be undone.',
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-[fadeIn_0.2s_ease-out]">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          {title}
        </h3>
        <p className="text-gray-500 text-center mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
