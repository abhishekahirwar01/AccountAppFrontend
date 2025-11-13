"use client";

import React, { useEffect } from "react";
import { Flag, BarChart3, Briefcase } from "lucide-react";

/**
 * Fully Responsive Process Section
 * - Mobile (< 640px): Card layout with ghost numbers
 * - Tablet (640px-1023px): Enhanced card layout with larger elements
 * - Desktop/Laptop (≥ 1024px): Animated curve layout with hex badges
 */
export default function ProcessSection_NoCurve() {
  const flowSpeed = 3;
  const flowSpeedMiddle = 1;
  const fullPathLength = 1000;
  const initialDrawDuration = "2.5s";

  // Add custom animations on mount
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "process-section-animations";
    style.textContent = `
      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      
      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `;

    // Only add if not already present
    if (!document.getElementById("process-section-animations")) {
      document.head.appendChild(style);
    }

    return () => {
      // Cleanup on unmount
      const existingStyle = document.getElementById(
        "process-section-animations"
      );
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <section className="relative w-full bg-white text-[#0f172a]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-16 pb-6 md:pb-6">
        <div className="text-center">
          <div className="mb-2 md:mb-3 flex items-center justify-center gap-2 md:gap-4 text-cyan-600">
            <span className="inline-block h-[2px] w-6 md:w-10 bg-cyan-500/60" />
            <p className="text-[11px] md:text-[13px] font-semibold tracking-[0.18em] uppercase">
              essentials
            </p>
            <span className="inline-block h-[2px] w-6 md:w-10 bg-cyan-500/60" />
          </div>

          <h1 className="text-[28px] sm:text-[35px] md:text-[42px] lg:text-[48px] font-extrabold tracking-tight px-4">
            <span className="text-black">Streamlined </span>
            <span className="bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-900 bg-clip-text text-transparent">
              {" "}
              Accounting Process
            </span>
          </h1>

          <p className="mt-2 md:mt-[-5px] text-cyan-600 text-[14px] md:text-base px-4">
            Transform your business accounting with Vinimay&apos;s intuitive
            three-step workflow
          </p>
        </div>
      </div>

      {/* ===== MOBILE & TABLET (< 1280px) ===== */}
      <div className="xl:hidden px-4 sm:px-8 md:px-12 lg:px-16 pb-12 space-y-10 sm:space-y-12 md:space-y-14">
        {/* Card 1 */}
        <div className="relative overflow-visible bg-gradient-to-br from-white to-gray-50/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 pr-20 sm:pr-28 md:pr-32 shadow-lg border border-gray-100 opacity-0 animate-[slideInUp_0.6s_ease-out_0.1s_forwards] hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="relative z-10 flex items-start gap-4 sm:gap-6 md:gap-8">
            <div className="flex-shrink-0 mt-1 animate-[bounce_1s_ease-in-out_0.3s]">
              <Hex
                icon={
                  <Flag
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#1d77ff]"
                    strokeWidth={1.7}
                  />
                }
                strongGlow
                tablet
              />
            </div>
            <div className="flex-1">
              <h3 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[32px] font-extrabold text-black mb-2 sm:mb-3 md:mb-4 animate-[fadeIn_0.8s_ease-out_0.2s_backwards]">
                Record Everything
              </h3>
              <p className="text-gray-600 text-[14px] sm:text-[15px] md:text-[17px] lg:text-[18px] leading-relaxed animate-[fadeIn_0.8s_ease-out_0.4s_backwards]">
                Create transactions for sales, purchases, receipts, and payments
                while managing your customer and vendor database
              </p>
            </div>
          </div>
          {/* ghost number */}
          <div className="absolute -top-12 sm:-top-14 md:-top-16 lg:-top-20 -right-1 sm:right-0 text-[120px] sm:text-[140px] md:text-[180px] lg:text-[200px] font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-gray-300 to-gray-100 leading-none pointer-events-none select-none z-0 animate-[fadeInScale_1s_ease-out_0.1s_backwards]">
            1
          </div>
        </div>

        {/* Card 2 */}
        <div className="relative overflow-visible bg-gradient-to-br from-white to-gray-50/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 pr-20 sm:pr-28 md:pr-32 shadow-lg border border-gray-100 opacity-0 animate-[slideInUp_0.6s_ease-out_0.3s_forwards] hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="relative z-10 flex items-start gap-4 sm:gap-6 md:gap-8">
            <div className="flex-shrink-0 mt-1 animate-[bounce_1s_ease-in-out_0.5s]">
              <Hex
                icon={
                  <BarChart3
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#1d77ff]"
                    strokeWidth={1.7}
                  />
                }
                strongGlow
                tablet
              />
            </div>
            <div className="flex-1">
              <h3 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[32px] font-extrabold text-black mb-2 sm:mb-3 md:mb-4 animate-[fadeIn_0.8s_ease-out_0.4s_backwards]">
                Invoice Professionally
              </h3>
              <p className="text-gray-600 text-[14px] sm:text-[15px] md:text-[17px] lg:text-[18px] leading-relaxed animate-[fadeIn_0.8s_ease-out_0.6s_backwards]">
                Generate and send beautiful invoices via email, print for
                records, or download as PDF files
              </p>
            </div>
          </div>
          <div className="absolute -top-12 sm:-top-14 md:-top-16 lg:-top-20 -right-1 sm:right-0 text-[120px] sm:text-[140px] md:text-[180px] lg:text-[200px] font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-gray-300 to-gray-100 leading-none pointer-events-none select-none z-0 animate-[fadeInScale_1s_ease-out_0.3s_backwards]">
            2
          </div>
        </div>

        {/* Card 3 */}
        <div className="relative overflow-visible bg-gradient-to-br from-white to-gray-50/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 pr-20 sm:pr-28 md:pr-32 shadow-lg border border-gray-100 opacity-0 animate-[slideInUp_0.6s_ease-out_0.5s_forwards] hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <div className="relative z-10 flex items-start gap-4 sm:gap-6 md:gap-8">
            <div className="flex-shrink-0 mt-1 animate-[bounce_1s_ease-in-out_0.7s]">
              <Hex
                icon={
                  <Briefcase
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#1d77ff]"
                    strokeWidth={1.7}
                  />
                }
                strongGlow
                tablet
              />
            </div>
            <div className="flex-1">
              <h3 className="text-[22px] sm:text-[26px] md:text-[30px] lg:text-[32px] font-extrabold text-black mb-2 sm:mb-3 md:mb-4 animate-[fadeIn_0.8s_ease-out_0.6s_backwards]">
                Stay On Top
              </h3>
              <p className="text-gray-600 text-[14px] sm:text-[15px] md:text-[17px] lg:text-[18px] leading-relaxed animate-[fadeIn_0.8s_ease-out_0.8s_backwards]">
                Automate payment reminders for due invoices and manage inventory
                with real-time stock tracking
              </p>
            </div>
          </div>
          <div className="absolute -top-12 sm:-top-14 md:-top-16 lg:-top-20 -right-1 sm:right-0 text-[120px] sm:text-[140px] md:text-[180px] lg:text-[200px] font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-gray-300 to-gray-100 leading-none pointer-events-none select-none z-0 animate-[fadeInScale_1s_ease-out_0.5s_backwards]">
            3
          </div>
        </div>
      </div>
      {/* ===== END MOBILE & TABLET ===== */}

      {/* ===== DESKTOP (≥ 1280px) ===== */}
      <div className="relative max-w-full mx-auto px-3 md:px-8 pb-8 md:pb-14 hidden xl:block">
        <div className="relative h-[500px] md:h-[500px] w-[95%] md:w-[90%] ml-4 md:ml-8 lg:ml-20 rounded-[20px] md:rounded-[28px] overflow-hidden">
          {/* === CURVE SVG (with Animation) === */}
          <svg
            viewBox="0 0 1000 400"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient
                id="gradient-curve"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#2e86de" />
                <stop offset="50%" stopColor="#48dbfb" />
                <stop offset="100%" stopColor="#2e86de" />
              </linearGradient>

              <linearGradient
                id="flow-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#2e86de" stopOpacity="0" />
                <stop offset="30%" stopColor="#48dbfb" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="70%" stopColor="#48dbfb" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#2e86de" stopOpacity="0" />
                <animate
                  attributeName="x1"
                  values="-100%;200%"
                  dur={`${flowSpeed}s`}
                  repeatCount="indefinite"
                  begin={initialDrawDuration}
                />
                <animate
                  attributeName="x2"
                  values="0%;300%"
                  dur={`${flowSpeed}s`}
                  repeatCount="indefinite"
                  begin={initialDrawDuration}
                />
              </linearGradient>

              <linearGradient
                id="flow-gradient-middle"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#48dbfb" stopOpacity="0" />
                <stop offset="40%" stopColor="#ffffff" stopOpacity="0.6" />
                <stop offset="60%" stopColor="#ffffff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#48dbfb" stopOpacity="0" />
                <animate
                  attributeName="x1"
                  values="-80%;220%"
                  dur={`${flowSpeedMiddle}s`}
                  repeatCount="indefinite"
                  begin={initialDrawDuration}
                />
                <animate
                  attributeName="x2"
                  values="20%;320%"
                  dur={`${flowSpeedMiddle}s`}
                  repeatCount="indefinite"
                  begin={initialDrawDuration}
                />
              </linearGradient>

              <linearGradient
                id="flow-gradient-second"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#93c5fd" stopOpacity="0" />
                <stop offset="30%" stopColor="#bfdbfe" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#e0f2fe" stopOpacity="1" />
                <stop offset="70%" stopColor="#bfdbfe" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
                <animate
                  attributeName="x1"
                  values="-100%;200%"
                  dur={`${flowSpeed * 1.2}s`}
                  repeatCount="indefinite} begin={initialDrawDuration}"
                />
                <animate
                  attributeName="x2"
                  values="0%;300%"
                  dur={`${flowSpeed * 1.2}s`}
                  repeatCount="indefinite} begin={initialDrawDuration}"
                />
              </linearGradient>
            </defs>

            {/* Back line with draw */}
            <path
              d="M 50 240 C 200 330, 310 260, 390 170 S 580 20, 695 190 S 880 65, 945 90"
              stroke="#93c5fd"
              strokeWidth="2.1"
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
              strokeDasharray={fullPathLength}
              strokeDashoffset={fullPathLength}
            >
              <animate
                attributeName="stroke-dashoffset"
                from={fullPathLength}
                to="0"
                dur={initialDrawDuration}
                begin="0s"
                fill="freeze"
              />
              <animate
                attributeName="stroke-dasharray"
                to="none"
                dur="0.01s"
                begin={initialDrawDuration}
                fill="freeze"
              />
              <animate
                attributeName="stroke-dashoffset"
                to="0"
                dur="0.01s"
                begin={initialDrawDuration}
                fill="freeze"
              />
            </path>

            {/* Flow highlight on back line */}
            <path
              d="M 50 240 C 200 330, 310 260, 390 170 S 580 20, 695 190 S 880 65, 945 90"
              stroke="url(#flow-gradient-second)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              opacity="0"
            >
              <animate
                attributeName="opacity"
                values="0;0.8"
                dur="0.5s"
                begin={initialDrawDuration}
                fill="freeze"
              />
            </path>

            {/* Front line with draw */}
            <path
              d="M 50 240 C 200 320, 310 250, 390 160 S 580 10, 695 180 S 880 60, 945 90"
              stroke="url(#gradient-curve)"
              strokeWidth="2.1"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={fullPathLength}
              strokeDashoffset={fullPathLength}
            >
              <animate
                attributeName="stroke-dashoffset"
                from={fullPathLength}
                to="0"
                dur={initialDrawDuration}
                begin="0s"
                fill="freeze"
              />
              <animate
                attributeName="stroke-dasharray"
                to="none"
                dur="0.01s"
                begin={initialDrawDuration}
                fill="freeze"
              />
              <animate
                attributeName="stroke-dashoffset"
                to="0"
                dur="0.01s"
                begin={initialDrawDuration}
                fill="freeze"
              />
            </path>

            {/* Flow overlays */}
            <path
              d="M 50 240 C 200 320, 310 250, 390 160 S 580 10, 695 180 S 880 60, 945 90"
              stroke="url(#flow-gradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              opacity="0"
            >
              <animate
                attributeName="opacity"
                values="0;0.9"
                dur="0.5s"
                begin={initialDrawDuration}
                fill="freeze"
              />
            </path>

            <path
              d="M 50 240 C 200 320, 310 250, 390 160 S 580 10, 695 180 S 880 60, 945 90"
              stroke="url(#flow-gradient-middle)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0"
            >
              <animate
                attributeName="opacity"
                values="0;0.7"
                dur="0.5s"
                begin={initialDrawDuration}
                fill="freeze"
              />
            </path>
          </svg>

          {/* Hex badges for desktop */}
          <div className="pointer-events-none absolute inset-0">
            <Hex
              className="absolute left-[7%] md:left-[9.2%] bottom-[200px] md:bottom-[130px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)]"
              big
              strongGlow
              icon={
                <Flag
                  className="w-6 h-6 md:w-7 md:h-7 text-[#1d77ff]"
                  strokeWidth={1.7}
                />
              }
            />
            <Hex
              className="absolute left-[44%] md:left-[49%] top-[100px] md:top-[60px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)]"
              big
              strongGlow
              icon={
                <BarChart3
                  className="w-6 h-6 md:w-7 md:h-7 text-[#1d77ff]"
                  strokeWidth={1.7}
                />
              }
            />
            <Hex
              className="absolute right-[7%] md:right-[9%] top-[200px] md:top-[130px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.15)]"
              big
              strongGlow
              icon={
                <Briefcase
                  className="w-6 h-6 md:w-7 md:h-7 text-[#1d77ff]"
                  strokeWidth={1.7}
                />
              }
            />
          </div>

          {/* Content grid for desktop */}
          <div className="relative h-full grid grid-cols-3 gap-4 px-6 md:px-14">
            {/* 1 */}
            <div className="flex flex-col justify-start pt-16 md:pt-24">
              <div className="bg-transparent">
                <div className="flex items-start">
                  <h3 className="text-[22px] md:text-[24px] font-extrabold text-black">
                    Record Everything
                  </h3>
                  <div className="mt-[-100px] md:mt-[-125px]">
                    <div
                      style={{
                        fontSize: "clamp(90px, 15vw, 140px)",
                        fontWeight: "bold",
                      }}
                      className="bg-clip-text text-transparent bg-gradient-to-b from-gray-400 to-gray-50"
                    >
                      1
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 text-[15px] md:text-[16px] max-w-[270px] mt-[-35px] md:mt-[-40px] text-justify">
                  Create transactions for sales, purchases, receipts, and
                  payments while managing your customer and vendor database
                </p>
              </div>
            </div>

            {/* 2 */}
            <div className="flex flex-col items-center justify-center text-center mt-40">
              <div className="w-full bg-transparent">
                <div className="flex mt-9">
                  <h3 className="text-[22px] md:text-[24px] font-extrabold text-black">
                    Invoice Professionally
                  </h3>
                  <div className="mt-[-100px] md:mt-[-125px]">
                    <div
                      style={{
                        fontSize: "clamp(90px, 15vw, 140px)",
                        fontWeight: "bold",
                      }}
                      className="bg-clip-text text-transparent bg-gradient-to-b from-gray-400 to-gray-50"
                    >
                      2
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 text-[15px] md:text-[16px] max-w-[345px] mx-auto mt-[-35px] md:mt-[-40px] text-justify">
                  Generate and send beautiful invoices via email, print for
                  records, or download as PDF files
                </p>
              </div>
            </div>

            {/* 3 */}
            <div className="flex flex-col justify-end pb-16 items-end">
              <div className="w-auto text-right bg-transparent">
                <div className="flex mt-1">
                  <h3 className="text-[22px] md:text-[24px] font-extrabold text-black">
                    Stay On Top
                  </h3>
                  <div className="mt-[-100px] md:mt-[-125px]">
                    <div
                      style={{
                        fontSize: "clamp(90px, 15vw, 140px)",
                        fontWeight: "bold",
                      }}
                      className="bg-clip-text text-transparent bg-gradient-to-b from-gray-400 to-gray-50"
                    >
                      3
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 text-[15px] md:text-[16px] max-w-[300px] mx-auto mt-[-35px] md:mt-[-40px] text-justify">
                  Automate payment reminders for due invoices and manage
                  inventory with real-time stock tracking
                </p>
              </div>
            </div>
          </div>

          <div className="absolute left-6 right-6 bottom-24 h-12 rounded-full bg-gray-200/20 blur-2xl pointer-events-none" />
        </div>
      </div>
      {/* ===== END DESKTOP ===== */}
    </section>
  );
}

