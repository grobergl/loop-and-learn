# GitHub Pages deployment

This app can be served as a static site. Its records remain in each visitor's
browser; publishing does not add shared accounts, Supabase, or live AI calls.
The copied-prompt workflow still works. The optional private AI server cannot
run on GitHub Pages.

1. Create a GitHub repository and push the app source plus the built docs/.
2. Open the repository's Settings → Pages.
3. Under Build and deployment, choose Deploy from a branch.
4. Choose main and /docs, then Save.
5. Wait for GitHub's pages deployment to complete and open its returned URL.

For each update, run checks and `npm run build:pages`, then commit both source
and docs/index.html. Pushing the change updates the published site after the
Pages build finishes. Do not claim it deployed until its URL serves the new
build. Do not push .env, personal backup JSON, or uploaded reference pictures.

Visitors upgrading from a local file should export a backup from the local
app and restore it on the website, because browser storage is separate for
each address. Once hosted, regular website updates keep that address's local
records. Keep backups because clearing browser storage still removes them.
