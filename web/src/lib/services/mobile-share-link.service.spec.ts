import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { handleAssetShareLinkAction, toMobileShareAsset } from '$lib/services/mobile-share-link.service';
import { user } from '$lib/stores/user.store';
import { AssetTypeEnum, SharedLinkType } from '@immich/sdk';
import { assetFactory, timelineAssetFactory } from '@test-data/factories/asset-factory';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';

const { modalShowMock, copyToClipboardMock, handleErrorMock, shareMock, emitMock, formatterMock } = vi.hoisted(() => ({
  modalShowMock: vi.fn(),
  copyToClipboardMock: vi.fn(),
  handleErrorMock: vi.fn(),
  shareMock: vi.fn(),
  emitMock: vi.fn(),
  formatterMock: vi.fn((key: string) => key),
}));

vi.mock('$app/environment', () => ({ browser: true }));

vi.mock('@immich/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@immich/ui')>();

  return {
    ...actual,
    modalManager: { show: modalShowMock },
  };
});

vi.mock('$lib/modals/SharedLinkCreateModal.svelte', () => ({
  default: {},
}));

vi.mock('$lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/utils')>();

  return {
    ...actual,
    copyToClipboard: copyToClipboardMock,
  };
});

vi.mock('$lib/utils/handle-error', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/utils/handle-error')>();

  return {
    ...actual,
    handleError: handleErrorMock,
  };
});

vi.mock('$lib/utils/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/utils/i18n')>();

  return {
    ...actual,
    getFormatter: vi.fn().mockResolvedValue(formatterMock),
  };
});

vi.mock('$lib/managers/event-manager.svelte', () => ({
  eventManager: {
    emit: emitMock,
    on: vi.fn(() => () => {}),
  },
}));

vi.mock('$lib/services/shared-link.service', () => ({
  asUrl: vi.fn(() => 'https://vault.example/share/test-link'),
}));

vi.mock('$lib/utils/mobile-share', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/utils/mobile-share')>();

  return {
    ...actual,
    canUseNativeMobileShare: vi.fn(),
  };
});

describe('mobile-share-link service', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    user.set(userAdminFactory.build({ name: 'Aoife', email: 'aoife@example.com' }));
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        share: shareMock,
      },
      configurable: true,
    });

    const { canUseNativeMobileShare } = await import('$lib/utils/mobile-share');
    vi.mocked(canUseNativeMobileShare).mockReturnValue(false);
  });

  it('falls back to the existing modal flow when native mobile share is unavailable', async () => {
    const asset = assetFactory.build({ type: AssetTypeEnum.Image });

    await handleAssetShareLinkAction({ assetIds: [asset.id], assets: [toMobileShareAsset(asset)] });

    expect(modalShowMock).toHaveBeenCalledWith(expect.anything(), { assetIds: [asset.id] });
    expect(sdkMock.createSharedLink).not.toHaveBeenCalled();
    expect(shareMock).not.toHaveBeenCalled();
  });

  it('creates a default shared link and opens the native share sheet when supported', async () => {
    const asset = assetFactory.build({
      type: AssetTypeEnum.Video,
      originalFileName: 'School Play 2014.mp4',
    });
    const sharedLink = sharedLinkFactory.build({ key: 'test-link', slug: null });
    sdkMock.createSharedLink.mockResolvedValue(sharedLink);

    const { canUseNativeMobileShare } = await import('$lib/utils/mobile-share');
    vi.mocked(canUseNativeMobileShare).mockReturnValue(true);

    await handleAssetShareLinkAction({ assetIds: [asset.id], assets: [toMobileShareAsset(asset)] });

    expect(sdkMock.createSharedLink).toHaveBeenCalledWith({
      sharedLinkCreateDto: {
        type: SharedLinkType.Individual,
        assetIds: [asset.id],
        allowDownload: true,
        allowUpload: false,
        showMetadata: true,
      },
    });
    expect(emitMock).toHaveBeenCalledWith('SharedLinkCreate', sharedLink);
    expect(shareMock).toHaveBeenCalledWith({
      text: 'Aoife has shared this movie: School Play 2014 from their Immich Vault:',
      url: 'https://vault.example/share/test-link',
    });
  });

  it('treats share-sheet cancellation as a neutral result', async () => {
    const asset = assetFactory.build({ type: AssetTypeEnum.Image });
    sdkMock.createSharedLink.mockResolvedValue(sharedLinkFactory.build({ key: 'test-link' }));

    const cancelled = new Error('The share operation was cancelled');
    cancelled.name = 'AbortError';
    shareMock.mockRejectedValue(cancelled);

    const { canUseNativeMobileShare } = await import('$lib/utils/mobile-share');
    vi.mocked(canUseNativeMobileShare).mockReturnValue(true);

    await handleAssetShareLinkAction({ assetIds: [asset.id], assets: [toMobileShareAsset(asset)] });

    expect(copyToClipboardMock).not.toHaveBeenCalled();
    expect(handleErrorMock).not.toHaveBeenCalled();
  });

  it('falls back to copying the link when native share fails unexpectedly', async () => {
    const asset = assetFactory.build({ type: AssetTypeEnum.Image });
    sdkMock.createSharedLink.mockResolvedValue(sharedLinkFactory.build({ key: 'test-link' }));
    shareMock.mockRejectedValue(new Error('NotAllowedError'));

    const { canUseNativeMobileShare } = await import('$lib/utils/mobile-share');
    vi.mocked(canUseNativeMobileShare).mockReturnValue(true);

    await handleAssetShareLinkAction({ assetIds: [asset.id], assets: [toMobileShareAsset(asset)] });

    expect(copyToClipboardMock).toHaveBeenCalledWith('https://vault.example/share/test-link');
  });

  it('shows an error and skips sharing when link creation fails', async () => {
    const asset = assetFactory.build({ type: AssetTypeEnum.Image });
    const error = new Error('create failed');
    sdkMock.createSharedLink.mockRejectedValue(error);

    const { canUseNativeMobileShare } = await import('$lib/utils/mobile-share');
    vi.mocked(canUseNativeMobileShare).mockReturnValue(true);

    await handleAssetShareLinkAction({ assetIds: [asset.id], assets: [toMobileShareAsset(asset)] });

    expect(handleErrorMock).toHaveBeenCalledWith(error, 'errors.failed_to_create_shared_link');
    expect(shareMock).not.toHaveBeenCalled();
  });

  it('converts timeline assets into mobile share assets', () => {
    const asset = timelineAssetFactory.build({ originalFileName: 'Clip.mov', isVideo: true });

    expect(toMobileShareAsset(asset)).toEqual({
      originalFileName: 'Clip.mov',
      isVideo: true,
    });
  });
});
