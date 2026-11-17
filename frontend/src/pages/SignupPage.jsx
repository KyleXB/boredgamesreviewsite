import { useState } from 'react'
import { useNavigate } from 'react-router'
import './AuthPages.css'


const MIN_PASSWORD_LENGTH = 8

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// Replace this with a real request to your backend, e.g.:
// const res = await fetch('/api/signup', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({ email, password })
// })
// if (!res.ok) throw new Error('Could not create account.')
function createAccount(email, password) {
  return new Promise((resolve) => setTimeout(resolve, 600))
}

export default function SignupPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [invalid, setInvalid] = useState({ email: false, password: false, confirm: false })
  const [message, setMessage] = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(false)

  // Repeat-password box turns green as soon as it matches
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

    if (!isValidEmail(trimmedEmail)) return fail('email', 'Please enter a valid e-mail.')
    if (password.length < MIN_PASSWORD_LENGTH)
      return fail('password', `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
    if (!confirm) return fail('confirm', 'Please repeat your password.')
    if (password !== confirm) return fail('confirm', 'The passwords do not match.')

    setLoading(true)
    try {
      await createAccount(trimmedEmail, password)
      setMessage({ text: 'Account created successfully.', type: 'success' })
      setEmail('')
      setPassword('')
      setConfirm('')
    } catch (err) {
      setMessage({ text: err.message, type: 'error' })
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

        <p className={`auth-message ${message.type}`} role="status">{message.text}</p>
      </form>
    </div>
  )
}
