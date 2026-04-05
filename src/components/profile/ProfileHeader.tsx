import { useAuthStore } from '@/stores/authStore'

export default function ProfileHeader() {
  const { user } = useAuthStore()

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    }
    return user?.email?.charAt(0).toUpperCase() || 'U'
  }

  return (
    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-5 text-white">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border-2 border-white/30">
          <span className="text-xl font-bold">
            {getInitials()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold truncate">
            {user?.firstName} {user?.lastName}
          </h2>
        </div>
      </div>
    </div>
  )
}