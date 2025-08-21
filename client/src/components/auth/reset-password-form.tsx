import { useState, useEffect } from "react";
import { useSearchParams, Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { AlertCircle, Eye, EyeOff, Lock, Home, CheckCircle, GraduationCap } from "lucide-react";
import { toast } from "../../hooks/use-toast";
import { ThreeScene } from "../three-scene";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/validate-reset-token/${token}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
          setError(data.error || "Invalid or expired reset link");
        }
      } catch (err) {
        setIsValidToken(false);
        setError("Failed to validate reset link");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        toast({
          title: "Success",
          description: "Your password has been reset successfully",
        });
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Header */}
        <header className="relative z-50 px-4 py-6">
          <div className="container mx-auto flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => setLocation("/")}
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 backdrop-blur-sm">
                <GraduationCap className="h-8 w-8 text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                GradeMe
              </h1>
            </div>
          </div>
        </header>
        
        {/* Main content with Three.js background */}
        <section className="relative overflow-hidden min-h-[calc(100vh-88px)] flex items-center justify-center">
          {/* Three.js Background */}
          <div className="absolute inset-0 z-0">
            <ThreeScene className="w-full h-full" />
          </div>
          
          {/* Dark mode overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 z-10"></div>
          <div className="absolute inset-0 backdrop-blur-[1px] z-15"></div>
          
          {/* Content */}
          <div className="relative z-20 container mx-auto px-4">
            <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white">Validating Reset Link</CardTitle>
                <CardDescription className="text-gray-200">
                  Please wait while we validate your reset link...
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent"></div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  // Show error state if token is invalid
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Header */}
        <header className="relative z-50 px-4 py-6">
          <div className="container mx-auto flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => setLocation("/")}
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 backdrop-blur-sm">
                <GraduationCap className="h-8 w-8 text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                GradeMe
              </h1>
            </div>
          </div>
        </header>
        
        {/* Main content with Three.js background */}
        <section className="relative overflow-hidden min-h-[calc(100vh-88px)] flex items-center justify-center">
          {/* Three.js Background */}
          <div className="absolute inset-0 z-0">
            <ThreeScene className="w-full h-full" />
          </div>
          
          {/* Dark mode overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 z-10"></div>
          <div className="absolute inset-0 backdrop-blur-[1px] z-15"></div>
          
          {/* Content */}
          <div className="relative z-20 container mx-auto px-4">
            <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-red-500/20 rounded-full">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-white">Invalid Reset Link</CardTitle>
                <CardDescription className="text-gray-200">
                  {error || "This password reset link is invalid or has expired"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-red-500/20 rounded-lg border border-red-400/30">
                  <p className="text-sm text-red-200">
                    Please request a new password reset link
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Home className="h-4 w-4 mr-2" />
                    Go to Login
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Header */}
        <header className="relative z-50 px-4 py-6">
          <div className="container mx-auto flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => setLocation("/")}
            >
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 backdrop-blur-sm">
                <GraduationCap className="h-8 w-8 text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                GradeMe
              </h1>
            </div>
          </div>
        </header>
        
        {/* Main content with Three.js background */}
        <section className="relative overflow-hidden min-h-[calc(100vh-88px)] flex items-center justify-center">
          {/* Three.js Background */}
          <div className="absolute inset-0 z-0">
            <ThreeScene className="w-full h-full" />
          </div>
          
          {/* Dark mode overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 z-10"></div>
          <div className="absolute inset-0 backdrop-blur-[1px] z-15"></div>
          
          {/* Content */}
          <div className="relative z-20 container mx-auto px-4">
            <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-green-500/20 rounded-full">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-white">Password Reset</CardTitle>
                <CardDescription className="text-gray-200">
                  Your password has been successfully reset
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-green-500/20 rounded-lg border border-green-400/30">
                  <p className="text-sm text-green-200">
                    You can now log in with your new password
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Home className="h-4 w-4 mr-2" />
                    Go to Login
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="relative z-50 px-4 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => setLocation("/")}
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 backdrop-blur-sm">
              <GraduationCap className="h-8 w-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              GradeMe
            </h1>
          </div>
        </div>
      </header>
      
      {/* Main content with Three.js background */}
      <section className="relative overflow-hidden min-h-[calc(100vh-88px)] flex items-center justify-center">
        {/* Three.js Background */}
        <div className="absolute inset-0 z-0">
          <ThreeScene className="w-full h-full" />
        </div>
        
        {/* Dark mode overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 z-10"></div>
        <div className="absolute inset-0 backdrop-blur-[1px] z-15"></div>
        
        {/* Content */}
        <div className="relative z-20 container mx-auto px-4">
          <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <Lock className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">Reset Password</CardTitle>
              <CardDescription className="text-gray-200">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}
                <div className="text-xs text-gray-300">
                  <p>Password must be at least 6 characters long</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3">
                <Button
                  type="submit"
                  disabled={isLoading || !password || !confirmPassword}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Reset Password
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
}