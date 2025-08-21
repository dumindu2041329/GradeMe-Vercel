import { Switch, Route, useLocation, useRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import "./components/glassmorphism.css";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import { ResetPasswordPage } from "@/pages/reset-password";
import Dashboard from "@/pages/dashboard";
import Exams from "@/pages/exams";
import Students from "@/pages/students";
import Results from "@/pages/results";
import Profile from "@/pages/profile";
import PaperCreationPage from "@/pages/paper-creation";
import EmailManagement from "@/pages/email-management";



import StudentDashboard from "@/pages/student-dashboard";
import StudentExams from "@/pages/student-exams";
import StudentResults from "@/pages/student-results";
import StudentExamPage from "@/pages/student-exam-page";
import StudentProfile from "@/pages/student-profile";

import StudentAcademicInfo from "@/pages/student-academic-info";
import LandingPage from "@/pages/landing";

import { useEffect, useState, useRef, lazy, Suspense } from "react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  // Keep content mounted for smoother transitions
  const [shouldRender, setShouldRender] = useState(true);
  // Track if we've started a navigation
  const isNavigatingRef = useRef(false);
  
  useEffect(() => {
    // Only redirect if not already navigating to avoid double redirects
    if (!isLoading && !isNavigatingRef.current) {
      if (!user) {
        // Set navigating flag to prevent multiple redirects
        isNavigatingRef.current = true;
        // Redirect without unmounting current content yet
        requestAnimationFrame(() => {
          navigate("/", { replace: true });
        });
      } else {
        // Reset navigation status when we have a valid user
        isNavigatingRef.current = false;
        // Ensure content is rendered for valid user
        setShouldRender(true);
      }
    }
  }, [user, isLoading, navigate, location]);

  // Use a minimal loader that matches the page background
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Return the children wrapped in a persistent container that won't flash
  return (
    <div className="content-fade content-fade-visible bg-background min-h-screen">
      {(shouldRender && user) ? children : (
        // Placeholder with same background - prevents white flash
        <div className="min-h-screen bg-background"></div>
      )}
    </div>
  );
}

function ProtectedStudentRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  // Keep content mounted for smoother transitions
  const [shouldRender, setShouldRender] = useState(true);
  // Track if we've started a navigation
  const isNavigatingRef = useRef(false);
  
  useEffect(() => {
    // Only log and redirect if not already navigating to avoid double redirects
    if (!isLoading && !isNavigatingRef.current) {
      if (!user) {
        // Set navigating flag to prevent multiple redirects
        isNavigatingRef.current = true;
        // Redirect to landing page without unmounting current content yet
        requestAnimationFrame(() => {
          navigate("/", { replace: true });
        });
      } else if (user.role !== "student") {
        // Set navigating flag to prevent multiple redirects
        isNavigatingRef.current = true;
        // Redirect to landing page without unmounting current content yet  
        requestAnimationFrame(() => {
          navigate("/", { replace: true });
        });
      } else {
        // Reset navigation status when we have a valid student user
        isNavigatingRef.current = false;
        // Ensure content is rendered for valid student
        setShouldRender(true);
      }
    }
  }, [user, isLoading, navigate, location]);

  // Use a minimal loader that matches the page background
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Return the children wrapped in a persistent container that won't flash
  return (
    <div className="content-fade content-fade-visible bg-background min-h-screen">
      {(shouldRender && user && user.role === "student") ? children : (
        // Placeholder with same background - prevents white flash
        <div className="min-h-screen bg-background"></div>
      )}
    </div>
  );
}

