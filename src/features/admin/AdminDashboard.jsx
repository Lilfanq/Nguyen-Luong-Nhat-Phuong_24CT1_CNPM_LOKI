import { useEffect, useState } from 'react'
import { listAccountsForAdmin, updateAccountRole } from '../auth/authService'

export default function AdminDashboard({ supabase, currentUserId, onBack }) {
  const [accounts, setAccounts] = useState([])
  const [roleDrafts, setRoleDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingUserId, setSavingUserId] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true

    const loadAccounts = async () => {
      try {
        const nextAccounts = await listAccountsForAdmin(supabase)
        if (!active) return
        setAccounts(nextAccounts)
        setRoleDrafts(Object.fromEntries(nextAccounts.map((account) => [account.id, account.role])))
        setLoadError('')
      } catch (error) {
        if (active) setLoadError(error?.message || 'Unable to load account roles.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadAccounts()
    return () => { active = false }
  }, [supabase])

  const saveRole = async (account) => {
    const requestedRole = roleDrafts[account.id]
    if (requestedRole === account.role) return

    setSavingUserId(account.id)
    setFeedback('')
    try {
      await updateAccountRole(supabase, account.id, requestedRole)
      setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, role: requestedRole } : item))
      setFeedback(`Updated role for ${account.email}.`)
    } catch (error) {
      setFeedback(error?.message || 'Unable to update account role.')
    } finally {
      setSavingUserId('')
    }
  }

  return <main className="admin-dashboard" aria-label="LOKI admin console">
    <header className="admin-dashboard-header">
      <div>
        <p className="ai-recommendation-kicker">LOKI / ADMIN</p>
        <h1>Account administration</h1>
        <p>Manage account roles. Role changes are checked by Supabase.</p>
      </div>
      <button type="button" className="admin-back-button" onClick={onBack}>Back to LOKI</button>
    </header>

    <section className="admin-account-panel" aria-label="Registered accounts">
      <div className="admin-panel-heading">
        <div>
          <p className="ai-recommendation-kicker">USER MANAGEMENT</p>
          <h2>Registered accounts</h2>
        </div>
        <span className="admin-account-count">{accounts.length} accounts</span>
      </div>

      {loading && <p className="admin-state-message">Loading accounts...</p>}
      {!loading && loadError && <p className="admin-state-message is-error">Could not load accounts. Apply `supabase/admin_roles.sql` and sign in with an admin account. {loadError}</p>}
      {!loading && !loadError && accounts.length === 0 && <p className="admin-state-message">No registered accounts found.</p>}

      {!loading && !loadError && accounts.length > 0 && <div className="admin-table-wrap">
        <table className="admin-account-table">
          <thead>
            <tr><th>Email</th><th>Created</th><th>Role</th><th>Action</th></tr>
          </thead>
          <tbody>
            {accounts.map((account) => {
              const selectedRole = roleDrafts[account.id] ?? account.role
              const isCurrentAdmin = account.id === currentUserId
              return <tr key={account.id}>
                <td>{account.email}</td>
                <td>{account.created_at ? new Date(account.created_at).toLocaleDateString() : '—'}</td>
                <td>
                  <select
                    value={selectedRole}
                    disabled={isCurrentAdmin || savingUserId === account.id}
                    onChange={(event) => setRoleDrafts((current) => ({ ...current, [account.id]: event.target.value }))}
                    aria-label={`Role for ${account.email}`}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {isCurrentAdmin && <small className="admin-self-role-note">Current account</small>}
                </td>
                <td><button type="button" className="admin-save-button" disabled={isCurrentAdmin || selectedRole === account.role || savingUserId === account.id} onClick={() => void saveRole(account)}>{savingUserId === account.id ? 'Saving...' : 'Save role'}</button></td>
              </tr>
            })}
          </tbody>
        </table>
      </div>}

      {feedback && <p className={`admin-state-message ${feedback.includes('Unable') ? 'is-error' : ''}`} role="status">{feedback}</p>}
    </section>
  </main>
}
