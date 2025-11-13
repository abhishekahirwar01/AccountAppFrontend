// "use client";

// import * as React from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Switch } from "@/components/ui/switch";
// import { Separator } from "@/components/ui/separator";
// import { Badge } from "@/components/ui/badge";
// import {
//   Loader2,
//   ShieldCheck,
//   ShieldOff,
//   Clock8,
//   CalendarDays,
//   Sparkles,
// } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";

// type Unit = "days" | "months" | "years";
// type ValidityDto = {
//   isActive: boolean; // derived from status
//   status?:
//     | "active"
//     | "expired"
//     | "suspended"
//     | "unlimited"
//     | "unknown"
//     | "disabled";
//   expiresAt: string | null;
//   startAt?: string | null;
//   updatedAt?: string;
// };

// function addToDate(base: Date, amount: number, unit: Unit) {
//   const d = new Date(base);
//   if (unit === "days") d.setDate(d.getDate() + amount);
//   if (unit === "months") d.setMonth(d.getMonth() + amount);
//   if (unit === "years") d.setFullYear(d.getFullYear() + amount);
//   return d;
// }

// function fmtDate(d?: Date | null) {
//   if (!d) return "—";
//   return new Intl.DateTimeFormat(undefined, {
//     dateStyle: "medium",
//     timeStyle: "short",
//   }).format(d);
// }

// function diffInDays(a: Date, b: Date) {
//   return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
// }

// type ClientValidityCardProps = {
//   clientId: string;
//   onChanged?: () => void | Promise<void>;
// };

// // draft = what the user intends to change, not yet persisted
// type Draft = {
//   enabled?: boolean; // on/off toggle
//   extend?: { amount: number; unit: Unit } | null; // queued extension
//   exactDate?: string | null; // queued exact date (yyyy-mm-dd)
// };

// export function ClientValidityCard({
//   clientId,
//   onChanged,
// }: ClientValidityCardProps) {
//   const baseURL = process.env.NEXT_PUBLIC_BASE_URL!;
//   const { toast } = useToast();

//   const [loading, setLoading] = React.useState(true);
//   const [saving, setSaving] = React.useState(false);
//   const [validity, setValidity] = React.useState<ValidityDto | null>(null);
//   const [draft, setDraft] = React.useState<Draft>({});

//   // form bits
//   const [amount, setAmount] = React.useState<number>(30);
//   const [unit, setUnit] = React.useState<Unit>("days");
//   const [exactDate, setExactDate] = React.useState<string>("");
//   // track if inputs changed but not staged into `draft`
//   const [extendDirty, setExtendDirty] = React.useState(false);
//   const [exactDirty, setExactDirty] = React.useState(false);

//   // warning dialog for unstaged changes
//   const [warnUnsavedOpen, setWarnUnsavedOpen] = React.useState(false);

//   const tokenRef = React.useRef<string | null>(null);
//   React.useEffect(() => {
//     tokenRef.current = localStorage.getItem("token");
//   }, []);

//   React.useEffect(() => {
//     if (!validity) return;
//     setDraft({ enabled: !(validity.status === "disabled") });
//   }, [validity]);

//   // fetch current validity
//   const load = React.useCallback(async () => {
//     try {
//       setLoading(true);
//       const token = tokenRef.current || localStorage.getItem("token");
//       if (!token) throw new Error("Authentication token not found.");

//       const res = await fetch(`${baseURL}/api/account/${clientId}/validity`, {
//         headers: { Authorization: `Bearer ${token}` },
//         cache: "no-store",
//       });

//       // 404 means no validity set yet
//       if (res.status === 404) {
//         setValidity({
//           isActive: false,
//           status: "unknown",
//           expiresAt: null,
//           startAt: null,
//         });
//         return;
//       }

//       const json = await res.json();
//       if (!res.ok)
//         throw new Error(json?.message || "Failed to fetch validity.");

//       // IMPORTANT: unwrap and normalize
//       const v = json?.validity ?? {};
//       const status: ValidityDto["status"] = [
//         "active",
//         "expired",
//         "suspended",
//         "unlimited",
//         "unknown",
//         "disabled",
//       ].includes(v?.status)
//         ? v.status
//         : "unknown";

