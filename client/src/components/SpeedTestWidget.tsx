import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Activity, Clock } from "lucide-react";
import { speedOps, speedMonitor } from "@/lib/speed-boost";

export default function SpeedTestWidget() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [cacheSize, setCacheSize] = useState(0);

  const runSpeedTest = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      // Clear cache first to ensure fair test
      speedMonitor.clearCache();
      
      // Test 1: First call (no cache)
      const start1 = performance.now();
      await speedOps.getStudents();
      const firstCallTime = performance.now() - start1;

      // Test 2: Second call (cached)
      const start2 = performance.now();
      await speedOps.getStudents();
      const cachedCallTime = performance.now() - start2;

      // Test 3: Multiple cached calls
      const multipleStart = performance.now();
      await Promise.all([
        speedOps.getStudents(),
        speedOps.getExams(),
        speedOps.getResults()
      ]);
      const multipleCallsTime = performance.now() - multipleStart;

      const improvement = Math.round(((firstCallTime - cachedCallTime) / firstCallTime) * 100);

      setResults({
        firstCall: Math.round(firstCallTime),
        cachedCall: Math.round(cachedCallTime),
        multipleCalls: Math.round(multipleCallsTime),
        improvement
      });

      setCacheSize(speedMonitor.getCacheSize());

    } catch (error) {
      console.error('Speed test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Supabase Speed Test
        </CardTitle>
        <Button 
          onClick={runSpeedTest} 
          disabled={isRunning}
          size="sm"
          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
        >
          {isRunning ? 'Testing...' : 'Run Test'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {results ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2">
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <div className="text-sm text-muted-foreground">First Call</div>
                <div className="text-lg font-bold text-red-600">{results.firstCall}ms</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <div className="text-sm text-muted-foreground">Cached Call</div>
                <div className="text-lg font-bold text-green-600">{results.cachedCall}ms</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <div className="text-sm text-muted-foreground">Multiple Calls</div>
                <div className="text-lg font-bold text-blue-600">{results.multipleCalls}ms</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <Badge 
                className={`text-sm px-3 py-1 ${
                  results.improvement > 0 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {results.improvement > 0 ? '+' : ''}{results.improvement}% Speed Improvement
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Cache: {cacheSize} items
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Real-time sync enabled
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            Click "Run Test" to see speed improvements
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <div>• First call loads from Supabase database</div>
          <div>• Subsequent calls return instantly from cache</div>
          <div>• Cache automatically updates when data changes</div>
        </div>
      </CardContent>
    </Card>
  );
}