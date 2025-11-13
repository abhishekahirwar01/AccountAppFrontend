'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, LogIn , Lock, User } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { loginUser, getCurrentUser } from "@/lib/auth";

export default function UserLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [userId, setUserId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);

  // State for window.location.origin to avoid SSR issues
  const [origin, setOrigin] = React.useState("");

  // Set origin on client side to avoid SSR issues
  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  React.useEffect(() => {
    const u = getCurrentUser();
    if (!u) return;

    if (u.role === "master") {
      router.replace("/admin/dashboard");
    } else if (u.role === "admin" || u.role === "customer") {
      router.replace("/dashboard");
    } else {
      router.replace("/user-dashboard");
    }
  }, [router]);

//  // Add this useEffect to your login pages
// React.useEffect(() => {
//   // Ensure login page is the only entry in history
//   window.history.replaceState(null, '', window.location.pathname);
  
//   const handlePopState = () => {
//     // Keep users on login page if they try to go back
//     window.history.pushState(null, '', window.location.pathname);
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
      const user = await loginUser(userId, password, captchaToken);

      localStorage.setItem("user", JSON.stringify({
        _id: user._id,
        id: user._id,
        userName: user.userName,
        userId: user.userId,
        contactNumber: user.contactNumber,
        address: user.address,
        role: user.role,
        permissions: user.permissions || [],
        companies: user.companies || [],
        createdByClient: user.createdByClient,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));

      localStorage.setItem("_id", user._id);
      localStorage.setItem("userId", user.userId);
      localStorage.setItem("userName", user.userName || "");
      localStorage.setItem("role", user.role);
      
      if (user.companies && user.companies.length > 0) {
        localStorage.setItem("companies", JSON.stringify(user.companies));
      }
      
      if (user.createdByClient) {
        localStorage.setItem("createdByClient", user.createdByClient);
      }

      if (user.role === "master") {
        router.push("/admin/dashboard");
      } 
      else if(user.role === "admin" || user.role === "customer" || user.role === "client"){
        router.push("/dashboard")
      }
      else {
        router.push("/user-dashboard");
      }

      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.userName}!`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-200 via-orange-200 to-indigo-200">
                 <button
  onClick={() => router.push('/')}
  className="fixed top-4 left-4 z-50 px-6 py-2.5 bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-400 text-white rounded-2xl text-sm font-medium shadow-md hover:from-[#6DD4EC] hover:via-[#0698BE] hover:to-gray-800 transition-all duration-300"
>
  Go To Home
</button>
      <div className="md:hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-300/50 rounded-full"></div>
          <div className="absolute top-3/4 right-1/3 w-24 h-24 bg-orange-400/40 rounded-full"></div>
        </div>

        <div className="absolute inset-0">
          <div className="absolute top-10 left-20 text-blue-600/30 text-6xl">₹</div>
          <div className="absolute top-40 right-32 text-orange-600/25 text-5xl">%</div>
          <div className="absolute bottom-10 left-32 text-indigo-600/30 text-4xl">*</div>
          <div className="absolute bottom-20 right-20 text-blue-600/25 text-5xl">+</div>
          <div className="absolute bottom-10 right-40 text-orange-600/30 text-5xl">-</div>
          <div className="absolute top-8 right-1/4 text-indigo-600/30 text-5xl">#</div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-2/3 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-300/50 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/3 w-24 h-24 bg-orange-400/40 rounded-full"></div>
        </div>

        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 text-blue-600/30 text-6xl animate-float">₹</div>
          <div className="absolute top-40 right-32 text-orange-600/25 text-5xl animate-float delay-1000">%</div>
          <div className="absolute bottom-32 left-32 text-indigo-600/30 text-4xl animate-float delay-2000">*</div>
          <div className="absolute bottom-40 right-20 text-blue-600/25 text-5xl animate-float delay-1500">+</div>
          <div className="absolute top-1/3 right-20 text-orange-600/30 text-5xl animate-float delay-500">-</div>
          <div className="absolute bottom-1/3 right-1/4 text-indigo-600/30 text-5xl animate-float delay-1200">#</div>
        </div>

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

            <div className="space-y-4">
              <div className="flex items-center space-x-3 group hover:translate-x-2 transition-transform duration-300">
                <div className="w-10 h-10 bg-blue-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm border border-blue-200">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <span className="text-gray-800 font-medium">GST Compliant Invoicing</span>
              </div>
              <div className="flex items-center space-x-3 group hover:translate-x-2 transition-transform duration-300">
                <div className="w-10 h-10 bg-orange-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm border border-orange-200">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <span className="text-gray-800 font-medium">Real-time Financial Insights</span>
              </div>
              <div className="flex items-center space-x-3 group hover:translate-x-2 transition-transform duration-300">
                <div className="w-10 h-10 bg-indigo-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm border border-indigo-200">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <span className="text-gray-800 font-medium">Secure Data Encryption</span>
              </div>
              <div className="flex items-center space-x-3 group hover:translate-x-2 transition-transform duration-300">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-orange-100 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm border border-blue-200">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <span className="text-gray-800 font-medium">Tax Calculation & Filing</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/20 rounded-full backdrop-blur-sm border border-white/0 shadow-lg"></div>
        <div className="absolute top-10 right-10 w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm border border-white/0 shadow-lg"></div>
        <div className="absolute top-20 right-1/4 w-12 h-12 bg-white/20 rounded-full backdrop-blur-sm border border-white/0 shadow-md"></div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="w-full max-w-md">
          <Card className="w-full shadow-2xl bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-3xl">
            <CardHeader className="space-y-6 text-center pt-10 pb-6 px-10">
              <div className="flex flex-col items-center justify-center">
                <a href={origin} className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">
                  <img src="/vinimaylogov.png" alt="Vinimay" className="h-10 w-auto object-cover" />
                  <img src="/vinimaylogotext.png" alt="Vinimay" className="h-6 w-auto object-cover mt-3 ml-[0vh]" />
                </a>
                <p className="text-sm mt-4 text-gray-800">
                  Smart Financial Exchange
                </p>
                <CardTitle className="text-2xl font-bold mt-4 text-gray-800">
                  User Login
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Sign in to your account
                </CardDescription>
              </div>
            </CardHeader>

            <form onSubmit={onSubmit}>
              <CardContent className="space-y-6 px-4 pb-8">
                <div className="space-y-3 transition-all duration-300">
                  <Label htmlFor="userId" className="text-sm font-medium text-gray-700 flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-500" />
                    User ID
                  </Label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition duration-300 group-focus-within:opacity-20"></div>
                    <Input
                      id="userId"
                      type="text"
                      placeholder="Enter your user ID"
                      required
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="bg-white/70 text-gray-900 relative border-slate-200 focus:border-blue-400 transition-all duration-300 rounded-xl py-3 pl-12 pr-4 text-base shadow-sm"
                      disabled={isLoading}
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <User className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 transition-all duration-300">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center">
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
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Lock className="h-5 w-5" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-lg hover:bg-black/5"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-2 transition-all duration-300">
                  <ReCAPTCHA
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                    onChange={(token: React.SetStateAction<string | null>) => setCaptchaToken(token)}
                    onExpired={() => setCaptchaToken(null)}
                  />
                </div>

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
              </CardContent>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}