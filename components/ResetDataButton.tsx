'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ResetDataButton() {
    const router = useRouter();

    const handleReset = async () => {
        if (!confirm('Möchtest du wirklich alle lokal gespeicherten Daten unwiderruflich löschen? Deine Abstimmungen gehen verloren.')) {
            return;
        }

        // 1. Clear Local Storage
        localStorage.clear();

        // 2. Delete Cookies (Session ID)
        // Helper to delete cookie
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // 3. Reload
        window.location.reload();
    };

    return (
        <button
            onClick={handleReset}
            className="mt-8 text-xs font-bold text-red-400 hover:text-red-600 uppercase tracking-widest flex items-center justify-center gap-2 transition-colors opacity-60 hover:opacity-100"
        >
            <Trash2 size={12} strokeWidth={2.5} />
            Alles zurücksetzen
        </button>
    );
}
