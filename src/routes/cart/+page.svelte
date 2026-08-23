<!--
  CART PAGE — line items on the left, sticky order summary on the right.

  Note how each cart row contains THREE tiny forms (setQuantity, remove) —
  that's the SvelteKit way: every button is a real form posting to a server
  action. No client state to keep in sync.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
	import { formatMoney } from '$lib/utils/money';
	// Shared shipping rules so this page always matches checkout exactly.
	import { calcShippingCents } from '$lib/utils/pricing';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const shippingCents = $derived(calcShippingCents(data.totalCents));

	/** Show failures (e.g. "Cart item not found") as a toast after update. */
	function onQuantityResult(result: { type: string; data?: Record<string, unknown> }): Promise<void> | void {
		if (result.type === 'failure' && result.data?.message) {
			toast.error(String(result.data.message));
		}
	}
</script>

<svelte:head><title>Your cart · sofi</title></svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
	<h1 class="mb-6 text-2xl font-semibold tracking-tight">Your cart</h1>

	{#if data.items.length === 0}
		<!-- Empty state -->
		<Card.Root class="p-12 text-center">
			<ShoppingCartIcon class="text-muted-foreground mx-auto mb-4 size-10" />
			<p class="font-medium">Your cart is empty</p>
			<p class="text-muted-foreground mt-1 text-sm">Browse the catalog and find something you like.</p>
			<Button class="mt-4" href={resolve('/products')}>Continue shopping</Button>
		</Card.Root>
	{:else}
		<div class="grid gap-8 lg:grid-cols-[1fr_360px]">
			<div class="space-y-4">
				{#each data.items as item (item.id)}
					<Card.Root class="flex gap-4 p-4">
						<a href={resolve('/products/[slug]', { slug: item.product.slug })} class="shrink-0">
							<img
								src={item.product.imageUrl ?? '/products/laptop.svg'}
								alt={item.product.name}
								class="size-24 rounded-lg object-cover"
							/>
						</a>
						<div class="flex min-w-0 flex-1 flex-col">
							<p class="text-muted-foreground text-xs uppercase">{item.product.brand.name}</p>
							<a
								href={resolve('/products/[slug]', { slug: item.product.slug })}
								class="truncate font-medium hover:underline"
							>
								{item.product.name}
							</a>
							<p class="text-muted-foreground mt-auto text-sm">
								{formatMoney(item.product.priceCents)} each
							</p>
						</div>
						<div class="flex flex-col items-end justify-between gap-2">
							<span class="font-semibold">{formatMoney(item.product.priceCents * item.quantity)}</span>
							<form
								method="POST"
								action="?/setQuantity"
								class="flex items-center gap-2"
								use:enhance={() => {
									return async ({ result, update }) => {
										onQuantityResult(result);
										await update();
									};
								}}
							>
								<input type="hidden" name="itemId" value={item.id} />
								<Input
									type="number"
									name="quantity"
									min="0"
									max={item.product.stock}
									value={item.quantity}
									class="h-8 w-16"
									aria-label="Quantity for {item.product.name}"
								/>
								<Button type="submit" variant="outline" size="sm">Update</Button>
							</form>
							<form method="POST" action="?/remove">
								<input type="hidden" name="itemId" value={item.id} />
								<Button type="submit" variant="ghost" size="sm" aria-label="Remove {item.product.name}">
									<TrashIcon class="mr-1 size-3.5" /> Remove
								</Button>
							</form>
						</div>
					</Card.Root>
				{/each}

				<form method="POST" action="?/clear">
					<Button type="submit" variant="ghost" size="sm">Clear cart</Button>
				</form>
			</div>

			<!-- Sticky summary stays visible while scrolling long carts -->
			<Card.Root class="h-fit p-6 lg:sticky lg:top-20">
				<h2 class="font-semibold">Order summary</h2>
				<Separator class="my-4" />
				<dl class="space-y-2 text-sm">
					<div class="flex justify-between">
						<dt class="text-muted-foreground">Subtotal</dt>
						<dd>{formatMoney(data.totalCents)}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-muted-foreground">Shipping</dt>
						<dd>{shippingCents === 0 ? 'Free' : formatMoney(shippingCents)}</dd>
					</div>
				</dl>
				<Separator class="my-4" />
				<div class="flex justify-between font-semibold">
					<span>Total</span>
					<span>{formatMoney(data.totalCents + shippingCents)}</span>
				</div>
				<Button size="lg" class="mt-6 w-full" href={resolve('/checkout')}>Proceed to checkout</Button>
				<p class="text-muted-foreground mt-3 text-center text-xs">
					Free shipping on orders over $50
				</p>
			</Card.Root>
		</div>
	{/if}
</div>
