import { Linkedin, Github, Twitter, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Alex Morgan</h3>
          <p className="text-slate-300 mb-6">
            Full Stack Developer crafting digital experiences
          </p>
          <div className="flex justify-center space-x-6 mb-8">
            <Button size="icon" variant="ghost" className="text-slate-300 hover:text-white">
              <Linkedin className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-slate-300 hover:text-white">
              <Github className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-slate-300 hover:text-white">
              <Twitter className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-slate-300 hover:text-white">
              <Mail className="w-5 h-5" />
            </Button>
          </div>
          <div className="border-t border-slate-600 pt-8">
            <p className="text-slate-400">
              &copy; {new Date().getFullYear()} Alex Morgan. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
