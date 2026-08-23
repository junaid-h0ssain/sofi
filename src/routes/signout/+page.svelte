<!-- Fallback content for anyone who visits /signout directly: an empty form
     they can submit to actually sign out. Normally nobody sees this. -->
<script>
	import { enhance } from '$app/forms';
</script>

<form method="POST" use:enhance class="hidden">
	<button>Sign out</button>
</form>
