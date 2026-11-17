import { useState } from 'react'
import { useNavigate } from 'react-router'
import './AuthPages.css'


const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// Replace this with a real request to your backend, e.g.:
// const res = await fetch('/api/login', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({ email, password })
// })
// if (!res.ok) throw new Error('Incorrect e-mail or password.')
function login(email, password) {
  return new Promise((resolve) => setTimeout(resolve, 600))
}

export default function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invalid, setInvalid] = useState({ email: false, password: false })
  const [message, setMessage] = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(false)

  const clearError = (field) => {
    setInvalid((prev) => ({ ...prev, [field]: false }))
    setMessage({ text: '', type: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedEmail = email.trim()
    const emailOk = isValidEmail(trimmedEmail)
    const passwordOk = password.length > 0

    setInvalid({ email: !emailOk, password: !passwordOk })

    if (!emailOk) return setMessage({ text: 'Please enter a valid e-mail.', type: 'error' })
    if (!passwordOk) return setMessage({ text: 'Please enter your password.', type: 'error' })

    setLoading(true)
    try {
      await login(trimmedEmail, password)
      setMessage({ text: 'Logged in successfully.', type: 'success' })
      // e.g. navigate('/') to go back to the home page after logging in
    } catch (err) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Carry over the e-mail if one was typed, so it's pre-filled
  const goToForgot = () => {
    const trimmedEmail = email.trim()
    navigate(
      trimmedEmail
        ? `/forgot-password?email=${encodeURIComponent(trimmedEmail)}`
        : '/forgot-password'
    )
  }

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

        <p className={`auth-message ${message.type}`} role="status">{message.text}</p>
      </form>
    </div>
  )
}
