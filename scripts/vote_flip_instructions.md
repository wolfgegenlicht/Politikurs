# Vote Flip Logic Setup

## 1. Update Database (SQL)
Run this command in your Supabase SQL Editor to add the missing column:

```sql
ALTER TABLE public.poll_questions 
ADD COLUMN IF NOT EXISTS vote_flip boolean DEFAULT false;
```

## 2. Reset "Russia" Poll (Terminal)
Clear the old cached question for Poll 6360 so it regenerates:

```bash
npx tsx reset_poll.ts
```

## 3. Trigger Sync (Terminal)
Run the sync to generate the new question (with `vote_flip: true`):

```bash
curl http://localhost:3000/api/sync-polls
```

## 4. Verify
Check the Localhost page for Poll 6360. The logic should now be aligned.
