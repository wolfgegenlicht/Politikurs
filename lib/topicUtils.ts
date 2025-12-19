export type SimplifiedTheme =
    | 'Alle'
    | 'Klima & Umwelt'
    | 'Wirtschaft & Finanzen'
    | 'Soziales & Gesundheit'
    | 'Außen & Europa'
    | 'Recht & Sicherheit'
    | 'Demokratie'
    | 'Bildung & Digitales'
    | 'Sonstiges';

export const THEMES: SimplifiedTheme[] = [
    'Alle',
    'Klima & Umwelt',
    'Wirtschaft & Finanzen',
    'Soziales & Gesundheit',
    'Außen & Europa',
    'Recht & Sicherheit',
    'Demokratie',
    'Bildung & Digitales',
    'Sonstiges'
];

export function mapTopicsToTheme(rawTopics: string[]): SimplifiedTheme {
    if (!rawTopics || rawTopics.length === 0) return 'Sonstiges';

    const text = rawTopics.join(' ').toLowerCase();

    // Priority ordered mapping
    if (text.match(/klima|umwelt|energie|natur|reaktor|tierschutz/)) return 'Klima & Umwelt';
    if (text.match(/wirtschaft|finanz|haushalt|steuer|arbeit|beschäftigung|landwirtschaft|verkehr|bauen|wohnen/)) return 'Wirtschaft & Finanzen';
    if (text.match(/sozial|gesundheit|familie|frauen|jugend|senioren|rente|pflege|inklusion/)) return 'Soziales & Gesundheit';
    if (text.match(/außen|europa|eu|verteidigung|entwicklung|menschenrechte|krieg|frieden|international/)) return 'Außen & Europa';
    if (text.match(/recht|sicherheit|justiz|polizei|migration|asyl|inneres/)) return 'Recht & Sicherheit';
    if (text.match(/bundestag|wahl|partei|demokratie|lobby|transparenz/)) return 'Demokratie';
    if (text.match(/bildung|digital|medien|forschung|wissenschaft|kultur|netz|internet/)) return 'Bildung & Digitales';

    return 'Sonstiges';
}
