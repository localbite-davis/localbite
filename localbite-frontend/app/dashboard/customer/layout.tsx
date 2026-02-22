"use client"

import { useState, createContext, useContext, type ReactNode } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { CustomerNavbar } from "@/components/customer-navbar"

interface CartItem {
  id: string
  restaurantId: string
  restaurantName: string
  name: string
  price: number
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: number
}

const CartContext = createContext<CartContextType | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within customer layout")
  return ctx
}

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    )
  }

  const clearCart = () => setItems([])

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <ProtectedRoute allowedRole="customer">
      <CartContext.Provider
        value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}
      >
        <div className="min-h-screen bg-background">
          <CustomerNavbar cartCount={items.reduce((s, i) => s + i.quantity, 0)} />
          <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
            {children}
          </main>
        </div>
      </CartContext.Provider>
    </ProtectedRoute>
  )
}