//       setValidity({
//         isActive: status === "active" || status === "unlimited",
//         status,
//         expiresAt: v?.expiresAt ?? null,
//         startAt: v?.startAt ?? null,
//         updatedAt: v?.updatedAt,
//       });
//     } catch (e) {
//       toast({
//         variant: "destructive",
//         title: "Couldn't load validity",
//         description: e instanceof Error ? e.message : "Please try again.",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [baseURL, clientId, toast]);

//   React.useEffect(() => {
//     load();
//   }, [load]);

//   const expiresAtDate = React.useMemo(
//     () => (validity?.expiresAt ? new Date(validity.expiresAt) : null),
//     [validity]
//   );
//   const now = new Date();
//   const daysLeft = expiresAtDate ? diffInDays(now, expiresAtDate) : null;
//   const expired = expiresAtDate
//     ? expiresAtDate.getTime() <= now.getTime()
//     : false;
//   const status =
//     validity?.status ?? (validity?.isActive ? "active" : "unknown");
//   const isDisabled = status === "disabled";

//   const previewDate = React.useMemo(() => {
//     const base = expiresAtDate && !expired ? expiresAtDate : now;
//     return addToDate(base, Number.isFinite(amount) ? amount : 0, unit);
//   }, [amount, unit, expiresAtDate, expired, now]);

//   // below your other derived values
//   const currentlyEnabled = !(validity?.status === "disabled");
//   const uiEnabled = draft.enabled ?? currentlyEnabled; // <— use this for the switch & label

//   // --- pending detection
//   const hasPending =
//     draft.enabled !== undefined || !!draft.extend || !!draft.exactDate;

//   // --- single place that persists everything
//   async function commitChanges() {
//     try {
//       setSaving(true);
//       const token = tokenRef.current || localStorage.getItem("token");
//       if (!token) throw new Error("Authentication token not found.");

//       // 1) Status change
//       const currentlyEnabled = !(validity?.status === "disabled");
//       if (draft.enabled !== undefined && draft.enabled !== currentlyEnabled) {
//         if (!draft.enabled) {
//           // disable
//           const r = await fetch(
//             `${baseURL}/api/account/${clientId}/validity/disable`,
//             {
//               method: "PATCH",
//               headers: { Authorization: `Bearer ${token}` },
//             }
//           );
//           const json = await r.json();
//           if (!r.ok) throw new Error(json?.message || "Failed to disable.");
//         } else {
//           // enable (if no expiry change queued, give a minimal 1-day validity)
//           if (!draft.exactDate && !draft.extend) {
//             const r = await fetch(
//               `${baseURL}/api/account/${clientId}/validity`,
//               {
//                 method: "PUT",
//                 headers: {
//                   "Content-Type": "application/json",
//                   Authorization: `Bearer ${token}`,
//                 },
//                 body: JSON.stringify({ years: 0, months: 0, days: 1 }),
//               }
//             );
//             const json = await r.json();
//             if (!r.ok) throw new Error(json?.message || "Failed to enable.");
//           }
//         }
//       }

//       // 2) Expiry change (exactDate takes precedence over extend)
//       if (draft.exactDate) {
//         const start = new Date();
//        const target = new Date(`${draft.exactDate}T00:00:00`);
//         const ms = target.getTime() - start.getTime();
//         const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
//         const r = await fetch(`${baseURL}/api/account/${clientId}/validity`, {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({
//             years: 0,
//             months: 0,
//             days,
//             startAt: start.toISOString(),
//           }),
//         });
//         const json = await r.json();
//         if (!r.ok) throw new Error(json?.message || "Failed to set expiry.");
//       } else if (draft.extend) {
//         const { amount, unit } = draft.extend;
//         const body =
//           unit === "years"
//             ? { years: amount, months: 0, days: 0 }
//             : unit === "months"
//             ? { years: 0, months: amount, days: 0 }
//             : { years: 0, months: 0, days: amount };

//         const r = await fetch(`${baseURL}/api/account/${clientId}/validity`, {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(body),
//         });
//         const json = await r.json();
//         if (!r.ok)
//           throw new Error(json?.message || "Failed to extend validity.");
//       }

