import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, BookOpen, Award, Users, Lock, ChevronUp } from "lucide-react";
import { LoginDialog } from "@/components/login-dialog";
import { ThreeScene } from "@/components/three-scene";
import { useQuery } from "@tanstack/react-query";


interface LandingStatistics {
  activeStudents: number;
  educators: number;
  examsCompleted: number;
  uptime: string;
}

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Fetch live statistics from Supabase
  const { data: stats, isLoading } = useQuery<LandingStatistics>({
    queryKey: ["/api/landing/statistics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Handle scroll to show/hide the scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      // Show button when page is scrolled down 300px
      if (window.scrollY > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Scroll to top function with smooth animation
  const scrollToTop = (): void => {
    // Get the current scroll position
    const currentPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    if (currentPosition > 0) {
      // Custom smooth scroll with better animation
      const scrollDuration = 800; // milliseconds
      const scrollStep = Math.PI / (scrollDuration / 15);
      let count = 0;
      let currentPos = window.pageYOffset;
      
      const cosParameter = currentPos / 2;
      
      const scrollInterval = setInterval(() => {
        if (window.pageYOffset !== 0) {
          count += 1;
          const scrollAmount = cosParameter - cosParameter * Math.cos(count * scrollStep);
          window.scrollTo(0, currentPos - scrollAmount);
        } else {
          clearInterval(scrollInterval);
        }
      }, 15);
    }
  };



  const features = [
    {
      icon: <BookOpen className="h-10 w-10 text-primary" />,
      title: "Online Exams",
      description: "Access and complete exams online from anywhere at any time."
    },
    {
      icon: <Award className="h-10 w-10 text-primary" />,
      title: "Performance Tracking",
      description: "Track your academic progress and performance over time."
    },
    {
      icon: <GraduationCap className="h-10 w-10 text-primary" />,
      title: "Academic Resources",
      description: "Access study materials and resources to help you succeed."
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Administrative Tools",
      description: "Powerful tools for educators to manage students and exams."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <header className="relative z-50 px-4 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => navigate("/")}
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 backdrop-blur-sm">
              <GraduationCap className="h-8 w-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              GradeMe
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Dashboard button removed as requested */}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden min-h-screen flex items-center justify-center">
          {/* Three.js Background */}
          <div className="absolute inset-0 z-0">
            <ThreeScene className="w-full h-full" />
          </div>
          
          {/* Dark mode overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 z-10"></div>
          <div className="absolute inset-0 backdrop-blur-[1px] z-15"></div>
          
          {/* Content */}
          <div className="relative z-20 container mx-auto px-4 text-center">
            <div className="animate-fade-in-up">
              <div className="mt-16 mb-8 p-8 rounded-2xl backdrop-blur-md border shadow-2xl bg-white/5 border-white/10">
                <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r bg-clip-text text-transparent leading-tight from-cyan-400 via-blue-400 to-purple-400">
                  GradeMe
                </h1>
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white/90">
                  Next-Gen Education Platform
                </h2>
                <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed text-white/70">
                  Experience the future of education with our advanced examination management system, 
                  powered by cutting-edge technology and intuitive design.
                </p>
                
                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-300">
                  <LoginDialog 
                    isAdmin={false}
                    trigger={
                      <Button size="lg" className="group px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-r text-white border-0 rounded-xl transform hover:scale-105 from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                        <GraduationCap className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                        Student Portal
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity duration-300 from-cyan-400 to-blue-400"></div>
                      </Button>
                    }
                  />
                  <LoginDialog 
                    isAdmin={true}
                    trigger={
                      <Button size="lg" variant="outline" className="group px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-500 border-2 backdrop-blur-sm rounded-xl transform hover:scale-105 border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white">
                        <Users className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                        Admin Dashboard
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300 from-purple-400 to-pink-400"></div>
                      </Button>
                    }
                  />
                </div>
              </div>
              
              {/* Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 mb-16">
                <div className="p-6 rounded-xl backdrop-blur-md border bg-white/5 border-white/10 text-center">
                  <div className="flex justify-center">
                    <BookOpen className="h-10 w-10 mb-4 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">Smart Exams</h3>
                  <p className="text-white/70">AI-powered examination system with real-time analytics</p>
                </div>
                <div className="p-6 rounded-xl backdrop-blur-md border bg-white/5 border-white/10 text-center">
                  <div className="flex justify-center">
                    <Award className="h-10 w-10 mb-4 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">Performance Tracking</h3>
                  <p className="text-white/70">Comprehensive analytics and progress monitoring</p>
                </div>
                <div className="p-6 rounded-xl backdrop-blur-md border bg-white/5 border-white/10 mb-8 text-center">
                  <div className="flex justify-center">
                    <GraduationCap className="h-10 w-10 mb-4 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">Modern Interface</h3>
                  <p className="text-white/70">Intuitive design with seamless user experience</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating icons */}
          <div className="absolute top-20 left-10 animate-bounce-slow">
            <div className="p-3 rounded-full backdrop-blur-md bg-white/10 border border-white/20">
              <BookOpen className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
          <div className="absolute top-32 right-16 animate-bounce-slow animation-delay-500">
            <div className="p-3 rounded-full backdrop-blur-md bg-white/10 border border-white/20">
              <Award className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
          <div className="absolute bottom-24 left-20 animate-bounce-slow animation-delay-1000">
            <div className="p-4 rounded-full backdrop-blur-md bg-white/10 border border-white/20">
              <GraduationCap className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          
          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
            <div className="animate-bounce">
              <div className="w-6 h-10 border-2 rounded-full p-1 border-white/30">
                <div className="w-1 h-3 rounded-full mx-auto animate-pulse bg-white/50"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-24 overflow-hidden bg-gradient-to-b from-slate-900 to-gray-900">
          {/* Three.js Background */}
          <div className="absolute inset-0 z-0 opacity-30">
            <ThreeScene className="w-full h-full" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 z-10"></div>
          
          <div className="relative z-20 container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r bg-clip-text text-transparent from-cyan-400 via-blue-400 to-purple-400">
                Platform Features
              </h2>
              <p className="text-xl max-w-3xl mx-auto text-white/70">
                Discover the advanced capabilities that make GradeMe the future of education technology
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="group">
                  <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-white/5 backdrop-blur-sm border-white/10">
                    <CardContent className="p-6 text-center">
                      <div className="mb-4 flex justify-center">
                        <div className="p-3 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-600/20 group-hover:from-cyan-400/30 group-hover:to-blue-600/30 transition-all duration-300">
                          {feature.icon}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                      <p className="text-white/70 leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="relative py-20 overflow-hidden bg-slate-800/50">
          <div className="absolute inset-0 z-0 opacity-20">
            <ThreeScene className="w-full h-full" />
          </div>
          
          <div className="relative z-20 container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              <div className="text-center p-4 md:p-6 rounded-xl backdrop-blur-md bg-white/5 border border-white/10">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyan-400 mb-2">
                  {isLoading ? "..." : stats?.activeStudents?.toLocaleString() || "0"}
                </div>
                <div className="text-sm md:text-base text-white/70">Active Students</div>
              </div>
              <div className="text-center p-4 md:p-6 rounded-xl backdrop-blur-md bg-white/5 border border-white/10">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-400 mb-2">
                  {isLoading ? "..." : stats?.educators?.toLocaleString() || "0"}
                </div>
                <div className="text-sm md:text-base text-white/70">Educators</div>
              </div>
              <div className="text-center p-4 md:p-6 rounded-xl backdrop-blur-md bg-white/5 border border-white/10">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
                  {isLoading ? "..." : stats?.examsCompleted?.toLocaleString() || "0"}
                </div>
                <div className="text-sm md:text-base text-white/70">Exams Completed</div>
              </div>
              <div className="text-center p-4 md:p-6 rounded-xl backdrop-blur-md bg-white/5 border border-white/10">
                <div className="text-lg sm:text-2xl md:text-4xl font-bold text-green-400 mb-2 break-words">
                  {isLoading ? "..." : stats?.uptime || "99%"}
                </div>
                <div className="text-sm md:text-base text-white/70">Uptime</div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="relative py-24 overflow-hidden bg-gradient-to-t from-slate-900 via-blue-900 to-indigo-900">
          {/* Three.js Background */}
          <div className="absolute inset-0 z-0 opacity-40">
            <ThreeScene className="w-full h-full" />
          </div>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 z-10"></div>
          
          <div className="relative z-20 container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto p-12 rounded-3xl backdrop-blur-md border shadow-2xl bg-white/5 border-white/10">
              <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r bg-clip-text text-transparent from-cyan-400 via-blue-400 to-purple-400">
                Ready to Transform Education?
              </h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto text-white/80">
                Join thousands of educators and students already using our platform to revolutionize learning and assessment.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <LoginDialog 
                  isAdmin={false}
                  trigger={
                    <Button 
                      size="lg" 
                      className="group relative overflow-hidden px-12 py-6 text-xl font-bold shadow-2xl hover:shadow-cyan-500/40 active:shadow-cyan-500/60 transition-all duration-300 ease-out bg-gradient-to-r border-0 rounded-2xl transform hover:scale-105 active:scale-95 from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 focus:ring-4 focus:ring-cyan-500/50 focus:outline-none text-white"
                    >
                      <div className="relative z-10 flex items-center">
                        <GraduationCap className="mr-3 h-7 w-7 group-hover:rotate-12 group-active:rotate-6 transition-transform duration-300" />
                        Start Learning Today
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-30 group-active:opacity-50 transition-opacity duration-300 from-cyan-400 to-blue-500"></div>
                      <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-active:opacity-100 transition-opacity duration-150"></div>
                    </Button>
                  }
                />
                <LoginDialog 
                  isAdmin={true}
                  trigger={
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="group relative overflow-hidden px-12 py-6 text-xl font-bold shadow-2xl hover:shadow-purple-500/40 active:shadow-purple-500/60 transition-all duration-300 ease-out border-2 backdrop-blur-sm rounded-2xl transform hover:scale-105 active:scale-95 border-white/30 hover:border-white/60 active:border-white/80 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white focus:ring-4 focus:ring-purple-500/50 focus:outline-none"
                    >
                      <div className="relative z-10 flex items-center">
                        <Users className="mr-3 h-7 w-7 group-hover:rotate-12 group-active:rotate-6 transition-transform duration-300" />
                        Admin Access
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-20 group-active:opacity-40 transition-opacity duration-300 from-purple-400 to-pink-400"></div>
                      <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-active:opacity-100 transition-opacity duration-150"></div>
                    </Button>
                  }
                />
              </div>
              
              {/* Additional CTA elements */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-center space-x-3 p-4 rounded-xl border bg-white/5 border-white/10">
                  <Lock className="h-5 w-5 text-green-400" />
                  <span className="font-medium text-white/80">Secure & Private</span>
                </div>
                <div className="flex items-center justify-center space-x-3 p-4 rounded-xl border bg-white/5 border-white/10">
                  <Award className="h-5 w-5 text-yellow-400" />
                  <span className="font-medium text-white/80">Award Winning</span>
                </div>
                <div className="flex items-center justify-center space-x-3 p-4 rounded-xl border bg-white/5 border-white/10">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span className="font-medium text-white/80">24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative overflow-hidden py-16 border-t bg-gradient-to-t from-black via-slate-900 to-gray-900 border-white/10">
        {/* Three.js Background */}
        <div className="absolute inset-0 z-0 opacity-10">
          <ThreeScene className="w-full h-full" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4">
          <div className="mb-12 text-center">
            {/* Brand Section */}
            <div className="flex flex-col items-center">
              <div 
                className="flex items-center gap-3 mb-6 cursor-pointer" 
                onClick={() => navigate("/")}
              >
                <div className="p-3 rounded-xl bg-gradient-to-br backdrop-blur-sm from-cyan-400/20 to-blue-600/20">
                  <GraduationCap className="h-8 w-8 text-cyan-400" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent from-cyan-400 to-blue-400">
                  GradeMe
                </span>
              </div>
              <p className="text-sm max-w-md text-white/70 text-center">
                The future of education technology. Empowering students and educators with innovative tools for assessment, learning, and growth.
              </p>
              <p className="text-sm text-white/70 text-center">Connect students and educators</p>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 text-center">
            <div className="flex flex-col items-center">
              <p className="text-sm text-white/70 mb-4">
                © {new Date().getFullYear()} GradeMe. All rights reserved.
              </p>
              <div className="flex space-x-6 text-sm text-white/70">
                <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-cyan-400 transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      {/* Go Up Button */}
      {showScrollButton && (
        <div 
          className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-110 hover:shadow-cyan-500/50 active:scale-95"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-6 w-6" />
        </div>
      )}
    </div>
  );
}