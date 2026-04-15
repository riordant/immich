<script lang="ts">
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { recordRecentVideo } from '$lib/services/recent-video.service';
  import { AssetTypeEnum } from '@immich/sdk';

  let lastRecordedAssetId = $state<string | undefined>();

  $effect(() => {
    if (!assetViewerManager.isViewing) {
      lastRecordedAssetId = undefined;
      return;
    }

    const asset = assetViewerManager.asset;
    if (!asset || asset.type !== AssetTypeEnum.Video || lastRecordedAssetId === asset.id) {
      return;
    }

    lastRecordedAssetId = asset.id;
    void recordRecentVideo(asset.id).catch(() => undefined);
  });
</script>
