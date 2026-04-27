import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GROUP_EMOJIS, GROUP_COLORS } from "@/lib/types";
import { store } from "@/lib/store";
import type { Group } from "@/lib/types";
import { ArrowLeft, ArrowRight, X, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (g: Group) => void;
}

export function CreateGroupDialog({ open, onOpenChange, onCreated }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏖️");
  const [color, setColor] = useState(GROUP_COLORS[0].token);
  const [meName, setMeName] = useState(store.getMeName() || "You");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [currency, setCurrency] = useState("₹");

  const reset = () => {
    setStep(1); setName(""); setEmoji("🏖️"); setColor(GROUP_COLORS[0].token);
    setMembers([]); setMemberInput(""); setCurrency("₹");
  };

  const addMember = () => {
    const n = memberInput.trim();
    if (n && !members.includes(n)) {
      setMembers([...members, n]);
      setMemberInput("");
    }
  };

  const handleCreate = () => {
    const g = store.createGroup({
      name: name.trim() || "Untitled group",
      emoji, color, currency,
      memberNames: members,
      meName: meName.trim() || "You",
    });
    onCreated?.(g);
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const canNext1 = name.trim().length > 0;
  const canNext2 = true;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTimeout(reset, 300); }}>
      <DialogContent className="max-w-md p-0 gap-0 rounded-2xl overflow-hidden border-0 shadow-modal">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              New group
            </h2>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((n) => (
                <div key={n} className={cn("h-1.5 w-6 rounded-full transition-all", n <= step ? "bg-primary" : "bg-muted")} />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Step {step} of 3</p>
        </div>

        <div className="px-6 pb-6 min-h-[320px]">
          {step === 1 && (
            <div className="space-y-5 animate-float-up">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pick an emoji</label>
                <div className="grid grid-cols-10 gap-1.5 mt-2">
                  {GROUP_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={cn(
                        "aspect-square rounded-lg text-lg flex items-center justify-center transition-all",
                        emoji === e ? "bg-primary text-white scale-110 shadow-glow" : "bg-secondary hover:bg-muted"
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Group name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Goa Trip 2025" className="mt-2 rounded-xl h-11" autoFocus />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color</label>
                <div className="flex gap-2 mt-2">
                  {GROUP_COLORS.map((c) => (
                    <button
                      key={c.token}
                      type="button"
                      onClick={() => setColor(c.token)}
                      className={cn(
                        "h-9 w-9 rounded-full transition-all border-2",
                        color === c.token ? "scale-110 border-foreground" : "border-transparent",
                      )}
                      style={{ backgroundColor: `hsl(${c.token})` }}
                      aria-label={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-float-up">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your name</label>
                <Input value={meName} onChange={(e) => setMeName(e.target.value)} placeholder="You" className="mt-2 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add members</label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={memberInput}
                    onChange={(e) => setMemberInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMember(); } }}
                    placeholder="e.g. Aman"
                    className="rounded-xl h-11"
                  />
                  <Button type="button" onClick={addMember} variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {members.length === 0 && (
                    <p className="text-xs text-muted-foreground">Add at least one to start splitting.</p>
                  )}
                  {members.map((m) => (
                    <div key={m} className="inline-flex items-center gap-1.5 bg-primary-light text-primary-deep px-3 py-1.5 rounded-full text-sm font-medium animate-pop-in">
                      {m}
                      <button onClick={() => setMembers(members.filter((x) => x !== m))} className="hover:opacity-60">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-float-up">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Currency symbol</label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {["₹", "$", "€", "£", "¥"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCurrency(s)}
                      className={cn(
                        "h-12 rounded-xl font-bold text-lg transition-all font-mono-num",
                        currency === s ? "bg-primary text-white shadow-glow" : "bg-secondary hover:bg-muted"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-card rounded-2xl p-5 mt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: `hsl(${color} / 0.18)` }}>{emoji}</div>
                  <div>
                    <p className="font-bold">{name || "Your group"}</p>
                    <p className="text-xs text-muted-foreground">{members.length + 1} members · {currency}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-4 flex justify-between bg-secondary/30">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-1.5 rounded-xl">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : <div />}
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
              className="bg-gradient-hero hover:opacity-90 text-white gap-1.5 font-semibold rounded-xl"
            >
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleCreate} className="bg-gradient-hero hover:opacity-90 text-white font-semibold rounded-xl gap-1.5">
              Create group 🎉
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
