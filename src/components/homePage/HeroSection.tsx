"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** size of the moving dot (Tailwind w-14 h-14 = 56px) */
const BALL_SIZE = 56;
const BALL_SIZE_MOBILE = 40; // Smaller size for mobile

/** Bounding box of the TOP-RIGHT square on the hero artwork (in % of hero size) */
const BOX_PCT = {
  left: 0.78,
  top: 0.1,
  width: 0.16,
  height: 0.26,
};

// Mobile specific box (adjusted for better visibility)
const BOX_PCT_MOBILE = {
  left: 0.65,
  top: 0.15,
  width: 0.3,
  height: 0.2,
};

const Navbar = () => {
  const router = useRouter();
  const onLoginClick = () => {
    router.push("/client-login");
  };

  return (
    <nav className="absolute top-0 left-0 w-full z-20 bg-transparent ">
      <div className="container mx-auto px-6 py-mb-6 flex items-center justify-between  ">
        {/* Logo Section */}
        <div className="flex items-center ">
          <img
            src="/assets/vinimaylogo.png"
            alt="Vinimay Logo"
            className="md:h-[8vh] h-[5vh]"
          />
          <img
            src="/assets/vinimaylogotext.png"
            alt="Vinimay Text"
            className="md:h-[6vh] object-cover  mt-8 ml-[-1vh] h-[3vh]"
          />
        </div>

        {/* Login Button */}
        <button
          onClick={onLoginClick}
          className="md:flex-inline px-6 py-2.5 bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-400 text-white rounded-2xl text-sm font-medium shadow-md hover:from-[#6DD4EC] hover:via-[#0698BE] hover:to-gray-800 transition-all duration-300"
        >
          Log in Now
        </button>
      </div>
    </nav>
  );
};

