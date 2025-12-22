import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dein PolitiKurs - Auswertung',
    description: 'Deine persönliche Auswertung: Mit welcher Partei stimmst du am meisten überein? Vergleiche deine Entscheidungen mit dem Bundestag.',
};

export default function MatchesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
