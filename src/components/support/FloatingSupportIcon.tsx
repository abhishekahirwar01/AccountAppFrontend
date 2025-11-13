"use client";

import * as React from "react";
import { MessageCircle, X, Send, HelpCircle, Clock, Mail, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupport } from "@/contexts/support-context";
import { usePathname } from "next/navigation";

export function FloatingSupportIcon(): React.JSX.Element | null {
  const { isOpen, toggleSupport } = useSupport();

    const pathname = usePathname();
    console.log("🔧 FloatingSupportIcon render:", { isOpen });
      // Hide on dashboard page
  const hideFloatingButton = pathname === "/dashboard";
  return (
    <>
      {/* Enhanced Floating Support Button with Pulse Animation */}
        {!hideFloatingButton && (
      <Button
        onClick={toggleSupport}
        className={`
          fixed bottom-6 right-6 z-40 
          h-16 w-16 rounded-full 
          bg-gradient-to-br from-blue-600 to-purple-600 
          hover:from-blue-700 hover:to-purple-700
          shadow-2xl shadow-blue-500/25 
          hover:shadow-2xl hover:shadow-blue-500/40
          transition-all duration-300 
          transform hover:scale-110
          group
          ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"}
        `}
        size="icon"
      >
        {/* Pulse Animation Ring */}
        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
        
        <MessageCircle className="h-7 w-7 text-white relative z-10" />
        
        {/* Tooltip on Hover */}
        <div className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Need help? Contact us!
        </div>
        
        <span className="sr-only">Open Support</span>
      </Button>
        )}
      {/* Enhanced Overlay with Smooth Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md transition-opacity duration-300"
          onClick={toggleSupport} 
        />
      )}

      {/* Enhanced Support Panel with Slide-in Animation */}
      <div
        className={`
          fixed top-0 right-0 z-50 h-full w-full max-w-md 
          transform transition-all duration-500 ease-out
          ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        `}
      >
        <SupportPanel />
      </div>
    </>
  );
}

// Types for the form data
interface SupportFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface SupportResult {
  type: 'success' | 'error';
  message: string;
}

// Enhanced Support Panel Component
function SupportPanel(): React.JSX.Element {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { toggleSupport } = useSupport();
  const [formData, setFormData] = React.useState<SupportFormData>({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = React.useState<boolean>(false);
  const [result, setResult] = React.useState<SupportResult | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${baseURL}/api/support/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();
      
      if (response.ok) {
        setResult({ 
          type: "success", 
          message: responseData.message 
        });
        setFormData({ name: "", email: "", subject: "", message: "" });
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => setResult(null), 5000);
      } else {
        throw new Error(responseData.message);
      }
    } catch (error) {
      setResult({ 
        type: "error", 
        message: error instanceof Error ? error.message : "Network error occurred" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-white to-gray-50/30 shadow-2xl border-l border-gray-200/50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Support Center</h2>
              <p className="text-blue-100 text-sm">We're here to help you!</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSupport}
            className="h-9 w-9 bg-white/20 hover:bg-white/30 text-white"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>

      {/* Enhanced Form Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Enhanced Result Message */}
          {result && (
            <div className={`mb-6 rounded-xl p-4 border-l-4 shadow-sm ${
              result.type === "success" 
                ? "bg-green-50 border-green-400 text-green-800" 
                : "bg-red-50 border-red-400 text-red-800"
            }`}>
              <div className="flex items-center">
                <div className={`p-2 rounded-full mr-3 ${
                  result.type === "success" ? "bg-green-100" : "bg-red-100"
                }`}>
                  {result.type === "success" ? (
                    <Send className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </div>
                <span className="font-medium">{result.message}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field with Icon */}
            <div className="space-y-2">
              <label htmlFor="name" className="flex items-center text-sm font-semibold text-gray-700">
                <User className="h-4 w-4 mr-2 text-blue-600" />
                Your Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm 
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                         transition-all duration-200 bg-white/50 text-black"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email Field with Icon */}
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center text-sm font-semibold text-gray-700">
                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm 
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                         transition-all duration-200 bg-white/50 text-black"
                placeholder="your@email.com"
              />
            </div>

            {/* Subject Field with Icon */}
            <div className="space-y-2">
              <label htmlFor="subject" className="flex items-center text-sm font-semibold text-gray-700">
                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                Subject *
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm 
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                         transition-all duration-200 bg-white/50 appearance-none text-black"
              >
                <option value="">What can we help you with?</option>
                <option value="Bug Report">🐛 Bug Report</option>
                <option value="Feature Request">💡 Feature Request</option>
                <option value="Account Help">🔐 Account Help</option>
                <option value="Billing Question">💰 Billing Question</option>
                <option value="Other">❓ Other Inquiry</option>
              </select>
            </div>

            {/* Message Field with Icon */}
            <div className="space-y-2">
              <label htmlFor="message" className="flex items-center text-sm font-semibold text-gray-700">
                <MessageCircle className="h-4 w-4 mr-2 text-blue-600" />
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm 
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                         transition-all duration-200 bg-white/50 resize-none text-black"
                placeholder="Please describe your issue or question in detail. The more information you provide, the better we can help you!"
              />
            </div>

            {/* Enhanced Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 
                       hover:from-blue-700 hover:to-purple-700 
                       text-white font-semibold text-sm 
                       transform transition-all duration-200 
                       hover:scale-[1.02] active:scale-[0.98]
                       shadow-lg shadow-blue-500/25 
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending Message...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </div>
              )}
            </Button>
          </form>

          {/* Enhanced Support Info */}
          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-700">Support Information</h3>
            </div>
            <div className="bg-blue-50/50 rounded-xl p-4 space-y-2">
              <p className="text-xs text-gray-600 flex items-center">
                <span className="font-semibold mr-1">Support Hours:</span> 
                Mon-Sat, 10AM-7PM IST
              </p>
              <p className="text-xs text-gray-600 flex items-center">
                <span className="font-semibold mr-1">Response Time:</span> 
                Typically within 24 hours
              </p>
             
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}