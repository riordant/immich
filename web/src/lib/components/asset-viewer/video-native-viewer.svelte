<script lang="ts">
  import FaceEditor from '$lib/components/asset-viewer/face-editor/face-editor.svelte';
  import VideoRemoteViewer from '$lib/components/asset-viewer/video-remote-viewer.svelte';
  import { assetViewerFadeDuration } from '$lib/constants';
  import { castManager } from '$lib/managers/cast-manager.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { getVideoPlaybackPosition, updateVideoPlaybackPosition } from '$lib/services/video-playback.service';
  import {
    autoPlayVideo,
    loopVideo as loopVideoPreference,
    videoViewerMuted,
    videoViewerVolume,
  } from '$lib/stores/preferences.store';
  import { getAssetMediaUrl, getAssetPlaybackUrl } from '$lib/utils';
  import {
    clampResumePosition,
    getPlaybackPositionToPersist,
    PLAYBACK_SAVE_INTERVAL_MS,
  } from '$lib/utils/video-playback';
  import { AssetMediaSize } from '@immich/sdk';
  import { LoadingSpinner } from '@immich/ui';
  import { onDestroy, onMount } from 'svelte';
  import { useSwipe, type SwipeCustomEvent } from 'svelte-gestures';
  import { fade } from 'svelte/transition';

  interface Props {
    assetId: string;
    loopVideo: boolean;
    cacheKey: string | null;
    playOriginalVideo: boolean;
    resumePlayback?: boolean;
    onPreviousAsset?: () => void;
    onNextAsset?: () => void;
    onVideoEnded?: () => void;
    onVideoStarted?: () => void;
    onClose?: () => void;
  }

  let {
    assetId,
    loopVideo,
    cacheKey,
    playOriginalVideo,
    resumePlayback = false,
    onPreviousAsset = () => {},
    onNextAsset = () => {},
    onVideoEnded = () => {},
    onVideoStarted = () => {},
    onClose = () => {},
  }: Props = $props();

  let videoPlayer: HTMLVideoElement | undefined = $state();
  let isLoading = $state(true);
  let assetFileUrl = $derived(
    playOriginalVideo
      ? getAssetMediaUrl({ id: assetId, size: AssetMediaSize.Original, cacheKey })
      : getAssetPlaybackUrl({ id: assetId, cacheKey }),
  );
  let isScrubbing = $state(false);
  let showVideo = $state(false);
  let hasFocused = $state(false);
  let hasRestoredPosition = $state(false);
  let savedPositionSeconds = $state<number | null>(null);
  let lastSavedPositionSeconds = $state<number | null>(null);
  let playbackLoadToken = 0;
  let playbackSaveInterval: ReturnType<typeof setInterval> | undefined;

  onMount(() => {
    // Show video after mount to ensure fading in.
    showVideo = true;
  });

  $effect(() => {
    // reactive on `assetFileUrl` changes
    if (assetFileUrl) {
      hasFocused = false;
      videoPlayer?.load();
    }
  });

  onDestroy(() => {
    clearPlaybackSaveInterval();
    void persistPlaybackPosition();
    if (videoPlayer) {
      videoPlayer.src = '';
    }
  });

  const clearPlaybackSaveInterval = () => {
    if (!playbackSaveInterval) {
      return;
    }

    clearInterval(playbackSaveInterval);
    playbackSaveInterval = undefined;
  };

  const resolvePlaybackPositionToPersist = (): number | null => {
    if (!videoPlayer) {
      return null;
    }

    return getPlaybackPositionToPersist({
      currentTime: videoPlayer.currentTime,
      durationSeconds: Number.isFinite(videoPlayer.duration) ? videoPlayer.duration : null,
    });
  };

  const persistPlaybackPosition = async (positionSeconds = resolvePlaybackPositionToPersist()) => {
    if (!resumePlayback || castManager.isCasting || positionSeconds === null) {
      return;
    }

    if (positionSeconds === lastSavedPositionSeconds) {
      return;
    }

    const previousPosition = lastSavedPositionSeconds;
    lastSavedPositionSeconds = positionSeconds;

    try {
      const persistedPosition = await updateVideoPlaybackPosition(assetId, positionSeconds);
      savedPositionSeconds = persistedPosition;
      lastSavedPositionSeconds = persistedPosition;
    } catch {
      lastSavedPositionSeconds = previousPosition;
    }
  };

  const startPlaybackSaveInterval = () => {
    if (!resumePlayback || castManager.isCasting || playbackSaveInterval) {
      return;
    }

    playbackSaveInterval = setInterval(() => {
      void persistPlaybackPosition();
    }, PLAYBACK_SAVE_INTERVAL_MS);
  };

  const restorePlaybackPosition = (video: HTMLVideoElement) => {
    if (!resumePlayback || hasRestoredPosition) {
      return;
    }

    const resumePosition = clampResumePosition({
      savedPositionSeconds,
      durationSeconds: video.duration,
    });
    if (resumePosition === null) {
      return;
    }

    hasRestoredPosition = true;
    video.currentTime = resumePosition;
  };

  const handleCanPlay = async (video: HTMLVideoElement) => {
    try {
      if (!video.paused && !isScrubbing) {
        await video.play();
        onVideoStarted();
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        await tryForceMutedPlay(video);
        return;
      }

      // auto-play failed
    } finally {
      isLoading = false;
    }
  };

  $effect(() => {
    const currentAssetId = assetId;
    const shouldResumePlayback = resumePlayback;

    playbackLoadToken += 1;
    savedPositionSeconds = null;
    lastSavedPositionSeconds = null;
    hasRestoredPosition = false;
    clearPlaybackSaveInterval();

    if (!shouldResumePlayback) {
      return;
    }

    const loadToken = playbackLoadToken;
    void (async () => {
      try {
        const positionSeconds = await getVideoPlaybackPosition(currentAssetId);
        if (loadToken !== playbackLoadToken) {
          return;
        }

        savedPositionSeconds = positionSeconds;
        lastSavedPositionSeconds = positionSeconds;
        if (videoPlayer) {
          restorePlaybackPosition(videoPlayer);
        }
      } catch {
        if (loadToken !== playbackLoadToken) {
          return;
        }

        savedPositionSeconds = null;
        lastSavedPositionSeconds = null;
      }
    })();
  });

  const tryForceMutedPlay = async (video: HTMLVideoElement) => {
    if (video.muted) {
      return;
    }

    try {
      video.muted = true;
      await handleCanPlay(video);
    } catch {
      // muted auto-play failed
    }
  };

  const onSwipe = (event: SwipeCustomEvent) => {
    if (event.detail.direction === 'left') {
      onNextAsset();
    }
    if (event.detail.direction === 'right') {
      onPreviousAsset();
    }
  };

  let containerWidth = $state(0);
  let containerHeight = $state(0);

  $effect(() => {
    if (assetViewerManager.isFaceEditMode) {
      videoPlayer?.pause();
    }
  });
