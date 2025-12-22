# CheckVotes 🗳️

**CheckVotes** (or *PolitiKurs*) helps citizens understand complex parliamentary votes by translating legislative texts into simple, neutral yes/no questions. It allows users to compare their own stance with the actual voting behavior of political parties in the Bundestag.

## Features

-   **Simplified Questions**: Complex "legislatese" is translated into clear German using AI.
-   **Vote Matching**: See how your opinion aligns with parties (SPD, CDU/CSU, Grünen, FDP, AfD, Linke, BSW).
-   **Transparent Sources**: Direct links to official Bundestag documents and PDFs.
-   **Filtering**: Filter by topics, parties, and vote outcomes.
-   **Deep Explanations**: Request easy-to-read explanations for every bill (Leichte Sprache).

## Tech Stack

-   **Frontend**: Next.js 14 (App Router), Tailwind CSS
-   **Backend/DB**: Supabase (PostgreSQL)
-   **AI**: OpenRouter (Mistral/Llama models) for summarization and simplified language generation.

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/wolfgangstefani/checkvotes.git
    cd checkvotes
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Copy the example environment file and fill in your keys:
    ```bash
    cp .env.example .env.local
    ```
    You will need a Supabase project and an OpenRouter API key.

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the app.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
