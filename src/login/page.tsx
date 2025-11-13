
'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import React from 'react';
import { loginMasterAdmin} from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loginType, setLoginType] = React.useState<'admin' | 'customer'>('admin');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await loginMasterAdmin(username, password);
      if (user) {
        router.push('/admin/dashboard');
        toast({
          title: "Login Successful",
          description: `Welcome back!`,
        });
      }
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



  const handleFormSubmit = (e: React.FormEvent) => {
    if (loginType === 'admin') {
      handleAdminLogin(e);
    } 
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl bg-card border">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">AccounTech Pro</CardTitle>
          <CardDescription>
            Professional Accounting Software
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="admin" onValueChange={(value) => setLoginType(value as any)} className="w-full px-6">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="admin">Admin</TabsTrigger>
                <TabsTrigger value="customer">Client</TabsTrigger>
            </TabsList>
        </Tabs>

        <form onSubmit={handleFormSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
               <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-background"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background pr-10"
                   disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                   disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" type="submit"  disabled={isLoading}>
               {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Sign In
            </Button>
             <div className="text-center text-xs text-muted-foreground/80 pt-4">
                <p>
                  {loginType === 'admin' 
                    ? <>Admin: <code className="bg-muted p-1 rounded-sm">masteradmin</code> / <code className="bg-muted p-1 rounded-sm">admin123</code></>
                    : <>Client: <code className="bg-muted p-1 rounded-sm">techcorpclient</code> / <code className="bg-muted p-1 rounded-sm">client123</code></>
                  }
                </p>
             </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
