<!--
  PRODUCT DETAIL PAGE — image, price, add-to-cart form, specs table and
  "more in this category" suggestions.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	// `toast` works anywhere: it just queues a notification for the <Toaster>
	// mounted once in the root layout.
	import { toast } from 'svelte-sonner';
	import ProductCard from '$lib/components/product/product-card.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Table, TableBody, TableCell, TableRow } from '$lib/components/ui/table/index.js';
	import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
	import { formatMoney } from '$lib/utils/money';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let quantity = $state(1);
	let adding = $state(false);

	const product = $derived(data.product);
	const outOfStock = $derived(product.stock === 0);
</script>

<svelte:head><title>{product.name} · sofi</title></svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
	<!-- Breadcrumb trail: Home / Products / Category / Name -->
	<nav class="text-muted-foreground mb-6 flex items-center gap-2 text-sm" aria-label="Breadcrumb">
		<a href={resolve('/')} class="hover:text-foreground">Home</a>
		<span>/</span>
		<a href={resolve('/products')} class="hover:text-foreground">Products</a>
		<span>/</span>
		<a href={`${resolve('/products')}?category=${product.category.slug}`} class="hover:text-foreground">
			{product.category.name}
		</a>
		<span>/</span>
		<span class="text-foreground truncate">{product.name}</span>
	</nav>

	<div class="grid gap-10 lg:grid-cols-2">
		<div class="overflow-hidden rounded-xl border">
			<img
				src={product.imageUrl ?? '/products/laptop.svg'}
				alt={product.name}
				class="aspect-[4/3] w-full object-cover"
			/>
		</div>

		<div class="flex flex-col gap-5">
			<div class="flex items-center gap-2">
				<Badge variant="outline">{product.brand.name}</Badge>
				<Badge variant="secondary">{product.category.name}</Badge>
			</div>

			<h1 class="text-3xl font-bold tracking-tight">{product.name}</h1>

			<!-- cents → "$1,099.00" only at display time -->
			<p class="text-3xl font-semibold">{formatMoney(product.priceCents)}</p>

			<p class="text-muted-foreground leading-relaxed">{product.description}</p>

			<Separator />

			{#if outOfStock}
				<Badge variant="destructive" class="w-fit">Out of stock</Badge>
			{:else}
				<p class="text-sm">
					{#if product.stock <= 5}
						<span class="font-medium text-orange-600">Only {product.stock} left in stock</span>
					{:else}
						<span class="text-green-600">In stock ({product.stock} available)</span>
					{/if}
				</p>

				<!--
				  Add-to-cart form → named action `?/addToCart`.
				  The enhance callback inspects the action RESULT (not the reactive
				  `form` prop — that isn't updated yet inside the callback):
				    result.type 'success' → green toast
				    result.type 'failure' → red toast with the server's message
				  update() then applies defaults & refreshes layout data, which is
				  what makes the cart badge count go up.
				-->
				<form
					method="POST"
					action="?/addToCart"
					use:enhance={() => {
						adding = true;
						return async ({ result, update }) => {
							adding = false;
							if (result.type === 'success') {
								toast.success('Added to cart', { description: product.name });
							} else if (result.type === 'failure' && result.data?.message) {
								toast.error(String(result.data.message));
							}
							await update();
						};
					}}
					class="flex items-center gap-3"
				>
					<input type="hidden" name="productId" value={product.id} />
					<Input
						type="number"
						name="quantity"
						min="1"
						max={product.stock}
						value={quantity}
						class="w-20"
						aria-label="Quantity"
						required
					/>
					<Button type="submit" size="lg" class="flex-1" disabled={adding}>
						<ShoppingCartIcon class="mr-2 size-4" />
						{adding ? 'Adding…' : 'Add to cart'}
					</Button>
				</form>
			{/if}
		</div>
	</div>

	<!--
	  Specs are a flexible JSONB object, so we render whatever keys exist.
	  Object.keys length check hides the whole section for spec-less products.
	-->
	{#if Object.keys(product.specs).length > 0}
		<section class="mt-14">
			<h2 class="mb-4 text-xl font-semibold tracking-tight">Specifications</h2>
			<Card.Root class="py-0">
				<Table>
					<TableBody>
						{#each Object.entries(product.specs) as [key, value], i (key)}
							<TableRow class={i % 2 === 0 ? '' : 'bg-muted/50'}>
								<TableCell class="w-48 font-medium">{key}</TableCell>
								<TableCell>{value}</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</Card.Root>
		</section>
	{/if}

	{#if data.related.length > 0}
		<section class="mt-14">
			<h2 class="mb-4 text-xl font-semibold tracking-tight">More in {product.category.name}</h2>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each data.related as related (related.id)}
					<ProductCard product={related} />
				{/each}
			</div>
		</section>
	{/if}
</div>
