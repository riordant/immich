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
