import { browser } from '$app/environment';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { eventManager } from '$lib/managers/event-manager.svelte';
import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
import { modalManager } from '@immich/ui';
import { mediaQueryManager } from '$lib/stores/media-query-manager.svelte';
import { user } from '$lib/stores/user.store';
import { copyToClipboard } from '$lib/utils';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import {
  SharedLinkType,
  createSharedLink,
  type AssetResponseDto,
  type SharedLinkCreateDto,
  type SharedLinkResponseDto,
} from '@immich/sdk';
import { get } from 'svelte/store';
import { asUrl } from './shared-link.service';
import {
  canUseNativeMobileShare,
  getNativeMobileShareMessage,
  isNativeShareCancelError,
  type MobileShareAsset,
} from '$lib/utils/mobile-share';

const createAssetShareLinkDto = (assetIds: string[]): SharedLinkCreateDto => ({
  type: SharedLinkType.Individual,
  assetIds,
  allowDownload: true,
  allowUpload: false,
  showMetadata: true,
});

const createTrackedAssetShareLink = async (assetIds: string[]): Promise<SharedLinkResponseDto> => {
  const sharedLink = await createSharedLink({ sharedLinkCreateDto: createAssetShareLinkDto(assetIds) });
  eventManager.emit('SharedLinkCreate', sharedLink);
  return sharedLink;
};

export const canUseNativeMobileShareLink = () =>
  browser &&
  canUseNativeMobileShare({
    navigatorObject: globalThis.navigator,
    isSecureContext: globalThis.isSecureContext,
    pointerCoarse: mediaQueryManager.pointerCoarse,
  });

export const handleAssetShareLinkAction = async ({
  assetIds,
  assets,
}: {
  assetIds: string[];
  assets: MobileShareAsset[];
}) => {
  if (!canUseNativeMobileShareLink()) {
    await modalManager.show(SharedLinkCreateModal, { assetIds });
    return;
  }

  const $t = await getFormatter();

  let shareUrl: string;
  try {
    const sharedLink = await createTrackedAssetShareLink(assetIds);
    shareUrl = asUrl(sharedLink);
  } catch (error) {
    handleError(error, $t('errors.failed_to_create_shared_link'));
    return;
  }

  try {
    const currentUser = get(user);
    const userName = currentUser?.name || currentUser?.email || 'Someone';

    await globalThis.navigator.share({
      text: getNativeMobileShareMessage({ userName, assets }),
      url: shareUrl,
    });
  } catch (error) {
    if (isNativeShareCancelError(error)) {
      return;
    }

    await copyToClipboard(shareUrl);
  }
};

export const toMobileShareAsset = (asset: AssetResponseDto | TimelineAsset): MobileShareAsset => {
  if ('type' in asset) {
    return { originalFileName: asset.originalFileName, type: asset.type };
  }

  return {
    originalFileName: asset.originalFileName,
    isVideo: asset.isVideo,
  };
};
