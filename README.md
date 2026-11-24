# Loop & Learn

Version 2.1.0 of the crochet planning app for an AI / vibe programming course.

## Try the app without installing anything

Open the standalone HTML download in a modern browser. It includes its fonts,
illustrations, and application code. The app saves one maker's studio in that
browser. It does not have separate sign-ins or cross-device sync yet.

Before replacing an earlier version, open Studio settings and export a JSON
backup. In this version, restore that backup and explicitly confirm replacing
the sample studio. Version 1 backups and single-color projects are supported.
Browser storage for local HTML files varies by browser; keep exported backups.
Clearing browser data removes locally saved work. Reference pictures use
storage too; the app reports save failures rather than claiming success.

New project is available from the dashboard, project list, an open project,
and the pattern library.

## Four ways to start

1. **Choose a pattern:** choose from built-in or maker-added patterns, including
   a difficulty filter. Give the project its own name and materials.
2. **Paste my pattern:** paste or type instructions. Enter separates checkable
   rows/rounds; `Round 1:`, `Row 1:`, Markdown bullets, and numbered lists work.
   `Rounds 3–5: sc around` expands into three separate rounds. Preview and edit
   before saving. `#` headings are ignored; put essential setup/finishing notes
   into the fields provided. Declaring source terminology is the maker's job.
3. **Describe an idea:** save a brief, set a target difficulty/terminology, copy
   a request into an existing AI chat, and paste the returned instructions.
   Automatic drafting is available only with the connected local server below.
4. **Start from a picture:** add a PNG/JPG/WebP reference under 750 KB and a
   description. Save it with manual or pasted instructions, or use a connected
   AI service. Copying a prompt does not copy/send the image; attach it to your
   AI chat yourself. A reference is for a crochet interpretation, not exact
   reconstruction of hidden construction.

The idea/photo paths never fabricate generated output. Without a configured
AI server, Generate an AI draft is disabled and explains what is missing.
User-entered or AI-generated patterns need human review and test crocheting.

## Icons, sidebar, and whole-pattern replies

Project pictures are fixed category symbols: bunny for Plushies, shirt for
Clothing, house for Home, bag for Accessories, and shapes for Other. Changing
the category changes the icon automatically, including in the pattern editor.
Symbols do not claim to depict the finished project. No image service is used.
The desktop sidebar uses compact spacing; decoration yields at short window
heights so the profile stays visible. The main content scrolls independently.

The editor includes “Paste a full AI reply or written pattern.” Paste the whole
response there and choose “Organize reply into fields.” It separates Pattern
details, Materials, Notes, Instructions, and Finishing. Recognised hook/weight/
terminology fields and per-color total yard estimates are filled in. Only the
Instructions section becomes numbered rows/rounds. Review the preview and
fields: this is a heading-based importer, not a guarantee for arbitrary prose.
The copied AI prompt requests those same headings and total yards per color.

## Personal setup

The dashboard offers a four-step setup: crochet rhythm, stitch familiarity,
preferences, and optional supplies. Habits include unfinished projects,
occasional work, weekly work, and starting/making one or more projects most
weeks. Multiple habits may be selected. Frequency/years alone do not set level.

A transparent starting-level suggestion uses selected mastered stitches and
reported construction experience. The maker can override it and choose
relaxing projects or challenges. All difficulties remain accessible. The
small built-in library currently tops out at Confident beginner; advanced
makers can add their own patterns. Recommendations rank the available
collection by interests, stitch familiarity, level, and learning preference.

US-first / UK-first preferences affect stitch names and supported instruction
terms. The original source terminology is retained and shown when different.
This is a glossary conversion, not a translator for arbitrary pattern syntax.
The written stitch guides remain clearly labeled US source material.

Hooks, supplies, and free-text details are optional. They are a personal
checklist, not counted stock that is automatically consumed. Stitch mastery
is always chosen by the maker, never inferred from project completion.

## A growing stitch library

Twenty-four written guides include the nine foundation/shaping techniques and
bobble, shell, puff, popcorn, clusters, post stitches, picot, reverse single
crochet, waistcoat, spike, V stitch, moss stitch, and granny clusters. Stitch
recipes vary; the guide examples do not override a pattern's stitch key.

Setup offers essentials first and an optional expanded texture/advanced list.
My stitches starts with foundation stitches and grows when projects require
recognised catalogue stitches or the maker selects familiarity. Discover
shows the rest of the catalogue. Pasted text selects likely stitches for the
maker to review; it cannot identify every abbreviation or unknown stitch.
Project creation and project details invite the maker to learn an unfamiliar
stitch or explicitly mark it known. Saving/finishing never assumes mastery.
A starting Advanced suggestion now also considers texture familiarity; levels
remain editable preferences rather than certifications.

