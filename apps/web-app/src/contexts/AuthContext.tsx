'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
    id: string
    email: string
    username: string
}

interface AuthContextType {
    user: User | null
    token: string | null
    login: (token: string, user: User) => void
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)

    useEffect(() => {
        // Check for existing token in localStorage
        const savedToken = localStorage.getItem('token')
        if (savedToken) {
            setToken(savedToken)
            // In a real app, you'd validate the token and fetch user data
            // For now, we'll use a placeholder user
            setUser({
                id: 'user-1',
                email: 'user@example.com',
                username: 'user'
            })
        }
    }, [])

    const login = (newToken: string, userData: User) => {
        setToken(newToken)
        setUser(userData)
        localStorage.setItem('token', newToken)
    }

    const logout = () => {
        setToken(null)
        setUser(null)
        localStorage.removeItem('token')
    }

    const isAuthenticated = !!token && !!user

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            isAuthenticated
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
