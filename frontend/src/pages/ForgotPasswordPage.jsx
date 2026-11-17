import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import './AuthPages.css'


const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// Replace this with a real request to your backend, e.g.:
// const res = await fetch('/api/forgot-password', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({ email })
// })
// if (!res.ok) throw new Error('Something went wrong. Please try again.')
function requestReset(email) {
  return new Promise((resolve) => setTimeout(resolve, 600))
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Pre-filled if the login page passed one along (?email=...)
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [invalid, setInvalid] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedEmail = email.trim()

    if (!isValidEmail(trimmedEmail)) {
      setInvalid(true)
      return setMessage({ text: 'Please enter a valid e-mail.', type: 'error' })
    }

    setLoading(true)
    try {
      await requestReset(trimmedEmail)
      // Same message whether or not the account exists, so the page
      // doesn't reveal which e-mails are registered.
      setMessage({
        text: `If an account exists for ${trimmedEmail}, a reset link has been sent.`,
        type: 'success'
      })
    } catch (err) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
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
            className={invalid ? 'invalid' : ''}
            onChange={(e) => {
              setEmail(e.target.value)
              setInvalid(false)
              setMessage({ text: '', type: '' })
            }}
          />
        </div>

        <button type="submit" className="auth-primary-btn" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>

        <div className="auth-secondary centered">
          <button type="button" onClick={() => navigate('/login')}>Back to login</button>
        </div>

        <p className={`auth-message ${message.type}`} role="status">{message.text}</p>
      </form>
    </div>
  )
}
