import { createContext, useState, useEffect } from "react";
import { getSession, login, logout, studentLogin as studentLoginFn } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  studentLogin: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadUser() {
      try {
        const session = await getSession();
        setUser(session);
      } catch (error) {
        console.error("Failed to load user session:", error);
        toast({
          title: "Session Error",
          description: "Failed to restore your session.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []); // Remove toast dependency to prevent infinite loops

  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const user = await login({ email, password });
      setUser(user);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.name}!`,
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Invalid email or password.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStudentLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const user = await studentLoginFn({ email, password });
      console.log("Student login successful, setting user:", user);
      setUser(user);
      toast({
        title: "Student Login Successful",
        description: `Welcome back, ${user.name}!`,
      });
      return user;
    } catch (error) {
      console.error("Student login error:", error);
      toast({
        title: "Login Failed",
        description: "Invalid email or password.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
      setUser(null);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "There was an error logging you out.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login: handleLogin,
        studentLogin: handleStudentLogin,
        logout: handleLogout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
