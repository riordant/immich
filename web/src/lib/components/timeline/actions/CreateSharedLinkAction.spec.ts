import CreateSharedLinkAction from '$lib/components/timeline/actions/CreateSharedLinkAction.svelte';
import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
import { timelineAssetFactory } from '@test-data/factories/asset-factory';
import { fireEvent, render, screen } from '@testing-library/svelte';

const { handleAssetShareLinkActionMock, toMobileShareAssetMock } = vi.hoisted(() => ({
  handleAssetShareLinkActionMock: vi.fn(),
  toMobileShareAssetMock: vi.fn((asset) => ({ originalFileName: asset.originalFileName, isVideo: asset.isVideo })),
}));

vi.mock('$lib/services/mobile-share-link.service', () => ({
  handleAssetShareLinkAction: handleAssetShareLinkActionMock,
  toMobileShareAsset: toMobileShareAssetMock,
}));

vi.mock('@immich/ui', async () => {
  const { default: MockIconButton } = await import('@test-data/MockIconButton.svelte');

  return {
    IconButton: MockIconButton,
  };
});

describe('CreateSharedLinkAction component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assetMultiSelectManager.clear();
  });

  afterEach(() => {
    assetMultiSelectManager.clear();
  });

  it('shares the current multi-select asset ids through the mobile share-link service', async () => {
    const first = timelineAssetFactory.build({ originalFileName: 'first.jpg', isVideo: false });
    const second = timelineAssetFactory.build({ originalFileName: 'second.mov', isVideo: true });
    assetMultiSelectManager.selectAssets([first, second]);

    render(CreateSharedLinkAction);

    await fireEvent.click(screen.getByRole('button', { name: 'share' }));

    expect(handleAssetShareLinkActionMock).toHaveBeenCalledWith({
      assetIds: [first.id, second.id],
      assets: [
        { originalFileName: 'first.jpg', isVideo: false },
        { originalFileName: 'second.mov', isVideo: true },
      ],
    });
  });
});
