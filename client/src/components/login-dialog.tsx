import React from "react";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginDialogProps {
  isAdmin?: boolean;
  trigger: React.ReactNode;
}

export function LoginDialog({ isAdmin = false, trigger }: LoginDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, setUser } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const endpoint = isAdmin ? "/api/auth/login" : "/api/auth/student/login";
      
      console.log(`Attempting ${isAdmin ? 'admin' : 'student'} login with:`, values);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        setLoginSuccess(false);
        throw new Error("Login failed");
      }
      
      const userData = await response.json();
      console.log(`${isAdmin ? 'Admin' : 'Student'} login successful, got user:`, userData);
      
      // Update auth context with user data
      setUser(userData);
      
      // Set login success
      setLoginSuccess(true);
      
      // Invalidate the session query to force a refresh
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name}!`,
      });
      
      // Close the dialog after successful login
      setTimeout(() => {
        setOpen(false);
        
        // Navigate to the appropriate dashboard after dialog closes
        const route = isAdmin ? "/admin" : "/student/dashboard";
        navigate(route, { replace: true });
      }, 1500);
      
    } catch (error) {
      console.error("Login error:", error);
      
      // Clear the password field when login fails
      form.setValue("password", "");
      
      // Reset form focus to password field
      setTimeout(() => {
        const passwordInput = document.querySelector('input[name="password"]');
        if (passwordInput) {
          (passwordInput as HTMLInputElement).focus();
        }
      }, 0);
      
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid email or password. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    
    // Reset all dialog states when closing
    if (!newOpen) {
      setShowForgotPassword(false);
      setLoginSuccess(false);
      setShowPassword(false);
      setIsLoading(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md login-modal-dark" aria-describedby="login-description">
        <DialogHeader>
          <DialogTitle>{isAdmin ? "Admin Login" : "Student Login"}</DialogTitle>
          <DialogDescription id="login-description">
            {loginSuccess
              ? `You are currently logged in as ${isAdmin ? 'an admin' : 'a student'}`
              : `Enter your credentials to access the ${isAdmin ? 'admin' : 'student'} portal`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {showForgotPassword ? (
            <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
          ) : loginSuccess ? (
            <Alert className="mb-4">
              <AlertTitle>Successfully logged in</AlertTitle>
              <AlertDescription>
                Welcome back, {user?.name}. You have successfully logged into your {isAdmin ? 'admin' : 'student'} account.
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your.email@example.com" className="glass-input" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="glass-input pr-10" 
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            )}
                            <span className="sr-only">
                              {showPassword ? "Hide password" : "Show password"}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full glass-button" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                        Logging in...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Lock className="mr-2 h-4 w-4" />
                        Login
                      </div>
                    )}
                  </Button>
                </div>
                
                <div className="text-center text-sm text-muted-foreground mt-2">
                  <button
                    type="button"
                    className="text-blue-400 hover:text-blue-300 underline"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot your password?
                  </button>
                </div>
                
                <div className="text-center text-sm text-muted-foreground mt-2">
                  {isAdmin ? (
                    <span>Looking for student login? Use the Student Login button instead.</span>
                  ) : (
                    <span>Looking for admin login? Use the Admin Login button instead.</span>
                  )}
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}