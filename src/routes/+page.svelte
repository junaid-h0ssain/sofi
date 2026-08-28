<!--
  HOMEPAGE — hero banner, category tiles, featured products.

  Data flow: +page.server.ts (this folder) returns { featured } and the root
  layout contributes { categories }. SvelteKit merges both into `data`.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ProductCard from '$lib/components/product/product-card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import type { PageData } from './$types';

	let { data }: { data: PageData & { categories: { id: string; name: string; slug: string; productCount: number }[] } } = $props();
</script>

<svelte:head><title>sofi — electronics store</title></svelte:head>

<!-- Hero -->
<section class="from-primary/5 via-background to-background border-b bg-linear-to-b">
	<div class="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
		<Badge variant="outline" class="px-3 py-1">Free shipping on orders over $50</Badge>
		<h1 class="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
			Electronics that <span class="text-primary">just work</span>
		</h1>
		<p class="text-muted-foreground max-w-xl text-lg">
			Laptops, phones, routers and more — hand-picked gear from the brands you trust.
		</p>
		<div class="flex gap-3">
			<Button size="lg" href={resolve('/products')}>
				Shop now <ArrowRightIcon class="ml-1 size-4" />
			</Button>
			<!-- A link with a query param — this is just the catalog pre-filtered by cheapest-first -->
			<Button size="lg" variant="outline" href={`${resolve('/products')}?sort=price-asc`}>
				Best deals
			</Button>
		</div>
	</div>
</section>

<!-- Categories: one tile per category; slugs match our placeholder SVGs -->
<section class="mx-auto max-w-7xl px-4 py-14 sm:px-6">
	<h2 class="mb-6 text-2xl font-semibold tracking-tight">Shop by category</h2>
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
		{#each data.categories as cat (cat.id)}
			<a
				href={`${resolve('/products')}?category=${cat.slug}`}
				class="bg-card hover:border-primary/40 hover:shadow-md rounded-xl border p-5 transition-all"
			>
				<img
					src="/products/{cat.slug}.svg"
					alt=""
					class="mb-3 h-16 w-16 rounded-lg object-cover"
					loading="lazy"
				/>
				<p class="font-medium">{cat.name}</p>
				<p class="text-muted-foreground text-sm">{cat.productCount} products</p>
			</a>
		{/each}
	</div>
</section>

<!-- Featured products reuse the same card component as the catalog page -->
<section class="border-t">
	<div class="mx-auto max-w-7xl px-4 py-14 sm:px-6">
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-2xl font-semibold tracking-tight">Featured products</h2>
			<Button variant="ghost" size="sm" href={resolve('/products')}>
				View all <ArrowRightIcon class="ml-1 size-4" />
			</Button>
		</div>
		{#if data.featured.length === 0}
			<p class="text-muted-foreground py-12 text-center">No featured products yet.</p>
		{:else}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each data.featured as product (product.id)}
					<ProductCard {product} />
				{/each}
			</div>
		{/if}
	</div>
</section>
