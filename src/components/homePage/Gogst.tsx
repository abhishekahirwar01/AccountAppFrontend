"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

export default function Gogst() {
  return (
    <div className="min-h-screen bg-gradient-to-br bg-white w-full flex items-center justify-center px-4 py-8 md:py-0">
      <div className="max-w-7xl w-full flex flex-col md:flex-row gap-8 md:gap-12 items-center">
        {/* Left Content Section */}
        <div className="space-y-6 md:space-y-8 flex-1">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-gray-900 leading-tight flex items-center gap-2 md:gap-3">
              <span className="block w-1 h-8 md:h-11 bg-blue-500 rounded-full"></span>
              <span className="flex flex-col items-start md:items-end md:flex-row">
                <span className="flex items-end flex-wrap">
                  <span className="relative text-5xl sm:text-6xl md:text-7xl lg:text-7xl">
                    P
                  </span>
                  <span className="relative text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-black mr-2 md:mr-3">
                    rint the way
                  </span>
                  <span className="relative text-2xl sm:text-3xl md:text-4xl lg:text-5xl bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-900 bg-clip-text text-transparent">
                    you want
                  </span>
                </span>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 font-medium hidden md:block">
              A4, A5, Thermal
            </p>
          </div>

          <p className="text-base md:text-lg text-gray-700 leading-relaxed w-full md:w-[85%] lg:w-[70%] hidden md:block">
            With our free GST software you can print beautiful and GST-compliant
            invoices hassle-free. Go GST Bill offers many different invoice
            formats in different size, you can choose any of them as per your
            business need. Our free GST billing software makes the whole process
            easy and simple.
          </p>

          <button className="w-full sm:w-auto bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-400 text-white font-bold py-3 md:py-4 px-6 md:px-8 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-md hover:from-[#6DD4EC] hover:via-[#0698BE] hover:to-gray-800  md:flex">
            <span className="text-sm md:text-base lg:text-lg">
              CREATE YOUR FREE ACCOUNT
            </span>
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Right Image Section - Desktop & Tablet */}
        <div className="relative w-full md:w-auto justify-center md:justify-start hidden md:flex flex-1">
          <div className="relative">
            <img
              src="/assets/Invoiceimage.png"
              alt="Invoice Preview"
              className="h-[60vh] md:h-[70vh] lg:h-[90vh] object-contain"
            />
          </div>
        </div>

        {/* Mobile Layout - Image on top, content below */}
        <div className="w-full flex flex-col items-center gap-6 md:hidden">
          <div className="relative w-full flex justify-center">
            <img
              src="/assets/Invoiceimage.png"
              alt="Invoice Preview"
              className="h-[40vh] object-contain"
            />
          </div>

          <div className="w-full space-y-4">
            <p className="text-lg text-gray-600 font-medium">A4, A5, Thermal</p>

            <p className="text-base text-gray-700 leading-relaxed">
              With our free GST software you can print beautiful and
              GST-compliant invoices hassle-free. Go GST Bill offers many
              different invoice formats in different size, you can choose any of
              them as per your business need. Our free GST billing software
              makes the whole process easy and simple.
            </p>

            <button className="w-11/12 mx-auto bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-400 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-lg flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 transform hover:scale-105 shadow-md hover:from-[#6DD4EC] hover:via-[#0698BE] hover:to-gray-800 sm:w-full">
              <span className="text-xs sm:text-sm">
                CREATE YOUR FREE ACCOUNT
              </span>
              <ArrowRight className="w-3 h-3 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
