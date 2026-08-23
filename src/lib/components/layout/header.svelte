<!--
  ============================================================================
  HEADER — logo, category nav, search, cart badge, user menu
  ============================================================================
  Receives everything from the ROOT LAYOUT (+layout.server.ts), so every page
  shows fresh data without repeating queries.

  Svelte 5 concepts used here:
    - $props() with TypeScript interface for component inputs
    - $state() for values that change and must re-render (mobileOpen)
    - $derived() for computed values that update automatically (initials)
-->
<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Link } from '$lib/utils/links';
	import type { CategoryWithCount } from '$lib/types';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import PackageIcon from '@lucide/svelte/icons/package';
	import ShieldIcon from '@lucide/svelte/icons/shield';

	interface Props {
		user?: App.Locals['user']; // undefined when logged out
		cartCount?: number;
		categories?: CategoryWithCount[];
	}

	let { user = undefined, cartCount = 0, categories = [] }: Props = $props();

	// Whether the mobile slide-out menu is open; `bind:open` two-way binds it.
	let mobileOpen = $state(false);

	/**
	 * Sign out WITHOUT a full page reload:
	 *  1. POST to /signout (its action clears the session cookie server-side)
	 *  2. invalidateAll() re-runs all load functions → layout data updates,
	 *     so the header immediately shows "Sign in" again
	 *  3. goto('/') navigates home
	 */
	async function signOut() {
		await fetch(resolve('/signout'), { method: 'POST' });
		await invalidateAll();
		await goto('/');
	}

	// First letters of the name → avatar initials ("Ada Lovelace" → "AL").
	const initials = $derived(
		user?.name
			? user.name
					.split(' ')
					.map((part) => part[0])
					.slice(0, 2)
					.join('')
					.toUpperCase()
			: ''
	);
</script>

<header class="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
	<div class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
		<!-- ===== Mobile: hamburger opens a Sheet (slide-out drawer) ========== -->
		<Sheet.Root bind:open={mobileOpen}>
			<Sheet.Trigger class="md:hidden">
				<Button variant="ghost" size="icon" aria-label="Open menu">
					<MenuIcon class="size-5" />
				</Button>
			</Sheet.Trigger>
			<Sheet.Content side="left" class="w-72">
				<Sheet.Header>
					<Sheet.Title><a href={resolve('/')} onclick={() => (mobileOpen = false)}>sofi</a></Sheet.Title>
				</Sheet.Header>
				<nav class="flex flex-col gap-1 px-2" aria-label="Categories">
					<a href={resolve('/products')} onclick={() => (mobileOpen = false)} class="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
						All products
					</a>
					{#each categories as cat (cat.id)}
						<!-- onclick closes the drawer after choosing a link -->
						<a href={`${resolve('/products')}?category=${cat.slug}`} onclick={() => (mobileOpen = false)} class="rounded-md px-3 py-2 text-sm hover:bg-accent">
							{cat.name}
							<span class="text-muted-foreground ml-1 text-xs">({cat.productCount})</span>
						</a>
					{/each}
				</nav>
				<form action={resolve('/products')} method="get" class="px-4">
					<Input type="search" name="q" placeholder="Search products…" />
				</form>
			</Sheet.Content>
		</Sheet.Root>

		<!-- Logo -->
		<a href={resolve('/')} class="flex items-center gap-1.5 text-xl font-bold tracking-tight">
			<span class="from-primary to-primary/60 rounded-lg bg-gradient-to-br px-2 py-0.5 text-primary-foreground">sofi</span>
		</a>

		<!-- Desktop category nav (hidden on small screens) -->
		<nav class="hidden items-center gap-1 md:flex" aria-label="Main navigation">
			<Button variant="ghost" size="sm" href={Link.products()}>All products</Button>
			{#each categories.slice(0, 5) as cat (cat.id)}
				<Button variant="ghost" size="sm" href={Link.category(cat.slug)}>{cat.name}</Button>
			{/each}
		</nav>

		<!-- Search submits a GET form → lands on /products?q=… (no JS needed) -->
		<form action={resolve('/products')} method="get" role="search" class="ml-auto hidden w-full max-w-xs lg:block">
			<div class="relative">
				<SearchIcon class="text-muted-foreground absolute top-2.5 left-3 size-4" />
				<Input type="search" name="q" placeholder="Search products…" class="pl-9" />
			</div>
		</form>

		<div class="ml-auto flex items-center gap-1 lg:ml-2">
			<!-- Cart icon with live item-count badge -->
			<Button variant="ghost" size="icon" href={Link.cart()} aria-label="Cart" class="relative">
				<ShoppingCartIcon class="size-5" />
				{#if cartCount > 0}
					<Badge class="absolute -top-1 -right-1 size-5 justify-center rounded-full p-0 text-[10px]">
						{cartCount > 99 ? '99+' : cartCount}
					</Badge>
				{/if}
			</Button>

			{#if user}
				<!-- Signed in: dropdown with account links -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button variant="ghost" class="gap-2 px-2">
							<span class="text-primary bg-primary/10 flex size-7 items-center justify-center rounded-full text-xs font-semibold">
								{initials || 'U'}
							</span>
							<span class="hidden max-w-24 truncate sm:inline">{user.name}</span>
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end" class="w-48">
						<DropdownMenu.Label class="truncate">{user.email}</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Group>
							<DropdownMenu.Item onclick={() => goto(Link.orders())}>
								<PackageIcon class="mr-2 size-4" /> My orders
							</DropdownMenu.Item>
							<!-- Only admins see this entry (role comes from better-auth's admin plugin) -->
							{#if user.role === 'admin'}
								<DropdownMenu.Item onclick={() => goto(Link.admin.root())}>
									<ShieldIcon class="mr-2 size-4" /> Admin panel
								</DropdownMenu.Item>
							{/if}
						</DropdownMenu.Group>
						<DropdownMenu.Separator />
						<DropdownMenu.Item variant="destructive" onclick={signOut}>
							<LogOutIcon class="mr-2 size-4" /> Sign out
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{:else}
				<Button variant="outline" size="sm" href={Link.login()}>Sign in</Button>
				<Button size="sm" href={Link.signup()} class="hidden sm:inline-flex">Sign up</Button>
			{/if}
		</div>
	</div>
</header>
