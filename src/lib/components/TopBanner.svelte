<script lang="ts">
  import type { Snippet } from "svelte"

  let { content }: { content: Snippet } = $props()
</script>

<style lang="scss">
  @use "/static/styles/variables" as *;

  .banner {
    box-sizing: border-box;
    height: 2rem;
    width: 100%;
    background-color: $red-500;
    margin: 0.5rem 0 0;
    border-radius: 0.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    color: white;
    font-weight: 600;
    font-size: 0.75rem;
    line-height: 1rem;
  }

  .alert-icon {
    height: 16px;
    width: 16px;
    background-image: $alert-icon;
  }
</style>

<div class="banner">
  <div class="alert-icon"></div>
  {@render content()}
</div>
