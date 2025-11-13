// // hooks/usePayments.ts
// "use client";

// import { useEffect, useState } from "react";

// type UsePaymentsOpts = { companyId?: string; from?: string; to?: string };

// export function usePayments(baseURL: string, opts: UsePaymentsOpts) {
//   const [payments, setPayments] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   const qs = new URLSearchParams({
//     ...(opts.companyId && { companyId: opts.companyId }),
//     ...(opts.from && { from: opts.from }),
//     ...(opts.to && { to: opts.to }),
//   }).toString();

//   useEffect(() => {
//     const run = async () => {
//       setLoading(true);
//       try {
//         const token = localStorage.getItem("token") || "";
//         const res = await fetch(`${baseURL}/api/payments${qs ? `?${qs}` : ""}`, {
//           headers: { Authorization: `Bearer ${token}` },
//           cache: "no-store",
//         });
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const json = await res.json();
//         // Flexible parsing like your Transactions tab:
//         const arr = Array.isArray(json)
//           ? json
//           : Array.isArray(json?.payments)
//           ? json.payments
//           : Array.isArray(json?.entries)
//           ? json.entries
//           : json?.data && Array.isArray(json.data)
//           ? json.data
//           : [];
//         setPayments(arr);
//       } catch (e) {
//         console.error(e);
//         setPayments([]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     run();
//   }, [baseURL, qs]);

//   return { payments, loading };
// }








/////////////////////////////////////////////

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Opts = { companyId?: string; from?: string; to?: string };

export function usePayments(baseURL: string, opts: Opts) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const prevKey = useRef<string>("");

  const qs = useMemo(() => {
    const u = new URLSearchParams();
    if (opts.companyId) u.set("companyId", opts.companyId);
    if (opts.from) u.set("from", opts.from);
    if (opts.to) u.set("to", opts.to);
    return u.toString();
  }, [opts.companyId, opts.from, opts.to]);

  useEffect(() => {
    const key = `${baseURL}|${qs}`;
    if (prevKey.current && prevKey.current !== key) {
      setPayments([]);
    }
    prevKey.current = key;

    const run = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${baseURL}/api/payments${qs ? `?${qs}` : ""}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const arr = Array.isArray(json)
          ? json
          : Array.isArray(json?.payments)
          ? json.payments
          : Array.isArray(json?.entries)
          ? json.entries
          : Array.isArray(json?.data)
          ? json.data
          : [];
        setPayments(arr);
      } catch (e) {
        console.error(e);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [baseURL, qs]);

  return { payments, loading };
}
