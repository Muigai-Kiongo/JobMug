import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "seeker",
    company: "",
    bio: "",
  })
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)

  const { register, setUser } = useAuth()
  const navigate = useNavigate()

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate() {
    if (!form.name.trim()) return "Name is required"
    if (!form.email.trim()) return "Email is required"
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      return "Please enter a valid email"
    if (!form.password || form.password.length < 6)
      return "Password must be at least 6 characters"
    if (form.role === "recruiter" && !form.company.trim())
      return "Company is required for recruiters"
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErr("")
    const v = validate()
    if (v) {
      setErr(v)
      toast.error(v)
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        ...(form.role === "recruiter" ? { company: form.company.trim() } : {}),
        bio: form.bio?.trim() || "",
      }

      const res = await register(payload)
      if (res && res.user && setUser) setUser(res.user)

      toast.success("Account created successfully")
      navigate("/")
    } catch (error) {
      console.error(error)
      const message =
        error?.response?.data?.error || error?.message || "Registration failed"
      setErr(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container mt-10 flex justify-center px-4 sm:px-0">
      <div className="w-full max-w-lg">
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
          <header className="mb-4 text-center">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              Create an account
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Register as a job seeker to apply, or as a recruiter to post jobs.
            </p>
          </header>

          {err && (
            <p className="text-sm text-red-600 dark:text-red-400 mb-3 text-center">
              {err}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Full name
              </label>
              <Input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Password
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                placeholder="Create a password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Role
              </label>
              <div className="flex gap-4 mt-1">
                <label className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <input
                    type="radio"
                    name="role"
                    value="seeker"
                    checked={form.role === "seeker"}
                    onChange={() => setField("role", "seeker")}
                    className="accent-primary-600"
                  />
                  Seeker
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <input
                    type="radio"
                    name="role"
                    value="recruiter"
                    checked={form.role === "recruiter"}
                    onChange={() => setField("role", "recruiter")}
                    className="accent-primary-600"
                  />
                  Recruiter
                </label>
              </div>
            </div>

            {form.role === "recruiter" && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Company
                </label>
                <Input
                  value={form.company}
                  onChange={(e) => setField("company", e.target.value)}
                  placeholder="Company name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Short bio (optional)
              </label>
              <Textarea
                value={form.bio}
                onChange={(e) => setField("bio", e.target.value)}
                rows={4}
                placeholder="A short professional summary (shown on your profile)"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                >
                  Sign in
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
