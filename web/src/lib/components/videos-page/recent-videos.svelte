<script lang="ts">
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import VideoTitleBand from '$lib/components/videos-page/video-title-band.svelte';
  import { mediaQueryManager } from '$lib/stores/media-query-manager.svelte';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { getRecentVideos } from '$lib/services/recent-video.service';
  import { navigate } from '$lib/utils/navigation';
  import { handleError } from '$lib/utils/handle-error';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { getPlaybackProgressPercent } from '$lib/utils/video-playback';
  import { t } from 'svelte-i18n';

  const assets = $derived(userInteraction.recentVideos ?? []);
  const timelineAssets = $derived(assets.map((asset) => toTimelineAsset(asset)));
  const playbackPositions = $derived(userInteraction.videoPlaybackPositions ?? {});
  const thumbnailHeight = $derived(mediaQueryManager.maxMd ? 100 : 235);

  const refreshRecentVideos = async () => {
    try {
      await getRecentVideos();
    } catch (error) {
      handleError(error, $t('failed_to_load_assets'));
    }
  };

  $effect(() => {
    if (userInteraction.recentVideos === undefined) {
      void refreshRecentVideos();
    }
  });
</script>

{#if timelineAssets.length > 0}
  <section class="px-2 pt-2 pb-4">
    <h2 class="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">{$t('recent')}</h2>

    <div class="scrollbar-hidden overflow-x-auto overflow-y-hidden">
      <div class="flex w-max gap-3 pb-1">
        {#each timelineAssets as asset (asset.id)}
          {@const thumbnailWidth = Math.max(Math.round(asset.ratio * thumbnailHeight), 1)}
          {@const progressPercent = getPlaybackProgressPercent({
            duration: asset.duration,
            positionSeconds: playbackPositions[asset.id],
          })}
          <div class="relative shrink-0" style:width={`${thumbnailWidth}px`} style:height={`${thumbnailHeight}px`}>
            <Thumbnail
              {asset}
              readonly
              thumbnailWidth={thumbnailWidth}
              thumbnailHeight={thumbnailHeight}
              onClick={(asset) => void navigate({ targetRoute: 'current', assetId: asset.id })}
            />
            <VideoTitleBand originalFileName={asset.originalFileName} title={asset.description} {progressPercent} />
          </div>
        {/each}
      </div>
    </div>
  </section>
{/if}
