import {
  canUseNativeMobileShare,
  getNativeMobileShareMessage,
  isMobileBrowserPlatform,
  isNativeShareCancelError,
  stripFileExtension,
} from '$lib/utils/mobile-share';
import { AssetTypeEnum } from '@immich/sdk';

describe('mobile-share utils', () => {
  it('strips the file extension from filenames', () => {
    expect(stripFileExtension('Family Trip 2024.mov')).toBe('Family Trip 2024');
  });

  it('detects Android and iPhone mobile browser platforms', () => {
    expect(
      isMobileBrowserPlatform({
        userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/135.0 Mobile Safari/537.36',
      }),
    ).toBe(true);
    expect(
      isMobileBrowserPlatform({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
      }),
    ).toBe(true);
  });

  it('treats touch-capable MacIntel user agents as iPad-like mobile devices', () => {
    expect(
      isMobileBrowserPlatform({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
        platform: 'MacIntel',
        maxTouchPoints: 5,
      }),
    ).toBe(true);
  });

  it('requires secure context, coarse pointer, and navigator.share support for native mobile share', () => {
    expect(
      canUseNativeMobileShare({
        navigatorObject: {
          share: vi.fn(),
          userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/135.0 Mobile Safari/537.36',
          platform: 'Linux armv8l',
          maxTouchPoints: 5,
        },
        isSecureContext: true,
        pointerCoarse: true,
      }),
    ).toBe(true);

    expect(
      canUseNativeMobileShare({
        navigatorObject: {
          share: undefined,
          userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/135.0 Mobile Safari/537.36',
          platform: 'Linux armv8l',
          maxTouchPoints: 5,
        } as unknown as Navigator,
        isSecureContext: true,
        pointerCoarse: true,
      }),
    ).toBe(false);
    expect(
      canUseNativeMobileShare({
        navigatorObject: {
          share: vi.fn(),
          userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/135.0 Mobile Safari/537.36',
          platform: 'Linux armv8l',
          maxTouchPoints: 5,
        },
        isSecureContext: false,
        pointerCoarse: true,
      }),
    ).toBe(false);
  });

  it('builds the single-video mobile share message', () => {
    expect(
      getNativeMobileShareMessage({
        userName: 'Aoife',
        assets: [{ originalFileName: 'School Play 2014.mp4', type: AssetTypeEnum.Video }],
      }),
    ).toBe('Aoife has shared this movie: School Play 2014 from their Immich Vault:');
  });

  it('builds the memories share message for non-video or multi-asset shares', () => {
    expect(
      getNativeMobileShareMessage({
        userName: 'Aoife',
        assets: [{ originalFileName: 'IMG_0001.JPG', type: AssetTypeEnum.Image }],
      }),
    ).toBe('Aoife has shared these memories from their Immich Vault:');

    expect(
      getNativeMobileShareMessage({
        userName: 'Aoife',
        assets: [
          { originalFileName: 'clip-1.mp4', type: AssetTypeEnum.Video },
          { originalFileName: 'clip-2.mp4', type: AssetTypeEnum.Video },
        ],
      }),
    ).toBe('Aoife has shared these memories from their Immich Vault:');
  });

  it('detects share-sheet cancellation errors', () => {
    const cancelled = new Error('The share operation was cancelled');
    cancelled.name = 'AbortError';

    expect(isNativeShareCancelError(cancelled)).toBe(true);
    expect(isNativeShareCancelError(new Error('Unexpected failure'))).toBe(false);
  });
});
