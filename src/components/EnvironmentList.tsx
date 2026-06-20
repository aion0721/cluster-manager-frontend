import type { UserResponse } from '../types/user'

type EnvironmentListProps = {
  environments: UserResponse[]
  loading: boolean
  selectedUserId?: string
  onRefresh: () => Promise<void>
  onSelect: (userId: string) => void
}

export function EnvironmentList({
  environments,
  loading,
  selectedUserId,
  onRefresh,
  onSelect,
}: EnvironmentListProps) {
  return (
    <section className="card">
      <div className="section-heading split-heading">
        <div>
          <h2>Pods</h2>
          <p>{environments.length} dev-container records</p>
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
              <th>pod</th>
              <th>service</th>
              <th>status</th>
            </tr>
          </thead>
          <tbody>
            {environments.map((environment) => (
              <tr
                key={environment.userId}
                className={selectedUserId === environment.userId ? 'selected-row' : undefined}
                onClick={() => onSelect(environment.userId)}
              >
                <td>{environment.userId}</td>
                <td>{environment.deployment ?? '-'}</td>
                <td>{environment.service ?? '-'}</td>
                <td>
                  <span className={`status-pill ${statusClassName(environment.status ?? environment.phase)}`}>
                    {environment.status ?? environment.phase ?? 'UNKNOWN'}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && environments.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-cell">
                  No pod records found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {loading ? <p className="muted-text">Loading pods...</p> : null}
    </section>
  )
}

function statusClassName(status?: string) {
  return (status ?? 'UNKNOWN').toLowerCase().replaceAll('_', '-')
}
