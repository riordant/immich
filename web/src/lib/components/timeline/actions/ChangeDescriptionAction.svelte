<script lang="ts">
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import AssetUpdateDescriptionConfirmModal from '$lib/modals/AssetUpdateDescriptionConfirmModal.svelte';
  import { user } from '$lib/stores/user.store';
  import { getOwnedAssetsWithWarning } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getAssetInfo, updateAssets } from '@immich/sdk';
  import { modalManager } from '@immich/ui';
  import { mdiText } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';

  interface Props {
    menuItem?: boolean;
  }

  let { menuItem = false }: Props = $props();

  const getSharedDescription = (assets: TimelineAsset[]) => {
    if (assets.length === 0) {
      return '';
    }

    const initialDescription = assets[0].description ?? '';
    return assets.every((asset) => (asset.description ?? '') === initialDescription) ? initialDescription : '';
  };

  const refreshChangedAssets = async (ids: string[]) => {
    const refreshedAssets = await Promise.allSettled(ids.map((id) => getAssetInfo({ id })));
    for (const result of refreshedAssets) {
      if (result.status === 'fulfilled') {
        eventManager.emit('AssetUpdate', result.value);
      }
    }
  };

  const handleUpdateDescription = async () => {
    const description = await modalManager.show(AssetUpdateDescriptionConfirmModal, {
      initialDescription: getSharedDescription(assetMultiSelectManager.ownedAssets),
    });

    if (description !== undefined) {
      const ids = getOwnedAssetsWithWarning(assetMultiSelectManager.assets, $user);

      try {
        await updateAssets({ assetBulkUpdateDto: { ids, description } });
        await refreshChangedAssets(ids);
        assetMultiSelectManager.clear();
      } catch (error) {
        handleError(error, $t('errors.unable_to_change_description'));
      }
    }
  };
</script>

{#if menuItem}
  <MenuOption text={$t('change_description')} icon={mdiText} onClick={() => handleUpdateDescription()} />
{/if}
