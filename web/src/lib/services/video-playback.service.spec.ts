import { sdkMock } from '$lib/__mocks__/sdk.mock';
import {
  getVideoPlaybackPosition,
  getVideoPlaybackPositions,
  updateVideoPlaybackPosition,
} from '$lib/services/video-playback.service';
import { userInteraction } from '$lib/stores/user.svelte';

describe('video-playback service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    userInteraction.videoPlaybackPositions = undefined;
  });

  it('loads playback positions into the user interaction cache', async () => {
    sdkMock.getMyVideoPlaybacks.mockResolvedValue([
      { assetId: 'video-a', positionSeconds: 12 },
      { assetId: 'video-b', positionSeconds: 34 },
    ]);

    await expect(getVideoPlaybackPositions()).resolves.toEqual({
      'video-a': 12,
      'video-b': 34,
    });
    expect(userInteraction.videoPlaybackPositions).toEqual({
      'video-a': 12,
      'video-b': 34,
    });
  });

  it('updates the cached playback position when the cache is loaded', async () => {
    userInteraction.videoPlaybackPositions = { 'video-a': 12 };
    sdkMock.updateMyVideoPlayback.mockResolvedValue({ assetId: 'video-a', positionSeconds: 40 });

    await expect(updateVideoPlaybackPosition('video-a', 40)).resolves.toBe(40);
    expect(userInteraction.videoPlaybackPositions).toEqual({ 'video-a': 40 });
  });

  it('removes cleared playback positions from the loaded cache', async () => {
    userInteraction.videoPlaybackPositions = { 'video-a': 12, 'video-b': 40 };
    sdkMock.updateMyVideoPlayback.mockResolvedValue({ assetId: 'video-a', positionSeconds: null });

    await expect(updateVideoPlaybackPosition('video-a', 0)).resolves.toBeNull();
    expect(userInteraction.videoPlaybackPositions).toEqual({ 'video-b': 40 });
  });

  it('does not initialize the cache from a playback update alone', async () => {
    sdkMock.updateMyVideoPlayback.mockResolvedValue({ assetId: 'video-a', positionSeconds: 40 });

    await expect(updateVideoPlaybackPosition('video-a', 40)).resolves.toBe(40);
    expect(userInteraction.videoPlaybackPositions).toBeUndefined();
  });

  it('returns a single playback position without mutating the cache', async () => {
    sdkMock.getMyVideoPlayback.mockResolvedValue({ assetId: 'video-a', positionSeconds: 22 });

    await expect(getVideoPlaybackPosition('video-a')).resolves.toBe(22);
    expect(userInteraction.videoPlaybackPositions).toBeUndefined();
  });
});
