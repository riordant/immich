import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import RecentVideos from '$lib/components/videos-page/recent-videos.svelte';
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

  it('fetches recent videos and renders titles without extensions', async () => {
    const recentVideos = [
      assetFactory.build({ type: AssetTypeEnum.Video, originalFileName: 'Newest clip.mov' }),
      assetFactory.build({ type: AssetTypeEnum.Video, originalFileName: 'Older clip.mp4' }),
    ];

    sdkMock.getMyRecentVideos.mockResolvedValue(recentVideos);

    render(RecentVideos);

    await waitFor(() => expect(sdkMock.getMyRecentVideos).toHaveBeenCalledTimes(1));

    const titles = screen.getAllByText(/clip$/);
    expect(titles.map((title) => title.textContent)).toEqual(['Newest clip', 'Older clip']);
  });

  it('uses cached recent videos without refetching and opens items in the current route', async () => {
    const cachedVideo = assetFactory.build({ type: AssetTypeEnum.Video, originalFileName: 'Watched again.mkv' });
    userInteraction.recentVideos = [cachedVideo];

    render(RecentVideos);

    expect(sdkMock.getMyRecentVideos).not.toHaveBeenCalled();
    expect(screen.getByText('Watched again')).toBeInTheDocument();

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
    });
    userInteraction.recentVideos = [watchedVideo];
    userInteraction.videoPlaybackPositions = { [watchedVideo.id]: 30 };

    render(RecentVideos);

    expect(screen.getByTestId('video-progress-bar')).toHaveStyle({ width: '25%' });
  });
});
