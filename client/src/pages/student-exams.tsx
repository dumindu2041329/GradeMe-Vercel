import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { StudentHeader } from "@/components/layout/student-header";
import { Exam } from "@shared/schema";

export default function StudentExams() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch available exams data
  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams/available"],
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
        <h1 className="text-3xl font-bold mb-8">Available Exams</h1>
        
        {!exams || exams.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">No exams available at the moment.</p>
                <Button onClick={() => navigate("/student")}>
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {exams.map((exam) => (
              <Card key={exam.id} className="border-primary/10 dark:border-primary/20">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{exam.name}</CardTitle>
                      <p className="text-muted-foreground">{exam.subject}</p>
                    </div>
                    <Badge 
                      className={
                        exam.status === "active" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      }
                    >
                      {exam.status === "active" ? "Active" : "Upcoming"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-6 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">
                        Date: {new Date(exam.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">
                        Duration: {exam.duration} minutes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">
                        Total Marks: {exam.totalMarks}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-4">{exam.description}</p>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => navigate(`/student/exam/${exam.id}`)}
                      className={exam.status !== "active" ? "bg-muted text-muted-foreground" : ""}
                      disabled={exam.status !== "active"}
                    >
                      {exam.status === "active" ? "Start Exam" : "Not Available Yet"}
                      {exam.status === "active" && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}