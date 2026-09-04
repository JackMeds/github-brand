# Public repository presentation audit

The inventory covers 17 repositories present at the start of the refresh: 14 non-forks (including the profile), of which two are archived, plus three forks. github-brand is the new coordination repository.

## Four pilots

- Flowloud: current complete runtime is extension/. Store distribution is controlled Alpha; use honest source-loading instructions. Extension MIT and third-party notices exist even though GitHub's top-level license detection is empty.
- MingXu: remote main already has canonical mingxu tools, legacy aliases, bilingual product and a real live workspace. The older dirty local checkout is not the implementation baseline.
- BiliDigest: existing Chinese/English docs and GPL-3.0-or-later/NOTICE remain. Capture proof offline; never publish personal account/session information.
- Kehua Garden: import processing is local but Google Fonts makes network requests. No project LICENSE was found; remove unsupported permissive-license claims. Some cached media needs files to be selected again.

## Historical repositories

- MakeSoundBook: actual Electron audio tool, not just a framework starter. Preserve LiuChunlin & SuYutong attribution and the package's GPL-3.0 declaration; no independent license text was found.
- HaoXing: front end, BMS and Express server exist. Compose references a missing frontend context and lacks a required Dockerfile; do not promise one-command deployment.
- hideplayerheadblock: source/Gradle wrapper are absent from this checkout; mod metadata says All Rights Reserved. LICENSE.txt is Forge's upstream license, not a new license grant for the mod.
- kehua-time-machine: default branch is gh-pages and contains compiled assets. It can be served as a static site; no npm build process is claimed.
- Notesharea-server: Koa/MySQL/Redis; schema synchronization mutates a database and is not run during document checks.
- Notesharea-admin: some chart data still comes from course examples; document that limitation.
- Notesharea-web: upload points at an external demo service; document the integration boundary.
- HaoXing, Notesharea and kehua-time-machine do not have confirmed project-level license files in the inspected source.

HaoXing-BMS and HaoXing-server remain archived/read-only. wx_key, echotrace and open-webui remain unchanged forks. No ownership or license inference is made merely because GitHub marks a repository as a non-fork.
