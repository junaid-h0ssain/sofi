<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import PackageIcon from '@lucide/svelte/icons/package';
	import ReceiptIcon from '@lucide/svelte/icons/receipt';
	import DollarSignIcon from '@lucide/svelte/icons/dollar-sign';
	import { formatMoney } from '$lib/utils/money';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const stats = $derived([
		{ label: 'Products', value: String(data.productCount), icon: PackageIcon },
		{ label: 'Paid orders', value: String(data.orderCount), icon: ReceiptIcon },
		{ label: 'Revenue', value: formatMoney(data.revenueCents), icon: DollarSignIcon }
	]);
</script>

<div class="grid gap-4 sm:grid-cols-3">
	{#each stats as stat (stat.label)}
		<Card.Root class="p-6">
			<stat.icon class="text-muted-foreground mb-2 size-5" />
			<p class="text-muted-foreground text-sm">{stat.label}</p>
			<p class="text-3xl font-semibold tracking-tight">{stat.value}</p>
		</Card.Root>
	{/each}
</div>
