/**
 * Local "smart" expense intelligence — runs entirely in the browser.
 * No external services. Used to replace what an LLM would do for:
 *  - categorization
 *  - natural language expense entry parsing
 *  - spending insights
 */

import type { Category, Member, SplitType } from "./types";

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  Food: [
    "pizza", "dinner", "lunch", "breakfast", "brunch", "snack", "coffee", "chai", "tea",
    "restaurant", "cafe", "café", "swiggy", "zomato", "uber eats", "ubereats", "doordash",
    "burger", "pasta", "noodle", "sushi", "biryani", "curry", "thali", "dosa", "samosa",
    "smoke house", "starbucks", "mcdonald", "kfc", "domino", "subway", "bakery",
    "groceries", "grocery", "supermarket", "veg", "wine", "beer", "drinks", "bar", "pub",
    "shack", "buffet", "feast", "meal", "food", "kitchen", "eat", "ate",
  ],
  Travel: [
    "uber", "ola", "lyft", "taxi", "cab", "auto", "rickshaw", "bus", "train", "metro",
    "flight", "airline", "airport", "indigo", "vistara", "air india", "fuel", "petrol",
    "gas", "diesel", "toll", "parking", "rental", "zoomcar", "rail", "irctc", "ride",
    "booking.com", "trip", "travel", "transport",
  ],
  Stay: [
    "hotel", "airbnb", "hostel", "resort", "stay", "checkout", "check-in", "checkin",
    "lodge", "villa", "guest house", "guesthouse", "rent", "accommodation", "oyo", "treebo",
  ],
  Utilities: [
    "electric", "electricity", "water bill", "gas bill", "internet", "wifi", "mobile",
    "recharge", "phone", "broadband", "subscription", "rent", "maintenance", "bill",
  ],
  Entertainment: [
    "movie", "cinema", "pvr", "inox", "ticket", "concert", "show", "netflix", "spotify",
    "prime", "hotstar", "disney", "game", "gaming", "playstation", "xbox", "club", "party",
    "event", "festival", "amusement", "theme park", "bowling", "karaoke",
  ],
  Shopping: [
    "amazon", "flipkart", "myntra", "ajio", "shop", "shopping", "store", "mall", "clothes",
    "shirt", "shoes", "dress", "jeans", "bag", "watch", "gift", "present", "ikea", "decor",
    "electronics", "gadget", "phone purchase", "laptop", "headphone",
  ],
  Health: [
    "medicine", "pharmacy", "apollo", "1mg", "doctor", "hospital", "clinic", "dental",
    "dentist", "gym", "yoga", "fitness", "consultation", "health", "wellness", "spa",
    "massage", "salon",
  ],
  Other: [],
};

/** Categorize an expense title using keyword matching. ~10ms, no network. */
export function categorize(title: string): Category {
  const t = title.toLowerCase().trim();
  if (!t) return "Other";
  let bestCat: Category = "Other";
  let bestScore = 0;
  for (const cat of Object.keys(CATEGORY_KEYWORDS) as Category[]) {
    for (const kw of CATEGORY_KEYWORDS[cat]) {
      if (t.includes(kw)) {
        // longer keyword = stronger match
        const score = kw.length;
        if (score > bestScore) {
          bestScore = score;
          bestCat = cat;
        }
      }
    }
  }
  return bestCat;
}

interface ParsedExpense {
  title: string;
  amount: number;
  category: Category;
  paidBy: string;
  splitWith: string[];
  splitType: SplitType;
}

/**
 * Parse a natural-language expense like:
 *  "Dinner at Smoke House ₹1200 split between me, Aman, Priya"
 *  "Uber to airport $40 paid by Aman"
 *  "Pizza for 4 people 800 paid by me"
 */
