import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { ThreeScene } from "@/components/three-scene";

export default function NotFound() {
  const [, navigate] = useLocation();
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Three.js Background */}
      <div className="absolute inset-0 z-0">
        <ThreeScene className="w-full h-full" />
      </div>
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]" />

      <Card className="relative z-10 w-[min(92%,760px)] mx-auto border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        <CardContent className="p-8 md:p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            404
          </h1>
          <p className="text-xl md:text-2xl font-semibold text-white/90">Page not found</p>
          <p className="mt-3 text-white/70 max-w-xl mx-auto">
            The page you are looking for doesn\'t exist or was moved. Check the URL or return to a safe place.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="px-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 hover:from-cyan-400 hover:to-blue-500"
              onClick={() => navigate("/")}
            >
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-6 border-white/30 text-white bg-white/10 hover:bg-white/20"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
