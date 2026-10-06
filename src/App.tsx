import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './interface/context/AuthContext'
import { PlanProvider } from './interface/context/PlanContext'
import Layout from './Layout'
import LoginPage from './interface/pages/LoginPage'
import RegisterPage from './interface/pages/RegisterPage'
import DashboardPage from './interface/pages/DashboardPage'
import ProposalsPage from './interface/pages/ProposalsPage'
import ProposalPublicPage from './interface/pages/ProposalPublicPage'
import AnalyticsPage from './interface/pages/AnalyticsPage'
import PackagesPage from './interface/pages/PackagesPage'
import TeamPage from './interface/pages/TeamPage'
import InvitePage from './interface/pages/InvitePage'
import { PrivacyPage, TermsPage } from './interface/pages/LegalPages'

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Carregando...</p>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return children
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/proposals" element={<ProposalsPage />} />
                <Route path="/packages" element={<PackagesPage />} />
                <Route path="/equipe" element={<TeamPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
            </Route>
            {/* Convite de equipe (público: funciona logado ou não) */}
            <Route path="/convite/:token" element={<InvitePage />} />
            {/* Rota pública para propostas */}
            <Route path="/p/:slug" element={<ProposalPublicPage />} />
            <Route path="/privacidade" element={<PrivacyPage />} />
            <Route path="/termos" element={<TermsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}

export default function App() {
    return (
        <AuthProvider>
            <PlanProvider>
                <AppRoutes />
            </PlanProvider>
        </AuthProvider>
    )
}
