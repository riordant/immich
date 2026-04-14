<script lang="ts">
  interface Props {
    originalFileName: string;
  }

  let { originalFileName }: Props = $props();

  const displayTitle = $derived(originalFileName.replace(/\.[^/.]+$/, ''));
</script>

<div class="pointer-events-none absolute inset-x-2 bottom-2">
  <div class="rounded-md bg-black/70 px-2 py-1 backdrop-blur-sm">
    <p class="truncate text-xs font-medium text-white" title={originalFileName}>
      {displayTitle}
    </p>
  </div>
</div>
