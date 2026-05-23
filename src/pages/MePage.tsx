import { UserConnectionGuide } from '../components/UserConnectionGuide'
import { useUser } from '../context/UserContext'

export function MePage() {
  const { currentUserId } = useUser()

  return (
    <div className="single-page">
      <UserConnectionGuide userId={currentUserId} />
    </div>
  )
}
