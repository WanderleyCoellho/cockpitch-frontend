import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { httpGateway } from '../../infra/gateway/HttpGateway'
import type { AuthUser, WorkspaceSummary } from '../../shared/types'

type RegisterExtra = { workspaceName?: string; segment?: string; inviteToken?: string }

type AuthContextType = {
    user: AuthUser | null
    loading: boolean
    error: string | null
    login: (email: string, password: string) => Promise<void>
    register: (name: string, email: string, password: string, extra?: RegisterExtra) => Promise<void>
    /** Entrar/cadastrar com Google (credencial do botão "Continuar com Google"). */
    loginWithGoogle: (credential: string, extra?: RegisterExtra) => Promise<{ created: boolean; joinedWorkspaceId: string | null }>
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
    /** Empresas de que o usuário participa e a ativa no momento. */
    workspaces: WorkspaceSummary[]
    activeWorkspace: WorkspaceSummary | null
    switchWorkspace: (workspaceId: string) => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'auth_token'
// Só o id da empresa ativa (não é dado sensível): lembra a escolha entre visitas.
const WORKSPACE_KEY = 'lumen_active_workspace'

function readStoredWorkspace() {
    try {
        return localStorage.getItem(WORKSPACE_KEY)
    } catch {
        return null
    }
}

function storeWorkspace(id: string | null) {
    try {
        if (id) localStorage.setItem(WORKSPACE_KEY, id)
        else localStorage.removeItem(WORKSPACE_KEY)
    } catch {
        // armazenamento indisponível (modo privado): segue sem lembrar a escolha
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient()
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(readStoredWorkspace)

    const workspaces = user?.workspaces ?? []
    const activeWorkspace =
        workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0] ?? null

    // Mantém o cliente HTTP apontando para a empresa ativa (inclusive quando a salva deixou de existir).
    httpGateway.setWorkspace(activeWorkspace?.id ?? null)

    const applySession = useCallback((nextUser: AuthUser) => {
        setUser(nextUser)
        const stored = readStoredWorkspace()
        const valid = nextUser.workspaces?.some((workspace) => workspace.id === stored)
        const id = valid ? stored : nextUser.activeWorkspaceId ?? nextUser.workspaces?.[0]?.id ?? null
        setActiveWorkspaceId(id)
        storeWorkspace(id)
        httpGateway.setWorkspace(id)
    }, [])

    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem(TOKEN_KEY)
                if (token) {
                    httpGateway.setToken(token)
                    const userData = await httpGateway.getMe()
                    applySession(userData.user)
                }
            } catch (err) {
                console.error('Auth init error:', err)
                localStorage.removeItem(TOKEN_KEY)
                httpGateway.clearToken()
            } finally {
                setLoading(false)
            }
        }
        initAuth()
    }, [applySession])

    // 401 em qualquer chamada autenticada (token expirado/revogado) encerra a sessão local.
    useEffect(() => {
        const handleUnauthorized = () => {
            localStorage.removeItem(TOKEN_KEY)
            httpGateway.clearToken()
            setUser(null)
        }
        window.addEventListener('auth:unauthorized', handleUnauthorized)
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }, [])

    const refreshUser = async () => {
        try {
            const userData = await httpGateway.getMe()
            applySession(userData.user)
        } catch (err) {
            console.error('Refresh user error:', err)
        }
    }

    const startSession = (result: { token?: string; user: AuthUser }) => {
        if (result.token) {
            localStorage.setItem(TOKEN_KEY, result.token)
            httpGateway.setToken(result.token)
        }
        queryClient.clear()
        applySession(result.user)
    }

    const login = async (email: string, password: string) => {
        setLoading(true)
        setError(null)
        try {
            startSession(await httpGateway.login(email, password))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao fazer login')
            throw err
        } finally {
            setLoading(false)
        }
    }

    const register = async (name: string, email: string, password: string, extra: RegisterExtra = {}) => {
        setLoading(true)
        setError(null)
        try {
            startSession(await httpGateway.register(email, password, name, extra))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao criar conta')
            throw err
        } finally {
            setLoading(false)
        }
    }

    const loginWithGoogle = async (credential: string, extra: RegisterExtra = {}) => {
        setError(null)
        // O caso "Gmail sem conta" é tratado pela tela (completar cadastro), sem virar erro global.
        const result = await httpGateway.loginWithGoogle({ credential, ...extra })
        startSession(result)
        if (result.joinedWorkspaceId) {
            setActiveWorkspaceId(result.joinedWorkspaceId)
            storeWorkspace(result.joinedWorkspaceId)
            httpGateway.setWorkspace(result.joinedWorkspaceId)
        }
        return { created: !!result.created, joinedWorkspaceId: result.joinedWorkspaceId ?? null }
    }

    const logout = async () => {
        localStorage.removeItem(TOKEN_KEY)
        storeWorkspace(null)
        httpGateway.clearToken()
        httpGateway.setWorkspace(null)
        queryClient.clear()
        setUser(null)
    }

    const switchWorkspace = (workspaceId: string) => {
        if (workspaceId === activeWorkspace?.id) return
        setActiveWorkspaceId(workspaceId)
        storeWorkspace(workspaceId)
        httpGateway.setWorkspace(workspaceId)
        // Dados de outra empresa não podem aparecer misturados: descarta todo o cache.
        queryClient.clear()
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                login,
                register,
                loginWithGoogle,
                logout,
                refreshUser,
                workspaces,
                activeWorkspace,
                switchWorkspace,
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
