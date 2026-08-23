<!--
  Root layout: wraps every page. Renders the header, the current route
  ({@render children()}), the footer, and toast notifications.
-->
<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import Header from '$lib/components/layout/header.svelte';
	import Footer from '$lib/components/layout/footer.svelte';
	import type { LayoutServerData } from './$types';

	/**
	 * Svelte 5 basics used here:
	 *  - `$props()` is how a component receives inputs (replaces `export let`).
	 *  - `children` is a snippet (a chunk of template) passed in by SvelteKit;
	 *    it renders whatever page/route is currently active.
	 *  - `{@render children()}` outputs it.
	 *
	 * `data` comes from our +layout.server.ts above and is fully typed via
	 * the generated './$types' module.
	 */
	let { data, children }: { data: LayoutServerData; children: any } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!-- min-h-screen + flex makes the footer stick to the bottom on short pages -->
<div class="flex min-h-screen flex-col">
	<Header user={data.user} cartCount={data.cartCount} categories={data.categories} />
	<main class="flex-1">
		{@render children()}
	</main>
	<Footer />
</div>

<!-- sonner renders pop-up notifications; pages call `toast.success(...)` etc. -->
<Toaster richColors position="top-center" />
