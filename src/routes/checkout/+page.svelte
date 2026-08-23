<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { formatMoney } from '$lib/utils/money';
	import { calcShippingCents } from '$lib/utils/pricing';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);

	const shippingCents = $derived(calcShippingCents(data.subtotalCents));
</script>

<svelte:head><title>Checkout · sofi</title></svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
	<h1 class="mb-6 text-2xl font-semibold tracking-tight">Checkout</h1>

	<div class="grid gap-8 lg:grid-cols-[1fr_380px]">
		<Card.Root class="p-6">
			<form
				method="POST"
				use:enhance={() => {
					submitting = true;
					return async ({ result, update }) => {
						submitting = false;
						if (result.type === 'failure' && result.data?.message) {
							console.error(result.data.message);
						}
						await update();
					};
				}}
				class="space-y-5"
			>
				<h2 class="font-semibold">Shipping address</h2>
				{#if form?.message}
					<p class="text-destructive text-sm" role="alert">{form.message}</p>
				{/if}

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-2">
						<Label for="fullName">Full name</Label>
						<Input id="fullName" name="fullName" required value={data.defaultName} />
					</div>
					<div class="flex flex-col gap-2">
						<Label for="country">Country</Label>
						<Input id="country" name="country" required placeholder="United States" />
					</div>
					<div class="flex flex-col gap-2 sm:col-span-2">
						<Label for="street">Street address</Label>
						<Input id="street" name="street" required placeholder="123 Main St" />
					</div>
					<div class="flex flex-col gap-2">
						<Label for="city">City</Label>
						<Input id="city" name="city" required />
					</div>
					<div class="flex flex-col gap-2">
						<Label for="postalCode">Postal code</Label>
						<Input id="postalCode" name="postalCode" required />
					</div>
				</div>

				<Separator />

				<div class="rounded-lg border border-dashed p-4">
					<div class="flex items-center justify-between">
						<p class="text-sm font-medium">Payment</p>
						<Badge variant="secondary">Demo mode — no real charge</Badge>
					</div>
					<p class="text-muted-foreground mt-1 text-xs">
						This is a mock checkout. Placing the order simulates a successful payment.
					</p>
				</div>

				<Button type="submit" size="lg" class="w-full" disabled={submitting}>
					{submitting ? 'Placing order…' : `Place order · ${formatMoney(data.subtotalCents + shippingCents)}`}
				</Button>
			</form>
		</Card.Root>

		<Card.Root class="h-fit p-6 lg:sticky lg:top-20">
			<h2 class="font-semibold">Your order</h2>
			<Separator class="my-4" />
			<ul class="space-y-3">
				{#each data.items as item (item.id)}
					<li class="flex items-center gap-3 text-sm">
						<img
							src={item.product.imageUrl ?? '/products/laptop.svg'}
							alt=""
							class="size-10 rounded object-cover"
						/>
						<span class="min-w-0 flex-1 truncate">{item.product.name}</span>
						<span class="text-muted-foreground">×{item.quantity}</span>
						<span>{formatMoney(item.product.priceCents * item.quantity)}</span>
					</li>
				{/each}
			</ul>
			<Separator class="my-4" />
			<dl class="space-y-2 text-sm">
				<div class="flex justify-between">
					<dt class="text-muted-foreground">Subtotal</dt>
					<dd>{formatMoney(data.subtotalCents)}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-muted-foreground">Shipping</dt>
					<dd>{shippingCents === 0 ? 'Free' : formatMoney(shippingCents)}</dd>
				</div>
			</dl>
			<Separator class="my-4" />
			<div class="flex justify-between font-semibold">
				<span>Total</span>
				<span>{formatMoney(data.subtotalCents + shippingCents)}</span>
			</div>
		</Card.Root>
	</div>
</div>
