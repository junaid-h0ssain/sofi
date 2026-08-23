export const FREE_SHIPPING_THRESHOLD_CENTS = 5000; // $50
export const SHIPPING_FLAT_CENTS = 499; // $4.99

export function calcShippingCents(subtotalCents: number): number {
	if (subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;
	return SHIPPING_FLAT_CENTS;
}
