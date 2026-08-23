<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();

	const links = [
		{ href: () => resolve('/admin'), label: 'Dashboard', match: '/admin' },
		{ href: () => resolve('/admin/products'), label: 'Products', match: '/admin/products' },
		{ href: () => resolve('/admin/brands'), label: 'Brands', match: '/admin/brands' },
		{ href: () => resolve('/admin/categories'), label: 'Categories', match: '/admin/categories' }
	];
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Admin panel</h1>
			<p class="text-muted-foreground text-sm">Signed in as {data.adminUser.name}</p>
		</div>
		<nav class="flex flex-wrap gap-1" aria-label="Admin sections">
			{#each links as link (link.match)}
				<Button
					variant={page.url.pathname === link.match ? 'default' : 'ghost'}
					size="sm"
					href={link.href()}
				>
					{link.label}
				</Button>
			{/each}
		</nav>
	</div>

	{@render children()}
</div>
