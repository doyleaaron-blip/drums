# CLAUDE.md — Drums

This project already existed and is now built by the **Software Factory**.
Every Claude session (including the factory's automated builder) reads this
file first.

## Who you are working for

The owner has **no coding experience**. Use plain English in everything they
see (UI text, pull request descriptions, questions). Never ask them to edit
code or run commands.

## Rules

1. **Keep the project's own way of working.** Use the languages, libraries and
   folder layout already here; don't rewrite it into something else unless a
   backlog item asks for that.
2. **The factory needs two commands to pass:** `npm run check` (lint, type
   checks and tests where the project has them) and `npm run build`. If
   `package.json` or either script is missing, add the smallest ones that fit
   this project (for a plain website, `build` can simply check the files are
   there) as part of your first change.
3. **Write tests** for every behaviour you add or change.
4. **Analytics:** every user-facing app the factory builds includes PostHog
   (EU region, inputs masked, people identified by account id, never email).
   If it's missing, add it when a backlog item touches the pages, reading the
   key from `NEXT_PUBLIC_POSTHOG_KEY` (or an equivalent setting the website
   can read).
5. **Never commit secrets** or edit `.github/`. If you need a key, a decision
   or an account, stop and ask (see the builder's instructions).
6. Keep changes small and do only what the backlog item asks.
