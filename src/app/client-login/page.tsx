"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  Key,
  Loader2,
  LogIn,
  Mail,
  User,
  Lock,
  Smartphone,
} from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { loginClientBySlug, getCurrentUser } from "@/lib/auth";
import {
  getCurrentUserNew as getSession,
  saveSession,
  scheduleAutoLogout,
} from "@/lib/authSession";
import { requestClientOtp, loginClientBySlugWithOtp } from "@/lib/auth";
import { jwtDecode } from "jwt-decode"; // Import jwtDecode

// Add interface for decoded token
interface DecodedToken {
  id: string;
  role: string;
  slug: string;
  iat: number;
  exp: number;
}

export default function ClientLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme } = useTheme();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);

  // OTP state
  const [tab, setTab] = React.useState<"password" | "otp">("password");
  const [otp, setOtp] = React.useState("");
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [resendIn, setResendIn] = React.useState(0); // seconds

  // State for window.location.origin to avoid SSR issues
  const [origin, setOrigin] = React.useState("");

  // Set origin on client side to avoid SSR issues
  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // ✅ guard: if already logged in, never show client login
  React.useEffect(() => {
    const s = getSession(); // null if token missing/expired (also clears it)
    if (!s) return;
    const u = getCurrentUser();
    if (u) {
      if (u.role === "customer") router.replace("/dashboard"); // or "/"
      else if (u.role === "master") router.replace("/admin/dashboard");
    }
  }, [router]);

  // resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

// NUCLEAR OPTION - Completely break back button functionality
// useEffect(() => {
//   if (typeof window === "undefined") return;

//   const currentUrl = window.location.href;
  
//   console.log('🚫 NUCLEAR: Breaking back button on login page');

//   // Fill history stack with current page
//   window.history.replaceState(null, '', currentUrl);
//   window.history.pushState(null, '', currentUrl);
//   window.history.pushState(null, '', currentUrl);

//   const handlePopState = () => {
//     // Always go forward, never back
//     window.history.forward();
//   };

//   window.addEventListener('popstate', handlePopState);
  
