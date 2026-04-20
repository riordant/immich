<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import { HStack, IconButton } from '@immich/ui';
  import { mdiFlipHorizontal, mdiFlipVertical, mdiRotateLeft, mdiRotateRight } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onRotate: (degrees: number) => void | Promise<void>;
    onMirror: (axis: 'horizontal' | 'vertical') => void;
  }

  let { onRotate, onMirror }: Props = $props();
</script>

<svelte:document
  use:shortcuts={[
    { shortcut: { key: ']' }, onShortcut: () => onRotate(90) },
    { shortcut: { key: '[' }, onShortcut: () => onRotate(-90) },
  ]}
/>

<div class="flex h-10 w-full items-center justify-between text-sm mt-2">
  <h2>{$t('editor_orientation')}</h2>
</div>
<HStack>
  <IconButton
    class="w-full"
    size="small"
    aria-label={$t('editor_rotate_left')}
    icon={mdiRotateLeft}
    onclick={() => onRotate(-90)}
  />
  <IconButton
    class="w-full"
    size="small"
    aria-label={$t('editor_rotate_right')}
    icon={mdiRotateRight}
    onclick={() => onRotate(90)}
  />
  <IconButton
    class="w-full"
    size="small"
    aria-label={$t('editor_flip_horizontal')}
    icon={mdiFlipHorizontal}
    onclick={() => onMirror('horizontal')}
  />
  <IconButton
    class="w-full"
    size="small"
    aria-label={$t('editor_flip_vertical')}
    icon={mdiFlipVertical}
    onclick={() => onMirror('vertical')}
  />
</HStack>
