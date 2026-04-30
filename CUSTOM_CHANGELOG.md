# Custom Changelog

This file tracks local product customizations made on top of upstream Immich.

## 2026-04-14

### Videos section: stage 1

- Added a new `Videos` entry to the left sidebar above `Photos`.
- Added a new `/videos` route that mirrors the timeline experience while filtering to video assets only.
- Extended the timeline API and generated SDK to support `assetType` filtering for time-bucket requests.
- Extended the time-bucket asset payload to include `originalFileName`.
- Rendered a title band on video thumbnails using the original filename with the extension removed.
- Added targeted tests covering server timeline service asset-type filtering, web timeline manager asset-type exclusion behavior, and video title-band filename rendering.

### Videos section: stage 2

- Added a horizontal `Recent` shelf above the main Videos timeline using the existing video thumbnail presentation.
- Adjusted Recent shelf thumbnails to follow the main timeline sizing model by using the same row-height targets and asset aspect ratios.
- Added `GET /users/me/recent-videos` and `PUT /users/me/recent-videos` endpoints backed by user metadata.
- Track up to 5 most recently opened videos by moving each opened video to the front of the list and pruning older entries.
- Only count actual viewer opens as recent views; hover-preview playback does not update recents.
- Added targeted tests covering recent-video ordering, pruning, and click-driven tracking behavior.

### Videos section: stage 3

- Added video playback progress persistence for the native asset viewer using user metadata-backed API endpoints.
- Resume full video opens from the last saved whole-second position across sessions.
- Save progress every 5 seconds while playing, and flush progress on pause, seek completion, viewer teardown, and explicit completion.
- Clear saved progress when a video ends or is within 5 seconds of completion so finished videos reopen from the start.
- Limited persisted playback entries to a bounded per-user list to keep metadata size controlled for future continue-watching UI work.
- Added targeted server and web tests covering playback persistence payloads and resume/clear threshold logic.

### Videos section: stage 4

- Added playback progress bars to video tiles in both the `Recent` shelf and the main Videos timeline.
- Added a bulk `GET /users/me/video-playback` endpoint so the Videos page can load saved playback positions without per-thumbnail API requests.
- Cached bulk playback positions in the existing web user-interaction store and kept that cache synchronized after viewer playback updates succeed.
- Reused the existing video title-band overlay so the progress bar sits directly below the title without changing thumbnail layout structure.
- Added targeted tests covering the new bulk playback API response, playback cache synchronization, progress-percentage calculation, and title-band rendering.

## 2026-04-16

### Mobile web native share-to-link

- Replaced the asset `Share` action on supported mobile browsers with a native Web Share flow that shares an Immich public link instead of file data.
- Replaced the timeline multi-select share action with the same mobile-native share-link flow, while keeping the existing desktop modal behavior unchanged.
- Added pragmatic mobile gating based on `navigator.share`, secure context, coarse pointer input, and Android/iOS-style browser platform detection.
- Reused Immich's existing public shared-link infrastructure and default settings, creating a new link on each mobile share action without adding backend share types.
- Added custom share text so single videos share as `"{user_name} has shared this movie: {movie_name} from their Immich Vault:"` and all other cases share as `"{user_name} has shared these memories from their Immich Vault:"`.
- Kept cancel behavior silent and fell back to clipboard copy for unexpected native-share failures, reusing the existing clipboard toast/error handling.
- Added targeted web tests for capability gating, share-message generation, mobile share-link service behavior, and multi-select/single-asset action wiring.

### Shared-link chat previews

- Upgraded public share-link Open Graph and Twitter metadata on the server-rendered share HTML so chat apps can show richer link previews.
- Reused the existing album cover / first shared asset thumbnail as the preview image instead of generating new preview media.
- Added trust-building preview copy:
  - single video: `"{user} shared a movie: {movie_name} with you"`
  - single photo: `"{user} shared a photo with you"`
  - multiple assets: `"{user} shared memories with you"`
  - album: `"{user} shared album: {album_name} with you"`
- Added `og:url`, `og:site_name`, `og:image:alt`, `og:image:width`, `og:image:height`, `twitter:url`, and `twitter:image:alt` for public share pages.
- Kept password-protected shared links on the existing no-preview path to avoid leaking preview metadata before authentication.
- Added targeted server tests for the shared-link metadata generator and HTML renderer.

### Shared-link video title bands