/* ---------- Hex Component ---------- */

function Hex({
  icon,
  className = "",
  big,
  strongGlow,
  tablet,
}: {
  icon: React.ReactNode;
  className?: string;
  big?: boolean;
  strongGlow?: boolean;
  tablet?: boolean;
}) {
  return (
    <div className={className}>
      <div
        className={[
          "relative grid place-items-center bg-white",
          "border-2 sm:border-3 md:border-4 border-cyan-100",
          "shadow-[0_18px_28px_rgba(2,132,199,0.18),0_8px_16px_rgba(0,0,0,0.12),inset_0_-2px_8px_rgba(147,197,253,0.3)]",
          big
            ? "w-[60px] h-[60px] sm:w-[76px] sm:h-[76px] md:w-[92px] md:h-[92px]"
            : tablet
            ? "w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] md:w-[72px] md:h-[72px] lg:w-[80px] lg:h-[80px]"
            : "w-[56px] h-[56px]",
          "rounded-[18%] [clip-path:polygon(25%_6%,75%_6%,94%_50%,75%_94%,25%_94%,6%_50%)]",
          "transform translate-y-0 hover:translate-y-[-2px] transition-transform",
        ].join(" ")}
      >
        {/* inner glow */}
        <div
          className={[
            "pointer-events-none absolute inset-0 rounded-[18%] [clip-path:inherit]",
            strongGlow ? "bg-sky-300/25 blur-xl" : "bg-sky-200/22 blur-md",
          ].join(" ")}
        />
        {/* Top highlight */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[18%] [clip-path:inherit] bg-gradient-to-b from-white/40 to-transparent"
          style={{
            clipPath:
              "polygon(25% 6%, 75% 6%, 94% 50%, 75% 94%, 25% 94%, 6% 50%)",
          }}
        />
        <div className="relative drop-shadow-[0_2px_3px_rgba(29,119,255,0.3)]">
          {icon}
        </div>
      </div>
    </div>
  );
}
