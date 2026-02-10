# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PolitiKurs** is a Next.js 14 application that translates complex German Bundestag (parliament) votes into simple yes/no questions, allowing citizens to compare their views with how political parties voted. The app uses AI to generate simplified questions and explanations from legislative texts.

**Tech Stack**: Next.js 14 (App Router), TypeScript, Supabase (PostgreSQL), Tailwind CSS, OpenRouter API (AI models)

## Development Commands

### Core Development
```bash
npm install              # Install dependencies
npm run dev              # Start development server (localhost:3000)
npm run build            # Production build
npm start                # Start production server
npm run lint             # Run ESLint
```

### Database Setup
1. Create a Supabase project
2. Run the schema: `supabase/schema.sql` contains the core database structure
3. Apply migrations in order from `supabase/migrations/`

### API Routes for Data Sync
```bash
# Sync polls from Abgeordnetenwatch API (manual trigger during development)
curl http://localhost:3000/api/sync-polls?limit=5

# Generate debate analysis for a poll (manual trigger)
curl http://localhost:3000/api/cron/sync-debate
```

**Note**: In production, these run as daily cron jobs (configured in `vercel.json`)

## Architecture

### Data Flow

1. **External Data Source**: Abgeordnetenwatch.de API provides Bundestag votes and voting records
2. **Data Sync** (`app/api/sync-polls/route.ts`):
   - Fetches polls from Abgeordnetenwatch API
   - Stores raw poll data in `polls` table
   - Fetches individual votes and aggregates by party/fraction into `vote_results`
   - Generates AI-simplified questions via OpenRouter API
   - Stores AI-generated content in `poll_questions` table
3. **Debate Analysis** (`app/api/cron/sync-debate/route.ts`):
   - Processes polls without analysis
   - Uses Perplexity (via OpenRouter) to generate pro/contra arguments
   - Stores in `poll_analysis` table

### Database Schema (Supabase)

**Core Tables**:
- `polls`: Raw Bundestag vote data (title, description, date, topics, links)
- `poll_questions`: AI-generated simplified questions and explanations
  - **Critical field**: `vote_flip` - boolean indicating if the question logic is inverted from the original title
- `vote_results`: Aggregated party voting results per poll (yes/no/abstain counts)
- `user_votes`: Anonymous user votes tracked by session_id (cookie-based)
- `user_vote_stats`: Real-time aggregated user voting statistics
- `poll_analysis`: AI-generated debate analysis (pro/contra arguments)

### Vote Flip Logic

The `vote_flip` field is crucial for correct vote interpretation:
- When `false`: "yes" to the question = "yes" to the original motion
- When `true`: "yes" to the question = "no" to the original motion (question is inverted)
- Example: Title="Reject proposal" but Question="Should this be accepted?" → flip=true

This logic is implemented in:
- `app/api/sync-polls/route.ts` (AI generation prompt)
- `lib/matchUtils.ts` (party matching calculations)
- `components/VoteMatchAnalysis.tsx` (UI display)

### Frontend Structure

**Pages** (App Router):
- `app/page.tsx`: Main feed with filterable poll list
- `app/poll/[id]/page.tsx`: Individual poll detail page with voting interface
- `app/matches/page.tsx`: User's voting history and party match analysis

**Key Components**:
- `PollList`: Renders poll cards with vote interface
- `PollInteraction`: Handles user voting, displays party results
- `VoteMatchAnalysis`: Shows how user vote aligns with parties (respects vote_flip)
- `FilterBar`: Topic and party filtering

### AI Integration

**OpenRouter Models Used**:
- `openai/gpt-oss-120b`: Question generation (fast, free tier)
- `perplexity/sonar`: Debate analysis with web search (requires credits)

**AI Prompt Strategy**:
- Questions must be answerable with "dafür" (for) or "dagegen" (against)
- Questions start with "Sollen..." (Should...)
- Explanations must be neutral, avoid mentioning parties or vote outcomes
- System enforces strict JSON responses for parsing reliability

### State Management

- **Server-side**: Supabase queries with ISR (revalidate: 60s on homepage)
- **Client-side**: React state for voting interactions, localStorage for vote history
- **Session tracking**: Cookie-based session_id for anonymous vote tracking

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (for API routes only)
- `OPENROUTER_API_KEY`: OpenRouter API key for AI features
- `CRON_SECRET`: Bearer token for securing cron endpoints (production)
- `NEXT_PUBLIC_APP_URL`: App URL for CORS/redirects

## Important Conventions

### Path Aliases
- `@/*` maps to project root (e.g., `@/components`, `@/lib`)

### TypeScript
- Strict mode enabled
- Component types should use `Promise<{ params }>` for Next.js 14+ async params

### Styling
- Tailwind CSS 4 (postcss-based)
- Component library: Custom design with Lucide icons
- Mobile-first responsive design

### Deployment
- Hosted on Vercel
- Cron jobs configured in `vercel.json` (daily debate sync at 5am UTC, poll sync hourly to prevent timeout)
- Poll Sync Route: `/api/sync-polls?limit=5` (small batches to stay under 60s limit)
- ISR enabled for dynamic pages with caching

## Working with the Codebase

### Adding a New Poll Filter
1. Update `app/page.tsx` filter logic (lines 75-139)
2. Add UI controls in `components/FilterBar.tsx`
3. Update URL search params handling

### Modifying AI Prompts
- Question generation: `app/api/sync-polls/route.ts` (lines 283-320)
- Debate analysis: `app/api/cron/sync-debate/route.ts` (lines 64-82)
- Always test with actual API responses, AI can be unpredictable

### Database Migrations
- Create new files in `supabase/migrations/` with timestamp prefix
- Apply manually via Supabase dashboard or CLI
- Update `supabase/schema.sql` to reflect current state

### Testing Vote Logic
- Pay special attention to `vote_flip` logic when testing
- Test cases: normal votes, flipped votes, ties, abstentions
- Check both `lib/matchUtils.ts` and component rendering

## Common Gotchas

- **Vote Flip**: Always verify the vote_flip field is correctly applied in calculations
- **Array vs Object Returns**: Supabase joins can return arrays or single objects - handle both
- **AI Rate Limits**: OpenRouter free tier has limits - implement retry logic
- **Session Tracking**: Cookie-based, so testing requires fresh browser sessions
- **HTML in Descriptions**: Poll descriptions contain HTML - always sanitize and clean before display
- **Cron Authentication**: Production cron endpoints require Bearer token from `CRON_SECRET`