export default function HeroSection() {
  const router = useRouter();

  // ball 1 (left area)
  const [ballPosition, setBallPosition] = useState({ x: 100, y: 150 });
  const [velocity, setVelocity] = useState({ x: 0.8, y: 0.6 });

  // ball 2 (TOP-RIGHT BOX)
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [boxPx, setBoxPx] = useState({
    left: 1000,
    top: 150,
    width: 200,
    height: 220,
  });
  const [ballPosition2, setBallPosition2] = useState({ x: 1200, y: 200 });
  const [velocity2, setVelocity2] = useState({ x: -0.7, y: 0.5 });
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /** size of the moving dot (Tailwind w-14 h-14 = 56px) */
  const BALL_SIZE = 56;
  const BALL_SIZE_MOBILE = 40; // Smaller size for mobile

  /** Bounding box of the TOP-RIGHT square on the hero artwork (in % of hero size) */
  const BOX_PCT = {
    left: 0.78,
    top: 0.1,
    width: 0.16,
    height: 0.26,
  };

  // Add this missing constant for mobile
  const BOX_PCT_MOBILE = {
    left: 0.7, // Adjusted for mobile screen
    top: 0.15, // Slightly lower on mobile
    width: 0.2, // Slightly wider on mobile
    height: 0.2, // Adjusted height for mobile
  };

  // compute pixel bounds from percentages whenever the section resizes
  useEffect(() => {
    const computeBox = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();

      // Use different box percentages for mobile vs desktop
      const box = isMobile ? BOX_PCT_MOBILE : BOX_PCT;

      const left = rect.width * box.left;
      const top = rect.height * box.top;
      const width = rect.width * box.width;
      const height = rect.height * box.height;

      setBoxPx({ left, top, width, height });

      // keep ball2 inside after resize
      const ballSize = isMobile ? BALL_SIZE_MOBILE : BALL_SIZE;
      setBallPosition2((prev) => ({
        x: Math.min(Math.max(prev.x, left), left + width - ballSize),
        y: Math.min(Math.max(prev.y, top), top + height - ballSize),
      }));
    };

    computeBox();
    window.addEventListener("resize", computeBox);
    return () => window.removeEventListener("resize", computeBox);
  }, [isMobile]);

  // start ball 2 in the middle of the box once boxPx is known
  useEffect(() => {
    const ballSize = isMobile ? BALL_SIZE_MOBILE : BALL_SIZE;
    setBallPosition2({
      x: boxPx.left + (boxPx.width - ballSize) / 2,
      y: boxPx.top + (boxPx.height - ballSize) / 2,
    });
  }, [boxPx.left, boxPx.top, boxPx.width, boxPx.height, isMobile]);

  useEffect(() => {
    const move = () => {
      const ballSize = isMobile ? BALL_SIZE_MOBILE : BALL_SIZE;

      // ball 1 – limited rectangle
      setBallPosition((prev) => {
        let newX = prev.x + velocity.x;
        let newY = prev.y + velocity.y;
        let vx = velocity.x,
          vy = velocity.y;

        const minX = isMobile ? 20 : 50;
        const maxX = isMobile ? 150 : 350;
        const minY = isMobile ? 120 : 100;
        const maxY = isMobile ? 280 : 400;

        if (newX <= minX || newX >= maxX - ballSize) {
          vx = -vx;
          newX = newX <= minX ? minX : maxX - ballSize;
        }
        if (newY <= minY || newY >= maxY - ballSize) {
          vy = -vy;
          newY = newY <= minY ? minY : maxY - ballSize;
        }

        setVelocity({ x: vx, y: vy });
        return { x: newX, y: newY };
      });

      // ball 2 – bounce inside top-right box
      setBallPosition2((prev) => {
        let newX = prev.x + velocity2.x;
        let newY = prev.y + velocity2.y;
        let vx = velocity2.x,
          vy = velocity2.y;

        const minX = boxPx.left;
        const maxX = boxPx.left + boxPx.width;
        const minY = boxPx.top;
        const maxY = boxPx.top + boxPx.height;

        if (newX <= minX || newX >= maxX - ballSize) {
          vx = -vx;
          newX = newX <= minX ? minX : maxX - ballSize;
        }
        if (newY <= minY || newY >= maxY - ballSize) {
          vy = -vy;
          newY = newY <= minY ? minY : maxY - ballSize;
        }

        setVelocity2({ x: vx, y: vy });
        return { x: newX, y: newY };
      });
    };

    const id = setInterval(move, 16);
    return () => clearInterval(id);
  }, [velocity, velocity2, boxPx, isMobile]);

  const handleLoginClick = () => {
    router.push("/client-login");
  };

  const ballSize = isMobile ? BALL_SIZE_MOBILE : BALL_SIZE;

  return (
    <div className="w-full h-screen overflow-hidden ">
      <section ref={heroRef} className="relative w-full h-screen">
        <Navbar />

        {/* Background for desktop */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/assets/Hero.jpg"
            alt="Hero Background"
            className="w-full h-full object-cover object-top"
          />
        </div>

        {/* Ball 1 - now visible on mobile too */}
        <div
          className="absolute rounded-full shadow-lg"
          style={{
            width: `${ballSize}px`,
            height: `${ballSize}px`,
            left: `${ballPosition.x}px`,
            top: `${ballPosition.y}px`,
            zIndex: 5,
            background: "radial-gradient(circle at 30% 30%, #7FE5FD, #a7a1a1)",
          }}
        />

        {/* Ball 2 — constrained to top-right box, now visible on mobile too */}
        <div
          className="absolute rounded-full shadow-lg"
          style={{
            width: `${ballSize}px`,
            height: `${ballSize}px`,
            left: `${ballPosition2.x}px`,
            top: `${ballPosition2.y}px`,
            zIndex: 5,
            background: "radial-gradient(circle at 30% 30%, #7FE5FD, #a7a1a1)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 pt-24 sm:pt-28 md:pt-32 lg:pt-40 px-4 sm:px-6 md:px-8 lg:px-16  container mx-auto">
          <div className="flex items-center justify-between">
            <div className="w-full md:w-full lg:w-3/4 xl:w-1/2 space-y-4 sm:space-y-6 md:space-y-8 flex flex-col gap-4 items-center justify-center md:justify-start md:items-start mt-20 md:mt-0">
              <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                <span className="text-gray-900">All your financial</span>
                <br />
                <span className="relative inline-block">
                  <span className="text-gray-900">data in </span>
                  <span className="relative z-10 bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-900 bg-clip-text text-transparent">
                    one place
                  </span>
                  <span className="text-gray-900">.</span>
                </span>
              </h1>

              <p className=" text-gray-600 text-xl md:text-xl text-center md:text-start leading-relaxed md:leading-loose max-w-xl rounded-lg">
                Vinimay is a comprehensive accounting platform that centralizes,
                organizes and manages all your business finances. It enables
                effortless transaction processing, automated invoice generation,
                and real-time inventory management.
              </p>

              <div className="hidden md:inline-flex flex-col sm:flex-row items-stretch sm:items-center bg-white rounded-2xl shadow-sm p-3 sm:pl-6 sm:pr-1.5 sm:py-1.5 border border-black/10 w-full sm:w-auto gap-3 sm:gap-0">
                <div className="bg-transparent text-gray-500 text-sm sm:w-48 sm:mr-3 text-center sm:text-left">
                  <span className="text-gray-400 italic">Click here..</span>
                </div>
                <button
                  onClick={handleLoginClick}
                  className="px-7 py-2.5 bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-400 text-white rounded-2xl text-sm hover:from-[#6DD4EC] hover:via-[#0698BE] hover:to-gray-800 transition-all duration-300 cursor-pointer whitespace-nowrap"
                >
                  Contact Us
                </button>
              </div>

              <button
                onClick={handleLoginClick}
                className="md:hidden px-7 py-2.5 bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-400 text-white rounded-2xl text-sm hover:from-[#6DD4EC] hover:via-[#0698BE] hover:to-gray-800 transition-all duration-300 cursor-pointer whitespace-nowrap"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
