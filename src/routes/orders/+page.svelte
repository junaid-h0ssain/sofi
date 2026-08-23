<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
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
</script>

<svelte:head><title>My orders · sofi</title></svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
	<h1 class="mb-6 text-2xl font-semibold tracking-tight">My orders</h1>

	{#if data.orders.length === 0}
		<Card.Root class="p-12 text-center">
			<p class="font-medium">No orders yet</p>
			<p class="text-muted-foreground mt-1 text-sm">Your placed orders will show up here.</p>
			<Button class="mt-4" href={resolve('/products')}>Start shopping</Button>
		</Card.Root>
	{:else}
		<div class="space-y-3">
			{#each data.orders as o (o.id)}
				<a href={resolve('/orders/[id]', { id: o.id })} class="block">
					<Card.Root class="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 transition-colors hover:bg-accent/50">
						<div class="min-w-40 flex-1">
							<p class="font-medium">Order {o.id.slice(0, 8).toUpperCase()}</p>
							<p class="text-muted-foreground text-xs">
								{new Date(o.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })} · to {o.city}, {o.country}
							</p>
						</div>
						<Badge variant={statusVariant(o.status)}>{o.status}</Badge>
						<span class="font-semibold">{formatMoney(o.totalCents)}</span>
					</Card.Root>
				</a>
			{/each}
		</div>
	{/if}
</div>
