import type { UserResponse } from '../types/user'

type UserListProps = {
  users: UserResponse[]
  loading: boolean
  selectedUserId?: string
  onRefresh: () => Promise<void>
  onSelect: (userId: string) => void
}

export function UserList({
  users,
  loading,
  selectedUserId,
  onRefresh,
  onSelect,
}: UserListProps) {
  return (
    <section className="card">
      <div className="section-heading split-heading">
        <div>
          <h2>Users</h2>
          <p>{users.length} users</p>
        </div>
        <button type="button" className="secondary-button" onClick={onRefresh} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>userId</th>
              <th>namespace</th>
              <th>serviceAccount</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.userId}
                className={selectedUserId === user.userId ? 'selected-row' : undefined}
                onClick={() => onSelect(user.userId)}
              >
                <td>{user.userId}</td>
                <td>{user.namespace}</td>
                <td>{user.serviceAccount ?? '-'}</td>
              </tr>
            ))}
            {!loading && users.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-cell">
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {loading ? <p className="muted-text">Loading users...</p> : null}
    </section>
  )
}
