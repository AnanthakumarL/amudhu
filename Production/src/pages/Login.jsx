import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import { setStoredUser } from '../services/authStorage'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectTo = useMemo(() => {
    const from = location.state?.from?.pathname
    if (typeof from !== 'string' || from.length === 0 || from === '/' || from === '/login') {
      return '/dashboard'
    }
    return from
  }, [location.state])

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await authAPI.login({ identifier, password })
      setStoredUser(res.data)
      toast.success('Logged in')
      navigate(redirectTo, { replace: true })
    } catch (error) {
      const msg = error?.response?.data?.detail || 'Login failed'
      toast.error(msg)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-bold text-dark-900">Production Login</h1>
        <p className="text-dark-500 mt-1 text-sm">Sign in to access the production dashboard.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="label">Identifier</label>
            <input
              className="input-field"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or phone"
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>

          <button className="btn-primary w-full" disabled={loading} type="submit">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
