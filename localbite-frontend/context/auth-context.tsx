"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export type UserRole = "customer" | "agent" | "restaurant"

interface User {
  name: string
  email: string
  role: UserRole
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string, role: UserRole) => void
  signup: (name: string, email: string, password: string, role: UserRole) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const MOCK_USERS: Record<UserRole, User> = {
  customer: {
    name: "Alex Chen",
    email: "alex@ucdavis.edu",
    role: "customer",
  },
  agent: {
    name: "Jordan Rivera",
    email: "jordan@ucdavis.edu",
    role: "agent",
  },
  restaurant: {
    name: "Davis Grill",
    email: "info@davisgrill.com",
    role: "restaurant",
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  const login = useCallback(
    (email: string, _password: string, role: UserRole) => {
      const mockUser = { ...MOCK_USERS[role], email }
      setUser(mockUser)
      router.push(`/dashboard/${role}`)
    },
    [router]
  )

  const signup = useCallback(
    (name: string, email: string, _password: string, role: UserRole) => {
      const newUser: User = { name, email, role }
      setUser(newUser)
      router.push(`/dashboard/${role}`)
    },
    [router]
  )

  const logout = useCallback(() => {
    setUser(null)
    router.push("/login")
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
