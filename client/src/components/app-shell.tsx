import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  FileText,
  Users,
  Medal,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      active: location === '/'
    },
    {
      name: 'Exams',
      href: '/exams',
      icon: FileText,
      active: location === '/exams'
    },
    {
      name: 'Students',
      href: '/students',
      icon: Users,
      active: location === '/students'
    },
    {
      name: 'Results',
      href: '/results',
      icon: Medal,
      active: location === '/results'
    },
    {
      name: 'Profile',
      href: '/admin-profile',
      icon: User,
      active: location === '/admin-profile'
    }
  ];
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for larger screens */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card glass-sidebar px-3 py-4">
        <div className="px-3 py-2 mb-6">
          <h1 className="text-xl font-bold tracking-tight">Exam Management</h1>
        </div>
        
        <nav className="space-y-1 flex-1">
          {navigationItems.map((item) => (
            <Link key={item.name} href={item.href}>
              <a
                className={`
                  flex items-center px-3 py-2 rounded-md text-sm font-medium
                  ${item.active 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
        
        <div className="mt-6 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Exam Management
          </p>
        </div>
      </aside>
      
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0">
          <div className="flex flex-col h-full">
            <div className="px-6 py-5 border-b">
              <h1 className="text-xl font-bold tracking-tight">Exam Management</h1>
            </div>
            
            <nav className="flex-1 p-4 space-y-1">
              {navigationItems.map((item) => (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`
                      flex items-center px-3 py-2 rounded-md text-sm font-medium
                      ${item.active 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </a>
                </Link>
              ))}
            </nav>
            
            <div className="p-4 border-t">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Exam Management
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Main content */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="h-16 border-b glass-navbar flex items-center px-4 lg:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <h1 className="text-lg font-semibold">Exam Management</h1>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImage || ''} alt={user.name || 'User'} />
                      <AvatarFallback>
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 glass-dropdown" align="end" forceMount>
                  <div className="p-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}