- Added the existing video filename title-band overlay to video tiles in public shared-link gallery pages.
- Kept photo tiles unchanged so filenames are only shown for videos.
- Reused the existing `/videos` title-band component to keep styling consistent rather than adding a second shared-link-specific label style.
- Added a narrow `showVideoTitleBand` prop to `GalleryViewer` and enabled it from the shared-link multi-asset viewer only.
- Added a focused web component test covering video-vs-photo rendering behavior in the shared-link gallery.

## 2026-04-17

### Video description backfill script

- Added [scripts/backfill-video-descriptions.sh](/home/riordant/Repositories/Personal/keepsake/immich/scripts/backfill-video-descriptions.sh:1), a standalone shell utility that populates video descriptions from filenames through the public Immich API.
- Supports `--all` mode for all videos and `--filename "..."` mode for exact filename matches.
- Defaults to filling only empty descriptions so reruns do not overwrite user-edited titles.
- Added `--overwrite` for forced resets and `--dry-run` for safe preview runs.
- Uses paginated `POST /search/metadata` reads and per-asset `PUT /assets/:id` updates via `x-api-key`, avoiding direct database writes or new backend endpoints.
- Updated the script to follow the existing `scripts/` env pattern by sourcing `scripts/.env` by default and reading `IMMICH_URL` / `API_KEY` like the other local admin utilities.
- Documented limitation: this script must authenticate as the owning user because Immich's public asset search/update APIs are user-scoped; an admin API key cannot target arbitrary users through the current public API.

### Description-backed video titles

- Switched video title rendering to prefer asset description, with rollout fallback to filename-without-extension when description is empty.
- Applied the same title-source behavior to the main `/videos` timeline, the `Recent` shelf, and shared-link video gallery tiles.
- Extended the timeline API and generated SDK to include video description data in time-bucket payloads so `/videos` can render description-backed titles without per-asset fetches.
- Updated the description edit flow to emit `AssetUpdate` after successful saves, so visible video titles refresh immediately instead of waiting for a page reload.
- Synced cached `recentVideos` entries on `AssetUpdate`, so the Recent shelf reflects edited titles immediately as well.
- Added focused web tests covering description-first title rendering, fallback behavior, Recent shelf cache updates, and description-save event emission.

## 2026-04-20

### Multi-select image editor

- Added a new multi-select `Editor` action to the authenticated asset-selection toolbars that already expose bulk actions.
- Reused the existing editor icon and the existing orientation controls so the bulk flow visually matches the single-image editor.
- Scoped the first pass to rotate and mirror only; crop remains intentionally single-photo only and is not shown in the multi-select editor UI.
- Implemented the bulk apply flow by reusing the existing per-asset edit API, merging the new rotate/mirror operations with any existing edits instead of overwriting them blindly.
- Preserved existing crop edits on assets when applying bulk rotate/mirror operations.
- Waited for the normal `AssetEditReadyV1` websocket event per asset before treating the operation as complete, then invalidated the local asset cache via `AssetEditsApplied`.
- Fetched the refreshed asset after each bulk edit and emitted the normal `AssetUpdate` event so edited orientation changes appear in the timeline immediately without a manual page refresh.
- Cleared multi-selection after successful bulk edit application, matching the behavior of other bulk actions.
- Added focused web tests covering:
  - transform-edit merge behavior
  - bulk editor action visibility for eligible vs ineligible selections
  - modal behavior and per-asset rotate application

### Multi-select editor live-refresh fix

- Reproduced a remaining browser bug where bulk rotate edits only appeared after a full page refresh.
- Root cause was [Image.svelte](/home/riordant/Repositories/Personal/keepsake/immich/web/src/lib/components/Image.svelte:1): it captured `src` only once and did not react when a new thumbnail URL arrived later.
- Updated `Image.svelte` to reset its internal source when `src` changes, cancel the old image URL, and trigger a fresh load cycle.
- Added a focused `Image.spec.ts` case proving that rerendering with a new `src` updates the rendered `<img>` element.
- Verified live in Playwright that after rotating a selected photo and clicking `Save`, the on-page tile switched from one thumbnail URL/cache key to a new one without a manual refresh.

### Multi-select editor loading state

- Updated the bulk editor modal to compose `Modal`/`ModalBody`/`ModalFooter` directly instead of `FormModal`, so its `Save` action can use the same `Button loading={...}` spinner treatment as the single-asset editor.
- Added a focused modal test proving the bulk editor shows the loading spinner and disables the save button while edits are in flight.

### Videos default landing and page chrome

