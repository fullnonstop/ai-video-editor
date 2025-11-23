import { ChevronLeft, Download, Share2, Star } from 'lucide-react';

export function Header() {
    return (
        <header className="h-14 bg-header border-b border-border flex items-center justify-between px-4 z-40">
            <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-panel rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">返回任务</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-medium text-foreground">伊斯坦布尔历史.mp4</span>
                    <Star className="w-4 h-4 text-muted-foreground hover:text-yellow-500 cursor-pointer" />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-panel rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                    <Download className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-panel rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
