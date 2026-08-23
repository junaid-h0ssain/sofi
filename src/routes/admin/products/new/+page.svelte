<!--
  NEW PRODUCT — reuses the shared <ProductForm> component.
  Compare with ../[id]/+page.svelte: identical page except we pass no
  `product` prop (blank form) and a different action name.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ProductForm from '$lib/components/admin/product-form.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h2 class="mb-4 text-lg font-semibold">New product</h2>
<ProductForm
	brands={data.brands}
	categories={data.categories}
	action="?/create"
/>
<p class="mt-4">
	<a href={resolve('/admin/products')} class="text-muted-foreground text-sm hover:underline">← Back to products</a>
</p>
