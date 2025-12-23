export const partyColors: Record<string, string> = {
    'CDU/CSU': '#000000', // Black
    'SPD': '#E3000F',     // SPD Red
    'AfD': '#009EE0',     // AfD Blue
    'FDP': '#FFED00',     // FDP Yellow
    'GRÜNEN': '#46962b',  // Green
    'BÜNDNIS 90/DIE GRÜNEN': '#46962b',
    'DIE LINKE': '#BE3075', // Magenta
    'BSW': '#771e3d',      // BSW Dark Red
    'SSW': '#003C8F',      // SSW Blue
    'fraktionslos': '#94a3b8' // Slate-400
};

export function getPartyColor(label: string): string {
    const lowerLabel = label.toLowerCase();
    for (const [key, color] of Object.entries(partyColors)) {
        if (lowerLabel.includes(key.toLowerCase())) return color;
    }
    return '#94a3b8'; // Slate-400
}

export function splitPartyLabel(label: string): { name: string; period?: string } {
    const match = label.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
        return {
            name: match[1].trim(),
            period: `(${match[2]})`
        };
    }
    return { name: label };
}
