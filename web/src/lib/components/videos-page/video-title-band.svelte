<script lang="ts">
  interface Props {
    title?: string | null;
  }

  let { title = null }: Props = $props();

  const normalizedTitle = $derived(title?.trim() || null);
</script>

{#if normalizedTitle}
  <div class="rounded-md bg-black/70 px-2 py-1 backdrop-blur-sm">
    <p class="truncate text-xs font-medium text-white" title={normalizedTitle}>
      {normalizedTitle}
    </p>
  </div>
{/if}
