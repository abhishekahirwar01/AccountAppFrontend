'use client';

import React from 'react';
import { Home, Building2, MapPin, TrendingUp, Key, FileText, Facebook, Twitter, Linkedin, Instagram, Phone, Mail } from 'lucide-react';

const KailashRealEstateFooter = () => {
  return (
    <footer className="relative flex bg-gradient-to-br from-blue-200 via-orange-200 to-indigo-200 w-full">
      {/* Background city skyline pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJjaXR5IiB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjQwIiB4PSIxMCIgeT0iNjAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48cmVjdCB3aWR0aD0iMTUiIGhlaWdodD0iNTAiIHg9IjM1IiB5PSI1MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA0KSIvPjxyZWN0IHdpZHRoPSIyNSIgaGVpZ2h0PSI2MCIgeD0iNTUiIHk9IjQwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PHJlY3Qgd2lkdGg9IjE4IiBoZWlnaHQ9IjQ1IiB4PSI4NSIgeT0iNTUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjY2l0eSkiLz48L3N2Zz4=')] opacity-30"></div>
      
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-300/50 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/3 w-24 h-24 bg-orange-400/40 rounded-full animate-pulse-delay-1"></div>
      </div>

      {/* Footer Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-start lg:items-center">
          
          {/* Left Side - Logo & Branding */}
          <div className="flex flex-col gap-3 md:gap-4 items-center lg:items-start lg:justify-self-start lg:ml-8 xl:ml-20">
            <img
              src="/vinimayMain.png"
              alt="Vinimay Logo"
              className="h-[16vh] sm:h-[18vh] md:h-[20vh] lg:h-[22vh] object-cover object-top"
            />
            <p className="text-xs sm:text-sm md:text-base text-gray-700 text-center lg:text-left">
              Smart Financial Exchange
            </p>
          </div>

          {/* Right Side - Links & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            
            {/* Quick Links */}
            <div>
              <h3 className="text-gray-700 text-lg sm:text-xl font-semibold mb-3 md:mb-4 uppercase tracking-wide">
                Features
              </h3>
              <ul className="space-y-2 md:space-y-3">
                <li>
                  <a href="#E-Invoice" className="text-gray-600 text-sm sm:text-base hover:text-black hover:translate-x-1 transition-all duration-300 inline-block">
                    E-Invoice
                  </a>
                </li>
                <li>
                  <a href="#Inventory-Tracking" className="text-gray-600 text-sm sm:text-base hover:text-black hover:translate-x-1 transition-all duration-300 inline-block">
                    Inventory Tracking
                  </a>
                </li>
                <li>
                  <a href="#Payment-Reminders" className="text-gray-600 text-sm sm:text-base hover:text-black hover:translate-x-1 transition-all duration-300 inline-block">
                    Payment Reminders
                  </a>
                </li>
                <li>
                  <a href="#Multi-Device-Access" className="text-gray-600 text-sm sm:text-base hover:text-black hover:translate-x-1 transition-all duration-300 inline-block">
                    Multi-Device Access
                  </a>
                </li>
                <li>
                  <a href="#Financial-Reports" className="text-gray-600 text-sm sm:text-base hover:text-black hover:translate-x-1 transition-all duration-300 inline-block">
                    Financial Reports   
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Us */}
            <div>
              <h3 className="text-gray-700 text-lg sm:text-xl font-semibold mb-3 md:mb-4 uppercase tracking-wide">
                Contact Us
              </h3>
              <ul className="space-y-3 md:space-y-4">
                <li className="flex items-start gap-2 md:gap-3">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mt-1 flex-shrink-0" />
                  <a href="tel:+917987021896" className="text-gray-600 text-sm sm:text-base hover:text-black transition-colors duration-300">
                    +91 7987021896
                  </a>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mt-1 flex-shrink-0" />
                  <a href="mailto:shardaassociates.in@gmail.com" className="text-gray-600 text-xs sm:text-sm hover:text-black transition-colors duration-300 break-all">
                    shardaassociates.in@gmail.com
                  </a>
                </li>
              </ul>

              {/* Social Media Icons */}
              <div className="mt-5 md:mt-6">
                <p className="text-xs sm:text-sm text-gray-700 mb-2 md:mb-3 uppercase tracking-wide">
                  Follow Us:
                </p>
                <div className="flex gap-3 md:gap-4">
                  <a 
                    href="#" 
                    className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-400 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 transition-all duration-300 hover:scale-110"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </a>
                  <a 
                    href="#" 
                    className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-400 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 transition-all duration-300 hover:scale-110"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </a>
                  <a 
                    href="#" 
                    className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-400 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 transition-all duration-300 hover:scale-110"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </a>
                  <a 
                    href="#" 
                    className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-400 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 transition-all duration-300 hover:scale-110"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-8 md:mt-10 lg:mt-12 pt-5 md:pt-6 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-center md:justify-start items-center gap-3 md:gap-4 text-gray-800 md:pl-8 lg:pl-20">
            <p className="text-xs sm:text-sm text-center md:text-left">
              COPYRIGHT © 2025 VINIMAY. ALL RIGHTS RESERVED
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-25px) translateX(15px) rotate(3deg);
          }
          50% {
            transform: translateY(-15px) translateX(-15px) rotate(-3deg);
          }
          75% {
            transform: translateY(-20px) translateX(20px) rotate(2deg);
          }
        }

        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
          }
          50% {
            transform: translateY(-30px) translateX(-20px) scale(1.05);
          }
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: floatSlow 12s ease-in-out infinite;
        }

        .animate-float-delay-1 {
          animation: float 8s ease-in-out infinite;
          animation-delay: 1s;
        }

        .animate-float-delay-2 {
          animation: float 9s ease-in-out infinite;
          animation-delay: 2s;
        }

        .animate-float-delay-3 {
          animation: float 7s ease-in-out infinite;
          animation-delay: 3s;
        }

        .animate-float-delay-4 {
          animation: float 8.5s ease-in-out infinite;
          animation-delay: 1.5s;
        }

        .animate-float-delay-5 {
          animation: float 9.5s ease-in-out infinite;
          animation-delay: 2.5s;
        }

        .animate-float-delay-6 {
          animation: float 7.5s ease-in-out infinite;
          animation-delay: 0.5s;
        }

        .animate-pulse-delay-1 {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: 1s;
        }

        .animate-pulse-delay-2 {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: 2s;
        }
      `}</style>
    </footer>
  );
};

export default KailashRealEstateFooter;