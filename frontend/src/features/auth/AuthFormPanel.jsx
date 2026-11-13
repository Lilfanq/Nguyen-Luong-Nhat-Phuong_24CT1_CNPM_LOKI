export default function AuthFormPanel({ mode, email, password, feedback, oauthBusy, onModeChange, onEmailChange, onPasswordChange, onSubmit, onOAuth, onCancel }) {
  return <div className="auth-form-panel">
    <div className="auth-mode-switch" role="group" aria-label="Account mode">
      <button type="button" className={mode === 'login' ? 'is-active' : ''} aria-pressed={mode === 'login'} onClick={() => onModeChange('login')}>Login</button>
      <button type="button" className={mode === 'signup' ? 'is-active' : ''} aria-pressed={mode === 'signup'} onClick={() => onModeChange('signup')}>Sign up</button>
    </div>
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
      <input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder={mode === 'signup' ? 'At least 6 characters' : 'Password'} />
    </label>
    {feedback && <small className="auth-feedback" role="status" aria-live="polite">{feedback}</small>}
    <div className="auth-form-actions">
      <button type="button" onClick={onSubmit}>{mode === 'signup' ? 'Create account' : 'Login'}</button>
      <button type="button" className="auth-cancel" onClick={onCancel}>Cancel</button>
    </div>
  </div>
}
