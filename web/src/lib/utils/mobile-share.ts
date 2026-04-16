import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';

type NavigatorLike = Pick<Navigator, 'share' | 'userAgent' | 'platform' | 'maxTouchPoints'>;

export type MobileShareAsset = Pick<TimelineAsset, 'originalFileName' | 'isVideo'> | Pick<AssetResponseDto, 'originalFileName' | 'type'>;

export const stripFileExtension = (originalFileName: string) => originalFileName.replace(/\.[^/.]+$/, '');

export const isMobileBrowserPlatform = ({
  userAgent,
  platform = '',
  maxTouchPoints = 0,
}: {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
}) => {
  return (
    /Android|iPhone|iPod/i.test(userAgent) ||
    /iPad/i.test(userAgent) ||
    (platform === 'MacIntel' && maxTouchPoints > 1)
  );
};

export const canUseNativeMobileShare = ({
  navigatorObject,
  isSecureContext,
  pointerCoarse,
}: {
  navigatorObject?: NavigatorLike;
  isSecureContext: boolean;
  pointerCoarse: boolean;
}) => {
  if (!navigatorObject?.share || !isSecureContext || !pointerCoarse) {
    return false;
  }

  return isMobileBrowserPlatform({
    userAgent: navigatorObject.userAgent,
    platform: navigatorObject.platform,
    maxTouchPoints: navigatorObject.maxTouchPoints,
  });
};

const isVideoAsset = (asset: MobileShareAsset) => ('isVideo' in asset ? asset.isVideo : asset.type === AssetTypeEnum.Video);

export const getNativeMobileShareMessage = ({
  userName,
  assets,
}: {
  userName: string;
  assets: MobileShareAsset[];
}) => {
  const safeUserName = userName.trim() || 'Someone';

  if (assets.length === 1 && isVideoAsset(assets[0])) {
    const movieName = stripFileExtension(assets[0].originalFileName) || assets[0].originalFileName;
    return `${safeUserName} has shared this movie: ${movieName} from their Immich Vault:`;
  }

  return `${safeUserName} has shared these memories from their Immich Vault:`;
};

export const isNativeShareCancelError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return error.name === 'AbortError' || error.name === 'CanceledError' || message.includes('abort') || message.includes('cancel');
};
