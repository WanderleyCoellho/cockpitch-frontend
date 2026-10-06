import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './interface/context/AuthContext'
import { LayoutDashboard, FileText, Package, BarChart3, LogOut, Menu, X, Users, Building2, BookOpen } from 'lucide-react'
import HelpMenu from './interface/components/help/HelpMenu'
import HelpTip from './interface/components/help/HelpTip'
import { usePlan } from './interface/context/PlanContext'
import { useState } from 'react'

export default function Layout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout, workspaces, activeWorkspace, switchWorkspace } = useAuth()
    const { currentPlan } = usePlan()
    const [menuOpen, setMenuOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const isActive = (path: string) => location.pathname.startsWith(path)

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Propostas', path: '/proposals', icon: FileText },
        { label: 'Pacotes', path: '/packages', icon: Package },
        { label: 'Equipe', path: '/equipe', icon: Users },
        { label: 'Analytics', path: '/analytics', icon: BarChart3 },
        { label: 'Ajuda', path: '/ajuda', icon: BookOpen },
    ]

    const workspacePicker = activeWorkspace && (
        <div className="px-3 pt-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-white/35 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Empresa
                    </span>
                    {workspaces.length > 1 && <HelpTip helpKey="workspace.switch" side="right" />}
                </div>
                {workspaces.length > 1 ? (
                    <select
                        aria-label="Empresa ativa"
                        value={activeWorkspace.id}
                        onChange={(event) => {
                            switchWorkspace(event.target.value)
                            navigate('/dashboard')
                        }}
                        className="mt-1 w-full bg-transparent text-sm font-medium text-white focus:outline-none"
                    >
                        {workspaces.map((workspace) => (
                            <option key={workspace.id} value={workspace.id} className="bg-[#0A0A0A]">
                                {workspace.name}
                            </option>
                        ))}
                    </select>
                ) : (
                    <p className="mt-1 text-sm font-medium text-white truncate">{activeWorkspace.name}</p>
                )}
                <p className="text-[10px] text-[#C9A84C] mt-0.5">Plano {currentPlan.name}</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-white flex">
            <aside className="hidden md:flex flex-col w-56 border-r border-white/5 bg-[#0A0A0A] fixed h-full z-40">
                <div className="px-5 py-5 border-b border-white/5">
                    <span className="text-base font-semibold tracking-tight text-white">
                        Lumen<span className="text-[#C9A84C]"> Deal</span>
                    </span>
                </div>
                {workspacePicker}
                <nav className="flex-1 px-3 py-4 space-y-0.5">
                    {navItems.map(({ label, path, icon: Icon }) => (
                        <button
                            key={path}
                            data-tour={`nav-${path.slice(1)}`}
                            onClick={() => navigate(path)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(path)
                                    ? 'bg-[#C9A84C]/10 text-[#C9A84C]'
                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </nav>
                <div className="px-3 pb-5 border-t border-white/5 pt-3">
                    <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-xs font-bold text-[#C9A84C]">
                            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{user?.name || 'Usuario'}</p>
                            <p className="text-[10px] text-white/30 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/30 hover:text-white/60 rounded-lg hover:bg-white/5 transition-all"
                    >
                        <LogOut className="w-3.5 h-3.5" /> Sair
                    </button>
                </div>
            </aside>

            <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#0A0A0A] border-b border-white/5 flex items-center justify-between px-4">
                <span className="text-sm font-semibold text-white">
                    Lumen<span className="text-[#C9A84C]"> Deal</span>
                </span>
                <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-white/60">
                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {menuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMenuOpen(false)}>
                    <div
                        className="bg-[#0A0A0A] w-56 h-full border-r border-white/5 pt-14 px-3 py-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="-mx-3 mb-3">{workspacePicker}</div>
                        <nav className="space-y-0.5">
                            {navItems.map(({ label, path, icon: Icon }) => (
                                <button
                                    key={path}
                                    onClick={() => {
                                        navigate(path)
                                        setMenuOpen(false)
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(path)
                                            ? 'bg-[#C9A84C]/10 text-[#C9A84C]'
                                            : 'text-white/50 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" /> {label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            )}

            <main className="flex-1 md:ml-56 pt-14 md:pt-0 min-h-screen">
                <Outlet />
            </main>
            <HelpMenu />
        </div>
    )
}
