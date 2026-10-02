export default function GuestSessionPanel({ onLogin, onSignup }) {
  return <div className="session-mode-panel guest-session-panel">
    <strong>Guest session</strong>
    <small className="session-mode-note">Temporary profiles are stored for this browser session.</small>
    <button type="button" onClick={onLogin}>Login</button>
    <button type="button" onClick={onSignup}>Sign up</button>
  </div>
}
