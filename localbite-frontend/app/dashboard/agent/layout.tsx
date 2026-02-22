"use client"

import type { ReactNode } from "react"
import { ProtectedRoute } from "@/components/protected-route"

export default function AgentLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRole="agent">
      {children}
    </ProtectedRoute>
  )
}
