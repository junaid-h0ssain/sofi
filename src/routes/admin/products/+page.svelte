<!--
  ADMIN PRODUCTS LIST — data table with edit links and a delete button
  per row. The delete uses window.confirm() BEFORE the request is even sent:
  `enhance` gives us a cancel() to stop the submission when the admin says no.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table/index.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { formatMoney } from '$lib/utils/money';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// $effect runs after DOM updates — perfect for reacting to action results.
	$effect(() => {
		if (form?.deleted) toast.success('Product deleted');
		else if (form?.message) toast.error(form.message);
	});
</script>

<div class="mb-4 flex items-center justify-between">
	<h2 class="text-lg font-semibold">Products ({data.products.length})</h2>
	<Button size="sm" href={resolve('/admin/products/new')}>
		<PlusIcon class="mr-1 size-4" /> New product
	</Button>
</div>

{#if data.products.length === 0}
	<p class="text-muted-foreground py-12 text-center">No products yet. Create your first one.</p>
{:else}
	<div class="rounded-lg border">
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Brand</TableHead>
					<TableHead>Category</TableHead>
					<TableHead class="text-right">Price</TableHead>
					<TableHead class="text-right">Stock</TableHead>
					<TableHead></TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each data.products as p (p.id)}
					<TableRow>
						<TableCell class="font-medium">
							{p.name}
							{#if p.featured}
								<Badge variant="secondary" class="ml-1">Featured</Badge>
							{/if}
						</TableCell>
						<TableCell>{p.brandName}</TableCell>
						<TableCell>{p.categoryName}</TableCell>
						<TableCell class="text-right">{formatMoney(p.priceCents)}</TableCell>
						<TableCell class="text-right">{p.stock}</TableCell>
						<TableCell class="flex justify-end gap-1">
							<Button variant="ghost" size="icon" href={resolve('/admin/products/[id]', { id: p.id })} aria-label="Edit {p.name}">
								<PencilIcon class="size-4" />
							</Button>
							<form
								method="POST"
								action="?/delete"
								use:enhance={({ cancel }) => {
									// Ask before destroying data; cancel() aborts the submit.
									if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) cancel();
									return async ({ update }) => update();
								}}
							>
								<input type="hidden" name="id" value={p.id} />
								<Button variant="ghost" size="icon" type="submit" aria-label="Delete {p.name}">
									<TrashIcon class="text-destructive size-4" />
								</Button>
							</form>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</div>
{/if}
