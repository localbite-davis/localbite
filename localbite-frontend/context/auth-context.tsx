"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
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
  signup: (name: string, email: string, password: string, role: UserRole, isStudent?: boolean) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const API_URL = "http://localhost:8000/api/v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  // Verify user session on mount
  useEffect(() => {
    const verifySession = async () => {
      try {
        // Try to get current user info from backend
        const response = await fetch(`${API_URL}/users/me`, {
          credentials: "include",
        })
        
        if (response.ok) {
          const userData = await response.json()
          const user: User = {
            id: userData.id,
            name: userData.first_name,
            email: userData.email,
            role: userData.role || "customer",
          }
          setUser(user)
        }
      } catch (error) {
        // Session doesn't exist or expired, user stays logged out
        console.log("No active session found")
      }
    }

    verifySession()
  }, [])

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

        const userData: User = { name: email.split("@")[0], email, role };
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
    async (name: string, email: string, password: string, role: UserRole, isStudent?: boolean) => {
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
      if (isStudent) {
        // Student agent signup: include simulated UC Davis fields
        // Generate a mostly-unique phone placeholder to avoid duplicate unique-key errors
        const uniquePhone = `000-${String(Date.now()).slice(-9)}`;

        body = {
          full_name: name,
          email,
          password,
          phone_number: uniquePhone,
          vehicle_type: "car",
          base_payout_per_delivery: 5.0,
          agent_id: `agent_${Date.now()}`,
                  // send lowercase enum values to match backend expectations
                  agent_type: "student",
          university_name: "UC Davis",
          student_id: `ucd_${Date.now()}`,
          kerberos_id: "mock_kerberos",
        };
      } else {
        // Regular third-party agent
        const uniquePhone = `000-${String(Date.now()).slice(-9)}`;

        body = {
          full_name: name,
          email,
          password,
          phone_number: uniquePhone,
          vehicle_type: "car",
          base_payout_per_delivery: 5.0,
          agent_id: `agent_${Date.now()}`,
                  // align with backend AgentType enum
                  agent_type: "third_party",
        };
      }
    }

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

    if (!response.ok) {
      // Try to parse JSON error body; fall back to text if not JSON.
      const text = await response.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        // Not JSON
      }

      if (parsed) {
        console.error("Signup failed details:", parsed);
        throw new Error(parsed.detail || JSON.stringify(parsed));
      } else {
        console.error("Signup failed body:", text);
        throw new Error(text || "Signup failed");
      }
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
