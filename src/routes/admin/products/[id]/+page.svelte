<!--
  EDIT PRODUCT — passes the loaded product into the shared form so every
  field starts pre-filled.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ProductForm from '$lib/components/admin/product-form.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h2 class="mb-4 text-lg font-semibold">Edit product</h2>
<ProductForm
	brands={data.brands}
	categories={data.categories}
	action="?/update"
	product={data.product}
	submitLabel="Save changes"
/>
<p class="mt-4">
	<a href={resolve('/admin/products')} class="text-muted-foreground text-sm hover:underline">← Back to products</a>
</p>
