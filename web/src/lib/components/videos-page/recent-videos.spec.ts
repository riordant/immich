import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import RecentVideos from '$lib/components/videos-page/recent-videos.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { userInteraction } from '$lib/stores/user.svelte';
import { AssetTypeEnum } from '@immich/sdk';
import { assetFactory } from '@test-data/factories/asset-factory';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

const { navigateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
}));

vi.mock('$lib/utils/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/utils/navigation')>();

  return {
    ...actual,
    currentUrlReplaceAssetId: vi.fn((assetId: string) => `/photos/${assetId}`),
    navigate: navigateMock,
  };
});

describe('RecentVideos component', () => {
  beforeAll(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
  });

  beforeEach(() => {
    vi.resetAllMocks();
    userInteraction.recentVideos = undefined;
    userInteraction.videoPlaybackPositions = undefined;
  });

  it('fetches recent videos and renders description-backed titles only', async () => {
    const recentVideos = [
      assetFactory.build({
        type: AssetTypeEnum.Video,
        originalFileName: 'Newest clip.mov',
        exifInfo: { description: 'Newest title' },
      }),
      assetFactory.build({ type: AssetTypeEnum.Video, originalFileName: 'Older clip.mp4' }),
    ];

    sdkMock.getMyRecentVideos.mockResolvedValue(recentVideos);

    render(RecentVideos);

    await waitFor(() => expect(sdkMock.getMyRecentVideos).toHaveBeenCalledTimes(1));

    expect(screen.getByText('Newest title')).toBeInTheDocument();
    expect(screen.queryByText('Older clip')).not.toBeInTheDocument();
    expect(screen.queryByText('Older clip.mp4')).not.toBeInTheDocument();
  });

  it('uses cached recent videos without refetching and opens items in the current route', async () => {
    const cachedVideo = assetFactory.build({
      type: AssetTypeEnum.Video,
      originalFileName: 'Watched again.mkv',
      exifInfo: { description: 'Watched title' },
    });
    userInteraction.recentVideos = [cachedVideo];

    render(RecentVideos);

    expect(sdkMock.getMyRecentVideos).not.toHaveBeenCalled();
    expect(screen.getByText('Watched title')).toBeInTheDocument();
    expect(screen.queryByText('Watched again')).not.toBeInTheDocument();

    await fireEvent.click(screen.getByRole('link'));

    expect(navigateMock).toHaveBeenCalledWith({ targetRoute: 'current', assetId: cachedVideo.id });
  });

  it('sizes recent thumbnails from the timeline row height and asset ratio', async () => {
    const wideVideo = assetFactory.build({
      type: AssetTypeEnum.Video,
      originalFileName: 'Wide clip.mp4',
      width: 400,
      height: 200,
    });
    userInteraction.recentVideos = [wideVideo];

    render(RecentVideos);

    expect(screen.getByRole('link')).toHaveStyle({ width: '470px', height: '235px' });
  });

  it('renders a playback progress bar for cached recent videos with saved progress', () => {
    const watchedVideo = assetFactory.build({
      type: AssetTypeEnum.Video,
      originalFileName: 'Watched again.mkv',
      duration: '00:02:00.000',
      exifInfo: { description: '' },
    });
    userInteraction.recentVideos = [watchedVideo];
    userInteraction.videoPlaybackPositions = { [watchedVideo.id]: 30 };

    render(RecentVideos);

    expect(screen.getByTestId('video-progress-bar')).toHaveStyle({ width: '25%' });
    expect(screen.queryByText('Watched again')).not.toBeInTheDocument();
  });

  it('updates cached recent video titles when an AssetUpdate event is emitted', async () => {
    const cachedVideo = assetFactory.build({
      id: 'video-a',
      type: AssetTypeEnum.Video,
      originalFileName: 'Watched again.mkv',
      exifInfo: { description: 'Original Title' },
    });
    userInteraction.recentVideos = [cachedVideo];

    render(RecentVideos);

    expect(screen.getByText('Original Title')).toBeInTheDocument();

    eventManager.emit('AssetUpdate', {
      ...cachedVideo,
      exifInfo: { ...cachedVideo.exifInfo, description: 'Updated Title' },
    });

    await waitFor(() => expect(screen.getByText('Updated Title')).toBeInTheDocument());
  });
});
