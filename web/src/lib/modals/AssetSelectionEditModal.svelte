<script lang="ts">
  import OrientationControls from '$lib/components/asset-viewer/editor/transform-tool/orientation-controls.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import type { EditActions } from '$lib/managers/edit/edit-manager.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { user } from '$lib/stores/user.store';
  import { waitForWebsocketEvent } from '$lib/stores/websocket';
  import { mergeTransformEdits, normalizedTransformToEdits } from '$lib/utils/editor';
  import { getOwnedAssetsWithWarning } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { editAsset, getAssetEdits, getAssetInfo, removeAssetEdits } from '@immich/sdk';
  import { Button, HStack, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiTune } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    assets: TimelineAsset[];
    onClose: (success: boolean) => void;
  }

  let { assets, onClose }: Props = $props();

  let loading = $state(false);
  let rotation = $state(0);
  let mirrorHorizontal = $state(false);
  let mirrorVertical = $state(false);
  const formId = 'asset-selection-edit-form';

  const canReset = $derived(rotation !== 0 || mirrorHorizontal || mirrorVertical);
  const pendingEdits = $derived(
    normalizedTransformToEdits({
      rotation,
      mirrorHorizontal,
      mirrorVertical,
    }),
  );

  function rotate(degrees: number) {
    rotation = (rotation + degrees + 360) % 360;
  }

  function mirror(axis: 'horizontal' | 'vertical') {
    if (rotation % 180 !== 0) {
      axis = axis === 'horizontal' ? 'vertical' : 'horizontal';
    }

    if (axis === 'horizontal') {
      mirrorHorizontal = !mirrorHorizontal;
    } else {
      mirrorVertical = !mirrorVertical;
    }
  }

  function resetAllChanges() {
    rotation = 0;
    mirrorHorizontal = false;
    mirrorVertical = false;
  }

  const onSubmit = async () => {
    const ids = getOwnedAssetsWithWarning(assets, $user);
    if (ids.length === 0 || pendingEdits.length === 0) {
      onClose(false);
      return;
    }

    loading = true;

    try {
      for (const id of ids) {
        const existingEdits = await getAssetEdits({ id });
        const mergedEdits = mergeTransformEdits(existingEdits.edits as EditActions, pendingEdits as EditActions);
        const editCompleted = waitForWebsocketEvent('AssetEditReadyV1', (event) => event.asset.id === id, 10_000);

        await (mergedEdits.length === 0
          ? removeAssetEdits({ id })
          : editAsset({
              id,
              assetEditsCreateDto: {
                edits: mergedEdits,
              },
            }));

        await editCompleted;
        eventManager.emit('AssetEditsApplied', id);
        eventManager.emit('AssetUpdate', await getAssetInfo({ id }));
      }

      assetMultiSelectManager.clear();
      onClose(true);
    } catch (error) {
      handleError(error, $t('editor_edits_applied_error'));
      onClose(false);
    } finally {
      loading = false;
    }
  };
</script>

<Modal title={$t('editor')} icon={mdiTune} onClose={() => onClose(false)} size="small">
  <ModalBody>
    <form
      id={formId}
      onsubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <div class="mt-3 px-4">
        <OrientationControls onRotate={rotate} onMirror={mirror} />
      </div>

      <div class="px-4 pb-4 pt-8">
        <Button
          variant="outline"
          onclick={() => resetAllChanges()}
          disabled={!canReset || loading}
          class="self-start"
          shape="round"
          size="small"
        >
          {$t('editor_reset_all_changes')}
        </Button>
      </div>
    </form>
  </ModalBody>

  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose(false)} disabled={loading}>
        {$t('cancel')}
      </Button>
      <Button
        shape="round"
        type="submit"
        tabindex={1}
        fullWidth
        disabled={!canReset}
        loading={loading}
        form={formId}
      >
        {$t('save')}
      </Button>
    </HStack>
  </ModalFooter>
</Modal>
