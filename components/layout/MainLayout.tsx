import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 flex flex-col min-h-0 relative">
                    {children}
                </main>
            </div>
        </div>
    );
}
