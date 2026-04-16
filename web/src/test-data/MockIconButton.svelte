<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    ['aria-label']?: string;
    onclick?: () => void;
    children?: Snippet;
  }

  let props: Props = $props();
</script>

<button type="button" aria-label={props['aria-label'] ?? ''} onclick={props.onclick ?? (() => {})}>
  {@render props.children?.()}
</button>
