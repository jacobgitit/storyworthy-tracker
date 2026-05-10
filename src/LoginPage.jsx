import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function signInWithGoogle() {
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
    }
  }

  async function sendMagicLink(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for the login link.')
    }

    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Storyworthy Tracker</h1>
        <p style={styles.subtitle}>
          Sign in once, then stay logged in.
        </p>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={loading}
          style={styles.googleButton}
        >
          {loading ? 'Opening Google...' : 'Continue with Google'}
        </button>

        <div style={styles.divider}>
          <span style={styles.line}></span>
          <span style={styles.dividerText}>or use magic link</span>
          <span style={styles.line}></span>
        </div>

        <form onSubmit={sendMagicLink} style={styles.form}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={styles.input}
          />

          <button
            type="submit"
            disabled={loading}
            style={styles.magicButton}
          >
            Send Magic Link
          </button>
        </form>

        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f4f4f5',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'white',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
  },
  title: {
    margin: '0 0 8px',
    fontSize: '28px',
    lineHeight: '1.2',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    margin: '0 0 24px',
    fontSize: '16px',
    color: '#6b7280',
    textAlign: 'center',
  },
  googleButton: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#111827',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '22px 0',
  },
  line: {
    flex: 1,
    height: '1px',
    background: '#e5e7eb',
  },
  dividerText: {
    fontSize: '13px',
    color: '#6b7280',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '16px',
  },
  magicButton: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    background: '#111827',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  message: {
    marginTop: '16px',
    color: '#374151',
    fontSize: '14px',
    textAlign: 'center',
  },
}