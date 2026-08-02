# Hacker News Launch 

**Title:** Show HN: ToDeAcordo – We built a "Consensus Closing" engine for Google Meet

**Body:**
Hey HN,

I’m Alexandre, builder of ToDeAcordo.

We noticed that AI meeting assistants are great at creating exhaustive transcripts and summaries, but terrible at driving accountability. A summary sitting in a Google Doc doesn't prevent a client from saying "That wasn't what we agreed upon" two weeks later.

We built a Chrome Extension that injects right into Google Meet. Instead of recording audio (which triggers privacy concerns and bots joining calls), we hook into the live DOM captions (`div[class*="a-s-fa-Ra"]`). 

At the end of the call, we parse the text to extract formal obligations, deadlines, and decisions, running a heuristic "Risk Map" to flag vague language (like "maybe we'll see about that later"). 

Then we generate a public, hashed URL (e.g., `todeacordo.com.br/valida/meet-123`). You send this to your client. They open it, review the items, and click either "Tô de Acordo" (which triggers a canvas for a signature and logs the IP/Hash) or "Tenho Ressalvas" (forcing them to document objections immediately).

It’s not a legally binding contract (yet), but it acts as an operational handshake to kill scope creep.

The frontend is React + Vite, deployed on Vercel. We use a hybrid approach for storage, utilizing IndexedDB for local drafts and Supabase for the Audit Trail.

Would love your thoughts on the approach, especially the decision to avoid audio recording in favor of DOM scraping for privacy/friction reasons. 

Link: https://todeacordo.com.br

Cheers!
