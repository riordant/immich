import { sdkMock } from '$lib/__mocks__/sdk.mock';
import RecentVideoTracker from '$lib/components/videos-page/recent-video-tracker.svelte';
import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
import { userInteraction } from '$lib/stores/user.svelte';
import { AssetTypeEnum } from '@immich/sdk';
import { assetFactory } from '@test-data/factories/asset-factory';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';

describe('RecentVideoTracker component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    userInteraction.recentVideos = undefined;
    assetViewerManager.showAssetViewer(false);
    sdkMock.updateMyRecentVideos.mockResolvedValue([]);
  });

  it('records a viewed video when the asset viewer opens', async () => {
    const video = assetFactory.build({ type: AssetTypeEnum.Video });

    render(RecentVideoTracker);
    assetViewerManager.setAsset(video);
    await tick();

    expect(sdkMock.updateMyRecentVideos).toHaveBeenCalledWith({ recentVideoUpdateDto: { assetId: video.id } });
  });

  it('ignores non-video assets', async () => {
    const image = assetFactory.build({ type: AssetTypeEnum.Image });

    render(RecentVideoTracker);
    assetViewerManager.setAsset(image);
    await tick();

    expect(sdkMock.updateMyRecentVideos).not.toHaveBeenCalled();
  });

  it('records the same video again only after the viewer closes and reopens', async () => {
    const video = assetFactory.build({ type: AssetTypeEnum.Video });

    render(RecentVideoTracker);

    assetViewerManager.setAsset(video);
    await tick();
    assetViewerManager.setAsset(video);
    await tick();

    expect(sdkMock.updateMyRecentVideos).toHaveBeenCalledTimes(1);

    assetViewerManager.showAssetViewer(false);
    await tick();
    assetViewerManager.setAsset(video);
    await tick();

    expect(sdkMock.updateMyRecentVideos).toHaveBeenCalledTimes(2);
  });
});