## Materials and progress

Each project has an editable pattern snapshot and multiple color roles. Each
role has a yarn weight, estimated yardage, and an actual stash yarn ID or
explicit Need to buy status. Add yarn inside creation, change assignments in
Edit project, and add or remove color roles. Custom library patterns preserve
color-role requirements for reuse, without forcing old stash assignments.

Reservations aggregate across projects and across color roles using the same
yarn. They do not subtract from on-hand stock. Availability is on hand minus
active reservations; shopping shortages are max(0, reserved minus stock).
Unassigned colors appear as their full estimated requirement in the shopping
list. A weight match does not verify fiber, gauge, or suitability.

At completion, enter actual use for each color. Combined use of the same yarn
must not exceed stock. Stock is deducted once and reservations released.
Completion is irreversible in this version. Canceling releases reservations
without consuming yarn. Reassign purchased yarn before recording its use.

Each project keeps its own instructions; editing a project does not rewrite
the library or another project. If instructions change after progress was
recorded, saving requires explicit confirmation to reset the checked rows.
Row/round percentage is not an estimate of time, material use, or difficulty.

## Work on the source

Requires Node 22.12+ (tested with Node 24). Run from this folder:

```sh
npm ci
npm run dev -- --port 5173
```

For a local static build or a new downloadable app:

```sh
npm run build
npm run build:standalone
```

Standard web assets are in `dist/`. The complete downloadable file is
`standalone/index.html`. No cloud preview settings are needed for that file.
The cloud machine's localhost is not a browser link on another computer.

## Optional automatic AI drafting

This is a separate connection step, not required for manual/paste workflows.

1. Copy `.env.example` to `.env` on your own computer.
2. Put your provider key in `OPENAI_API_KEY` in that local file. Keep it private.
3. Run `npm run build`, then `npm start`.
4. Open the server URL printed in your terminal, normally
   `http://127.0.0.1:4174` on that same computer. The served app can now request
   drafts. For development, Vite proxies `/api` to that server.

The server uses the OpenAI Responses API with structured JSON and optional
reference-image input; the default model is gpt-4.1-mini and can be changed
with OPENAI_MODEL. A provider account/key and associated usage billing are
required. Keys never go into browser code or exports. The local server binds
to 127.0.0.1 by default, limits request sizes/rate, and rejects other origins.
Do not expose it online until real authentication, authorization, and hosted
usage controls are added. GitHub/Supabase alone do not provide an AI model key.

Contract tests use a mocked provider; no live AI request was made during this
build. Model output is an untested draft and can have incorrect stitch counts,
shaping, gauge, or assembly. Provider errors keep the input intact.

## Checks

```sh
npm test
npx playwright test
```

Start Vite on port 5173 and the optional Node server on 4174 before browser
checks. Tests use an isolated Chromium context; they do not change the maker's
saved browser data. The Playwright config uses `/usr/bin/chromium`; adjust to
your installation or install Playwright's browser on another computer.

## Source map

- `AGENTS.md`: durable instructions, business rules, boundaries, and checks.
- `HANDOFF.md`: current state, delivery workflow, and what to provide next chat.
- `src/main.jsx`: navigation, studio state, dashboard, and pages.
- `src/ProjectForms.jsx`: all four starts, instruction editor, color assignments.
- `src/Profile.jsx`: optional personal setup.
- `src/project.js`: instruction parsing, glossary, profiles, backup validation.
- `src/model.js`: reservations, shortages, and actual yarn consumption.
- `src/Modal.jsx`: dialogs, stash forms, stitch guides, backups, and completion.
- `src/data.js`: original sample patterns, stitches, and demonstration records.
- `src/ai-service.js` and `server.mjs`: optional AI adapter and local server.
- `tests/`: business checks, browser workflows, and mocked AI contract checks.

## GitHub and later class connections

The app source is being published to https://github.com/grobergl/loop-and-learn.
Read DEPLOY.md for GitHub Pages setup. `npm run build:pages` creates a complete
static website in docs/. GitHub Pages must be enabled for main /docs before
that website is live; never assume a source upload itself proves publication.
Pages cannot run the optional Node AI server. Static/manual workflows work.

Supabase authentication/database storage are not yet connected. A real
multi-user version needs data ownership and row-level access policies, not a
local profile switcher. Preserve local records during that migration. Private
Page attachments remain available for standalone and source downloads.