</script>

{#if showVideo}
  <div
    transition:fade={{ duration: assetViewerFadeDuration }}
    class="flex h-full select-none place-content-center place-items-center"
    bind:clientWidth={containerWidth}
    bind:clientHeight={containerHeight}
  >
    {#if castManager.isCasting}
      <div class="place-content-center h-full place-items-center">
        <VideoRemoteViewer
          poster={getAssetMediaUrl({ id: assetId, size: AssetMediaSize.Preview, cacheKey })}
          {onVideoStarted}
          {onVideoEnded}
          {assetFileUrl}
        />
      </div>
    {:else}
      <video
        bind:this={videoPlayer}
        loop={$loopVideoPreference && loopVideo}
        autoplay={$autoPlayVideo}
        playsinline
        controls
        disablePictureInPicture
        class="h-full object-contain"
        {...useSwipe(onSwipe)}
        onloadedmetadata={(e) => restorePlaybackPosition(e.currentTarget)}
        oncanplay={(e) => handleCanPlay(e.currentTarget)}
        onended={() => {
          clearPlaybackSaveInterval();
          void persistPlaybackPosition(0);
          onVideoEnded();
        }}
        onpause={() => {
          clearPlaybackSaveInterval();
          if (!isScrubbing) {
            void persistPlaybackPosition();
          }
        }}
        onvolumechange={(e) => ($videoViewerMuted = e.currentTarget.muted)}
        onseeking={() => (isScrubbing = true)}
        onseeked={() => {
          isScrubbing = false;
          void persistPlaybackPosition();
        }}
        onplaying={(e) => {
          if (!hasFocused) {
            e.currentTarget.focus();
            hasFocused = true;
          }
          startPlaybackSaveInterval();
        }}
        onclose={() => onClose()}
        muted={$videoViewerMuted}
        bind:volume={$videoViewerVolume}
        poster={getAssetMediaUrl({ id: assetId, size: AssetMediaSize.Preview, cacheKey })}
        src={assetFileUrl}
      >
      </video>

      {#if isLoading}
        <div class="absolute flex place-content-center place-items-center">
          <LoadingSpinner />
        </div>
      {/if}

      {#if assetViewerManager.isFaceEditMode}
        <FaceEditor htmlElement={videoPlayer} {containerWidth} {containerHeight} {assetId} />
      {/if}
    {/if}
  </div>
{/if}
