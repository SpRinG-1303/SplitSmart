/**
 * Razorpay Checkout (client-only, test mode).
 *
 * SECURITY NOTE: Without a backend we cannot create signed orders or verify
 * payment signatures. The success callback fires from the client, so this is
 * suitable ONLY for demos / hackathons / internal tools using a TEST key.
 * For real money, add a backend that creates orders and verifies signatures.
 */

let scriptPromise: Promise<boolean> | null = null;

function loadCheckout(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => { scriptPromise = null; resolve(false); };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

export interface RazorpayPayOptions {
  keyId: string;
  /** Amount in major unit (e.g. INR rupees). */
  amount: number;
  currency?: string; // "INR"
  name: string; // payee/business name
  description: string;
  payerName?: string;
  payerEmail?: string;
  payerContact?: string;
  /** UPI VPA to prefill. */
  vpa?: string;
  notes?: Record<string, string>;
  onSuccess?: (paymentId: string) => void;
  onDismiss?: () => void;
  themeColor?: string;
}

export async function payWithRazorpay(opts: RazorpayPayOptions): Promise<void> {
  const ok = await loadCheckout();
  if (!ok) throw new Error("Couldn't load Razorpay Checkout. Check your connection.");
  const Razorpay = (window as any).Razorpay;
  const rzp = new Razorpay({
    key: opts.keyId,
    amount: Math.round(opts.amount * 100), // paise
    currency: opts.currency ?? "INR",
    name: opts.name,
    description: opts.description,
    prefill: {
      name: opts.payerName,
      email: opts.payerEmail,
      contact: opts.payerContact,
      vpa: opts.vpa,
    },
    notes: opts.notes,
    theme: { color: opts.themeColor ?? "#6C63FF" },
    handler: (resp: { razorpay_payment_id: string }) => {
      opts.onSuccess?.(resp.razorpay_payment_id);
    },
    modal: {
      ondismiss: () => opts.onDismiss?.(),
    },
  });
  rzp.open();
}

/** Build a UPI deep link. Works on mobile + most desktop UPI clients. */
export function buildUpiLink(p: {
  vpa: string;
  payeeName: string;
  amount: number;
  note?: string;
  currency?: string;
}): string {
  const params = new URLSearchParams();
  params.set("pa", p.vpa);
  params.set("pn", p.payeeName);
  params.set("am", p.amount.toFixed(2));
  params.set("cu", p.currency ?? "INR");
  if (p.note) params.set("tn", p.note);
  return `upi://pay?${params.toString()}`;
}

/** Amount-aware Razorpay Payment Link. Razorpay supports ?amount=... in paise. */
export function appendAmountToPaymentLink(link: string, amountInRupees: number): string {
  if (!link) return link;
  try {
    const u = new URL(link);
    u.searchParams.set("amount", String(Math.round(amountInRupees * 100)));
    return u.toString();
  } catch {
    return link;
  }
}
