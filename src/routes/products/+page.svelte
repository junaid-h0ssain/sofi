<script lang="ts">
	import { resolve } from '$app/paths';
	import ProductCard from '$lib/components/product/product-card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import { SORT_OPTIONS } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let mobileFiltersOpen = $state(false);
	let sortForm: HTMLFormElement | undefined = $state();

	const sortValue = $derived(data.filters.sort ?? 'newest');
	const hasActiveFilters = $derived(
		Boolean(
			data.filters.q ||
				data.filters.categories.length > 0 ||
				data.filters.brands.length > 0 ||
				data.filters.min ||
				data.filters.max
		)
	);

	function buildPageUrl(page: number): string {
		const params = new URLSearchParams();
		if (data.filters.q) params.set('q', data.filters.q);
		for (const brand of data.filters.brands) params.append('brand', brand);
		for (const cat of data.filters.categories) params.append('category', cat);
		if (data.filters.sort && data.filters.sort !== 'newest') params.set('sort', data.filters.sort);
		if (data.filters.min) params.set('min', data.filters.min);
		if (data.filters.max) params.set('max', data.filters.max);
		if (page > 1) params.set('page', String(page));
		const query = params.toString();
		return query ? `${resolve('/products')}?${query}` : resolve('/products');
	}

	function pageNumbers(current: number, total: number): (number | 'ellipsis')[] {
		if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
		const pages: (number | 'ellipsis')[] = [1];
		if (current > 3) pages.push('ellipsis');
		for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
		if (current < total - 2) pages.push('ellipsis');
		pages.push(total);
		return pages;
	}

	// `change` bubbles from the checkboxes, so one handler per group is enough.
	function autoSubmit(event: Event) {
		const currentTarget = event.currentTarget as HTMLFieldSetElement | null;
		currentTarget?.closest('form')?.requestSubmit();
	}
</script>

<svelte:head><title>Products · sofi</title></svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">
				{data.filters.q ? `Results for "${data.filters.q}"` : 'All products'}
			</h1>
			<p class="text-muted-foreground text-sm">{data.result.total} products found</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" class="lg:hidden" onclick={() => (mobileFiltersOpen = !mobileFiltersOpen)}>
				<SlidersHorizontalIcon class="mr-1 size-4" /> Filters
			</Button>
			<form method="get" action={resolve('/products')} class="contents" bind:this={sortForm}>
				{#each data.filters.brands as b (b)}
					<input type="hidden" name="brand" value={b} />
				{/each}
				{#each data.filters.categories as c (c)}
					<input type="hidden" name="category" value={c} />
				{/each}
				{#if data.filters.q}<input type="hidden" name="q" value={data.filters.q} />{/if}
				{#if data.filters.min}<input type="hidden" name="min" value={data.filters.min} />{/if}
				{#if data.filters.max}<input type="hidden" name="max" value={data.filters.max} />{/if}
				<Select.Root
					type="single"
					name="sort"
					value={sortValue}
					onValueChange={(v) => {
						if (v && sortForm) sortForm.requestSubmit();
					}}
				>
					<Select.Trigger class="w-[180px]" aria-label="Sort products">Sort</Select.Trigger>
					<Select.Content>
						{#each SORT_OPTIONS as option (option.value)}
							<Select.Item value={option.value}>{option.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</form>
		</div>
	</div>

	<div class="flex gap-8">
		<!-- Filters sidebar -->
		<aside class="{mobileFiltersOpen ? 'block' : 'hidden'} lg:block w-full shrink-0 space-y-6 lg:w-60">
			<Card.Root class="p-5 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
				<form method="get" action={resolve('/products')} class="space-y-6">
					<input type="hidden" name="sort" value={sortValue} />

					<div class="space-y-2">
						<Label for="filter-q">Search</Label>
						<Input id="filter-q" type="search" name="q" value={data.filters.q ?? ''} placeholder="Search…" />
					</div>

					<Separator />

					<fieldset class="space-y-2" onchange={autoSubmit}>
						<legend class="text-sm font-medium">Category</legend>
						{#each data.categories as cat (cat.id)}
							<label class="flex cursor-pointer items-center gap-2 text-sm" for="cat-{cat.slug}">
								<Checkbox
									id="cat-{cat.slug}"
									name="category"
									value={cat.slug}
									checked={data.filters.categories.includes(cat.slug)}
								/>
								<span>{cat.name}</span>
								<span class="text-muted-foreground ml-auto text-xs">{cat.productCount}</span>
							</label>
						{/each}
					</fieldset>

					<Separator />

					<fieldset class="max-h-64 space-y-2 overflow-y-auto pr-1" onchange={autoSubmit}>
						<legend class="text-sm font-medium">Brand</legend>
						{#each data.allBrands as brand (brand.id)}
							<label class="flex cursor-pointer items-center gap-2 text-sm" for="brand-{brand.slug}">
								<Checkbox
									id="brand-{brand.slug}"
									name="brand"
									value={brand.slug}
									checked={data.filters.brands.includes(brand.slug)}
								/>
								<span>{brand.name}</span>
							</label>
						{/each}
					</fieldset>

					<Separator />

					<fieldset class="space-y-2">
						<legend class="text-sm font-medium">Price ($)</legend>
						<div class="flex items-center gap-2">
							<Input type="number" name="min" min="0" step="1" placeholder="Min" value={data.filters.min ?? ''} />
							<span class="text-muted-foreground">–</span>
							<Input type="number" name="max" min="0" step="1" placeholder="Max" value={data.filters.max ?? ''} />
						</div>
					</fieldset>

					<div class="flex gap-2">
						<Button type="submit" class="flex-1">Apply</Button>
						{#if hasActiveFilters}
							<Button type="button" variant="outline" href={resolve('/products')}>Reset</Button>
						{/if}
					</div>
				</form>
			</Card.Root>
		</aside>

		<!-- Results -->
		<div class="min-w-0 flex-1">
			{#if data.result.products.length === 0}
				<Card.Root class="p-12 text-center">
					<p class="font-medium">No products found</p>
					<p class="text-muted-foreground mt-1 text-sm">Try adjusting your filters or search terms.</p>
					<Button variant="outline" size="sm" class="mt-4" href={resolve('/products')}>Clear all filters</Button>
				</Card.Root>
			{:else}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{#each data.result.products as product (product.id)}
						<ProductCard {product} />
					{/each}
				</div>

				{#if data.result.pages > 1}
					<nav class="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
						<Button variant="outline" size="icon" disabled={data.result.page <= 1} href={buildPageUrl(data.result.page - 1)} aria-label="Previous page">
							‹
						</Button>
						{#each pageNumbers(data.result.page, data.result.pages) as p (String(p))}
							{#if p === 'ellipsis'}
								<span class="text-muted-foreground px-2">…</span>
							{:else if p === data.result.page}
								<Button variant="default" size="icon" aria-current="page">{p}</Button>
							{:else}
								<Button variant="outline" size="icon" href={buildPageUrl(p)}>{p}</Button>
							{/if}
						{/each}
						<Button variant="outline" size="icon" disabled={data.result.page >= data.result.pages} href={buildPageUrl(data.result.page + 1)} aria-label="Next page">
							›
						</Button>
					</nav>
				{/if}
			{/if}
		</div>
	</div>
</div>