export function parseNaturalLanguage(text: string, members: Member[], meId: string): ParsedExpense | null {
  const original = text.trim();
  if (!original) return null;

  // 1. Extract amount: look for currency-prefixed or standalone number.
  // Matches: ₹1200, $40.50, €1.000,50, 1,200, 800
  const amountRegex = /(?:[₹$€£¥])\s*([\d,]+(?:[.,]\d+)?)|(?<![\w.])(\d{2,}(?:[,.]\d+)?)(?!\s*(?:people|persons?|ppl|members?|guys?|friends?|ways?))/gi;
  let amount = 0;
  let amountMatch: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = amountRegex.exec(original)) !== null) {
    const raw = (m[1] || m[2] || "").replace(/,/g, "");
    const val = parseFloat(raw);
    if (!isNaN(val) && val > amount) {
      amount = val;
      amountMatch = m;
    }
  }
  if (amount === 0) return null;

  // 2. Find member name mentions (case-insensitive, word boundary).
  const meTokens = ["me", "myself", "i"];
  const lower = original.toLowerCase();
  const mentioned = new Set<string>();

  for (const member of members) {
    if (member.id === meId) continue;
    const name = member.name.toLowerCase();
    const re = new RegExp(`\\b${escapeRegex(name)}\\b`, "i");
    if (re.test(original)) mentioned.add(member.id);
  }

  const meMentioned = meTokens.some((tok) => new RegExp(`\\b${tok}\\b`, "i").test(original));
  if (meMentioned) mentioned.add(meId);

  // 3. Determine paidBy: "paid by X" / "X paid"
  let paidBy = meId;
  const paidByMatch = lower.match(/paid by\s+([a-z][a-z\s]*?)(?:\s+(?:and|,|$|for|with|split)|$)/i)
    ?? lower.match(/^([a-z][a-z]*)\s+paid/i);
  if (paidByMatch) {
    const who = paidByMatch[1].trim();
    if (meTokens.includes(who)) paidBy = meId;
    else {
      const found = members.find((mem) => mem.id !== meId && mem.name.toLowerCase() === who);
      if (found) {
        paidBy = found.id;
        mentioned.add(found.id);
      }
    }
  }

  // 4. Determine splitWith: any "split with/between X, Y" list, else everyone mentioned, else all members.
  let splitWith: string[] = [];
  const splitMatch = original.match(/split (?:with|between|among)\s+(.+?)(?:\s+(?:paid|equally|by)|$)/i);
  if (splitMatch) {
    const tail = splitMatch[1];
    const tokens = tail.split(/[,&]| and /i).map((s) => s.trim().toLowerCase()).filter(Boolean);
    for (const tok of tokens) {
      if (meTokens.includes(tok)) splitWith.push(meId);
      else {
        const found = members.find((mem) => mem.id !== meId && mem.name.toLowerCase() === tok);
        if (found) splitWith.push(found.id);
      }
    }
  }

  if (splitWith.length === 0) {
    splitWith = mentioned.size > 0 ? Array.from(mentioned) : members.map((mem) => mem.id);
  }

  // Always include payer in splitWith if not present (so it's an even split that includes them)
  if (!splitWith.includes(paidBy)) splitWith.push(paidBy);

  // 5. Title: strip the amount + "split..." phrase + "paid by..." phrase.
  let title = original;
  if (amountMatch) {
    title = title.replace(amountMatch[0], " ");
  }
  title = title
    .replace(/split (?:with|between|among)[^.]*$/i, "")
    .replace(/paid by\s+[a-z][a-z\s]*?(?=\s+(?:for|with|split|and|,)|$)/i, "")
    .replace(/^[a-z][a-z]*\s+paid/i, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[,;:.\-]+\s*$/, "")
    .trim();
  // Remove trailing "for N people"
  title = title.replace(/\bfor\s+\d+\s+(?:people|persons?|ppl|guys?|friends?)\b/i, "").trim();
  if (!title) title = "Expense";
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return {
    title,
    amount,
    category: categorize(title),
    paidBy,
    splitWith,
    splitType: "equal",
  };
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Generate spending insight strings from category totals and a settlement plan. */
export function generateInsights(input: {
  totalsByCategory: Record<Category, number>;
  total: number;
  memberCount: number;
  expenseCount: number;
  currency: string;
  topPayer?: { name: string; amount: number };
  simplifiedEdges?: Array<{ from: string; to: string; amount: number; fromName: string; toName: string }>;
  groupName: string;
  meName: string;
}): string[] {
  const { totalsByCategory, total, memberCount, expenseCount, currency, topPayer, simplifiedEdges, meName } = input;
  const insights: string[] = [];

  if (total === 0 || expenseCount === 0) return insights;

  // Insight 1: top category
  const sorted = (Object.entries(totalsByCategory) as [Category, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    const [cat, val] = sorted[0];
    const pct = Math.round((val / total) * 100);
    const emoji = ({ Food: "🍔", Travel: "✈️", Stay: "🏨", Utilities: "💡", Entertainment: "🎬", Shopping: "🛍️", Health: "💊", Other: "💸" } as Record<Category, string>)[cat];
    insights.push(
      pct >= 40
        ? `${emoji} ${cat} took up ${pct}% of the budget — that's the heavy hitter.`
        : `${emoji} ${cat} leads with ${pct}% (${currency}${val.toFixed(0)}) of total spending.`
    );
  }

  // Insight 2: per-person average
  const perPerson = total / memberCount;
  insights.push(
    `📊 That's about ${currency}${perPerson.toFixed(0)} per person across ${expenseCount} ${expenseCount === 1 ? "expense" : "expenses"}.`
  );

  // Insight 3: top payer or settlement hint
  if (simplifiedEdges && simplifiedEdges.length > 0) {
    const e = simplifiedEdges[0];
    const fromLabel = e.fromName === meName ? "You pay" : `${e.fromName} pays`;
    if (simplifiedEdges.length === 1) {
      insights.push(`💡 One transfer settles everyone: ${fromLabel} ${e.toName} ${currency}${e.amount.toFixed(0)}.`);
    } else {
      insights.push(`💡 ${fromLabel} ${e.toName} ${currency}${e.amount.toFixed(0)} — clears the biggest debt.`);
    }
  } else if (topPayer && topPayer.amount > 0) {
    insights.push(`✨ ${topPayer.name} fronted ${currency}${topPayer.amount.toFixed(0)} — the most in this group.`);
  } else {
    insights.push(`✅ Everything is settled in this group. Nice work.`);
  }

  return insights;
}
