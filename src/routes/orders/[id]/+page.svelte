<!--
  ORDER CONFIRMATION / DETAIL PAGE.
  Data shape note: everything now arrives as ONE nested object from the API
  (data.order with .items inside) instead of two separate props.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import CheckCircleIcon from '@lucide/svelte/icons/circle-check-big';
	import { formatMoney } from '$lib/utils/money';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type OrderStatus = 'paid' | 'shipped' | 'delivered' | 'cancelled';

	function statusVariant(status: OrderStatus) {
		switch (status) {
			case 'paid':
				return 'default';
			case 'shipped':
				return 'secondary';
			case 'delivered':
				return 'outline';
			case 'cancelled':
				return 'destructive';
		}
	}

	// Items subtotal straight from the stored line items.
	const itemsTotalCents = $derived(
		data.order.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0)
	);
</script>

<svelte:head><title>Order {data.order.id.slice(0, 8)} · sofi</title></svelte:head>

<div class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
	{#if data.order.status !== 'cancelled'}
		<!-- Big friendly confirmation header -->
		<div class="mb-6 flex items-center gap-3">
			<CheckCircleIcon class="size-8 text-green-600" />
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Thank you for your order!</h1>
				<p class="text-muted-foreground text-sm">We received your payment and your order is being prepared.</p>
			</div>
		</div>
	{:else}
		<h1 class="mb-6 text-2xl font-semibold tracking-tight">Order cancelled</h1>
	{/if}

	<Card.Root class="p-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<p class="text-muted-foreground text-xs uppercase">Order number</p>
				<p class="font-mono font-medium">{data.order.id}</p>
			</div>
			<!-- status arrives as a lowercase string ("paid") from the API -->
			<Badge variant={statusVariant(data.order.status as OrderStatus)}>{data.order.status}</Badge>
		</div>

		<Separator class="my-5" />

		<ul class="space-y-4">
			{#each data.order.items as item (item.id)}
				<li class="flex items-center gap-4">
					<img
						src={item.imageUrl ?? '/products/laptop.svg'}
						alt=""
						class="size-12 rounded object-cover"
					/>
					<div class="min-w-0 flex-1">
						<p class="truncate font-medium">{item.productName}</p>
						<p class="text-muted-foreground text-sm">
							{formatMoney(item.unitPriceCents)} × {item.quantity}
						</p>
					</div>
					<span class="font-medium">{formatMoney(item.unitPriceCents * item.quantity)}</span>
				</li>
			{/each}
		</ul>

		<Separator class="my-5" />

		<div class="grid gap-6 sm:grid-cols-2">
			<!-- <address> is semantic HTML for contact information -->
			<div>
				<p class="text-muted-foreground mb-1 text-xs uppercase">Shipping to</p>
				<address class="text-sm not-italic">
					{data.order.fullName}<br />
					{data.order.street}<br />
					{data.order.city}, {data.order.postalCode}<br />
					{data.order.country}
				</address>
			</div>
			<div class="space-y-1 text-sm sm:text-right">
				<div class="flex justify-between sm:justify-end sm:gap-6">
					<span class="text-muted-foreground">Items total</span>
					<span>{formatMoney(itemsTotalCents)}</span>
				</div>
				<div class="flex justify-between sm:justify-end sm:gap-6">
					<span class="text-muted-foreground">Shipping</span>
					<span>{data.order.shippingCents === 0 ? 'Free' : formatMoney(data.order.shippingCents)}</span>
				</div>
				<div class="flex justify-between border-t pt-2 font-semibold sm:justify-end sm:gap-6">
					<span>Total paid</span>
					<span>{formatMoney(data.order.totalCents)}</span>
				</div>
			</div>
		</div>
	</Card.Root>

	<div class="mt-6 flex gap-3">
		<Button variant="outline" href={resolve('/orders')}>All orders</Button>
		<Button href={resolve('/products')}>Continue shopping</Button>
	</div>
</div>
