/**
 * Format a price stored in whole cents for display.
 *
 *   formatMoney(199900) → "$1,999.00"
 *
 * We keep money as integers in the database (avoids floating-point rounding
 * errors) and only convert to a human string at the very edge — right here.
 */
export function formatMoney(cents: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(cents / 100);
}
