"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

type EmailStatus = {
  connected: boolean;
  email?: string | null;
  termsAcceptedAt?: string | null;

  // OPTIONAL: add in your backend if you can.
  // If not present, the UI still works with `connected` + `email`.
  reason?: "token_expired" | "revoked" | "unknown" | null;
  lastFailureAt?: string | null;
};

export function EmailSendingConsent() {
  const { toast } = useToast();
  const [status, setStatus] = React.useState<EmailStatus>({ connected: false });
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [agreeChecked, setAgreeChecked] = React.useState(false);
  const [savingAgree, setSavingAgree] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [reconnectNotice, setReconnectNotice] = React.useState(false);

  // Track previous "connected" state to detect a flip -> disconnected
  const prevConnectedRef = React.useRef<boolean | null>(null);

  // Polling interval (ms)
  const POLL_MS = 120_000; // 2 minutes

  // Fetch current status
  const refreshStatus = React.useCallback(async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${baseURL}/api/integrations/gmail/status`, {
      headers: { Authorization: `Bearer ${token || ""}` },
    });
    if (!res.ok) throw new Error("Failed to load email status");
    const data = (await res.json()) as EmailStatus;

    // Compare with previous "connected" value to detect expiry
    const wasConnected = prevConnectedRef.current;
    const nowConnected = !!data.connected;

    setStatus(data);
    prevConnectedRef.current = nowConnected;

    // If we were connected and now we're not -> show reconnect banner & toast
    if (wasConnected && !nowConnected && data.email) {
      setReconnectNotice(true);
      const msg =
        data.reason === "token_expired"
          ? "Your Gmail session expired. Please reconnect to keep emailing invoices."
          : "Your Gmail connection is no longer active. Please reconnect.";
      toast({ variant: "destructive", title: "Gmail needs reconnect", description: msg });
    }
  }, [toast]);

  // Handle callback flags added to URL by backend (e.g., after OAuth)
  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const gmailFlag = sp.get("gmail"); // "connected" | "reconnect" | "revoked" | "disconnected"
    const connectedEmail = sp.get("email");

    (async () => {
      if (!gmailFlag) return;

      try {
        await refreshStatus();
      } catch {
        /* ignore */
      }

      if (gmailFlag === "connected") {
        toast({
          title: "Gmail connected",
          description: connectedEmail
            ? `Connected as ${connectedEmail}`
            : "Connection successful.",
        });
        setReconnectNotice(false);
      } else if (
        gmailFlag === "reconnect" ||
        gmailFlag === "revoked" ||
        gmailFlag === "disconnected"
      ) {
        setReconnectNotice(true);
        toast({
          variant: "destructive",
          title: "Gmail disconnected",
          description:
            "Please reconnect your Gmail account to keep emailing invoices.",
        });
      }

      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("gmail");
      url.searchParams.delete("email");
      window.history.replaceState({}, "", url.toString());
    })();
  }, [refreshStatus, toast]);

  // Listen for a global event to force the reconnect dialog/banner
  React.useEffect(() => {
    const onNeedsReconnect = () => setReconnectNotice(true);
    window.addEventListener("gmail:reconnect-required", onNeedsReconnect);
    return () =>
      window.removeEventListener("gmail:reconnect-required", onNeedsReconnect);
  }, []);

  // Initial load
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refreshStatus();
      } catch {
        /* ignore */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshStatus]);

  // Light polling to catch token expiry while user is on the screen
  const hasAccepted = Boolean(status.termsAcceptedAt);
  React.useEffect(() => {
    if (!hasAccepted) return; // no need to poll until terms are accepted
    const id = setInterval(() => {
      refreshStatus().catch(() => {});
    }, POLL_MS);
    return () => clearInterval(id);
  }, [hasAccepted, refreshStatus]);

  const handleAgree = async () => {
    if (!agreeChecked) return;
    setSavingAgree(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseURL}/api/integrations/gmail/accept-terms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ accepted: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to record acceptance");
      }
      setStatus((s) => ({ ...s, termsAcceptedAt: new Date().toISOString() }));
      setDialogOpen(false);
      toast({
        title: "Thank you!",
        description: "Terms accepted. You can now connect an email account.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Could not save",
        description: e instanceof Error ? e.message : "Something went wrong.",
      });
    } finally {
      setSavingAgree(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const redirect = window.location.href;
      const url =
        `${baseURL}/api/integrations/gmail/connect` +
        `?redirect=${encodeURIComponent(redirect)}` +
        `&token=${encodeURIComponent(token)}`;

      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setConnecting(false);
    }
  };

  const needsReconnect =
    reconnectNotice ||
    (hasAccepted && !!status.email && !status.connected) ||
    (hasAccepted && status.reason === "token_expired");

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking email-sending status…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!hasAccepted && (
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Email invoicing is enabled for your account</AlertTitle>
          <AlertDescription className="mt-2">
            Your administrator has granted you permission to send invoices via email.
            Please review and accept the terms to activate this feature.
            <div className="mt-3">
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                Read & Agree
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {needsReconnect && (
        <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-500/10">
          <AlertTitle className="font-medium">Gmail disconnected — action required</AlertTitle>
          <AlertDescription className="mt-1">
            {status.reason === "token_expired"
              ? "Your Gmail session has expired. Please reconnect to continue emailing invoices."
              : "To email invoices, please reconnect your Gmail account."}
            {status.lastFailureAt ? (
              <div className="mt-1 text-xs text-muted-foreground">
                Last send failure: {new Date(status.lastFailureAt).toLocaleString()}
              </div>
            ) : null}
            <div className="mt-3">
              <Button size="sm" onClick={handleConnect}>
                <Mail className="h-4 w-4 mr-2" />
                {status.email ? "Reconnect Gmail" : "Connect Gmail"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-4  flex flex-col justify-start gap-8 md:flex-row md:justify-between max-w-fit">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm">
              <div className="font-medium">Email account</div>
              {status.connected && status.email ? (
                <></>
              ) : (
                <div className="text-muted-foreground">
                  {hasAccepted
                    ? "No email connected yet."
                    : "Accept terms first to connect an email."}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status.connected ? (
              <div className="px-3 py-2 rounded-md bg-emerald-50 text-emerald-700 text-sm flex items-center gap-2 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Connected{status.email ? `: ${status.email}` : ""}</span>
              </div>
            ) : (
              <Button onClick={handleConnect} disabled={!hasAccepted || connecting}>
                {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {status.email ? "Reconnect Gmail" : "Connect Gmail"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Terms dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Terms for sending invoices via email</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-64 rounded-md border p-4 text-sm space-y-4">
            <p>
              <strong>1. Scope.</strong> You authorize this app to send invoice emails on your behalf.
            </p>
            <p>
              <strong>2. Data usage.</strong> Email metadata (recipient, subject) and invoice PDFs may be
              processed to deliver messages.
            </p>
            <p>
              <strong>3. Gmail access.</strong> We request the Gmail scope <code>gmail.send</code> solely
              to send messages; we do not read your inbox.
            </p>
            <p>
              <strong>4. Compliance.</strong> You agree to comply with anti-spam and email content policies.
              Do not send unsolicited emails.
            </p>
            <p>
              <strong>5. Revocation.</strong> You can disconnect your email anytime from this screen.
            </p>
            <p>
              <strong>6. Liability.</strong> Use at your own risk; the service is provided “as is”.
            </p>
          </ScrollArea>
          <div className="flex items-center gap-2 pt-3">
            <Checkbox
              id="agree"
              checked={agreeChecked}
              onCheckedChange={(v) => setAgreeChecked(Boolean(v))}
            />
            <label htmlFor="agree" className="text-sm">
              I have read and agree to the terms above.
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAgree} disabled={!agreeChecked || savingAgree}>
              {savingAgree ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Agree & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
