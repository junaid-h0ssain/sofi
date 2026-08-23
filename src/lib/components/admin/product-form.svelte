<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	interface Option {
		id: string;
		name: string;
		slug: string;
	}

	interface Props {
		brands: Option[];
		categories: Option[];
		action: string;
		product?: {
			name: string;
			description: string;
			priceCents: number;
			stock: number;
			brandId: string;
			categoryId: string;
			imageUrl: string | null;
			featured: number;
			specs: Record<string, string>;
		};
		error?: string;
		submitLabel?: string;
	}

	let {
		brands,
		categories,
		action,
		product = undefined,
		error = undefined,
		submitLabel = 'Save product'
	}: Props = $props();

	// Intentional initial-only values: the form remounts per route, product never changes after load.
	// svelte-ignore state_referenced_locally
	let brandId = $state(product?.brandId ?? '');
	// svelte-ignore state_referenced_locally
	let categoryId = $state(product?.categoryId ?? '');
	// svelte-ignore state_referenced_locally
	let featuredChecked = $state(product?.featured === 1);

	// svelte-ignore state_referenced_locally
	const specsText = product ? Object.entries(product.specs).map(([k, v]) => `${k}: ${v}`).join('\n') : '';
</script>

<Card.Root class="max-w-2xl p-6">
	{#if error}
		<p class="text-destructive mb-4 text-sm" role="alert">{error}</p>
	{/if}

	<form method="POST" {action} class="space-y-5">
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="flex flex-col gap-2 sm:col-span-2">
				<Label for="name">Name</Label>
				<Input id="name" name="name" required value={product?.name ?? ''} />
			</div>

			<div class="flex flex-col gap-2">
				<Label for="brandId">Brand</Label>
				<Select.Root type="single" name="brandId" bind:value={brandId} required>
					<Select.Trigger class="w-full">{brands.find((b) => b.id === brandId)?.name ?? 'Select brand'}</Select.Trigger>
					<Select.Content>
						{#each brands as brand (brand.id)}
							<Select.Item value={brand.id}>{brand.name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="flex flex-col gap-2">
				<Label for="categoryId">Category</Label>
				<Select.Root type="single" name="categoryId" bind:value={categoryId} required>
					<Select.Trigger class="w-full">{categories.find((c) => c.id === categoryId)?.name ?? 'Select category'}</Select.Trigger>
					<Select.Content>
						{#each categories as category (category.id)}
							<Select.Item value={category.id}>{category.name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="flex flex-col gap-2">
				<Label for="price">Price ($)</Label>
				<Input id="price" name="price" type="number" min="0" step="0.01" required value={product ? (product.priceCents / 100).toFixed(2) : ''} />
			</div>

			<div class="flex flex-col gap-2">
				<Label for="stock">Stock</Label>
				<Input id="stock" name="stock" type="number" min="0" step="1" required value={product?.stock ?? 10} />
			</div>

			<div class="flex flex-col gap-2 sm:col-span-2">
				<Label for="imageUrl">Image URL</Label>
				<Input id="imageUrl" name="imageUrl" placeholder="/products/laptop.svg" value={product?.imageUrl ?? ''} />
			</div>

			<div class="flex flex-col gap-2 sm:col-span-2">
				<Label for="description">Description</Label>
				<Textarea id="description" name="description" rows={3} value={product?.description ?? ''} />
			</div>

			<div class="flex flex-col gap-2 sm:col-span-2">
				<Label for="specs">Specs (one per line, "Key: Value")</Label>
				<Textarea id="specs" name="specs" rows={5} placeholder={'Screen: 14-inch\nRAM: 16 GB'} value={specsText} />
			</div>

			<label class="flex items-center gap-2 text-sm sm:col-span-2" for="featured">
				<Checkbox
					id="featured"
					name="featured"
					value="1"
					bind:checked={featuredChecked}
				/>
				Featured on homepage
			</label>
		</div>

		<Button type="submit">{submitLabel}</Button>
	</form>
</Card.Root>