//       // reload from server, clear draft, notify parent
//       await load();
//       setDraft({});
//       toast({ title: "Changes saved" });
//       await onChanged?.();
//     } catch (e) {
//       toast({
//         variant: "destructive",
//         title: "Save failed",
//         description: e instanceof Error ? e.message : "Please try again.",
//       });
//     } finally {
//       setSaving(false);
//     }
//   }

//   const canSave = (hasPending || extendDirty || exactDirty) && !saving;

//   function resetDraft() {
//     setDraft({});
//     setExactDate("");
//     setExtendDirty(false);
//     setExactDirty(false);
//   }

//   async function handleSave() {
//     // warn if inputs changed but not staged
//     if (extendDirty || exactDirty) {
//       setWarnUnsavedOpen(true);
//       return;
//     }
//     await commitChanges();
//     setExactDate("");
//   }
//   return (
//     <Card className="overflow-hidden border-blue-100 dark:border-blue-800/70 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-900 shadow-md dark:shadow-lg dark:shadow-blue-900/20">
//       <CardHeader className="pb-2">
//         <div className="flex items-center justify-between">
//           <CardTitle className="flex items-center gap-2">
//             <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
//             Account Validity
//           </CardTitle>

//           {loading ? (
//             <Badge variant="outline" className="animate-pulse bg-transparent dark:bg-gray-800">
//               Loading…
//             </Badge>
//           ) : status === "active" ? (
//             <Badge className="bg-emerald-600 hover:bg-emerald-600 dark:bg-emerald-700 dark:hover:bg-emerald-700 dark:text-white">
//               Active
//             </Badge>
//           ) : status === "expired" ? (
//             <Badge className="bg-red-600 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-700 dark:text-white">Expired</Badge>
//           ) : status === "disabled" ? (
//             <Badge className="bg-gray-600 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-700 dark:text-white">Disabled</Badge>
//           ) : (
//             <Badge className="bg-slate-600 hover:bg-slate-600 dark:bg-slate-700 dark:hover:bg-slate-700 dark:text-white capitalize">
//               {status}
//             </Badge>
//           )}
//         </div>
//       </CardHeader>

//       <CardContent className="space-y-6">
//         {/* Top stats */}
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//           <div className="rounded-xl bg-white/70 dark:bg-gray-800 p-4 border border-white/60 dark:border-gray-700 shadow-sm dark:shadow-md dark:shadow-black/30">
//             <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-300 mb-1">
//               <CalendarDays className="h-4 w-4" />
//               <span>Expires On</span>
//             </div>
//             <div className="text-sm font-semibold dark:text-white">
//               {loading ? "—" : fmtDate(expiresAtDate)}
//             </div>
//           </div>
//           <div className="rounded-xl bg-white/70 dark:bg-gray-800 p-4 border border-white/60 dark:border-gray-700 shadow-sm dark:shadow-md dark:shadow-black/30">
//             <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-300 mb-1">
//               <Clock8 className="h-4 w-4" />
//               <span>Days Left</span>
//             </div>
//             <div className="text-lg font-semibold items-center dark:text-white">
//               {loading
//                 ? "—"
//                 : expiresAtDate
//                 ? daysLeft! >= 0
//                   ? daysLeft
//                   : 0
//                 : "—"}
//             </div>
//           </div>
//           <div className="rounded-xl bg-white/70 dark:bg-gray-800 p-4 border border-white/60 dark:border-gray-700 shadow-sm dark:shadow-md dark:shadow-black/30">
//             <div className="flex items-center justify-between">
//               <div className="space-y-1">
//                 <Label className="text-muted-foreground dark:text-gray-300">Account Status</Label>
//                 <div className="flex items-center gap-2">
//                   {uiEnabled ? (
//                     <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
//                   ) : (
//                     <ShieldOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
//                   )}
//                   <span className="font-medium text-sm dark:text-white">
//                     {uiEnabled ? "Enabled" : "Disabled"}
//                   </span>
//                 </div>
//               </div>
//               <Switch
//                 checked={uiEnabled}
//                 onCheckedChange={(v) => setDraft((d) => ({ ...d, enabled: v }))}
//                 disabled={loading || saving}
//               />
//             </div>
//           </div>
//         </div>

