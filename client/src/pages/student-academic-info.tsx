import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StudentHeader } from "@/components/layout/student-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ResultWithDetails } from "@shared/schema";

interface DashboardData {
  totalExams: number;
  averageScore: number;
  bestRank: number;
  availableExams: Array<{
    id: number;
    name: string;
    subject: string;
    date: string;
    duration: number;
    totalMarks: number;
  }>;
  examHistory: Array<{
    id: number;
    exam: {
      name: string;
      totalMarks: number;
    };
    submittedAt: string;
    percentage: number;
    score: number;
    rank: number;
    totalParticipants: number;
  }>;
}

interface SubjectPerformance {
  subject: string;
  average: number;
  best: number;
  examsCount: number;
}

export default function StudentAcademicInfo() {
  const { user } = useAuth();

  // Fetch student dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<DashboardData>({
    queryKey: ["/api/student/dashboard", user?.studentId],
    enabled: !!user?.studentId,
  });

  // Fetch student results
  const { data: results, isLoading: isResultsLoading } = useQuery<ResultWithDetails[]>({
    queryKey: ["/api/student/results"],
    enabled: !!user?.studentId,
  });

  // Calculate subject-wise performance if results exist
  const subjectPerformance = React.useMemo<SubjectPerformance[]>(() => {
    if (!results || results.length === 0) return [];
    
    const subjectData: Record<string, {total: number, count: number, best: number}> = {};
    
    results.forEach(result => {
      const subject = result.exam.subject;
      if (!subjectData[subject]) {
        subjectData[subject] = { total: 0, count: 0, best: 0 };
      }
      
      subjectData[subject].total += result.percentage;
      subjectData[subject].count += 1;
      subjectData[subject].best = Math.max(subjectData[subject].best, result.percentage);
    });
    
    // Convert to averages
    const averages = Object.entries(subjectData).map(([subject, data]) => ({
      subject,
      average: Math.round(data.total / data.count),
      best: data.best,
      examsCount: data.count
    }));
    
    // Sort by average score
    return averages.sort((a, b) => b.average - a.average);
  }, [results]);
  
  if (isDashboardLoading || isResultsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <StudentHeader />
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto pt-24 pb-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Academic Information</h1>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="exams">Exam History</TabsTrigger>
            <TabsTrigger value="subjects">Subject Analysis</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Academic Summary</AlertTitle>
              <AlertDescription>
                View your academic performance data and track your progress over time.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-primary/10 dark:border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Overall Average</CardTitle>
                  <CardDescription>Across all exams</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <div className="text-4xl font-bold mb-2">
                      {dashboardData?.averageScore ? Math.round(dashboardData.averageScore) : 0}%
                    </div>
                    <Progress 
                      value={dashboardData?.averageScore || 0} 
                      className="h-2 w-full"
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-primary/10 dark:border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Exams Completed</CardTitle>
                  <CardDescription>Your test participation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <div className="text-4xl font-bold">
                      {dashboardData?.totalExams || 0}
                    </div>
                    <p className="text-muted-foreground text-sm mt-2">
                      {dashboardData?.totalExams === 0 
                        ? "No exams taken yet" 
                        : dashboardData?.totalExams === 1 
                          ? "1 exam completed" 
                          : `${dashboardData?.totalExams} exams completed`}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-primary/10 dark:border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Best Performance</CardTitle>
                  <CardDescription>Your highest score</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    {results && results.length > 0 ? (
                      <>
                        <div className="text-4xl font-bold mb-2">
                          {Math.max(...results.map(r => r.percentage))}%
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {results.sort((a, b) => b.percentage - a.percentage)[0]?.exam.name}
                        </p>
                      </>
                    ) : (
                      <div className="text-muted-foreground">No exam data yet</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Exam History Tab */}
          <TabsContent value="exams">
            <Card className="border-primary/10 dark:border-primary/20">
              <CardHeader>
                <CardTitle>Exam History</CardTitle>
                <CardDescription>
                  View all your past exams and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!results || results.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    You haven't taken any exams yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Rank</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result) => {
                        // Calculate grade based on percentage
                        let grade;
                        if (result.percentage >= 90) grade = "A+";
                        else if (result.percentage >= 80) grade = "A";
                        else if (result.percentage >= 70) grade = "B";
                        else if (result.percentage >= 60) grade = "C";
                        else if (result.percentage >= 50) grade = "D";
                        else grade = "F";

                        // Determine badge color based on grade
                        let badgeColor;
                        if (grade === "A+" || grade === "A") badgeColor = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
                        else if (grade === "B") badgeColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
                        else if (grade === "C") badgeColor = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
                        else if (grade === "D") badgeColor = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
                        else badgeColor = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";

                        return (
                          <TableRow key={result.id}>
                            <TableCell className="font-medium">
                              <div>
                                {result.exam.name}
                                <p className="text-xs text-muted-foreground">{result.exam.subject}</p>
                              </div>
                            </TableCell>
                            <TableCell>{new Date(result.submittedAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Progress value={result.percentage} className="h-2 w-full" />
                                <div className="flex justify-between text-xs">
                                  <span>{result.percentage}%</span>
                                  <span>{result.score}/{result.exam.totalMarks}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {result.rank ? (
                                <span className="text-sm">{result.rank} of {result.totalParticipants}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={badgeColor}>
                                {grade}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Subject Analysis Tab */}
          <TabsContent value="subjects">
            <Card className="border-primary/10 dark:border-primary/20">
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
                <CardDescription>
                  Your performance across different subjects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subjectPerformance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No subject data available yet.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {subjectPerformance.map((subject: SubjectPerformance) => (
                      <div key={subject.subject} className="space-y-2">
                        <div className="flex justify-between">
                          <h3 className="font-medium">{subject.subject}</h3>
                          <span className="text-sm text-muted-foreground">
                            {subject.examsCount} {subject.examsCount === 1 ? "exam" : "exams"}
                          </span>
                        </div>
                        <Progress 
                          value={subject.average} 
                          className="h-2 w-full" 
                        />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Average: {subject.average}%</span>
                          <span className="text-muted-foreground">Best: {subject.best}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}