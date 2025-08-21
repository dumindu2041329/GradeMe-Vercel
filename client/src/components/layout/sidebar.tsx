import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NavLink } from "@/components/ui/nav-link";
import { BookOpen, GraduationCap, Home, BarChart2, Mail } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export function Sidebar({ className, onItemClick }: SidebarProps = {}) {
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();

  const links = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: Home,
    },
    {
      name: "Exams",
      href: "/exams",
      icon: BookOpen,
    },
    {
      name: "Students",
      href: "/students",
      icon: GraduationCap,
    },
    {
      name: "Results",
      href: "/results",
      icon: BarChart2,
    },
    {
      name: "Email Management",
      href: "/email-management",
      icon: Mail,
    },

  ];

  const handleClick = () => {
    if (isMobile && onItemClick) {
      onItemClick();
    }
  };

  const goToHome = () => {
    navigate('/admin');
    handleClick();
  };

  return (
    <div className={cn(
      "w-64 bg-background border-r border-border flex flex-col transition-colors duration-200",
      className || "h-screen max-h-screen hidden md:flex"
    )}>
      <div className="h-16 min-h-16 flex items-center border-b border-border px-6">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={goToHome}
        >
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold text-primary">GradeMe</span>
        </div>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto sidebar-content" style={{ maxHeight: "calc(100vh - 4rem)" }}>
        <nav className="px-3 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.href}
                href={link.href}
                className="sidebar-link"
                activeClassName="active"
                onClick={handleClick}
              >
                <Icon className="mr-3 h-5 w-5" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto px-3 space-y-1">
          <Separator className="my-4 bg-gray-200 dark:bg-gray-800" />
          
          <div className="w-full px-3 py-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
