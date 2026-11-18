import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [invalid, setInvalid] = useState({ identifier: false, password: false })
  const [message, setMessage] = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(false)

  const clearError = (field) => {
    setInvalid((prev) => ({ ...prev, [field]: false }))
    setMessage({ text: '', type: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedIdentifier = emailOrUsername.trim()
    const identifierOk = trimmedIdentifier.length > 0
    const passwordOk = password.length > 0

    setInvalid({ identifier: !identifierOk, password: !passwordOk })

    if (!identifierOk) return setMessage({ text: 'Please enter your email or username.', type: 'error' })
    if (!passwordOk) return setMessage({ text: 'Please enter your password.', type: 'error' })

    setLoading(true)
    try {
      await login(trimmedIdentifier, password)
      setMessage({ text: 'Logged in successfully! Redirecting...', type: 'success' })
      setTimeout(() => navigate('/'), 600)
    } catch (err) {
      setMessage({ text: err.message || 'Incorrect credentials.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="identifier">E-mail or Username</label>
          <input
            type="text"
            id="identifier"
            autoComplete="username"
            value={emailOrUsername}
            className={invalid.identifier ? 'invalid' : ''}
            onChange={(e) => { setEmailOrUsername(e.target.value); clearError('identifier') }}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            className={invalid.password ? 'invalid' : ''}
            onChange={(e) => { setPassword(e.target.value); clearError('password') }}
          />
        </div>

        <button type="submit" className="auth-primary-btn" disabled={loading}>
          {loading ? 'Signing in…' : 'Continue'}
        </button>

        <div className="auth-secondary">
          <button type="button" onClick={() => navigate('/forgot')}>Forgot password</button>
          <button type="button" onClick={() => navigate('/register')}>Create account</button>
        </div>

        {message.text && (
          <p className={`auth-message ${message.type}`} role="status">{message.text}</p>
        )}
      </form>
    </div>
  )
}
