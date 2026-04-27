import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CategoryIcon } from "@/components/CategoryIcon";
import { MemberAvatar } from "@/components/MemberAvatar";
import { CATEGORIES, CATEGORY_META, type Category, type SplitType, type Group } from "@/lib/types";
import { computeSplits, round2 } from "@/lib/balance";
import { store } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Camera, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  group: Group;
}

export function AddExpenseDialog({ open, onOpenChange, group }: Props) {
  const [nlText, setNlText] = useState("");
  const [nlLoading, setNlLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<Category>("Other");
  const [categorizing, setCategorizing] = useState(false);
  const [paidBy, setPaidBy] = useState(group.meMemberId);
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [selectedIds, setSelectedIds] = useState<string[]>(group.members.map((m) => m.id));
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCategorizedTitle = useRef<string>("");

  const reset = () => {
    setNlText(""); setTitle(""); setAmount(""); setCategory("Other");
    setPaidBy(group.meMemberId); setSplitType("equal");
    setSelectedIds(group.members.map((m) => m.id));
    setCustomAmounts({}); setNotes(""); setReceiptPreview(null);
    setDate(new Date().toISOString().slice(0, 10));
    lastCategorizedTitle.current = "";
  };

  useEffect(() => {
    if (!open) setTimeout(reset, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const numAmount = parseFloat(amount) || 0;

  const splitsPreview = useMemo(() => {
    if (!numAmount || selectedIds.length === 0) return [];
    return computeSplits(numAmount, splitType, selectedIds, customAmounts);
  }, [numAmount, splitType, selectedIds, customAmounts]);

  const splitTotal = splitsPreview.reduce((s, x) => s + x.amount, 0);
  const splitDiff = round2(numAmount - splitTotal);
  const isValid = title.trim() && numAmount > 0 && selectedIds.length > 0 &&
    (splitType === "equal" || Math.abs(splitDiff) < 0.05);

  const triggerCategorize = async (t: string) => {
    if (!t.trim() || t === lastCategorizedTitle.current) return;
    lastCategorizedTitle.current = t;
    setCategorizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("categorize-expense", { body: { title: t } });
      if (!error && data?.category) setCategory(data.category as Category);
    } catch (e) {
      // silent fallback
    } finally {
      setCategorizing(false);
    }
  };

  const handleTitleBlur = () => {
    if (titleBlurTimer.current) clearTimeout(titleBlurTimer.current);
    titleBlurTimer.current = setTimeout(() => triggerCategorize(title.trim()), 150);
  };

  const handleNlSubmit = async () => {
    const text = nlText.trim();
    if (!text) return;
    setNlLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-expense-nl", {
        body: { text, members: group.members.map((m) => ({ id: m.id, name: m.name })) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTitle(data.title || "");
      setAmount(String(data.amount || ""));
      setCategory((data.category as Category) || "Other");
      lastCategorizedTitle.current = data.title || "";
      const validPaidBy = group.members.find((m) => m.id === data.paidBy);
      if (validPaidBy) setPaidBy(validPaidBy.id);
      const validSplit = (data.splitWith || []).filter((id: string) => group.members.some((m) => m.id === id));
      if (validSplit.length) setSelectedIds(validSplit);
      setSplitType(data.splitType === "exact" || data.splitType === "percentage" ? data.splitType : "equal");
      toast.success("AI filled the form ✨");
      setNlText("");
    } catch (e: any) {
      toast.error(e?.message || "Couldn't parse that. Try filling manually.");
    } finally {
      setNlLoading(false);
    }
  };

  const handleReceiptUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }
    setReceiptLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setReceiptPreview(base64);
        try {
          const { data, error } = await supabase.functions.invoke("extract-receipt", {
            body: { imageBase64: base64 },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          if (data?.title) setTitle(data.title);
          if (data?.amount) setAmount(String(data.amount));
          if (data?.category) {
            setCategory(data.category as Category);
            lastCategorizedTitle.current = data.title || "";
          }
          toast.success("Receipt scanned ✨");
        } catch (e: any) {
          toast.error(e?.message || "Could not read receipt");
        } finally {
          setReceiptLoading(false);
        }
      };
      reader.onerror = () => { setReceiptLoading(false); toast.error("Failed to read file"); };
      reader.readAsDataURL(file);
    } catch (e) {
      setReceiptLoading(false);
    }
  };

  const handleSave = () => {
    if (!isValid) return;
    const splits = splitsPreview;
    store.addExpense(group.id, {
      title: title.trim(),
      amount: round2(numAmount),
      category,
      paidBy,
      splitType,
      splits,
      notes: notes.trim() || undefined,
      date: new Date(date).toISOString(),
      receiptUrl: receiptPreview || undefined,
    });
    toast.success("Expense added");
    onOpenChange(false);
  };

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const updateCustom = (id: string, v: number) => {
    setCustomAmounts({ ...customAmounts, [id]: v });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border-0 shadow-modal">
        <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-bold text-lg">Add expense</h2>
            <p className="text-xs text-muted-foreground">{group.emoji} {group.name}</p>
          </div>
          <button onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5 flex-1">
          {/* AI Input bar */}
          <div className="space-y-2">
            <div className={cn(
              "relative rounded-2xl bg-gradient-card border border-primary/20 p-1 transition-all",
              nlLoading && "ai-shimmer",
            )}>
              <div className="flex items-center gap-2 pl-3">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <Input
                  value={nlText}
                  onChange={(e) => setNlText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleNlSubmit(); } }}
                  placeholder="Try: Pizza ₹800 split with Aman and Priya"
                  disabled={nlLoading}
                  className="border-0 bg-transparent focus-visible:ring-0 px-1 h-10 text-sm placeholder:text-muted-foreground/70"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNlSubmit}
                  disabled={!nlText.trim() || nlLoading}
                  className="bg-gradient-hero hover:opacity-90 text-white font-semibold rounded-xl h-9 px-3"
                >
                  {nlLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Parse →"}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">or fill manually below ↓</p>
          </div>

          {/* Title + category */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</label>
            <div className="flex gap-2 mt-2">
              <div className="relative">
                <CategoryIcon category={category} size="md" />
                {categorizing && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                    <Loader2 className="h-3 w-3 text-white animate-spin" />
                  </div>
                )}
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="What was it for?"
                className="rounded-xl h-11 flex-1"
              />
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={cn(
                    "text-[10px] font-semibold px-2 py-1 rounded-full transition-all",
                    category === c ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-muted"
                  )}>
                  {CATEGORY_META[c].emoji} {c}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono-num font-bold text-lg">{group.currency}</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-10 h-14 text-2xl font-mono-num font-bold rounded-xl"
              />
            </div>
          </div>

          {/* Paid by */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid by</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {group.members.map((m) => (
                <button key={m.id} type="button" onClick={() => setPaidBy(m.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
                    paidBy === m.id ? "bg-primary text-white border-primary shadow-glow" : "bg-card border-border hover:bg-secondary",
                  )}>
                  <MemberAvatar member={m} size="xs" />
                  <span className="text-sm font-medium">{m.id === group.meMemberId ? "You" : m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Split */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Split</label>
              <div className="inline-flex bg-secondary rounded-lg p-0.5 text-xs">
                {(["equal", "percentage", "exact"] as SplitType[]).map((t) => (
                  <button key={t} type="button" onClick={() => setSplitType(t)}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-semibold capitalize transition-all",
                      splitType === t ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}>
                    {t === "percentage" ? "%" : t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 space-y-1.5">
              {group.members.map((m) => {
                const checked = selectedIds.includes(m.id);
                const split = splitsPreview.find((s) => s.memberId === m.id);
                return (
                  <div key={m.id} className={cn("flex items-center gap-3 p-2.5 rounded-xl border transition-all",
                    checked ? "bg-card border-border" : "bg-secondary/40 border-transparent opacity-50"
                  )}>
                    <button type="button" onClick={() => toggleMember(m.id)}
                      className={cn("h-5 w-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all",
                        checked ? "bg-primary border-primary" : "border-border"
                      )}>
                      {checked && <span className="text-white text-xs leading-none">✓</span>}
                    </button>
                    <MemberAvatar member={m} size="sm" />
                    <span className="flex-1 text-sm font-medium">{m.id === group.meMemberId ? "You" : m.name}</span>

                    {checked && splitType === "equal" && (
                      <span className="font-mono-num text-sm font-semibold">{group.currency}{split?.amount.toFixed(2) ?? "0.00"}</span>
                    )}
                    {checked && splitType === "percentage" && (
                      <Input type="number" min={0} max={100} step={1}
                        value={customAmounts[m.id] ?? ""}
                        onChange={(e) => updateCustom(m.id, parseFloat(e.target.value) || 0)}
                        className="h-8 w-20 rounded-lg text-right font-mono-num" placeholder="%" />
                    )}
                    {checked && splitType === "exact" && (
                      <Input type="number" min={0} step={0.01}
                        value={customAmounts[m.id] ?? ""}
                        onChange={(e) => updateCustom(m.id, parseFloat(e.target.value) || 0)}
                        className="h-8 w-24 rounded-lg text-right font-mono-num" placeholder="0.00" />
                    )}
                  </div>
                );
              })}
            </div>

            {numAmount > 0 && splitType !== "equal" && Math.abs(splitDiff) > 0.05 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-warning bg-warning/10 px-3 py-2 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5" />
                {splitType === "percentage"
                  ? `Total: ${splitsPreview.reduce((s, x) => s + (x.percentage || 0), 0).toFixed(0)}% (must be 100%)`
                  : `Difference: ${group.currency}${splitDiff.toFixed(2)} unaccounted for`}
              </div>
            )}
          </div>

          {/* Receipt + Notes + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 h-11 rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receipt</label>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => {
                const f = e.target.files?.[0]; if (f) handleReceiptUpload(f);
              }} />
              {receiptPreview ? (
                <div className="relative mt-2 h-11 rounded-xl border border-border overflow-hidden">
                  <img src={receiptPreview} alt="Receipt" className="h-full w-full object-cover" />
                  <button onClick={() => setReceiptPreview(null)} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={receiptLoading}
                  className="mt-2 w-full h-11 rounded-xl gap-1.5 font-medium">
                  {receiptLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  <span className="text-xs">{receiptLoading ? "Reading..." : "Scan"}</span>
                </Button>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes (optional)</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="..." rows={2} className="mt-2 rounded-xl resize-none" />
          </div>
        </div>

        <div className="border-t border-border p-4 bg-secondary/30 shrink-0 flex gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={!isValid}
            className="flex-1 bg-gradient-hero hover:opacity-90 text-white font-semibold rounded-xl">
            Save expense
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
