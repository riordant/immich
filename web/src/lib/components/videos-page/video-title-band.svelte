<script lang="ts">
  interface Props {
    originalFileName: string;
    progressPercent?: number | null;
  }

  let { originalFileName, progressPercent = null }: Props = $props();

  const displayTitle = $derived(originalFileName.replace(/\.[^/.]+$/, ''));
</script>

<div class="pointer-events-none absolute inset-x-2 bottom-2">
  <div class="rounded-md bg-black/70 px-2 py-1 backdrop-blur-sm">
    <p class="truncate text-xs font-medium text-white" title={originalFileName}>
      {displayTitle}
    </p>
    {#if progressPercent !== null}
      <div class="mt-1 h-1 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
        <div data-testid="video-progress-bar" class="h-full rounded-full bg-primary" style:width={`${progressPercent}%`}></div>
      </div>
    {/if}
  </div>
</div>
