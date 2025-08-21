import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { Menu, User, X, LogOut, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { DialogTitle } from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { AvatarImage } from "@/components/ui/avatar";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  sidebar?: "admin";
}

export function AppShell({ children, title, sidebar }: AppShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";
    
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Close sidebar when switching to desktop view
  useEffect(() => {
    if (!isMobile && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [isMobile]); // Remove isMobileSidebarOpen from dependencies to prevent infinite loop

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen max-h-screen">
      {/* Desktop sidebar - hidden on mobile */}
      <Sidebar className="h-screen max-h-screen hidden md:flex" />
      
      <div className="flex flex-col flex-1 overflow-hidden max-h-screen">
        {/* Mobile sidebar with sheet component - positioned absolutely over content */}
        <Sheet 
          open={isMobileSidebarOpen} 
          onOpenChange={setIsMobileSidebarOpen}
          modal={false}
        >
          <SheetContent 
            side="left" 
            closeButton={false}
            className="w-64 p-0 flex flex-col shadow-xl animate-slide-in border-r border-sidebar-border !opacity-100 mobile-sidebar"
            style={{ 
              backgroundColor: "hsl(224, 71%, 4%)", /* Hard-coded background color value */
              backgroundImage: "none",
              opacity: 1,
              backdropFilter: "none",
              position: "fixed",
              top: 0,
              bottom: 0,
              left: 0,
              zIndex: 100
            }}
          >
            <Button 
              className="absolute right-3 top-3 z-50 rounded-full size-8 p-0" 
              variant="outline"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </Button>
            <DialogTitle className="sr-only">Navigation menu</DialogTitle>
            <Sidebar 
              className="h-full flex" 
              onItemClick={closeMobileSidebar} 
            />
          </SheetContent>
        </Sheet>
        <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full hover:bg-secondary transition-all"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5 text-foreground" />
              <span className="sr-only">Toggle menu</span>
            </Button>
            
            {/* GradeMe Logo - Desktop Only */}
            <div className="hidden md:flex items-center gap-2 cursor-pointer" onClick={() => navigate('/admin')}>
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold text-primary">GradeMe</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-primary/20">
                  <Avatar className="h-10 w-10 cursor-pointer">
                    <AvatarImage 
                      src={user?.profileImage || undefined} 
                      alt={`${user?.name || 'Admin'} profile`}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigate('/profile')}
                className="cursor-pointer hover:bg-accent"
              >
                <User className="mr-2 h-4 w-4" />
                <span>View Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer hover:bg-accent"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6 pt-20 main-content">
          <div className="pb-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
