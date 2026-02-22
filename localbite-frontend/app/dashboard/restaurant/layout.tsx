"use client"

import type { ReactNode } from "react"
import { ProtectedRoute } from "@/components/protected-route"

export default function RestaurantLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRole="restaurant">
      {children}
    </ProtectedRoute>
  )
}
