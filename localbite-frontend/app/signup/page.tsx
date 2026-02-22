"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAuth, type UserRole } from "@/context/auth-context"
import { UtensilsCrossed, Bike, Store, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Full roles
const roles: {
  value: UserRole
  label: string
  icon: typeof UtensilsCrossed
  description: string
}[] = [
  { value: "customer", label: "Student", icon: UtensilsCrossed, description: "Order food from Davis restaurants" },
  { value: "agent", label: "Delivery Agent", icon: Bike, description: "Deliver food and earn money" },
  { value: "restaurant", label: "Restaurant", icon: Store, description: "Manage orders and grow your business" },
]

// Only for delivery agent types
const agentTypes = ["Student Agent", "Professional Agent"]

function SignupForm() {
  const { signup } = useAuth()
  const searchParams = useSearchParams()
  const preselectedRole = searchParams.get("role") as UserRole | null

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(
    preselectedRole && roles.some((r) => r.value === preselectedRole)
      ? preselectedRole
      : null
  )
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [studentId, setStudentId] = useState("")
  const [agentType, setAgentType] = useState(agentTypes[0])
  const [showPassword, setShowPassword] = useState(false)

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) return

    // Simple validation
    if (selectedRole === "customer" && !studentId) {
      alert("Please enter your student ID")
      return
    }

    if (selectedRole === "agent" && !agentType) {
      alert("Please select agent type")
      return
    }

    signup(
      name,
      email,
      password,
      selectedRole,
      selectedRole === "agent" ? agentType === "Student Agent" : undefined
    )
  }

  return (
    <div className="w-full max-w-md">
      {/* Role Selection */}
      {!selectedRole ? (
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground">Create account</h1>
          <p className="mb-8 mt-2 text-muted-foreground">
            Choose how you want to use Aggie Bites
          </p>
          <div className="space-y-3">
            {roles.map((role) => (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <role.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-card-foreground">{role.label}</p>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      ) : (
        <div className="animate-slide-up">
          <button
            onClick={() => setSelectedRole(null)}
            className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Change role
          </button>

          <h1 className="text-xl font-bold text-foreground mb-4">
            {roles.find((r) => r.value === selectedRole)?.label} Sign Up
          </h1>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{selectedRole === "restaurant" ? "Restaurant Name" : "Full Name"}</Label>
              <Input
                id="name"
                type="text"
                placeholder={selectedRole === "restaurant" ? "Davis Grill" : "Alex Chen"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={selectedRole === "restaurant" ? "info@yourrestaurant.com" : "you@ucdavis.edu"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            {/* Student ID */}
            {selectedRole === "customer" && (
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="12345678"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
            )}

            {/* Agent Type */}
            {selectedRole === "agent" && (
              <div className="space-y-2">
                <Label htmlFor="agentType">Agent Type</Label>
                <select
                  id="agentType"
                  value={agentType}
                  onChange={(e) => setAgentType(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card p-2"
                  required
                >
                  {agentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden flex-1 flex-col justify-between bg-primary p-12 lg:flex">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
            <UtensilsCrossed className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="text-xl font-bold text-primary-foreground">AggieBites</span>
        </Link>
        <div>
          <h2 className="text-balance text-4xl font-bold leading-tight text-primary-foreground">
            Join the Aggie Bites community.
          </h2>
          <p className="mt-3 text-pretty text-lg text-primary-foreground/70">
            Whether you are hungry, want to earn, or run a restaurant -- we have got you covered on campus.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/50">&copy; 2026 Aggie Bites</p>
      </div>

      {/* Right Panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-6 lg:p-12">
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          }
        >
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}
