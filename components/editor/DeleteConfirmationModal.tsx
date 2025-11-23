import React from 'react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[400px] bg-[#1e1e1e] rounded-xl border border-[#333] shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-medium text-white">是否删除该视频？</h3>
                    <p className="text-sm text-neutral-400">已删除的视频仍然可以从历史纪录中找到</p>
                </div>

                <div className="flex items-center justify-end gap-3 mt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg border border-[#333] text-sm text-neutral-300 hover:bg-[#333] transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-1.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors"
                    >
                        确认
                    </button>
                </div>
            </div>
        </div>
    );
};
