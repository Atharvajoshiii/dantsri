// components/LoginForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signInWithEmail } from "@/services/adminuser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, Shield, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmail(email, password);
      router.push("/admin/patients"); // Redirect to dashboard after login
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during login';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null; // Prevent SSR flash
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-100 via-teal-50 to-indigo-100 py-10 px-4 relative">
      {/* Abstract background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
            className="mb-5 flex justify-center"
          >
            {/* Logo without white box container */}
            <Image 
              src="/dantsrilogo.png" 
              alt="DantSri Dental Clinic Logo" 
              width={300} 
              height={305}
              className="object-contain drop"
              onError={(e) => {
                e.currentTarget.src = "/placeholder-logo.jpg";
              }}
            />
          </motion.div>

          <Card className="relative border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] backdrop-blur-sm bg-white/90">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-teal-500/5 z-0"></div>
            <div className="relative z-10 bg-white/95 shadow-xl rounded-2xl border border-white/40">
              {/* Enhanced gradient top bar */}
              <div className="h-2 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600"></div>
              
              <CardHeader className="pt-6 pb-4 px-8">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="flex justify-center mb-3">
                    <motion.div 
                      whileHover={{ rotate: [0, -5, 5, -5, 5, 0], transition: { duration: 0.5 } }}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg"
                    >
                      <Shield className="h-8 w-8 text-white" />
                    </motion.div>
                  </div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                    Administrator Access
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    Sign in to manage your clinic operations
                  </CardDescription>
                </motion.div>
              </CardHeader>
              
              <CardContent className="px-8 py-4">
                <motion.form 
                  onSubmit={handleSubmit} 
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert variant="destructive" className="bg-red-50 text-red-600 py-2 text-sm border border-red-200 rounded-xl shadow-sm">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-teal-500" />
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-4 h-11 bg-white/50 backdrop-blur-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm group-hover:shadow-md transition-all duration-300"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400/0 via-blue-400/0 to-indigo-400/0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 -z-10"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center">
      <Lock className="h-4 w-4 mr-2 text-teal-500" />
      Password
    </Label>
    <Link href="/auth/forgot_password" className="text-xs font-medium text-teal-600 hover:text-teal-800 transition-colors flex items-center group">
      Forgot password?
      <ArrowRight className="ml-1 h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  </div>
  <div className="relative group">
    <Input
      id="password"
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
      className="pl-4 h-11 bg-white/50 backdrop-blur-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm group-hover:shadow-md transition-all duration-300"
    />
    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400/0 via-blue-400/0 to-indigo-400/0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 -z-10"></div>
  </div>
</div>
                  
                  <div className="flex items-center pt-1">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        id="remember"
                        className="peer h-5 w-5 text-teal-500 focus:ring-teal-400 border-gray-300 rounded transition-all"
                      />
                      <div className="absolute h-5 w-5 rounded bg-teal-100/0 peer-checked:bg-teal-100/50 transition-all duration-200"></div>
                    </div>
                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-600">
                      Remember this device
                    </label>
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-2"
                  >
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white h-11 mt-2 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl font-medium overflow-hidden relative"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        <>
                          <span className="absolute inset-0 bg-white/20 blur-md scale-150 animate-pulse-slow opacity-0 hover:opacity-100 transition-opacity duration-1000"></span>
                          <span className="flex items-center justify-center relative z-10">
                            Sign in to Dashboard
                            <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                          </span>
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              </CardContent>
              
              
              
              <CardFooter className="py-3 flex justify-between bg-gradient-to-r from-gray-50 to-blue-50/30 px-8 text-xs text-gray-500">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Link href="/support" className="text-teal-600 hover:text-teal-800 transition-colors flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Need help?
                  </Link>
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="text-gray-400"
                >
                  © 2025 DantSri Dental
                </motion.p>
              </CardFooter>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}