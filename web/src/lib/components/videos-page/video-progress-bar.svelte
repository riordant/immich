<script lang="ts">
  interface Props {
    progressPercent?: number | null;
  }

  let { progressPercent = null }: Props = $props();
</script>

{#if progressPercent !== null}
  <div class="h-1 overflow-hidden rounded-full bg-white/30 shadow-sm" aria-hidden="true">
    <div
      data-testid="video-progress-bar"
      class="h-full rounded-full bg-primary"
      style:width={`${progressPercent}%`}
    ></div>
  </div>
{/if}
