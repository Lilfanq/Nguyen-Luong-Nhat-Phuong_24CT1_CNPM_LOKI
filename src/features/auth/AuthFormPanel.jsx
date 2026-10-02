export default function AuthFormPanel({ mode, email, password, feedback, onEmailChange, onPasswordChange, onSubmit, onCancel }) {
  return <div className="auth-form-panel">
    <div className="auth-form-header"><span>{mode === 'signup' ? 'Create account' : 'Login'}</span></div>
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
