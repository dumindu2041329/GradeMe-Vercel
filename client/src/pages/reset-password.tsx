import React from 'react';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home, AlertCircle } from "lucide-react";
import { ThreeScene } from "@/components/three-scene";

export function ResetPasswordPage() {
  // Extract token from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#020817] via-[#0f1729] to-[#020817]">
        <ThreeScene />
        
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-white/5 border-b border-white/10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <a className="flex items-center space-x-3 cursor-pointer">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold text-white">GradeMe</span>
                </a>
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-20">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent pointer-events-none" />
          
          <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-500/20 rounded-full">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">Invalid Reset Link</CardTitle>
              <CardDescription className="text-gray-200">
                The password reset link is invalid or missing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-red-500/20 rounded-lg border border-red-400/30">
                <p className="text-sm text-red-200">
                  Please request a new password reset link from the login page
                </p>
              </div>
              <Link href="/">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}