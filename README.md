# PolitiKurs 🗳️

**PolitiKurs** hilft Bürgerinnen und Bürgern, komplexe Bundestagsabstimmungen zu verstehen, indem legislative Texte in einfache, neutrale Ja/Nein-Fragen übersetzt werden. Die App ermöglicht es Nutzern, ihre eigene Haltung direkt mit dem tatsächlichen Abstimmungsverhalten der Parteien im Bundestag zu vergleichen.

## Features

-   **Vereinfachte Fragen**: Komplexe "Gesetzessprache" wird mittels KI in verständliches Deutsch übersetzt.
-   **Wahl-Abgleich**: Vergleiche deine Meinung mit den Parteien (SPD, CDU/CSU, Grüne, FDP, AfD, Linke, BSW).
-   **Transparente Quellen**: Direkte Links zu offiziellen Dokumenten und PDFs des Bundestags.
-   **Filter**: Filtere nach Themen, Parteien und Abstimmungseregbnissen.
-   **Deep Explanations**: Erhalte auf Wunsch einfach verständliche Erklärungen für jeden Gesetzentwurf (Leichte Sprache).

## Tech Stack

-   **Frontend**: Next.js 14 (App Router), Tailwind CSS
-   **Backend/DB**: Supabase (PostgreSQL)
-   **AI**: OpenRouter (Mistral/Llama Modelle) für Zusammenfassungen und Leichte Sprache.

## Loslegen (Getting Started)

1.  **Repository klonen**:
    ```bash
    git clone https://github.com/wolfgangstefani/checkvotes.git
    cd checkvotes
    ```

2.  **Abhängigkeiten installieren**:
    ```bash
    npm install
    ```

3.  **Umgebung einrichten**:
    Kopiere die Beispiel-Datei und trage deine Keys ein:
    ```bash
    cp .env.example .env.local
    ```
    Du benötigst ein Supabase-Projekt und einen OpenRouter API Key.

4.  **Development Server starten**:
    ```bash
    npm run dev
    ```
    Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## Mitarbeit (Contributing)

Wir freuen uns über Beiträge! Bitte schau in [CONTRIBUTING.md](CONTRIBUTING.md) für Details (aktuell auf Englisch/Deutsch gemischt).

## Lizenz

Dieses Projekt ist unter der MIT Lizenz veröffentlicht - siehe [LICENSE](LICENSE) Datei für Details.
