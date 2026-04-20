<script lang="ts">
  import OrientationControls from '$lib/components/asset-viewer/editor/transform-tool/orientation-controls.svelte';
  import { transformManager } from '$lib/managers/edit/transform-manager.svelte';
  import { Button, HStack } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface AspectRatioOption {
    label: string;
    value: string;
    width?: number;
    height?: number;
    isFree?: boolean;
  }

  const aspectRatios: AspectRatioOption[] = [
    { label: $t('crop_aspect_ratio_free'), value: 'free', isFree: true },
    { label: $t('crop_aspect_ratio_original'), value: 'original', width: 24, height: 18 },
    { label: '5:4', value: '5:4', width: 22, height: 18 },
    { label: '4:5', value: '4:5', width: 18, height: 22 },
    { label: '4:3', value: '4:3', width: 24, height: 18 },
    { label: '3:4', value: '3:4', width: 18, height: 24 },
    { label: '3:2', value: '3:2', width: 24, height: 16 },
    { label: '2:3', value: '2:3', width: 16, height: 24 },
    { label: '16:9', value: '16:9', width: 24, height: 14 },
    { label: '9:16', value: '9:16', width: 14, height: 24 },
    { label: $t('crop_aspect_ratio_square'), value: '1:1', width: 20, height: 20 },
  ];

  let isRotated = $derived(transformManager.normalizedRotation % 180 !== 0);

  function rotatedRatio(ratio: AspectRatioOption): string {
    if (ratio.value === 'free') {
      return ratio.value;
    }

    if (isRotated) {
      let [width, height] = ratio.value.split(':');
      return `${height}:${width}`;
    } else {
      return ratio.value;
    }
  }

  function ratioSelected(ratio: AspectRatioOption): boolean {
    const currentRatioRotated = rotatedRatio(ratio);

    return transformManager.cropAspectRatio === currentRatioRotated;
  }

  function selectAspectRatio(ratio: AspectRatioOption) {
    let appliedRatio;
    if (ratio.value === 'original') {
      const { width, height } = transformManager.cropImageSize;
      appliedRatio = `${width}:${height}`;
    } else {
      appliedRatio = rotatedRatio(ratio);
    }

    transformManager.setAspectRatio(appliedRatio);
  }

  async function rotateImage(degrees: number) {
    await transformManager.rotate(degrees);
  }

  function mirrorImage(axis: 'horizontal' | 'vertical') {
    transformManager.mirror(axis);
  }
</script>

<div class="mt-3 px-4">
  <OrientationControls onRotate={rotateImage} onMirror={mirrorImage} />

  <div class="flex h-10 w-full items-center justify-between text-sm mt-6">
    <h2>{$t('crop')}</h2>
  </div>

  <!-- Aspect Ratio Grid -->
  <div class="grid grid-cols-2 mb-4">
    {#each aspectRatios as ratio (ratio.value)}
      <HStack>
        <Button
          class="w-14 h-14 m-2"
          shape="round"
          onclick={() => selectAspectRatio(ratio)}
          aria-label={ratio.label}
          color={ratioSelected(ratio) ? 'primary' : 'secondary'}
          variant={ratioSelected(ratio) ? 'filled' : 'outline'}
        >
          {#if ratio.isFree}
            <!-- Free crop icon with dashed border -->
            <div
              class="w-6 h-6 border-2 border-dashed rounded-xs flex-shrink-0 {ratioSelected(ratio)
                ? 'border-black'
                : 'border-white'}"
            ></div>
          {:else}
            <!-- Aspect ratio box -->
            <div
              class="border-2 rounded-xs flex-shrink-0 {ratioSelected(ratio) ? 'border-black' : 'border-white'}"
              style="width: {ratio.width}px; height: {ratio.height}px;"
            ></div>
          {/if}
        </Button>
        <span class="text-sm text-white">{ratio.label}</span>
      </HStack>
    {/each}
  </div>
</div>
