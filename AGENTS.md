# Loop & Learn project instructions

## Purpose and context

Help crocheters choose or create projects, plan materials, follow editable
patterns, and grow stitch skills. This is also a classroom app for practicing
how to direct an AI coding agent.
Read README.md and inspect relevant source before proposing code changes.
State what you inspected, what you will change, and an observable success
criterion before editing application code. Keep changes within the request.
When a lesson asks the student to predict or check something, leave that part
to the student; do not replace their observation with your own summary.

## Current capabilities and connection limits

Four creation paths exist: library, pasted pattern, idea, and reference image.
Pasted text is organized locally; Enter separates instructions. Labeled
ranges can expand into individual rows or rounds. The maker can correct them.
Idea/photo paths save the brief/reference and allow manual instructions or
copying a request to an AI chat. Automatic AI drafts need the Node server and
a server-side OPENAI_API_KEY. Never claim generated instructions when no AI
call occurred. The adapter has mocked contract tests, not live-provider proof.
Real sign-ins, separate authenticated makers, database sync, and Supabase
integration are not implemented. The current studio is one maker per browser.
GitHub repository: grobergl/loop-and-learn. A push is not proof the website is live.
Confirm GitHub Pages deployment and the served build. Do not claim a ZIP upload
configures any service.

## Profile and recommendations

Ask about crochet habits, including unfinished and occasional projects; allow
multiple descriptions. Years/frequency alone do not establish skill level.
The maker selects stitch familiarity. Suggest a level transparently and let
them override it. Keep all difficulty levels accessible, including simple
projects for experienced makers. Do not automatically mark skills mastered.
Interests and learning preferences inform recommendations. The small library
may not contain advanced projects; do not present basic patterns as advanced.
Supplies and hook setup are optional. Supply notes are not measured inventory.

## Pattern and terminology rules

Keep the source pattern's declared US or UK terminology. Show the maker's
preferred system first, with the source/equivalent labeled. The built-in
guides retain their labeled US source. Do not guess ambiguous source terms.
Samples and AI drafts have not been independently test-crocheted. Label yarn
estimates and unverified AI output. Do not promise exact photo reconstruction.
A project has its own pattern snapshot. Editing it must not change another
project or the library original. Ask explicitly before clearing checked rows
when instructions change. Row progress does not mean time or yarn progress.

## Interface and import expectations

Use fixed category icons everywhere: bunny/Plushies, shirt/Clothing,
house/Home, bag/Accessories, shapes/Other. They are category symbols, not
finished-project images. Keep the desktop profile accessible at short window
heights by reducing decorative spacing; let the main content scroll.
The full-pattern importer must separate materials, assumptions, setup, and
finishing from numbered crochet instructions. Keep the copied AI prompt in
agreement with its supported headings. Preserve the original reply until
import succeeds and invite review of ambiguous or missing fields.
The personal stitch library grows from recognised project requirements or
explicit familiarity selections. Offer Learn / already known choices; never
infer mastery. The catalogue has 24 guides; unknown stitches are not silently
invented. Include textured techniques in optional onboarding assessment.

## Yarn and project records

Projects link to stash yarn by stable IDs. Each color role has an estimated
quantity and a selected yarn record or an explicit need-to-buy entry.
Weight compatibility does not guarantee suitable fiber, color, or gauge.
Active projects reserve estimated yarn; reservations do not reduce stock.
Aggregate reservations for every project/color using the same yarn record.
Unassigned colors become shopping needs. Keep shortages separate by yarn.
Adding yarn, changing assignments, or revising estimates must recalculate
availability. Exclude the edited project's old reservation from its preview.
Canceling releases reservations without consuming yarn.
Finishing deducts confirmed actual use once per yarn record and releases all
reservations. Combine uses of the same yarn before validating stock limits.
Reject missing/negative usage and spending more yarn than is on hand.

## Boundaries and persistence

Preserve unrelated work and existing records. Maintain compatibility with
version 1 JSON backups and single-color projects. Never silently reset a
studio during an upgrade. Show a save error if browser storage is full.
Use isolated test contexts; do not alter the maker's real browser records.
Ask before deleting stored data, adding paid services, or changing access to
public. A user confirming a specific cancellation or restore authorizes it.
Keep AI keys on the server, out of browser code, exports, logs, and Git.
The bundled AI server is local by default. Hosted deployment requires real
authentication and per-user authorization before exposing paid generation.
Future-feature notes are context, not blanket authorization to implement them.

## Verification and delivery

Use npm test for business calculations, parsing, migration, and AI contracts.
Check affected browser flows for interface changes, including awkward cases.
Run npm run build and npm run build:standalone before delivering app changes.
For GitHub publication run npm run build:pages, then commit source and docs/
together. Keep public uploads free of .env and personal backup/image files.
Report passed/failed checks and distinguish mocked tests from live services.
Do not call unavailable UI settings verified. Deliver a current standalone
HTML plus source ZIP through the existing private download Page. Update its
instructions and known limits. Include AGENTS.md and HANDOFF.md in the ZIP.
