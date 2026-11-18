import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

const MIN_PASSWORD_LENGTH = 6
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default function SignupPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [invalid, setInvalid] = useState({ email: false, username: false, password: false, confirm: false })
  const [message, setMessage] = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(false)

  const passwordsMatch = confirm.length > 0 && confirm === password

  const clearError = (field) => {
    setInvalid((prev) => ({ ...prev, [field]: false }))
    setMessage({ text: '', type: '' })
  }

  const fail = (field, text) => {
    setInvalid((prev) => ({ ...prev, [field]: true }))
    setMessage({ text, type: 'error' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedEmail = email.trim()
    const trimmedUsername = username.trim()

    if (!isValidEmail(trimmedEmail)) return fail('email', 'Please enter a valid e-mail.')
    if (trimmedUsername.length < 3) return fail('username', 'Username must be at least 3 characters.')
    if (password.length < MIN_PASSWORD_LENGTH)
      return fail('password', `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
    if (!confirm) return fail('confirm', 'Please repeat your password.')
    if (password !== confirm) return fail('confirm', 'The passwords do not match.')

    setLoading(true)
    try {
      await register({ email: trimmedEmail, username: trimmedUsername, password })
      setMessage({ text: 'Account created successfully! Redirecting...', type: 'success' })
      setTimeout(() => navigate('/'), 600)
    } catch (err) {
      setMessage({ text: err.message || 'Could not create account.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const confirmClass = invalid.confirm ? 'invalid' : passwordsMatch ? 'valid' : ''

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="email">E-mail</label>
          <input
            type="email"
            id="email"
            autoComplete="email"
            value={email}
            className={invalid.email ? 'invalid' : ''}
            onChange={(e) => { setEmail(e.target.value); clearError('email') }}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            autoComplete="username"
            value={username}
            className={invalid.username ? 'invalid' : ''}
            onChange={(e) => { setUsername(e.target.value); clearError('username') }}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            className={invalid.password ? 'invalid' : ''}
            onChange={(e) => { setPassword(e.target.value); clearError('password') }}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="confirm">Repeat password</label>
          <input
            type="password"
            id="confirm"
            autoComplete="new-password"
            value={confirm}
            className={confirmClass}
            onChange={(e) => { setConfirm(e.target.value); clearError('confirm') }}
          />
        </div>

        <button type="submit" className="auth-primary-btn" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </button>

        <div className="auth-secondary centered">
          <button type="button" className="wide" onClick={() => navigate('/login')}>
            Already have an account
          </button>
        </div>

        {message.text && (
          <p className={`auth-message ${message.type}`} role="status">{message.text}</p>
        )}
      </form>
    </div>
  )
}
