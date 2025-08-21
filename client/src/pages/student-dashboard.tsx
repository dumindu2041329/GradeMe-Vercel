import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, BarChart2, Award, ArrowRight, TrendingUp, Target, Calendar, Clock, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { StudentHeader } from "@/components/layout/student-header";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { StudentDashboardData, Exam, ResultWithDetails } from "@shared/schema";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";



export default function StudentDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // Search states for each exam section
  const [activeExamSearch, setActiveExamSearch] = React.useState("");
  const [completedExamSearch, setCompletedExamSearch] = React.useState("");
  const [upcomingExamSearch, setUpcomingExamSearch] = React.useState("");

  // Fetch student dashboard data
  const { data: dashboardData, isLoading, refetch } = useQuery<StudentDashboardData>({
    queryKey: ["/api/student/dashboard", user?.studentId],
    enabled: !!user?.studentId,
  });

  // Log dashboard data when received
  React.useEffect(() => {
    if (dashboardData) {
      console.log('Dashboard data received:', dashboardData);
      console.log('Overall rank:', dashboardData.overallRank);
      console.log('Total students:', dashboardData.totalStudents);
    }
  }, [dashboardData]);

  // Force refresh on mount to get latest data
  React.useEffect(() => {
    if (user?.studentId) {
      queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard", user.studentId] });
    }
  }, [user?.studentId, queryClient]);

  // Filter functions for each exam section
  const filterExams = (exams: Exam[] | undefined, searchTerm: string) => {
    if (!exams || !searchTerm.trim()) {
      return exams || [];
    }
    return exams.filter(exam => 
      exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Filtered exam arrays
  const filteredActiveExams = filterExams(dashboardData?.activeExams, activeExamSearch);
  const filteredCompletedExams = filterExams(dashboardData?.completedExams, completedExamSearch);
  const filteredUpcomingExams = filterExams(dashboardData?.availableExams, upcomingExamSearch);

  if (isLoading) {
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
      <main className="flex-1 container mx-auto pt-24 pb-4 sm:pb-6 md:pb-8 px-4">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Student Dashboard</h1>
        
        {/* Enhanced Stats cards with progress indicators */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="border-primary/10 dark:border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Exams</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 sm:gap-4 p-4 sm:p-6">
              <div className="bg-blue-100 dark:bg-blue-950/20 p-2 sm:p-3 rounded-full">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-bold">{dashboardData?.totalExams || 0}</span>
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-primary/10 dark:border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="bg-purple-100 dark:bg-purple-950/20 p-2 sm:p-3 rounded-full">
                  <BarChart2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-500" />
                </div>
                <span className="text-2xl sm:text-3xl font-bold">{dashboardData?.averageScore ? dashboardData.averageScore.toFixed(1) : '0'}%</span>
              </div>
              <Progress value={dashboardData?.averageScore || 0} className="h-2" />
            </CardContent>
          </Card>
          
          <Card className="border-primary/10 dark:border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Your Rank in Class</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 sm:gap-4 p-4 sm:p-6">
              <div className="bg-amber-100 dark:bg-amber-950/20 p-2 sm:p-3 rounded-full">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-bold">
                  {dashboardData?.overallRank ? dashboardData.overallRank : '-'}
                </span>
                {dashboardData?.totalStudents ? (
                  <span className="text-xs text-muted-foreground">of {dashboardData.totalStudents} students</span>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 dark:border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Progress Goal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="bg-green-100 dark:bg-green-950/20 p-2 sm:p-3 rounded-full">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-500" />
                </div>
                <span className="text-2xl sm:text-3xl font-bold">
                  {dashboardData?.averageScore && dashboardData.averageScore >= 80 ? '🎯' : 
                   dashboardData?.averageScore && dashboardData.averageScore >= 70 ? '📈' : '💪'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {dashboardData?.averageScore && dashboardData.averageScore >= 80 ? 'Target Achieved!' : 
                 dashboardData?.averageScore && dashboardData.averageScore >= 70 ? 'Almost There!' : 'Keep Going!'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Performance Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-primary/10 dark:border-primary/20">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  Performance Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {dashboardData?.examHistory && dashboardData.examHistory.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <ChartContainer
                      config={{
                        percentage: {
                          label: "Score %",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                      className="h-[200px] sm:h-[250px] md:h-[200px] lg:h-[250px] xl:h-[300px] w-full"
                    >
                      <AreaChart
                        data={dashboardData.examHistory
                          .slice()
                          .reverse()
                          .map((exam, index) => ({
                            exam: `Exam ${index + 1}`,
                            percentage: exam.percentage,
                            name: exam.exam.name
                          }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="exam" />
                        <YAxis domain={[0, 100]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="percentage"
                          stroke="hsl(var(--chart-1))"
                          fill="hsl(var(--chart-1))"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </motion.div>
                ) : (
                  <div className="h-[200px] sm:h-[250px] md:h-[200px] lg:h-[250px] xl:h-[300px] flex items-center justify-center text-muted-foreground">
                    No performance data available
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Grade Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="border-primary/10 dark:border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5" />
                  Grade Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.examHistory && dashboardData.examHistory.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="space-y-4"
                  >
                    {(() => {
                      const gradeDistribution = dashboardData.examHistory.reduce((acc, exam) => {
                        let grade;
                        const percentage = parseFloat(exam.percentage);
                        if (percentage >= 90) grade = "A+";
                        else if (percentage >= 80) grade = "A";
                        else if (percentage >= 70) grade = "B";
                        else if (percentage >= 60) grade = "C";
                        else if (percentage >= 50) grade = "D";
                        else grade = "F";
                        
                        acc[grade] = (acc[grade] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);

                      const total = dashboardData.examHistory.length;
                      const grades = ["A+", "A", "B", "C", "D", "F"];
                      const colors = ["bg-green-500", "bg-blue-500", "bg-yellow-500", "bg-orange-500", "bg-red-400", "bg-red-600"];

                      return grades.map((grade, index) => {
                        const count = gradeDistribution[grade] || 0;
                        const percentage = total > 0 ? (count / total) * 100 : 0;
                        
                        return (
                          <motion.div
                            key={grade}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                            className="space-y-2"
                          >
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Grade {grade}</span>
                              <span className="text-muted-foreground">{count} ({percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 1, delay: 0.8 + index * 0.1, ease: "easeOut" }}
                                className={`h-2 rounded-full ${colors[index]}`}
                              />
                            </div>
                          </motion.div>
                        );
                      });
                    })()}
                  </motion.div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No grade data available
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Active Exams Section */}
        <div className="mb-8">
          <Card className="border-green-500/20 dark:border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <BookOpen className="h-5 w-5" />
                Active Exams
              </CardTitle>
              <div className="relative pt-4">
                <div className="absolute inset-y-0 left-0 pt-4 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  placeholder="Search active exams by name or subject..."
                  value={activeExamSearch}
                  onChange={(e) => setActiveExamSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {!dashboardData?.activeExams || dashboardData.activeExams.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No active exams at the moment.</p>
                  <p className="text-sm text-muted-foreground mt-1">Active exams will appear here when available.</p>
                </div>
              ) : filteredActiveExams.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No active exams match your search.</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your search terms.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                  {filteredActiveExams.map((exam) => {
                    const examDate = new Date(exam.date);
                    
                    return (
                      <div 
                        key={exam.id} 
                        className="p-4 sm:p-6 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-950/30 hover:border-green-300 dark:hover:border-green-700 transition-colors relative overflow-hidden group"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-500 to-green-600"></div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg text-green-800 dark:text-green-200">{exam.name}</h3>
                              <Badge variant="default" className="bg-green-600 text-white text-xs">
                                Active
                              </Badge>
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300 font-medium">{exam.subject}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{examDate.toLocaleDateString()}</span>
                            </div>
                            {exam.startTime && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  Start Time: {new Date(exam.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>Duration: {exam.duration} min</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span>{exam.totalMarks} marks</span>
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700 text-white" 
                            onClick={() => navigate(`/student/exam/${exam.id}`)}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Start Exam
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>



        {/* Completed Exams Section */}
        <div className="mb-8">
          <Card className="border-blue-500/20 dark:border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Award className="h-5 w-5" />
                Completed Exams
              </CardTitle>
              <div className="relative pt-4">
                <div className="absolute inset-y-0 left-0 pt-4 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  placeholder="Search completed exams by name or subject..."
                  value={completedExamSearch}
                  onChange={(e) => setCompletedExamSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {!dashboardData?.completedExams || dashboardData.completedExams.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No completed exams yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">Completed exams will appear here after you finish them.</p>
                </div>
              ) : filteredCompletedExams.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No completed exams match your search.</p>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your search terms.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                  {filteredCompletedExams.map((exam) => {
                    const examDate = new Date(exam.date);
                    const studentResult = dashboardData.examHistory.find(result => result.exam.id === exam.id);
                    
                    return (
                      <div 
                        key={exam.id} 
                        className="p-4 sm:p-6 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 transition-colors relative overflow-hidden group"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-blue-600"></div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg text-blue-800 dark:text-blue-200">{exam.name}</h3>
                              <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                                Completed
                              </Badge>
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">{exam.subject}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{examDate.toLocaleDateString()}</span>
                            </div>
                            {exam.startTime && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                  Start Time: {new Date(exam.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span>{exam.totalMarks} marks</span>
                            </div>
                            {studentResult && (
                              <div className="flex items-center gap-2">
                                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  Score: {studentResult.score}/{exam.totalMarks} ({studentResult.percentage}%)
                                </span>
                              </div>
                            )}
                          </div>

                          {studentResult && (
                            <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Performance</span>
                                <span className={`font-medium ${
                                  parseFloat(studentResult.percentage) >= 80 ? 'text-green-600' :
                                  parseFloat(studentResult.percentage) >= 60 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {parseFloat(studentResult.percentage) >= 80 ? 'Excellent' :
                                   parseFloat(studentResult.percentage) >= 60 ? 'Good' : 'Needs Improvement'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Exams with Enhanced Design */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="border-primary/10 dark:border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Exams
                </CardTitle>
                <div className="relative pt-4">
                  <div className="absolute inset-y-0 left-0 pt-4 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    placeholder="Search upcoming exams by name or subject..."
                    value={upcomingExamSearch}
                    onChange={(e) => setUpcomingExamSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {!dashboardData?.availableExams || dashboardData.availableExams.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No exams scheduled at the moment.</p>
                    <p className="text-sm text-muted-foreground mt-2">Check back later for new assignments.</p>
                  </div>
                ) : filteredUpcomingExams.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No upcoming exams match your search.</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search terms.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUpcomingExams.map((exam) => {
                      const examDate = new Date(exam.date);
                      const isToday = examDate.toDateString() === new Date().toDateString();
                      const isUpcoming = examDate > new Date();
                      
                      return (
                        <div 
                          key={exam.id} 
                          className="p-6 border border-border rounded-lg hover:border-primary/30 transition-colors relative overflow-hidden group"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50"></div>
                          
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-lg">{exam.name}</h3>
                                {isToday && (
                                  <Badge variant="destructive" className="text-xs">
                                    Today
                                  </Badge>
                                )}
                                {isUpcoming && !isToday && (
                                  <Badge variant="secondary" className="text-xs">
                                    Upcoming
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground font-medium">{exam.subject}</p>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Scheduled
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{examDate.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {exam.startTime ? (
                                <span className="text-primary font-medium">
                                  {new Date(exam.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Time TBA</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{exam.duration} min</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              <span>{exam.totalMarks} marks</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Personalized Recommendations */}
          <Card className="border-primary/10 dark:border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Study Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardData?.examHistory && dashboardData.examHistory.length > 0 ? (
                <>
                  {(() => {
                    const avgScore = dashboardData.averageScore || 0;
                    const recentExams = dashboardData.examHistory.slice(0, 3);
                    const improvementNeeded = avgScore < 75;
                    
                    return (
                      <>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-medium mb-2">Performance Insights</h4>
                          <div className="space-y-2 text-sm">
                            {avgScore >= 85 && (
                              <div className="flex items-center gap-2 text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Excellent performance! Keep it up!
                              </div>
                            )}
                            {avgScore >= 70 && avgScore < 85 && (
                              <div className="flex items-center gap-2 text-blue-600">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Good progress. Aim for 85%+
                              </div>
                            )}
                            {avgScore < 70 && (
                              <div className="flex items-center gap-2 text-orange-600">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                Focus on improvement areas
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium">Quick Tips</h4>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            {improvementNeeded ? (
                              <>
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                                  <span>Review previous exam topics</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                                  <span>Practice time management</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                                  <span>Focus on weak areas</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                                  <span>Maintain consistent study schedule</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                                  <span>Challenge yourself with harder topics</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                                  <span>Help classmates to reinforce learning</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Complete your first exam to get personalized recommendations!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Exam History */}
        <Card className="border-primary/10 dark:border-primary/20">
          <CardHeader>
            <CardTitle>Exam History</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.examHistory?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No exam history available.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Rank</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.examHistory?.map((result) => {
                    // Calculate grade based on percentage
                    let grade;
                    const percentage = parseFloat(result.percentage.toString());
                    if (percentage >= 90) grade = "A+";
                    else if (percentage >= 80) grade = "A";
                    else if (percentage >= 70) grade = "B";
                    else if (percentage >= 60) grade = "C";
                    else if (percentage >= 50) grade = "D";
                    else grade = "F";
                    
                    // Determine progress bar color based on percentage
                    let progressColor;
                    if (percentage >= 80) progressColor = "bg-green-500 dark:bg-green-600";
                    else if (percentage >= 70) progressColor = "bg-blue-500 dark:bg-blue-600";
                    else if (percentage >= 60) progressColor = "bg-amber-500 dark:bg-amber-600";
                    else if (percentage >= 50) progressColor = "bg-orange-500 dark:bg-orange-600";
                    else progressColor = "bg-red-500 dark:bg-red-600";
                    
                    return (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">
                          <div>
                            {result.exam.name}
                            {/* Include subject if available in the data model */}
                            {'subject' in result.exam && (
                              <p className="text-xs text-muted-foreground">{(result.exam as any).subject}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(result.submittedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium">{result.percentage}%</span>
                              <span>{result.score}/{result.exam.totalMarks} marks</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${progressColor}`} 
                                style={{ width: `${result.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
                              {result.rank} of {result.totalParticipants}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}