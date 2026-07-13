import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Density = 'compact' | 'comfy' | 'cozy';

interface CrawlerUIContextType {
    focusedIssueCategory: string | null;
    setFocusedIssueCategory: (category: string | null) => void;
    density: Density;
    setDensity: (d: Density) => void;
}

const CrawlerUIContext = createContext<CrawlerUIContextType | undefined>(undefined);

export function CrawlerUIProvider({ children }: { children: ReactNode }) {
    const [focusedIssueCategory, setFocusedIssueCategory] = useState<string | null>(null);
    const [density, setDensity] = useState<Density>(() => {
        if (typeof window === 'undefined') return 'comfy';
        return (localStorage.getItem('seesby.density') as Density) || 'comfy';
    });

    useEffect(() => {
        localStorage.setItem('seesby.density', density);
    }, [density]);

    return (
        <CrawlerUIContext.Provider value={{ 
            focusedIssueCategory, 
            setFocusedIssueCategory,
            density,
            setDensity
        }}>
            {children}
        </CrawlerUIContext.Provider>
    );
}

export function useCrawlerUI() {
    const context = useContext(CrawlerUIContext);
    if (context === undefined) {
        throw new Error('useCrawlerUI must be used within a CrawlerUIProvider');
    }
    return context;
}