//         <Separator className="dark:bg-gray-700" />



//         {/* Exact date setter */}
//         <div className="space-y-3">
//           <Label className="text-sm text-muted-foreground dark:text-gray-300">
//             Set Exact Expiry
//           </Label>
//           <div className="grid grid-cols-1 sm:grid-cols-[240px_auto] gap-3 items-end">
//             <div>
//               <Label htmlFor="v-date" className="dark:text-gray-300">Expiry date</Label>
//               <Input
//                 id="v-date"
//                 type="date"
//                 value={exactDate}
//                 onChange={(e) => {
//                   setExactDate(e.target.value);
//                   setExactDirty(true);
//                 }}
//                 className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-blue-500"
//               />
//             </div>
//             <Button
//               variant="outline"
//               onClick={() => {
//                 setDraft((d) => ({ ...d, exactDate }));
//                 setExactDirty(false);
//               }}
//               disabled={!exactDate || loading || saving}
//               className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
//             >
//               {saving ? (
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               ) : null}
//               Save Exact Date
//             </Button>
//           </div>
//         </div>

//         <Separator className="dark:bg-gray-700" />

//         <div className="flex items-center justify-end gap-2 pt-2">
          
//           <Button 
//             onClick={handleSave} 
//             disabled={!hasPending || saving}
//             className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
//           >
//             {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
//             Save changes
//           </Button>
//         </div>

//         <AlertDialog open={warnUnsavedOpen} onOpenChange={setWarnUnsavedOpen}>
//           <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-700">
//             <AlertDialogHeader>
//               <AlertDialogTitle className="dark:text-white">Discard unstaged changes?</AlertDialogTitle>
//               <AlertDialogDescription className="dark:text-gray-300">
//                 {extendDirty && exactDirty
//                   ? "You changed Extend and Exact Expiry inputs but didn't click their buttons."
//                   : extendDirty
//                   ? "You changed the Extend inputs but didn't click the Extend button."
//                   : "You picked an Exact Expiry date but didn't click Save Exact Date."}{" "}
//                 These changes aren't staged and will be discarded if you
//                 continue.
//               </AlertDialogDescription>
//             </AlertDialogHeader>
//             <AlertDialogFooter>
//               <AlertDialogCancel className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white">Go back</AlertDialogCancel>
//               <AlertDialogAction
//                 onClick={async () => {
//                   setWarnUnsavedOpen(false);
//                   // discard the dirty parts only (don't clear staged draft)
//                   setExtendDirty(false);
//                   setExactDirty(false);
//                   await commitChanges();
//                   setExactDate("");
//                 }}
//                 className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
//               >
//                 Discard & Save
//               </AlertDialogAction>
//             </AlertDialogFooter>
//           </AlertDialogContent>
//         </AlertDialog>
//       </CardContent>
//     </Card>
//   );
// }




















"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ShieldCheck,
  ShieldOff,
  Clock8,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Unit = "days" | "months" | "years";
type ValidityDto = {
  isActive: boolean; // derived from status
  status?:
    | "active"
    | "expired"
    | "suspended"
    | "unlimited"
    | "unknown"
    | "disabled";
  expiresAt: string | null;
  startAt?: string | null;
  updatedAt?: string;
};

function addToDate(base: Date, amount: number, unit: Unit) {
  const d = new Date(base);
  if (unit === "days") d.setDate(d.getDate() + amount);
  if (unit === "months") d.setMonth(d.getMonth() + amount);
  if (unit === "years") d.setFullYear(d.getFullYear() + amount);
  return d;
}

