<!--
  ADMIN BRANDS — inline "add" form at the top, one card per brand below.
  Brands still referenced by products show an "in use" badge instead of a
  delete button.
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

	let newBrandError: string | undefined = $state();
	let deleteError: string | undefined = $state();

	// Shared result handling for the create form.
	// `reset` clears the inputs only after the server accepted the row.
	function handleCreate(result: { type: string; data?: Record<string, unknown> }, reset: () => void) {
		if (result.type === 'failure') {
			newBrandError = String(result.data?.message ?? 'Failed');
		} else {
			newBrandError = undefined;
			reset();
			toast.success('Brand added');
		}
	}

	function handleDelete(result: { type: string; data?: Record<string, unknown> }) {
		if (result.type === 'failure') {
			deleteError = String(result.data?.message ?? 'Failed');
		} else {
			deleteError = undefined;
			toast.success('Brand deleted');
		}
	}
</script>

<h2 class="mb-4 text-lg font-semibold">Brands</h2>

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
			<label class="text-sm font-medium" for="brand-name">New brand name</label>
			<Input id="brand-name" name="name" required placeholder="e.g. Samsung" />
		</div>
		<Button type="submit">Add brand</Button>
	</form>
	{#if newBrandError}<p class="text-destructive mt-2 text-sm">{newBrandError}</p>{/if}
</Card.Root>

{#if deleteError}<p class="text-destructive mb-2 text-sm">{deleteError}</p>{/if}

<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
	{#each data.brands as b (b.id)}
		<Card.Root class="flex items-center justify-between p-4">
			<div>
				<p class="font-medium">{b.name}</p>
				<p class="text-muted-foreground text-xs">{b.productCount} products · /{b.slug}</p>
			</div>
			{#if b.productCount === 0}
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
					<input type="hidden" name="id" value={b.id} />
					<Button variant="ghost" size="icon" type="submit" aria-label="Delete {b.name}">
						<TrashIcon class="text-destructive size-4" />
					</Button>
				</form>
			{:else}
				<Badge variant="outline">in use</Badge>
			{/if}
		</Card.Root>
	{/each}
</div>
