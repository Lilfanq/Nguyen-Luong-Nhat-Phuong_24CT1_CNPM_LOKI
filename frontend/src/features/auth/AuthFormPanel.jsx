export default function AuthFormPanel({ mode, email, password, feedback, oauthBusy, onEmailChange, onPasswordChange, onSubmit, onOAuth, onCancel }) {
  return <div className="auth-form-panel">
    <div className="auth-form-header"><span>{mode === 'signup' ? 'Create account' : 'Login'}</span></div>
    <div className="auth-provider-list">
      <button className="auth-provider-button" type="button" disabled={Boolean(oauthBusy)} onClick={() => onOAuth('google')}><span className="auth-provider-mark is-google" aria-hidden="true">G</span>Continue with Google</button>
      <button className="auth-provider-button" type="button" disabled={Boolean(oauthBusy)} onClick={() => onOAuth('discord')}><span className="auth-provider-mark is-discord" aria-hidden="true">D</span>Continue with Discord</button>
    </div>
    <div className="auth-divider"><span>or use email</span></div>
    <label className="auth-field">
      <span>Email</span>
      <input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="name@example.com" />
    </label>
    <label className="auth-field">
      <span>Password</span>
      <input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="Password" />
    </label>
    {feedback && <small className="auth-feedback">{feedback}</small>}
    <div className="auth-form-actions">
      <button type="button" onClick={onSubmit}>{mode === 'signup' ? 'Create account' : 'Login'}</button>
      <button type="button" className="auth-cancel" onClick={onCancel}>Cancel</button>
    </div>
  </div>
}
