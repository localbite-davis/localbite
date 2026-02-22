"use client"

import { useAuth, type UserRole } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRole: UserRole
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { isAuthenticated, isAuthLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthLoading) return

    if (!isAuthenticated) {
      router.replace("/login")
    } else if (user?.role !== allowedRole) {
      router.replace(`/dashboard/${user?.role}`)
    }
  }, [isAuthLoading, isAuthenticated, user, allowedRole, router])

  if (isAuthLoading || !isAuthenticated || user?.role !== allowedRole) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            {isAuthLoading ? "Checking session..." : "Redirecting..."}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
