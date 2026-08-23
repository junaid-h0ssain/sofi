/**
 * Shipping rules — kept in ONE place so cart page, checkout page and the
 * checkout action all agree on the numbers.
 *
 * Orders of $50 or more ship free; otherwise a flat $4.99 fee applies.
 */
export const FREE_SHIPPING_THRESHOLD_CENTS = 5000; // $50
export const SHIPPING_FLAT_CENTS = 499; // $4.99

/** Returns the shipping cost in cents for a given subtotal in cents. */
export function calcShippingCents(subtotalCents: number): number {
	if (subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;
	return SHIPPING_FLAT_CENTS;
}
