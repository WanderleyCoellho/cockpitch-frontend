import { createContext, useContext, useState, useEffect } from 'react'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import type { AuthUser } from '../../shared/types'

type AuthContextType = {
    user: AuthUser | null
    loading: boolean
    error: string | null
    login: (email: string, password: string) => Promise<void>
    register: (name: string, email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Inicializar auth do httpGateway
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Tentar recuperar token do localStorage
                const token = localStorage.getItem('auth_token')
                if (token) {
                    httpGateway.setToken(token)
                    const userData = await httpGateway.getMe()
                    setUser(userData.user)
                }
            } catch (err) {
                console.error('Auth init error:', err)
                localStorage.removeItem('auth_token')
                httpGateway.clearToken()
            } finally {
                setLoading(false)
            }
        }
        initAuth()
    }, [])

    const login = async (email: string, password: string) => {
        setLoading(true)
        setError(null)
        try {
            const result = await httpGateway.login(email, password)
            if (result.token) {
                localStorage.setItem('auth_token', result.token)
                httpGateway.setToken(result.token)
            }
            setUser(result.user)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao fazer login'
            setError(message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const register = async (name: string, email: string, password: string) => {
        setLoading(true)
        setError(null)
        try {
            const result = await httpGateway.register(email, password, name)
            if (result.token) {
                localStorage.setItem('auth_token', result.token)
                httpGateway.setToken(result.token)
            }
            setUser(result.user)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao criar conta'
            setError(message)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        setLoading(true)
        try {
            localStorage.removeItem('auth_token')
            httpGateway.clearToken()
            setUser(null)
        } catch (err) {
            console.error('Logout error:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                login,
                register,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de AuthProvider')
    }
    return context
}
