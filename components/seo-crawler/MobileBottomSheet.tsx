import React, { ReactNode, useEffect, useMemo, useState } from 'react';

interface MobileBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    defaultHeight?: number;
}

export default function MobileBottomSheet({
    isOpen,
    onClose,
    title,
    children,
    defaultHeight = 60
}: MobileBottomSheetProps) {
    const [dragOffset, setDragOffset] = useState(0);
    const [startY, setStartY] = useState<number | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setDragOffset(0);
            setStartY(null);
        }
    }, [isOpen]);

    const translateY = useMemo(() => {
        if (!isOpen) return '100%';
        return `${Math.max(0, dragOffset)}px`;
    }, [dragOffset, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/70">
            <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} />
            <div
                className="relative w-full rounded-t-[24px] border-t border-[#2a2a31] bg-[var(--brand-surface-2)] shadow-[0_-20px_60px_rgba(0,0,0,0.45)] transition-transform duration-200"
                style={{ height: `${defaultHeight}vh`, transform: `translateY(${translateY})` }}
            >
                <div
                    className="flex cursor-grab flex-col items-center gap-2 border-b border-[var(--brand-surface-3)] px-4 py-3 active:cursor-grabbing"
                    onTouchStart={(event) => setStartY(event.touches[0].clientY)}
                    onTouchMove={(event) => {
                        if (startY === null) return;
                        setDragOffset(event.touches[0].clientY - startY);
                    }}
                    onTouchEnd={() => {
                        if (dragOffset > 120) {
                            onClose();
                        }
                        setDragOffset(0);
                        setStartY(null);
                    }}
                >
                    <div className="h-1.5 w-12 rounded-full bg-[#3a3a40]" />
                    <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--brand-text-mid)]">{title}</div>
                </div>
                <div className="h-[calc(100%-56px)] overflow-y-auto px-4 py-4">
                    {children}
                </div>
            </div>
        </div>
    );
}
