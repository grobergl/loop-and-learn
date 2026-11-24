# Loop & Learn handoff

## Current work

Version 2.1.0 adds fixed category icons, a compact sidebar, 24 stitch guides,
a growing personal stitch collection, texture-aware setup, and a full-pattern
reply importer aligned with the copied AI prompt. It keeps New project accessible from the project list, an open
project, and the pattern library. Version 2 adds four creation paths, editable user patterns, project-specific
instruction snapshots, multiple colors with yarn IDs and quantity accounting,
inline yarn entry, later yarn reassignment, personal setup, recommendations,
and US/UK glossary preferences. Version 1 JSON backups remain supported.

## What is connected

The downloadable HTML works for local profiles, manual/pasted patterns,
reference photos, idea briefs, prompt copying, and project/yarn management.
AI drafting has an optional local Node server and structured-output adapter;
it requires a private server-side model key. Tests mock provider calls. No
live provider call, Supabase connection, separate user login, or
cross-device sync has been configured. Never imply otherwise.

## GitHub publishing

The selected repository is https://github.com/grobergl/loop-and-learn.
The website address is https://grobergl.github.io/loop-and-learn/.
GitHub reported a successful Pages deployment for source commit
1184b515741c230b6579c8eaa089055931ed9ae0. Direct access to the website
hostname was rejected by the environment network policy, so no live visual
check was performed. Local build and browser checks passed.
Source and docs/index.html should be updated in one commit after checks.
Run npm run build:pages. The repository's Pages settings must deploy main
/docs. Verify the actual website before calling it live. No real users'
local browser records, reference images, or backup files belong in Git.

## Classroom approach

This chat is still expanding the initial build. For a chapter exercise, let
the student predict the outcome, choose an edge case, inspect the changes,
and operate the app. Agent-run checks supplement their judgment. Do not
complete their prediction/reflection for them. The course reading emphasizes
what the agent can see, what it may do, and independent evidence it worked.

## Next conversation

Attach the latest source ZIP (not only the runnable HTML). It includes
AGENTS.md, README.md, this handoff, and editable source. Ask the next agent to
read them and identify relevant files before editing. Attach the next chapter
separately if needed. In a normal webpage chat, use the attachment/paperclip
or plus button beside the message composer and select the ZIP from Downloads;
the exact label depends on the client. Do not guess menu locations if absent.
A future Codex checkout can load AGENTS.md from the connected repository.

## Preserve maker data

In the old downloaded app, export a JSON backup from Studio settings before
switching files/browsers. Restore it in the new app and confirm replacement.
Source ZIPs do not contain the maker's browser records. AI keys do not belong
in source ZIPs or in chat. Use .env.example locally for later configuration.

## Delivery

Update the existing private download Page with the latest standalone HTML,
source ZIP, and AGENTS.md. Keep its instructions accurate. Published Sites is
not enabled in this workspace; do not send the user searching for nonexistent
web environment settings. Private download links are supplied in the chat, not in public source files.
