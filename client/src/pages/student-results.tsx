import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { StudentHeader } from "@/components/layout/student-header";
import { ResultWithDetails } from "@shared/schema";

export default function StudentResults() {
  const { user } = useAuth();

  // Fetch student results data
  const { data: results, isLoading } = useQuery<ResultWithDetails[]>({
    queryKey: ["/api/student/results"],
    enabled: !!user?.studentId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      
      <main className="container mx-auto pt-24 pb-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Exam Results</h1>
        
        {!results || results.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">You haven't taken any exams yet.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/10 dark:border-primary/20">
            <CardHeader>
              <CardTitle>Your Results</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}