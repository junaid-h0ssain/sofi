<!--
  ADMIN CATEGORIES — mirrors the brands page. Note the <img> preview:
  /products/{c.slug}.svg proves why slugs must match static file names.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let newCategoryError: string | undefined = $state();
	let deleteError: string | undefined = $state();

	function handleCreate(result: { type: string; data?: Record<string, unknown> }, reset: () => void) {
		if (result.type === 'failure') {
			newCategoryError = String(result.data?.message ?? 'Failed');
		} else {
			newCategoryError = undefined;
			reset();
			toast.success('Category added');
		}
	}

	function handleDelete(result: { type: string; data?: Record<string, unknown> }) {
		if (result.type === 'failure') {
			deleteError = String(result.data?.message ?? 'Failed');
		} else {
			deleteError = undefined;
			toast.success('Category deleted');
		}
	}
</script>

<h2 class="mb-4 text-lg font-semibold">Categories</h2>
<p class="text-muted-foreground mb-6 text-sm">
	Category slugs map to placeholder images at <code>/static/products/&lt;slug&gt;.svg</code>.
</p>

<Card.Root class="mb-6 p-5">
	<form
		method="POST"
		action="?/create"
		class="flex items-end gap-3"
		use:enhance={({ formElement }) => {
			return async ({ result, update }) => {
				handleCreate(result, () => formElement.reset());
				await update();
			};
		}}
	>
		<div class="flex flex-col gap-2">
			<label class="text-sm font-medium" for="category-name">New category name</label>
			<Input id="category-name" name="name" required placeholder="e.g. Monitor" />
		</div>
		<Button type="submit">Add category</Button>
	</form>
	{#if newCategoryError}<p class="text-destructive mt-2 text-sm">{newCategoryError}</p>{/if}
</Card.Root>

{#if deleteError}<p class="text-destructive mb-2 text-sm">{deleteError}</p>{/if}

<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
	{#each data.categories as c (c.id)}
		<Card.Root class="flex items-center justify-between p-4">
			<div class="flex items-center gap-3">
				<img src="/products/{c.slug}.svg" alt="" class="size-10 rounded object-cover" loading="lazy" />
				<div>
					<p class="font-medium">{c.name}</p>
					<p class="text-muted-foreground text-xs">{c.productCount} products · /{c.slug}</p>
				</div>
			</div>
			{#if c.productCount === 0}
				<form
					method="POST"
					action="?/delete"
					use:enhance={() => {
						return async ({ result, update }) => {
							handleDelete(result);
							await update();
						};
					}}
				>
					<input type="hidden" name="id" value={c.id} />
					<Button variant="ghost" size="icon" type="submit" aria-label="Delete {c.name}">
						<TrashIcon class="text-destructive size-4" />
					</Button>
				</form>
			{:else}
				<Badge variant="outline">in use</Badge>
			{/if}
		</Card.Root>
	{/each}
</div>