function fmtDate(d?: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function diffInDays(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

type ClientValidityCardProps = {
  clientId: string;
  onChanged?: () => void | Promise<void>;
  onClose?: () => void; 
};

// draft = what the user intends to change, not yet persisted
type Draft = {
  enabled?: boolean; // on/off toggle
  extend?: { amount: number; unit: Unit } | null; // queued extension
  exactDate?: string | null; // queued exact date (yyyy-mm-dd)
};

export function ClientValidityCard({
  clientId,
  onChanged,
}: ClientValidityCardProps) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL!;
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [validity, setValidity] = React.useState<ValidityDto | null>(null);
  const [draft, setDraft] = React.useState<Draft>({});

  // form bits
  const [amount, setAmount] = React.useState<number>(30);
  const [unit, setUnit] = React.useState<Unit>("days");
  const [exactDate, setExactDate] = React.useState<string>("");

  const tokenRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    tokenRef.current = localStorage.getItem("token");
  }, []);

  React.useEffect(() => {
    if (!validity) return;
    setDraft({ enabled: !(validity.status === "disabled") });
  }, [validity]);

  // fetch current validity
  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = tokenRef.current || localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`${baseURL}/api/account/${clientId}/validity`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      // 404 means no validity set yet
      if (res.status === 404) {
        setValidity({
          isActive: false,
          status: "unknown",
          expiresAt: null,
          startAt: null,
        });
        return;
      }

      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.message || "Failed to fetch validity.");

      // IMPORTANT: unwrap and normalize
      const v = json?.validity ?? {};
      const status: ValidityDto["status"] = [
        "active",
        "expired",
        "suspended",
        "unlimited",
        "unknown",
        "disabled",
      ].includes(v?.status)
        ? v.status
        : "unknown";

      setValidity({
        isActive: status === "active" || status === "unlimited",
        status,
        expiresAt: v?.expiresAt ?? null,
        startAt: v?.startAt ?? null,
        updatedAt: v?.updatedAt,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Couldn't load validity",
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [baseURL, clientId, toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const expiresAtDate = React.useMemo(
    () => (validity?.expiresAt ? new Date(validity.expiresAt) : null),
    [validity]
  );
  const now = new Date();
  const daysLeft = expiresAtDate ? diffInDays(now, expiresAtDate) : null;
  const expired = expiresAtDate
    ? expiresAtDate.getTime() <= now.getTime()
    : false;
  const status =
    validity?.status ?? (validity?.isActive ? "active" : "unknown");
  const isDisabled = status === "disabled";

  const previewDate = React.useMemo(() => {
    const base = expiresAtDate && !expired ? expiresAtDate : now;
    return addToDate(base, Number.isFinite(amount) ? amount : 0, unit);
  }, [amount, unit, expiresAtDate, expired, now]);

  // below your other derived values
  const currentlyEnabled = !(validity?.status === "disabled");
  const uiEnabled = draft.enabled ?? currentlyEnabled; // <— use this for the switch & label

  // --- pending detection
  const hasPending =
    draft.enabled !== undefined || !!draft.extend || !!draft.exactDate;

  // --- single place that persists everything
  async function commitChanges() {
    try {
      setSaving(true);
      const token = tokenRef.current || localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      // 1) Status change
      const currentlyEnabled = !(validity?.status === "disabled");
      if (draft.enabled !== undefined && draft.enabled !== currentlyEnabled) {
        if (!draft.enabled) {
          // disable
          const r = await fetch(
            `${baseURL}/api/account/${clientId}/validity/disable`,
            {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const json = await r.json();
          if (!r.ok) throw new Error(json?.message || "Failed to disable.");
        } else {
          // enable (if no expiry change queued, give a minimal 1-day validity)
          if (!draft.exactDate && !draft.extend) {
            const r = await fetch(
              `${baseURL}/api/account/${clientId}/validity`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ years: 0, months: 0, days: 1 }),
              }
            );
            const json = await r.json();
            if (!r.ok) throw new Error(json?.message || "Failed to enable.");
          }
        }
      }

      // 2) Expiry change (exactDate takes precedence over extend)
      if (draft.exactDate) {
        const start = new Date();
        const target = new Date(`${draft.exactDate}T00:00:00`);
        const ms = target.getTime() - start.getTime();
        const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
        const r = await fetch(`${baseURL}/api/account/${clientId}/validity`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            years: 0,
            months: 0,
            days,
            startAt: start.toISOString(),
          }),
        });
        const json = await r.json();
        if (!r.ok) throw new Error(json?.message || "Failed to set expiry.");
      } else if (draft.extend) {
        const { amount, unit } = draft.extend;
        const body =
          unit === "years"
            ? { years: amount, months: 0, days: 0 }
            : unit === "months"
            ? { years: 0, months: amount, days: 0 }
            : { years: 0, months: 0, days: amount };

        const r = await fetch(`${baseURL}/api/account/${clientId}/validity`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        const json = await r.json();
        if (!r.ok)
          throw new Error(json?.message || "Failed to extend validity.");
      }

      // reload from server, clear draft, notify parent
      await load();
      setDraft({});
      setExactDate(""); // Clear the exact date input
      toast({ title: "Changes saved" });
      await onChanged?.();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  const canSave = hasPending && !saving;

  function resetDraft() {
    setDraft({});
    setExactDate("");
  }

  // Handle exact date change - automatically stage it to draft
  const handleExactDateChange = (value: string) => {
    setExactDate(value);
    if (value) {
      setDraft((d) => ({ ...d, exactDate: value, extend: null }));
    } else {
      setDraft((d) => ({ ...d, exactDate: null }));
    }
  };

  async function handleSave() {
    await commitChanges();
  }

     
  return (
    <Card className="overflow-hidden border-blue-100 dark:border-blue-800/70 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-900 shadow-md dark:shadow-lg dark:shadow-blue-900/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Account Validity
          </CardTitle>

          {loading ? (
            <Badge variant="outline" className="animate-pulse bg-transparent dark:bg-gray-800">
              Loading…
            </Badge>
          ) : status === "active" ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-600 dark:bg-emerald-700 dark:hover:bg-emerald-700 dark:text-white">
              Active
            </Badge>
          ) : status === "expired" ? (
            <Badge className="bg-red-600 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-700 dark:text-white">Expired</Badge>
          ) : status === "disabled" ? (
            <Badge className="bg-gray-600 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-700 dark:text-white">Disabled</Badge>
          ) : (
            <Badge className="bg-slate-600 hover:bg-slate-600 dark:bg-slate-700 dark:hover:bg-slate-700 dark:text-white capitalize">
              {status}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Top stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/70 dark:bg-gray-800 p-4 border border-white/60 dark:border-gray-700 shadow-sm dark:shadow-md dark:shadow-black/30">
            <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-300 mb-1">
              <CalendarDays className="h-4 w-4" />
              <span>Expires On</span>
            </div>
            <div className="text-sm font-semibold dark:text-white">
              {loading ? "—" : fmtDate(expiresAtDate)}
            </div>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-gray-800 p-4 border border-white/60 dark:border-gray-700 shadow-sm dark:shadow-md dark:shadow-black/30">
            <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-300 mb-1">
              <Clock8 className="h-4 w-4" />
              <span>Days Left</span>
            </div>
            <div className="text-lg font-semibold items-center dark:text-white">
              {loading
                ? "—"
                : expiresAtDate
                ? daysLeft! >= 0
                  ? daysLeft
                  : 0
                : "—"}
            </div>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-gray-800 p-4 border border-white/60 dark:border-gray-700 shadow-sm dark:shadow-md dark:shadow-black/30">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-muted-foreground dark:text-gray-300">Account Status</Label>
                <div className="flex items-center gap-2">
                  {uiEnabled ? (
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ShieldOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  )}
                  <span className="font-medium text-sm dark:text-white">
                    {uiEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
              <Switch
                checked={uiEnabled}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, enabled: v }))}
                disabled={loading || saving}
              />
            </div>
          </div>
        </div>

        <Separator className="dark:bg-gray-700" />

        {/* Exact date setter */}
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground dark:text-gray-300">
            Set Exact Expiry
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-[240px_auto] gap-3 items-end">
            <div>
              <Label htmlFor="v-date" className="dark:text-gray-300">Expiry date</Label>
              <Input
                id="v-date"
                type="date"
                value={exactDate}
                onChange={(e) => handleExactDateChange(e.target.value)}
                className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-blue-500"
              />
            </div>
            <div className="text-sm text-muted-foreground dark:text-gray-400">
              {exactDate && `Will expire on: ${new Date(exactDate).toLocaleDateString()}`}
            </div>
          </div>
        </div>

        <Separator className="dark:bg-gray-700" />

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button 
            onClick={handleSave} 
            disabled={!hasPending || saving}
            className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        </div>
      
      </CardContent>
    </Card>
  );
}