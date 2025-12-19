'use client';

import { useState, useEffect } from 'react';

interface ObfuscatedMailProps {
    user: string;
    domain: string;
    className?: string;
}

export function ObfuscatedMail({ user, domain, className }: ObfuscatedMailProps) {
    const [email, setEmail] = useState<string>('Loading...');

    useEffect(() => {
        // Construct email only on client side
        setTimeout(() => {
            setEmail(`${user}@${domain}`);
        }, 500);
    }, [user, domain]);

    if (email === 'Loading...') {
        return <span className="text-slate-300 select-none">...</span>;
    }

    return (
        <a href={`mailto:${email}`} className={className}>
            {email}
        </a>
    );
}