//   return () => {
//     window.removeEventListener('popstate', handlePopState);
//   };
// }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      toast({
        variant: "destructive",
        title: "reCAPTCHA Required",
        description: "Please complete the reCAPTCHA verification.",
      });
      return;
    }
    setIsLoading(true);

    try {
      // Login
      const user = await loginClientBySlug(username, password, captchaToken);

      // DEBUG: Check what properties the user object actually has
      console.log("User object from login:", user);
      console.log("User object keys:", Object.keys(user || {}));

      // Validate
      const isCustomer = String(user?.role || "").toLowerCase() === "customer";
      if (!isCustomer || !user?.token) {
        throw new Error("Invalid customer credentials.");
      }

      // Extract ID from JWT token (this is the most reliable method)
      let userId = "";
      try {
        const decoded = jwtDecode<DecodedToken>(user.token);
        userId = decoded.id;
        console.log("Extracted ID from token:", userId);
      } catch (decodeError) {
        console.error("Failed to decode token:", decodeError);
        throw new Error("Failed to process authentication token.");
      }

      // Persist for authSession (expiry-aware)
      saveSession(user.token, {
        role: "customer",
        username: user.username,
        name: user.name,
        email: user.email,
        id: userId,
        slug: user.slug,
      });

      // Keep legacy/local keys other parts of the app use
      localStorage.setItem("tenantSlug", user.slug || "");
      localStorage.setItem("slug", user.slug || "");
      localStorage.setItem("role", "customer");
      localStorage.setItem("username", user.username || "");
      localStorage.setItem("id", userId); // Save the extracted ID

      // Save the complete user object with all properties
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: userId,
          _id: userId, // For compatibility
          role: "customer",
          username: user.username,
          name: user.name,
          email: user.email,
          slug: user.slug,
        })
      );

      // Auto-logout exactly at JWT expiry → back to client login page
      scheduleAutoLogout(user.token, () => {
        localStorage.clear();
        router.replace(`/client-login`);
      });

      // Success
      router.push("/dashboard");
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.name}!`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSendOtp = async () => {
    if (!username.trim()) {
      toast({
        variant: "destructive",
        title: "Username required",
        description: "Enter your client username first.",
      });
      return;
    }
    if (resendIn > 0) return; // still throttled

    setSendingOtp(true);
    try {
      await requestClientOtp(username); // calls /api/clients/request-otp
      setResendIn(45); // match server throttle
      toast({
        title: "OTP sent",
        description: "Check your registered email for the OTP.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const onSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      toast({
        variant: "destructive",
        title: "reCAPTCHA Required",
        description: "Please complete the reCAPTCHA verification.",
      });
      return;
    }
    setIsLoading(true);

    try {
      const user = await loginClientBySlugWithOtp(username, otp, captchaToken); // calls /api/clients/login-otp

      // DEBUG: Check what properties the user object actually has
      console.log("User object from OTP login:", user);
      console.log("User object keys:", Object.keys(user || {}));

      const isCustomer = String(user?.role || "").toLowerCase() === "customer";
      if (!isCustomer || !user?.token) throw new Error("Invalid OTP.");

      // Extract ID from JWT token (this is the most reliable method)
      let userId = "";
      try {
        const decoded = jwtDecode<DecodedToken>(user.token);
        userId = decoded.id;
        console.log("Extracted ID from token:", userId);
      } catch (decodeError) {
        console.error("Failed to decode token:", decodeError);
        throw new Error("Failed to process authentication token.");
      }

      saveSession(user.token, {
        role: "customer",
        username: user.username,
        name: user.name,
        email: user.email,
        id: userId,
        slug: user.slug,
      });

      localStorage.setItem("tenantSlug", user.slug || "");
      localStorage.setItem("slug", user.slug || "");
      localStorage.setItem("role", "customer");
      localStorage.setItem("username", user.username || "");
      localStorage.setItem("id", userId); // Save the extracted ID

      // Save the complete user object with all properties
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: userId,
          _id: userId, // For compatibility
          role: "customer",
          username: user.username,
          name: user.name,
          email: user.email,
          slug: user.slug,
        })
      );

      scheduleAutoLogout(user.token, () => {
        localStorage.clear();
        router.replace(`/client-login`);
      });

      router.push("/dashboard");
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.name}!`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "OTP Login Failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-200 via-orange-200 to-indigo-200">
      {/* Mobile background elements */}
      <div className="md:hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-300/50 rounded-full"></div>
          <div className="absolute top-3/4 right-1/3 w-24 h-24 bg-orange-400/40 rounded-full delay-4000"></div>
        </div>

        {/* Accounting icons floating animation */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-20 text-blue-600/30 text-6xl animate-float">
            ₹
          </div>
          <div className="absolute top-40 right-32 text-orange-600/25 text-5xl animate-float delay-1000">
            %
          </div>
          <div className="absolute bottom-10 left-32 text-indigo-600/30 text-4xl animate-float delay-2000">
            *
          </div>
          <div className="absolute bottom-20 right-20 text-blue-600/25 text-5xl animate-float delay-1500">
            +
          </div>
          <div className="absolute bottom-10 right-40 text-orange-600/30 text-5xl animate-float delay-500">
            -
          </div>
          <div className="absolute top-2 right-1/4 text-indigo-600/30 text-5xl animate-float delay-1200">
            #
          </div>
        </div>
      </div>
          <button
  onClick={() => router.push('/')}
  className="fixed top-4 left-4 z-50 px-6 py-2.5 bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-400 text-white rounded-2xl text-sm font-medium shadow-md hover:from-[#6DD4EC] hover:via-[#0698BE] hover:to-gray-800 transition-all duration-300"
>
  Go To Home
</button>

      {/* Left side - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:flex lg:w-2/3 relative overflow-hidden">
      
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-300/50 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/3 w-24 h-24 bg-orange-400/40 rounded-full delay-4000"></div>
        </div>
        

        {/* Accounting icons floating animation */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 text-blue-600/30 text-6xl animate-float">
            ₹
          </div>
          <div className="absolute top-40 right-32 text-orange-600/25 text-5xl animate-float delay-1000">
            %
          </div>
          <div className="absolute bottom-32 left-32 text-indigo-600/30 text-4xl animate-float delay-2000">
            *
          </div>
          <div className="absolute bottom-40 right-20 text-blue-600/25 text-5xl animate-float delay-1500">
            +
          </div>
          <div className="absolute top-1/3 right-20 text-orange-600/30 text-5xl animate-float delay-500">
            -
          </div>
          <div className="absolute bottom-1/3 right-1/4 text-indigo-600/30 text-5xl animate-float delay-1200">
            #
          </div>
        </div>

        {/* Main content area */}
        <div className="relative z-10 flex flex-col justify-center items-center text-gray-800 px-16 w-full">
          <div className="max-w-md">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-2 h-12 bg-blue-500 rounded-full"></div>
              <h1 className="text-4xl font-bold uppercase tracking-wide text-gray-800">
                Smart Accounting Made Simple
              </h1>
              <div className="h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-2"></div>
            </div>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Manage invoices, track expenses, and grow your business with our
              intuitive accounting platform designed for Indian businesses.
            </p>

            {/* Features list */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 group hover:translate-x-2 transition-transform duration-300">
                <div className="w-10 h-10 bg-blue-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm border border-blue-200">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <span className="text-gray-800 font-medium">
                  GST Compliant Invoicing
                </span>
              </div>
              <div className="flex items-center space-x-3 group hover:translate-x-2 transition-transform duration-300">
                <div className="w-10 h-10 bg-orange-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm border border-orange-200">
                  <svg
                    className="w-5 h-5 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <span className="text-gray-800 font-medium">
                  Real-time Financial Insights
                </span>
              </div>
              <div className="flex items-center space-x-3 group hover:translate-x-2 transition-transform duration-300">
                <div className="w-10 h-10 bg-indigo-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm border border-indigo-200">
                  <svg
                    className="w-5 h-5 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <span className="text-gray-800 font-medium">
                  Secure Data Encryption
                </span>
              </div>
              <div className="flex items-center space-x-3 group hover:translate-x-2 transition-transform duration-300">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-orange-100 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm border border-blue-200">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <span className="text-gray-800 font-medium">
                  Tax Calculation & Filing
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/20 rounded-full backdrop-blur-sm border border-white/0 shadow-lg"></div>
        <div className="absolute top-10 right-10 w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm border border-white/0 shadow-lg"></div>
        <div className="absolute top-20 right-1/4 w-12 h-12 bg-white/20 rounded-full backdrop-blur-sm border border-white/0 shadow-md"></div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="w-full max-w-md">
          <Card className="w-full shadow-2xl bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-3xl">
            <CardHeader className="space-y-2 text-center pt-10 pb-6 px-10">
  <div className="flex flex-col items-center justify-center">
    <a
      href={origin}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center hover:opacity-80 transition-opacity duration-200 cursor-pointer"
    >
      <img
        src="/vinimaylogov.png"
        alt="Vinimay"
        className="h-10 w-auto object-cover"
      />
      <img
        src="/vinimaylogotext.png"
        alt="Vinimay"
        className="h-6 w-auto object-cover mt-3 ml-[0vh]"
      />
    </a>
    <p className="text-sm mt-4 text-gray-800">
      Smart Financial Exchange
    </p>
    <CardTitle className="text-2xl font-bold mt-4 text-gray-800">
      Client Login
    </CardTitle>
    <CardDescription className="text-gray-600">
      Sign in to your account
    </CardDescription>
  </div>
</CardHeader>

            <CardContent className="space-y-2 px-4 pb-8">
              <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as "password" | "otp")}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 mb-6 bg-gradient-to-r from-slate-50 to-blue-50/50 p-1 rounded-2xl border border-slate-200/60 shadow-sm">
                  <TabsTrigger
                    value="password"
                    className="rounded-xl transition-all duration-400 font-medium border-0 hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-200 hover:text-slate-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-200 data-[state=active]:to-blue-400 data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Password
                  </TabsTrigger>
                  <TabsTrigger
                    value="otp"
                    className="rounded-xl transition-all duration-400 font-medium border-0 hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-200 hover:text-slate-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-200 data-[state=active]:to-blue-400 data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    OTP
                  </TabsTrigger>
                </TabsList>

                {/* Password Tab */}
                <TabsContent value="password" className="space-y-2 mt-4">
                  <form onSubmit={onSubmit} className="space-y-2">
                    {/* Username Field */}
                    <div className="space-y-3 transition-all duration-300">
                      <Label
                        htmlFor="username"
                        className="text-sm font-medium text-gray-700 flex items-center"
                      >
                        <User className="w-4 h-4 mr-2 text-blue-500" />
                        Username
                      </Label>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition duration-300 group-focus-within:opacity-20"></div>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Enter your username"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="bg-white/70 text-gray-900 relative border-slate-200 focus:border-blue-400 transition-all duration-300 rounded-xl py-3 pl-12 pr-4 text-base shadow-sm"
                          disabled={isLoading}
                          autoComplete="username"
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <User className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-3 transition-all duration-300">
                      <Label
                        htmlFor="password"
                        className="text-sm font-medium text-gray-700 flex items-center"
                      >
                        <Lock className="w-4 h-4 mr-2 text-blue-500" />
                        Password
                      </Label>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition duration-300 group-focus-within:opacity-20"></div>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-white/70 text-gray-900 relative border-slate-200 focus:border-blue-400 transition-all duration-300 rounded-xl py-3 pl-12 pr-12 text-base shadow-sm"
                            disabled={isLoading}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                          />
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <Lock className="h-5 w-5" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-lg hover:bg-black/5"
                            disabled={isLoading}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* reCAPTCHA */}
                    <div className="flex justify-center pt-2 transition-all duration-300">
                      <ReCAPTCHA
                        sitekey={
                          process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""
                        }
                        onChange={(token) => setCaptchaToken(token)}
                        onExpired={() => setCaptchaToken(null)}
                      />
                    </div>

                    {/* Login Button */}
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl relative overflow-hidden group mt-4"
                      type="submit"
                      disabled={isLoading || !captchaToken}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* OTP Tab */}
                <TabsContent value="otp" className="space-y-2">
                  <form onSubmit={onSubmitOtp} className="space-y-2">
                    {/* Username Field */}
                    <div className="space-y-3 md:flex gap-4 items-center align-middle transition-all duration-300">
                      <Label
                        htmlFor="username-otp"
                        className="text-sm font-medium text-gray-700 flex items-center"
                      >
                        <User className="w-4 h-4 mr-2 text-blue-500" />
                        Username
                      </Label>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition duration-300 group-focus-within:opacity-20"></div>
                        <Input
                          id="username-otp"
                          type="text"
                          placeholder="Enter your username"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="bg-white/70 text-gray-900 relative border-slate-200 focus:border-blue-400 transition-all duration-300 rounded-xl py-3 pl-12 pr-4 text-base shadow-sm"
                          disabled={isLoading || sendingOtp}
                          autoComplete="username"
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <User className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    {/* Send OTP Button */}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={onSendOtp}
                        disabled={sendingOtp || !username || resendIn > 0}
                        className="flex-1 text-gray-700 bg-white/70 border-slate-200 hover:bg-white/90 transition-all duration-300 rounded-xl py-3"
                      >
                        {sendingOtp ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="mr-2 h-4 w-4" />
                        )}
                        {resendIn > 0 ? `Resend in ${resendIn}s` : "Send OTP"}
                      </Button>
                    </div>

                    {/* OTP Field */}
                    <div className="space-y-3 md:flex gap-4 transition-all duration-300">
                      <Label
                        htmlFor="otp"
                        className="text-sm font-medium text-gray-700 flex items-center"
                      >
                        <Key className="w-4 h-4 mr-2 text-blue-500" />
                        Enter OTP
                      </Label>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition duration-300 group-focus-within:opacity-20"></div>
                        <Input
                          id="otp"
                          inputMode="numeric"
                          pattern="\d{6}"
                          maxLength={6}
                          placeholder="6-digit code"
                          value={otp}
                          onChange={(e) =>
                            setOtp(e.target.value.replace(/\D/g, ""))
                          }
                          className="bg-white/70 text-gray-900 relative border-slate-200 focus:border-blue-400 transition-all duration-300 rounded-xl py-3 px-4 text-base shadow-sm text-center tracking-widest font-mono"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* reCAPTCHA */}
                    <div className="flex justify-center pt-2 transition-all duration-300">
                      <ReCAPTCHA
                        sitekey={
                          process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""
                        }
                        onChange={(token) => setCaptchaToken(token)}
                        onExpired={() => setCaptchaToken(null)}
                      />
                    </div>

                    {/* Verify & Sign In Button */}
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl relative overflow-hidden group mt-4"
                      type="submit"
                      disabled={isLoading || otp.length !== 6 || !captchaToken}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                          Verify & Sign In
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