// Optimized fade transition component for fast navigation
function PageFade({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(true);
  const [location] = useLocation();
  const prevLocationRef = useRef(location);
  
  useEffect(() => {
    // No initial delay, immediate visibility
    setIsVisible(true);
  }, []);
  
  // Handle location changes with minimal animation
  useEffect(() => {
    if (prevLocationRef.current !== location) {
      // Skip the fade out completely for faster navigation
      setIsVisible(true);
      prevLocationRef.current = location;
    }
  }, [location]);
  
  return (
    <div className="page-fade page-fade-visible">
      {children}
    </div>
  );
}

function Router() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Redirect based on user role when already authenticated
  useEffect(() => {
    if (user && user.id && user.email) {
      // If user is already authenticated and on the landing page, redirect to their dashboard
      if (location === "/") {
        if (user.role === "student") {
          navigate("/student/dashboard", { replace: true });
        } else {
          navigate("/admin", { replace: true });
        }
      }
    }
  }, [user, location, navigate]);

  // Get current route content
  function getRouteContent() {
    // Create a map of paths to components to avoid render flashing
    const routeContent = (
      <Switch>
        {/* Public landing page */}
        <Route path="/" component={LandingPage} />
        
        {/* Auth routes */}
        {/* Login handled by popups on landing page */}
        <Route path="/reset-password" component={ResetPasswordPage} />
        
        {/* Admin routes */}
        <Route path="/admin">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        
        <Route path="/exams">
          <ProtectedRoute>
            <Exams />
          </ProtectedRoute>
        </Route>
        
        <Route path="/exams/:examId/paper">
          <ProtectedRoute>
            <PaperCreationPage />
          </ProtectedRoute>
        </Route>
        
        <Route path="/students">
          <ProtectedRoute>
            <Students />
          </ProtectedRoute>
        </Route>
        
        <Route path="/results">
          <ProtectedRoute>
            <Results />
          </ProtectedRoute>
        </Route>
        
        <Route path="/profile">
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        </Route>
        
        <Route path="/email-management">
          <ProtectedRoute>
            <EmailManagement />
          </ProtectedRoute>
        </Route>
        
        {/* Student routes */}
        {/* Student login handled by popups on landing page */}
        
        <Route path="/student/dashboard">
          <ProtectedStudentRoute>
            <StudentDashboard />
          </ProtectedStudentRoute>
        </Route>
        
        <Route path="/student/exams">
          <ProtectedStudentRoute>
            <StudentExams />
          </ProtectedStudentRoute>
        </Route>
        
        <Route path="/student/results">
          <ProtectedStudentRoute>
            <StudentResults />
          </ProtectedStudentRoute>
        </Route>
        
        <Route path="/student/exam/:id">
          <ProtectedStudentRoute>
            <StudentExamPage />
          </ProtectedStudentRoute>
        </Route>
        
        <Route path="/student/profile">
          <ProtectedStudentRoute>
            <StudentProfile />
          </ProtectedStudentRoute>
        </Route>

        <Route path="/student/academic-info">
          <ProtectedStudentRoute>
            <StudentAcademicInfo />
          </ProtectedStudentRoute>
        </Route>
        
        {/* Root student dashboard route - should be last in the student routes */}
        <Route path="/student">
          <ProtectedStudentRoute>
            <StudentDashboard />
          </ProtectedStudentRoute>
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    );
    
    return routeContent;
  }
  
  // Cache of preloaded routes to avoid flashing
  const [cachedRoutes] = useState(new Map());
  
  // Keep track of previous route for transitions
  const prevRouteRef = useRef(location);
  
  // Pre-rendered content
  const [content, setContent] = useState(getRouteContent());
  
  // Update content when location changes, with smooth transition
  useEffect(() => {
    if (location !== prevRouteRef.current) {
      // Use requestAnimationFrame for smoother transitions
      requestAnimationFrame(() => {
        setContent(getRouteContent());
        prevRouteRef.current = location;
      });
    }
  }, [location]);

  // Optimize the suspense fallback to match the background color
  return (
    <div className="page-container bg-background">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        {/* Apply transition effect */}
        <div 
          className="transition-opacity" 
          style={{
            minHeight: '100vh',
            backgroundColor: 'var(--background)',
            transition: 'opacity 80ms ease-out',
          }}
        >
          {content}
        </div>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;