// components/users/reset-password-dialog.tsx
"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
};

export default function ResetPasswordDialog({ open, onClose, userId, userName }: Props) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL!;
  const { toast } = useToast();
  const [pw1, setPw1] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [showPw1, setShowPw1] = React.useState(false);
const [showPw2, setShowPw2] = React.useState(false);


  const submit = async () => {
    if (!pw1 || pw1.length < 6) {
      toast({ variant: "destructive", title: "Password must be at least 6 characters" });
      return;
    }
    if (pw1 !== pw2) {
      toast({ variant: "destructive", title: "Passwords do not match" });
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseURL}/api/users/${userId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({ newPassword: pw1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to reset password");

      toast({ title: "Password reset", description: `Password updated for ${userName ?? "user"}.` });
      onClose();
    } catch (e) {
      toast({ variant: "destructive", title: "Reset failed", description: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
      setPw1("");
      setPw2("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {/* <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password{userName ? ` — ${userName}` : ""}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>New Password</Label>
            <Input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} />
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Saving..." : "Update"}</Button>
        </DialogFooter>
      </DialogContent> */}
      <DialogContent>
  <DialogHeader>
    <DialogTitle>Reset Password{userName ? ` — ${userName}` : ""}</DialogTitle>
  </DialogHeader>

  <div className="space-y-3">
    {/* New Password */}
    <div>
      <Label>New Password</Label>
      <div className="relative">
        <Input
          type={showPw1 ? "text" : "password"}
          value={pw1}
          onChange={(e) => setPw1(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPw1((prev) => !prev)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
        >
          {showPw1 ? "Hide" : "Show"}
        </button>
      </div>
    </div>

    {/* Confirm New Password */}
    <div>
      <Label>Confirm New Password</Label>
      <div className="relative">
        <Input
          type={showPw2 ? "text" : "password"}
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPw2((prev) => !prev)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
        >
          {showPw2 ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  </div>

  <DialogFooter>
    <Button variant="ghost" onClick={onClose} disabled={loading}>
      Cancel
    </Button>
    <Button onClick={submit} disabled={loading}>
      {loading ? "Saving..." : "Update"}
    </Button>
  </DialogFooter>
</DialogContent>

    </Dialog>
  );
}
