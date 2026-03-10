import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { cn } from '../../lib/utils';
import { NAV_ITEMS, UserProfile } from '../../types';

interface SidebarProps {
    role: UserProfile;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    onLogout: () => void;
    onGoToPayment?: () => void;
}

export default function Sidebar({
    role,
    activeTab,
    setActiveTab,
    isSidebarOpen,
    setIsSidebarOpen,
    onLogout,
    onGoToPayment
}: SidebarProps) {
    const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(role as any));
    const categories = Array.from(new Set(filteredNav.map(item => item.category)));

    const renderIcon = (iconName: string, className?: string) => {
        const IconComponent = (Icons as any)[iconName];
        return IconComponent ? <IconComponent className={className} size={18} /> : null;
    };

    return (
        <>
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={cn(
                "fixed lg:relative w-72 bg-white border-r border-black/5 flex flex-col h-full z-40 transition-transform duration-300 lg:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-8 border-b border-black/5">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#00A859] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                E
                            </div>
                            <span className="text-xl font-bold tracking-tight">EduTec<span className="text-[#00A859]">Pro</span></span>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden p-2 hover:bg-black/5 rounded-lg"
                        >
                            <Icons.X size={20} />
                        </button>
                    </div>

                    <div className="p-4 bg-black/5 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-black/5 shrink-0">
                                <Icons.User size={20} className="text-black/40" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">Perfil Ativo</p>
                                <p className="text-sm font-semibold capitalize truncate">
                                    {role === 'diretor' ? 'Diretor da Escola' :
                                        role === 'professor' ? 'Professor da Escola' :
                                            role === 'pro' ? 'Conta Pro' : 'Conta Free'}
                                </p>
                            </div>
                            {role === 'free' && (
                                <button
                                    onClick={onGoToPayment}
                                    className="p-1.5 bg-[#00A859] text-white rounded-lg hover:bg-[#008F4C] transition-all"
                                    title="Mudar para o Pro"
                                >
                                    <Icons.Zap size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
                    {categories.map(category => (
                        <div key={category}>
                            {category && (
                                <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-black/30 mb-4 mt-6 first:mt-0">
                                    {category}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {filteredNav
                                    .filter(item => item.category === category)
                                    .map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setActiveTab(item.id);
                                                setIsSidebarOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                                                activeTab === item.id
                                                    ? "bg-[#00A859] text-white shadow-lg shadow-[#00A859]/20"
                                                    : "text-black/60 hover:bg-black/5 hover:text-black"
                                            )}
                                        >
                                            {renderIcon(item.icon, activeTab === item.id ? "text-white" : "text-black/40 group-hover:text-black")}
                                            {item.label}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-black/5">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
                    >
                        <Icons.LogOut size={18} />
                        Sair do Sistema
                    </button>
                </div>
            </aside>
        </>
    );
}
