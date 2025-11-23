import { Plus, Folder, GraduationCap, Sparkles, Film } from 'lucide-react';
import Link from 'next/link';

export function Sidebar() {
    return (
        <aside className="w-16 h-screen bg-sidebar border-r border-border flex flex-col items-center py-4 gap-6 z-50">
            {/* Logo / Home */}
            <div className="w-10 h-10 flex items-center justify-center mb-2">
                <Film className="w-6 h-6 text-muted-foreground hover:text-foreground transition-colors" />
            </div>

            {/* Main Actions */}
            <button className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-opacity">
                <Plus className="w-6 h-6" />
            </button>

            <nav className="flex flex-col gap-6 mt-2">
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Folder className="w-6 h-6" />
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    <GraduationCap className="w-6 h-6" />
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Sparkles className="w-6 h-6" />
                </Link>
            </nav>

            {/* User Profile (Bottom) */}
            <div className="mt-auto">
                <div className="w-8 h-8 rounded-full bg-blue-500 overflow-hidden">
                    {/* Placeholder for user avatar */}
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                </div>
            </div>
        </aside>
    );
}
