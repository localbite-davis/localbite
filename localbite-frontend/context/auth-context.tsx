"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export type UserRole = "customer" | "agent" | "restaurant"

interface User {
<<<<<<< HEAD
  id: string | number
=======
  id?: number
>>>>>>> 867d11e57857988f0c2d08031fc060fc82a27c67
  name: string
  email: string
  role: UserRole
  avatar?: string
  token?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string, role: UserRole) => void
  signup: (name: string, email: string, password: string, role: UserRole) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const API_URL = "http://localhost:8000/api/v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  const login = useCallback(
    async (email: string, password: string, role: UserRole) => {
      try {
        let endpoint = `/auth/login/user`;
        if (role === "restaurant") endpoint = `/auth/login/restaurant`;
        if (role === "agent") endpoint = `/auth/login/delivery-agent`;

        const response = await fetch(`${API_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
          credentials: "include", 
        });

        if (!response.ok) {
           const errorData = await response.json();
           console.error("Login failed:", errorData);
           throw new Error(errorData.detail || "Login failed");
        }

<<<<<<< HEAD
        const data = await response.json();
        
        const userData: User = { 
            id: data.user_id,
            name: email.split("@")[0], 
            email: data.email || email, 
            role,
            token: data.access_token 
=======
        const responseData = await response.json();
        const userData: User = { 
          id: responseData.id || 1, // Fallback to 1 for test customer
          name: email.split("@")[0], 
          email, 
          role 
>>>>>>> 867d11e57857988f0c2d08031fc060fc82a27c67
        };
        setUser(userData);
        router.push(`/dashboard/${role}`);
      } catch (error) {
        console.error("Login error:", error);
        alert("Login failed. Please check your credentials.");
      }
    },
    [router]
  )

  const signup = useCallback(
    async (name: string, email: string, password: string, role: UserRole) => {
      try {
        let endpoint = `/register/user`;
        let body: any = {};

        if (role === "customer") {
            const [first, ...rest] = name.split(" ");
            const last = rest.join(" ") || "User";
            body = {
                email,
                password,
                first_name: first,
                last_name: last,
                role: "customer"
            };
        } else if (role === "restaurant") {
            endpoint = `/register/restaurant`;
            body = {
                name, // Restaurant name
                email,
                password,
                cuisine_type: "Other", 
                address: "To be updated", 
                city: "Davis",
                state: "CA",
                commission_rate: 0.10
            };
        } else if (role === "agent") {
            endpoint = `/register/delivery-agent`;
            body = {
                full_name: name,
                email,
                password,
                phone_number: "000-000-0000",
                vehicle_type: "car",
                base_payout_per_delivery: 5.0,
                agent_id: `agent_${Date.now()}`,
                agent_type: "normal"
            };
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Signup failed details:", error);
            throw new Error(error.detail || "Signup failed");
        }
        
        // Auto-login after signup
        await login(email, password, role);

      } catch (error) {
        console.error("Signup error:", error);
        alert("Signup failed. Please try again.");
      }
    },
    [router, login]
  )

  const logout = useCallback(async () => {
    try {
        await fetch(`${API_URL}/auth/logout`, { method: "POST" });
    } catch (e) {
        console.error("Logout failed", e);
    }
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
