# Proview Employee night test log

One line per night run (newest at the bottom). The test itself is tests/nighttest/run.py in this export.

- 2026-11-11 02:09 UTC — PASS — 1,400 prompts (owner + staff), phone/iPad input sample and 3-size page sweep all clean. Only note: "Compare last 7 days with last 7 days" gives the generic "I can answer questions about" reply (not counted as a failure).
- 2026-11-11 03:10 UTC — PASS — same. Only note: the same generic reply (2 times). The trailing "." in the scheduled command is read as a bad seed, so run.py was run without it.
- 2026-11-11 04:09 UTC — PASS — same. Only note: "Compare last 7 days with on the 3rd of November" gives the generic reply.
- 2026-11-11 05:10 UTC — PASS — clean, no notes.
- 2026-11-11 06:09 UTC — PASS — clean, no notes.
- 2026-11-11 07:11 UTC — PASS — clean, no notes.
- 2026-11-12 (afternoon) — PASS — seeds 21, 22, 23, 31, 32, 33 on version 1794475612-cd9e, 1,400 prompts each, all clean.
