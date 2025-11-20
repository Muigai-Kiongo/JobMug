import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FiEye, FiEyeOff } from "react-icons/fi"
import { useAuth } from "../context/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setErr("")
    setLoading(true)
    try {
      await login(email.trim(), password)
      toast.success("Signed in successfully")
      navigate("/")
    } catch (error) {
      console.error(error)
      const message =
        error?.response?.data?.error || error?.message || "Login failed"
      setErr(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container mt-10 flex justify-center px-4 sm:px-0">
      <div className="w-full max-w-md">
        <div className="p-6 rounded-2xl border border-neutral-200 shadow-sm bg-white dark:bg-neutral-900 dark:border-neutral-800">
          <header className="mb-4 text-center">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              Sign in
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Access your account to apply for jobs or manage postings.
            </p>
          </header>

          {err && (
            <p className="text-sm text-red-600 dark:text-red-400 mb-3 text-center">
              {err}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="text-neutral-900 dark:text-neutral-100"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Your password"
                  className="pr-10 text-neutral-900 dark:text-neutral-100"
                />
                <button
                  type="button"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  {showPwd ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <input
                  type="checkbox"
                  className="rounded border-neutral-300 dark:border-neutral-700 text-primary-600 focus:ring-primary-500"
                />
                Remember me
              </label>

              <Link
                to="/forgot"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
                className="w-full"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          <footer className="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              Create one
            </Link>
          </footer>
        </div>
      </div>
    </div>
  )
}
