import React from 'react';
import * as Icons from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserProfile, NavItem } from '../../types';

interface HeaderProps {
    role: UserProfile;
    activeItem?: NavItem;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

export default function Header({ role, activeItem, setIsSidebarOpen }: HeaderProps) {
    return (
        <header className="h-20 bg-white border-b border-black/5 px-4 md:px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2 hover:bg-black/5 rounded-lg"
                >
                    <Icons.Menu size={24} />
                </button>
                <div className="min-w-0">
                    <h2 className="text-lg md:text-xl font-bold tracking-tight truncate">{activeItem?.label}</h2>
                    <p className="text-[10px] md:text-xs text-black/40 font-medium">{activeItem?.category}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <button className="p-2 md:p-2.5 bg-black/5 rounded-full text-black/40 hover:text-black transition-colors relative">
                    <Icons.Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </button>
                <div className="h-8 w-[1px] bg-black/5 mx-1 md:mx-2" />
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold">Raquel Duarte</p>
                        <p className="text-[10px] text-black/40 font-bold uppercase tracking-wider">
                            {role === 'diretor' || role === 'professor' ? 'Escola EduTec Matriz' : (
                                <span className="flex items-center gap-1">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-black mt-1",
                                        role === 'pro' ? "bg-[#00A859] text-white" : "bg-black/10 text-black/60"
                                    )}>
                                        {role === 'pro' ? 'CONTA PRO' : 'CONTA FREE'}
                                    </span>
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#00A859] to-[#008F4C] rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-base">
                        RD
                    </div>
                </div>
            </div>
        </header>
    );
}
