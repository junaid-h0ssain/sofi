<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { ActionData } from './$types';

	let form: ActionData = $props();

	let submitting = $state(false);
</script>

<svelte:head><title>Create account · sofi</title></svelte:head>

<div class="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-16">
	<Card.Root>
		<Card.Header>
			<Card.Title>Create your account</Card.Title>
			<Card.Description>Shop electronics, track orders and more</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			{#if form?.message}
				<p class="text-destructive text-sm" role="alert">{form.message}</p>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						submitting = false;
						await update();
					};
				}}
				class="flex flex-col gap-4"
			>
				<div class="flex flex-col gap-2">
					<Label for="name">Name</Label>
					<Input id="name" name="name" required value={form?.name ?? ''} placeholder="Jane Doe" />
				</div>
				<div class="flex flex-col gap-2">
					<Label for="email">Email</Label>
					<Input id="email" name="email" type="email" required value={form?.email ?? ''} placeholder="you@example.com" />
				</div>
				<div class="flex flex-col gap-2">
					<Label for="password">Password</Label>
					<Input id="password" name="password" type="password" required minlength={8} />
					<p class="text-muted-foreground text-xs">At least 8 characters</p>
				</div>
				<Button type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Sign up'}</Button>
			</form>
		</Card.Content>
		<Card.Footer class="justify-center">
			<p class="text-muted-foreground text-sm">
				Already have an account?
				<a href={resolve('/login')} class="text-foreground font-medium hover:underline">Sign in</a>
			</p>
		</Card.Footer>
	</Card.Root>
</div>
