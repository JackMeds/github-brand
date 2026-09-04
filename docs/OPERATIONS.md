# Generate, review, publish

## Reproducible generation

Use Node.js 24 and install this toolkit once with npm ci. Product repositories do not need the rendering dependencies.

Run npm run brand -- --repo /absolute/path/to/project to generate the approved banner pair, social preview source/PNG, font notices and build fingerprints. Only the README section between the jackmeds-brand markers is generated; hand-written prose is preserved.

Run npm run brand:check -- --repo /absolute/path/to/project for a read-only drift, proof-image and local-link check. A missing or changed asset fails validation. Remote websites/settings are separate release checks, not silently treated as successful by CI.

project-brand.json records the source repository, display name, local name, project index, motif, colors, bilingual tagline, tags, README paths and verified public links. pilot projects require a product-proof.png. The toolkit rejects unsafe relative paths, duplicate markers and symlink outputs.

The projects directory contains the initial reviewed inputs. Once adopted, each target repository's manifest is authoritative. Copy intentional manifest edits back to this catalogue when changing account-level presentation.

## Branch and review sequence

1. Review the toolkit, profile and Flowloud sample. The profile stays a draft until the four pilots are accepted.
2. Review BiliDigest and Kehua Garden; review MingXu preparation and its dependent address-switch change.
3. Merge accepted product changes individually. No automation merges a PR.
4. Publish the profile and update avatar, bio, social previews, descriptions, website links and Pins using the release checklist.
5. Merge light historical-repository presentation changes as reviewed. Forks and archived repositories are not changed.

## Accounts and settings

The baseline captures public README files, commit IDs, repo settings, profile fields and Pins. It refuses to overwrite an existing baseline. scripts/snapshot-avatar.mjs separately saves the original avatar image bytes and SHA256 in the git-ignored backups directory before any avatar change. Keep that local backup; a mutable avatar URL alone is insufficient for rollback.

An exported image file alone is not proof that GitHub's Social preview setting was updated.

The planned Pins are flowloud, mingxu (sizhu-astro-ai before rename), BiliDigest and kehua-memory-garden, in that order. Avatar uses the profile repository's assets/brand/avatar.png. Bio: Experimental product builder · Local-first tools · Human × AI.

Keep mcp.jackmeds.top as the MCP endpoint. MingXu repository/domain changes are a separate reviewed switch, after the recovery page and import flow are available. README links point at current working URLs until that switch.

## Rollback

Revert the individual repository's presentation commit to restore its README/assets. Restore profile fields and metadata from baselines/2026-09-refresh/metadata.json. Preserve the previous site build during MingXu DNS/Pages cutover; the Worker stays in hold mode until HTTPS and recovery checks pass.

Do not recreate the old sizhu-astro-ai repository name after renaming; that would break GitHub redirects. Keep the old-domain recovery path reachable even after ordinary paths redirect.

## Licensing and provenance

No project license is selected or replaced as part of this refresh. Existing license and author notices remain. Missing and conflicting license information is recorded in REPOSITORY-AUDIT.md. Bundled fonts retain their upstream OFL notices; generated subsets carry those notices into each repository.

The toolkit is private:true to prevent accidental npm publishing. This refresh does not introduce account-wide .github defaults or add build frameworks to historical projects.
