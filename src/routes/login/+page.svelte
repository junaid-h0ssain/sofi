<!--
  LOGIN PAGE — client side.

  The form posts to the named action `?/signin` defined in +page.server.ts.
  `use:enhance` (from $app/forms) upgrades the plain form into a fetch-based
  submission: no full page reload, and we can react to the result (here:
  showing a loading state on the button).
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { PageServerData, ActionData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

	/**
	 * `form` is SvelteKit magic: after an action runs, whatever the action
	 * returned via fail()/return lands here as `form` — e.g. our error message
	 * and the email to re-fill. `$state` marks it as reactive for the template.
	 */
	let submitting = $state(false);
</script>

<svelte:head><title>Sign in · sofi</title></svelte:head>

<div class="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-16">
	<Card.Root>
		<Card.Header>
			<Card.Title>Welcome back</Card.Title>
			<Card.Description>Sign in to your account to continue</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			{#if form?.message}
				<!-- role="alert" makes screen readers announce the error -->
				<p class="text-destructive text-sm" role="alert">{form.message}</p>
			{/if}

			<!--
			  use:enhance callback: return a function that receives the response.
			  Calling update() applies SvelteKit's default behaviour (apply action
			  result + invalidate data). We just toggle the button before/after.
			-->
			<form
				method="POST"
				action="?/signin"
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
					<Label for="email">Email</Label>
					<Input id="email" name="email" type="email" required value={form?.email ?? ''} placeholder="you@example.com" />
				</div>
				<div class="flex flex-col gap-2">
					<Label for="password">Password</Label>
					<Input id="password" name="password" type="password" required minlength={8} />
				</div>
				<Button type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</Button>
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
				No account?
				<a href={resolve('/signup')} class="text-foreground font-medium hover:underline">Sign up</a>
			</p>
		</Card.Footer>
	</Card.Root>
</div>
