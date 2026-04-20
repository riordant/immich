<script lang="ts">
  let props = $props();
</script>

<div data-testid="mock-thumbnail" data-asset-id={props.asset?.id ?? ''}></div>
