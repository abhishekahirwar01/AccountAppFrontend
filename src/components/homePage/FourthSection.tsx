"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  FileSpreadsheet,
  Send,
  Users,
  ShieldCheck,
  Cloud,
  Lock,
} from "lucide-react";

/* ----------------------------- Utils: in-view ----------------------------- */
function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      {
        root: null,
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.15,
        ...(options || {}),
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, inView };
}

/** Icon badge with optional tiny overlay (bottom-right) */
function IconBadge({
  MainIcon,
  OverlayIcon,
  bgSolid,
  ringFrom,
  ringTo,
  iconClass = "text-white",
  show,
  delayMs = 0,
}: {
  MainIcon: React.ElementType;
  OverlayIcon?: React.ElementType;
  bgSolid: string;
  ringFrom: string;
  ringTo: string;
  iconClass?: string;
  show?: boolean;
  delayMs?: number;
}) {
  return (
    <div
      className={`relative w-12 h-12 rounded-xl p-[2px] bg-gradient-to-br ${ringFrom} ${ringTo}
        shadow-[0_10px_24px_rgba(2,132,199,0.12)]
        transform transition-all duration-500 ease-out
        ${
          show
            ? "opacity-100 scale-100 rotate-0"
            : "opacity-0 scale-75 -rotate-3"
        }`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <div
        className={`w-full h-full rounded-[10px] grid place-items-center ${bgSolid}`}
      >
        <MainIcon
          className={`w-5 h-5 ${iconClass}`}
          strokeWidth={2}
          aria-hidden
        />
      </div>
      {OverlayIcon && (
        <span
          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-md grid place-items-center bg-white shadow-sm
            transform transition-all duration-500 ease-out
            ${show ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
          style={{ transitionDelay: `${Math.max(0, (delayMs || 0) + 80)}ms` }}
        >
          <OverlayIcon
            className="w-3.5 h-3.5 text-slate-700"
            strokeWidth={2}
            aria-hidden
          />
        </span>
      )}
      <span
        className={`pointer-events-none absolute inset-0 rounded-[10px]`}
        style={{
          boxShadow: show
            ? "0 0 0 0 rgba(14,165,233,0.25)"
            : "0 0 0 10px rgba(14,165,233,0)",
          transition: "box-shadow 900ms ease-out",
          transitionDelay: `${delayMs}ms`,
        }}
      />
    </div>
  );
}

export default function FourthSection() {
  const { ref: sectionRef, inView } = useInView<HTMLDivElement>();

  const benefits = [
    {
      title: "Create Professional Invoices Effortlessly",
      description:
        "With Vinimay's intuitive interface, generate GST-compliant invoices in seconds. Choose from multiple templates, automatically calculate taxes, and send invoices directly to customers via email or WhatsApp.",
      MainIcon: FileSpreadsheet,
      OverlayIcon: Send,
      ringFrom: "from-sky-200",
      ringTo: "to-cyan-300",
      bgSolid: "bg-sky-600",
      iconClass: "text-white",
    },
    {
      title: "Multi-Staff Account Management",
      description:
        "Collaborate seamlessly with your team by creating staff accounts with role-based permissions. Assign specific access levels for accountants, sales staff, and inventory managers while maintaining data security.",
      MainIcon: Users,
      OverlayIcon: ShieldCheck,
      ringFrom: "from-indigo-200",
      ringTo: "to-violet-300",
      bgSolid: "bg-indigo-600",
      iconClass: "text-white",
    },
    {
      title: "Secure Cloud Backup & Data Protection",
      description:
        "Your financial data is automatically backed up with enterprise-grade security. Access your accounts from any device while ensuring complete data protection and business continuity.",
      MainIcon: Cloud,
      OverlayIcon: Lock,
      ringFrom: "from-emerald-200",
      ringTo: "to-teal-300",
      bgSolid: "bg-emerald-600",
      iconClass: "text-white",
    },
  ];

  return (
    <div ref={sectionRef} className="w-full bg-white py-16 px-4 mt-[-32px]">
      <style>{`
        @keyframes floatSlow { 
          0%,100% { transform: translateY(4px) } 
          50% { transform: translateY(-6px) } 
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <h2
          className={`text-3xl md:text-4xl font-bold text-center mb-12
    transform transition-all duration-700 ease-out
    ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
        >
          <span className="text-gray-800">Benefits of Vinimay </span>
          <span className="bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-900 bg-clip-text text-transparent">
            Accounting Software
          </span>
        </h2>

        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
          {/* Left Side - Phone Mockup */}
          <div
            className={`w-full lg:w-1/2 flex relative
              transform transition-all duration-700 ease-out
              ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            style={{ transitionDelay: inView ? "120ms" : "0ms" }}
          >
            <img
              src="/assets/FourthSection2.png"
              alt="GST Billing Software Dashboard"
              className="w-full max-w-2xl h-auto object-contain"
              style={
                inView
                  ? { animation: "floatSlow 5s ease-in-out 400ms infinite" }
                  : {}
              }
            />
          </div>

          {/* Right Side - Benefits List */}
          <div className="w-full lg:w-1/2 space-y-7">
            {benefits.map(
              (
                {
                  title,
                  description,
                  MainIcon,
                  OverlayIcon,
                  ringFrom,
                  ringTo,
                  bgSolid,
                  iconClass,
                },
                i
              ) => {
                const baseDelay = 180 + i * 140;
                return (
                  <div
                    key={i}
                    className={`flex gap-4 transform transition-all duration-700 ease-out
                      ${
                        inView
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-20"
                      }`}
                    style={{
                      transitionDelay: inView ? `${baseDelay}ms` : "0ms",
                    }}
                  >
                    <div className="flex-shrink-0 mt-2">
                      <IconBadge
                        MainIcon={MainIcon}
                        OverlayIcon={OverlayIcon}
                        ringFrom={ringFrom}
                        ringTo={ringTo}
                        bgSolid={bgSolid}
                        iconClass={iconClass}
                        show={inView}
                        delayMs={baseDelay + 60}
                      />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        {title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-justify">
                        {description}
                      </p>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
