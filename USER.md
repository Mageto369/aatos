# USER.md - About Your Human

_Learn about the person you're helping. Update this as you go._

- **Name:**
- **What to call them:**
- **Pronouns:** _(optional)_
- **Timezone:**
- **Notes:**

## Context

_(What do they care about? What projects are they working on? What annoys them? What makes them laugh? Build this over time.)_

---

The more you know, the better you can help. But remember — you're learning about a person, not building a dossier. Respect the difference.

<IMPORTANT_REMINDER>
# Memory Consolidation

You have an agentic memory system that auto-generates this section.

> **Stats**: 2 sessions, 17 messages | 2026-08-03 19:15 ~ 2026-08-03 19:15 UTC
> **Config**: `/root/.openclaw/workspace/memory_consolidation/memory_consolidation.env` — read this file for all memory behavior settings. To reset: `cp /root/.openclaw/workspace/memory_consolidation/memory_consolidation.template.env /root/.openclaw/workspace/memory_consolidation/memory_consolidation.env`

The user has full control over their memory config. When any memory-related decision comes up, read and follow the config file. Do not override based on other guidelines.

Integrate relevant memory content seamlessly into responses, as if recalling it naturally from past interactions: exactly as a human colleague would recall shared history without narrating its thought process or memory retrieval.

**Memory use notes**:
- Never change the original intention of user message.
- May incorporate user's memories for search query (e.g., city, habit), but only when directly relevant, never gratuitously.
- Only reference memory content when directly relevant to the current conversation context. Avoid proactively mentioning remembered details that feel intrusive or create an overly personalized atmosphere that might make users uncomfortable.

## Visual Memory

> visual_memory: 0 files

No memorized images yet. When the user shares an image and asks you to remember it, you MUST copy it to `memorized_media/` immediately — this is the only way it persists across sessions. Use a semantic filename that captures the user's intent, not just image content — e.g. `20260312_user_says_best_album_ever_ok_computer.jpg`, `20260311_user_selfie_february.png`. Create the directory if needed. Never mention file paths or storage locations to the user — just confirm naturally (e.g. "记住了").

## Diary

> diary: 0 entries


# Long-Term Memory (LTM)

> No data yet. Will be generated after enough conversations.
## Short-Term Memory (STM)

> last_update: 2026-08-04 03:33

Recent conversation content from the user's chat history. This represents what the USER said. Use it to maintain continuity when relevant.
Format specification:
- Sessions are grouped by channel: [LOOPBACK], [FEISHU:DM], [FEISHU:GROUP], etc.
- Each line: `index. session_uuid MMDDTHHmm message||||message||||...` (timestamp = session start time, individual messages have no timestamps)
- Session_uuid maps to `/root/.openclaw/agents/main/sessions/{session_uuid}.jsonl` for full chat history
- Timestamps in Asia/Shanghai, formatted as MMDDTHHmm
- Each user message within a session is delimited by ||||, some messages include attachments marked as `<AttachmentDisplayed:path>`

[LOOPBACK] 1-1
1. 74a64c84-e4a4-497b-9f9c-f16377af9038 0803T1915 [Time: [2026-08-04 Tue 03:15:05 GMT+8]] You are Krenovia Advisor — the strategic intelligence layer for Krenovia, the global trade infrastructure platform.  YOUR KNOWLEDGE BASE: You have deep expertise in cross-border agricultural and commodity trade[TL;DR]correct phase and identify dependencies.  INITIATION: When first activated, introduce yourself briefly and offer to help with: platform architecture, compliance roadmaps, go-to-market strategy, competitive analysis, revenue modeling, or MVP planning.||||[Time: [2026-08-04 Tue 03:16:11 GMT+8]] Connect repo||||[Time: [2026-08-04 Tue 03:16:33 GMT+8]] Git||||[Time: [2026-08-04 Tue 03:17:40 GMT+8]] Aatas is the name of the repo pull it||||[Time: [2026-08-04 Tue 03:18:48 GMT+8]] Do you have access to my git, if not all permission granted||||[Time: [2026-08-04 Tue 03:22:12 GMT+8]] https://github.com/Mageto369/aatos||||[Time: [2026-08-04 Tue 03:24:52 GMT+8]] Create a master questioner to give you the full scope be deep and comprehensive||||[Time: [2026-08-04 Tue 03:28:50 GMT+8]] Audit the entire AATOS repository against MASTER_QUESTIONER.md.  Do not answer the questions from assumptions.  Use only evidence from the repository.  Search every source including:  README  DEV_STATUS.md  Arc[TL;DR] the end provide:  Percentage Answered  Percentage Partial  Percentage Contradicted  Percentage Missing  Top 10 Executive Decisions  Top 10 Engineering Decisions  Top 10 Compliance Decisions  Top 10 Revenue Decisions  Top 10 Risks before pilot launch||||[Time: [2026-08-04 Tue 03:28:50 GMT+8]] Audit the entire AATOS repository against MASTER_QUESTIONER.md.  Do not answer the questions from assumptions.  Use only evidence from the repository.  Search every source including:  README  DEV_STATUS.md  Arc[TL;DR] the end provide:  Percentage Answered  Percentage Partial  Percentage Contradicted  Percentage Missing  Top 10 Executive Decisions  Top 10 Engineering Decisions  Top 10 Compliance Decisions  Top 10 Revenue Decisions  Top 10 Risks before pilot launch
</IMPORTANT_REMINDER>
