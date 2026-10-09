import { ADMIN_ROLE } from './authService'

export default function AuthenticatedSessionPanel({ email, role, isAdminView, onToggleAdmin, onSignOut }) {
  const isAdmin = role === ADMIN_ROLE

  return <div className="session-mode-panel authenticated-session-panel">
    <strong>{isAdmin ? 'Administrator' : 'Authenticated user'}</strong>
    {email && <small className="session-account-email">{email}</small>}
    <span className={`session-role-label ${isAdmin ? 'is-admin' : 'is-user'}`}>{isAdmin ? 'ADMIN' : 'USER'}</span>
    {isAdmin && <button type="button" onClick={onToggleAdmin}>{isAdminView ? 'Return to LOKI' : 'Admin console'}</button>}
    <button type="button" onClick={onSignOut}>Logout</button>
  </div>
}
