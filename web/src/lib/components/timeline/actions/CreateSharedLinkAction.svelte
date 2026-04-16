<script lang="ts">
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { handleAssetShareLinkAction, toMobileShareAsset } from '$lib/services/mobile-share-link.service';
  import { IconButton } from '@immich/ui';
  import { mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const handleClick = async () => {
    await handleAssetShareLinkAction({
      assetIds: assetMultiSelectManager.assets.map(({ id }) => id),
      assets: assetMultiSelectManager.assets.map((asset) => toMobileShareAsset(asset)),
    });
  };
</script>

<IconButton
  shape="round"
  color="secondary"
  variant="ghost"
  aria-label={$t('share')}
  icon={mdiShareVariantOutline}
  onclick={handleClick}
/>
