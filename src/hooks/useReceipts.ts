// // hooks/useReceipts.ts
// "use client";
// import { useEffect, useState } from "react";

// export function useReceipts(baseURL: string, opts: { companyId?: string; from?: string; to?: string }) {
//   const [data, setData] = useState<any[]>([]);
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
//         const res = await fetch(`${baseURL}/api/receipts${qs ? `?${qs}` : ""}`, {
//           headers: { Authorization: `Bearer ${token}` },
//           cache: "no-store",
//         });
//         const json = await res.json();
//         const arr = Array.isArray(json) ? json : Array.isArray(json?.receipts) ? json.receipts : [];
//         setData(arr);
//       } catch {
//         setData([]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     run();
//   }, [baseURL, qs]);

//   return { receipts: data, loading };
// }











//////////////////////////////////////////////////////////////////////////////////


"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Opts = { companyId?: string; from?: string; to?: string };

export function useReceipts(baseURL: string, opts: Opts) {
  const [receipts, setReceipts] = useState<any[]>([]);
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
    // clear immediately when filter changes to avoid showing stale results
    if (prevKey.current && prevKey.current !== key) {
      setReceipts([]);
    }
    prevKey.current = key;

    const run = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${baseURL}/api/receipts${qs ? `?${qs}` : ""}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const arr = Array.isArray(json)
          ? json
          : Array.isArray(json?.receipts)
          ? json.receipts
          : Array.isArray(json?.entries)
          ? json.entries
          : Array.isArray(json?.data)
          ? json.data
          : [];
        setReceipts(arr);
      } catch (e) {
        console.error(e);
        setReceipts([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [baseURL, qs]);

  return { receipts, loading };
}