- Changed the generic authenticated landing route from `/photos` to `/videos`, including the root app redirect and the default post-login / post-onboarding / post-password-change fallbacks.
- Updated the generic non-admin fallback redirect to `/videos` as well, so the default library home is consistent when no more specific destination is available.
- Removed the explicit `Videos` header bar from the `/videos` page by matching the same `UserPageLayout` usage as `/photos`.

### Videos shelf label tweak

- Renamed the top shelf label on `/videos` from `Recent` to `Continue Watching`.
- The current font sizing for that label is controlled directly in [web/src/lib/components/videos-page/recent-videos.svelte](/home/riordant/Repositories/Personal/keepsake/immich/web/src/lib/components/videos-page/recent-videos.svelte:29) via the `text-sm` class on the `<h2>`.

### Photos page image-only filter

- Updated the main `/photos` timeline to request only `IMAGE` assets via the existing timeline `assetType` filter.
- This removes standalone video assets from the Photos grid while leaving the separate `/videos` surface unchanged.
- Memories on the Photos page were intentionally left unchanged in this pass.

### Date-change hardening

- Hardened asset date changes so they update the authoritative asset timeline fields immediately instead of waiting for the async sidecar-write and metadata-extraction round trip.
- Added `AssetRepository.syncDateTimesFromExif(...)` and now call it directly after single-asset and bulk date edits in `AssetService`, so routes like `Explore -> People -> person` do not depend on websocket-driven eventual consistency to reflect date changes.
- Updated `AssetChangeDateModal.svelte` to emit `AssetUpdate` from the returned `updateAsset(...)` response.
- Updated `AssetSelectionChangeDateModal.svelte` to refresh the changed assets with `getAssetInfo(...)` and emit `AssetUpdate` for each one after bulk date changes, so filtered timelines reposition items without a manual page refresh.
- Fixed a related sidecar bug in `MetadataService.handleSidecarWrite(...)`: writing a new `.xmp` now registers the sidecar file whenever one did not already exist, instead of only when `asset.files.length === 0`.
- Added focused server and web test coverage for:
  - immediate asset date synchronization in `asset.service.spec.ts`
  - sidecar registration in `metadata.service.spec.ts`
  - `AssetUpdate` emission in both date modals

### Explore gallery live-update fix

- Fixed a remaining stale-UI bug on gallery-style routes reached from Explore and similar surfaces, where rotate and date changes still required a manual refresh even after the date-hardening work.
- Root cause: [gallery-viewer.svelte](/home/riordant/Repositories/Personal/keepsake/immich/web/src/lib/components/shared-components/gallery-viewer/gallery-viewer.svelte:1) did not listen for global `AssetUpdate` events emitted by the edit/date modals, and it mutated its local asset arrays in place.
- `GalleryViewer` now listens for `AssetUpdate` through `OnEvents` and immutably replaces matching assets in both `assets` and `viewerAssets`, forcing the gallery tile/title/thumbnail state to rerender immediately.
- Added focused coverage in [gallery-viewer.spec.ts](/home/riordant/Repositories/Personal/keepsake/immich/web/src/lib/components/shared-components/gallery-viewer/gallery-viewer.spec.ts:1) to prove the rendered asset updates when `AssetUpdate` is emitted.

## 2026-04-29

### Multi-select editor thumbnail cache invalidation

- Hardened the bulk rotate/mirror live-refresh path by making shared timeline thumbnails respond directly to `AssetEditsApplied` events.
- `Thumbnail.svelte` now increments a local edit refresh key for the matching asset id and appends it to the existing thumbnail cache key, forcing the image URL to change even before broader page state has reloaded.
- This keeps the fix scoped to the shared thumbnail surface rather than adding page-specific refresh logic for Photos, People, or other grids.
- Added focused test coverage proving matching edit events change the thumbnail `c=` cache key while unrelated asset edit events do not.
- Verification note: the focused Vitest command was blocked in this shell by Node `v18.16.0`; the repo currently requires Node `v24.14.1`.

### Description edit prefill

- Updated the bulk `Change description` modal to prefill from the selected asset description when the selected owned assets share the same value.
- Left the modal blank for mixed-description selections to avoid implying that one existing value applies to every selected asset.
- Allowed submitting an empty description string so users can intentionally clear descriptions from the same flow.
- Refreshed changed assets with `getAssetInfo(...)` and emitted `AssetUpdate` after bulk description saves, keeping description-backed video titles current without a reload.
- Added focused web tests covering modal prefill, empty-description submission, mixed-selection behavior, and post-save `AssetUpdate` emission.
