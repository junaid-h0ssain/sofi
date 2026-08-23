<!--
  PRODUCT CARD — the tile used on the homepage, catalog grid and "related
  products" section. One component = consistent product UI everywhere.

  Svelte 5 notes:
   - $props() receives the product from the parent's {#each} loop.
   - $derived recomputes `outOfStock` whenever the prop changes — no manual
     update logic needed.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatMoney } from '$lib/utils/money';
	import type { ProductWithRelations } from '$lib/types';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Card, CardContent, CardFooter } from '$lib/components/ui/card/index.js';

	let { product }: { product: ProductWithRelations } = $props();

	const outOfStock = $derived(product.stock === 0);
</script>

<Card class="group h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-lg">
	<!-- The whole image is a link to the detail page; `group` lets the hover
	     effect on the card drive the img zoom inside it. -->
	<a href={resolve('/products/[slug]', { slug: product.slug })} class="relative block aspect-[4/3] overflow-hidden">
		<img
			src={product.imageUrl ?? '/products/laptop.svg'}
			alt={product.name}
			loading="lazy"
			class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
		/>
		{#if outOfStock}
			<!-- Semi-transparent overlay + badge for sold-out items -->
			<div class="absolute inset-0 flex items-center justify-center bg-background/70">
				<Badge variant="secondary">Out of stock</Badge>
			</div>
		{/if}
	</a>

	<CardContent class="flex-1 p-4">
		<p class="text-muted-foreground text-xs font-medium uppercase tracking-wide">
			{product.brand.name} · {product.category.name}
		</p>
		<a href={resolve('/products/[slug]', { slug: product.slug })} class="mt-1 block hover:underline">
			<h3 class="line-clamp-2 font-medium leading-snug">{product.name}</h3>
		</a>
	</CardContent>

	<CardFooter class="justify-between p-4 pt-0">
		<span class="text-base font-semibold">{formatMoney(product.priceCents)}</span>
		{#if !outOfStock && product.stock <= 5}
			<Badge variant="outline">Only {product.stock} left</Badge>
		{/if}
	</CardFooter>
</Card>
