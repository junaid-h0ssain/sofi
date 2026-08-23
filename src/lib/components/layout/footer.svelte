<!-- Simple footer with a few links. new Date() gives the current year. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { Separator } from '$lib/components/ui/separator/index.js';
</script>

<footer class="border-t">
	<div class="text-muted-foreground mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-sm sm:flex-row sm:justify-between sm:px-6">
		<p>© {new Date().getFullYear()} sofi — electronics store demo</p>
		<nav class="flex items-center gap-4" aria-label="Footer">
			<a href={resolve('/products')} class="hover:text-foreground">Shop</a>
			<Separator orientation="vertical" class="h-4" />
			<a href={resolve('/orders')} class="hover:text-foreground">Orders</a>
			<Separator orientation="vertical" class="h-4" />
			<a href={resolve('/cart')} class="hover:text-foreground">Cart</a>
		</nav>
	</div>
</footer>
