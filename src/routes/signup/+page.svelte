<!--
  SIGNUP PAGE — same pattern as login:
  plain HTML form → named action `?/signup` → server returns errors via `form`.
  GitHub OAuth is offered here too: first login creates the account, so
  "sign-up with GitHub" and "sign-in with GitHub" are the same flow.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { ActionData, PageServerData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

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
				action="?/signup"
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

			{#if data.hasGithub}
				<!-- Divider with "or" on both sides -->
				<div class="flex items-center gap-3">
					<span class="bg-border h-px flex-1"></span>
					<span class="text-muted-foreground text-xs uppercase">or</span>
					<span class="bg-border h-px flex-1"></span>
				</div>
				<form method="POST" action="?/github">
					<Button variant="outline" type="submit" class="w-full">
						<!-- Inline SVG: lucide no longer ships brand logos like GitHub -->
						<svg viewBox="0 0 24 24" aria-hidden="true" class="mr-2 size-4 fill-current">
							<path
								d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.14c0 .3.21.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"
							/>
						</svg>
						Continue with GitHub
					</Button>
				</form>
			{/if}
		</Card.Content>
		<Card.Footer class="justify-center">
			<p class="text-muted-foreground text-sm">
				Already have an account?
				<a href={resolve('/login')} class="text-foreground font-medium hover:underline">Sign in</a>
			</p>
		</Card.Footer>
	</Card.Root>
</div>
