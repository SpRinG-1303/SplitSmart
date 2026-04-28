export interface PaymentSettings {
  /** Razorpay public Key ID (rzp_test_... or rzp_live_...) */
  razorpayKeyId: string;
  /** Receiver UPI ID, e.g. yourname@okhdfc */
  upiId: string;
  /** Display name on UPI / Razorpay receipt */
  payeeName: string;
  /** Default Razorpay Payment Link (e.g. https://rzp.io/l/abc) */
  paymentLink: string;
}

const KEY = "splitsmart_payment_settings_v1";

const DEFAULTS: PaymentSettings = {
  razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID ?? "",
  upiId: "",
  payeeName: "",
  paymentLink: "",
};

export function getPaymentSettings(): PaymentSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const saved = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...saved,
      // always fall back to env key if localStorage has nothing
      razorpayKeyId: saved.razorpayKeyId || DEFAULTS.razorpayKeyId,
    };
  } catch {
    return DEFAULTS;
  }
}

export function savePaymentSettings(s: PaymentSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("splitsmart:settings:change"));
}
