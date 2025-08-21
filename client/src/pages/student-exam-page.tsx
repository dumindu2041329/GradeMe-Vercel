import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Clock, 
  AlertTriangle, 
  Send, 
  CheckCircle, 
  BookOpen,
  Target,
  BarChart,
  FileCheck
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

// Define the structure of an exam question
interface Question {
  id: string;
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false';
  options?: string[];
  marks: number;
  orderIndex: number;
}

// Define the structure of an exam
interface Exam {
  id: number;
  name: string;
  subject: string;
  duration: number;
  totalMarks: number;
  questions: Question[];
}

// Define the structure of an exam result
interface ExamResult {
  examId: number;
  studentId: number;
  answers: {[key: string]: string};
  score: number;
  percentage: number;
  rank?: number;
  totalParticipants?: number;
  attemptedMarks: number;
  exam: {
    totalMarks: number;
    [key: string]: any;
  };
}

export default function StudentExamPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<{[key: string]: string}>({});
  const [currentProgress, setCurrentProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  
  // Fetch exam data
  const { data: exam, isLoading } = useQuery<Exam>({
    queryKey: [`/api/exams/${id}`, user?.studentId],
    enabled: !!user?.studentId && !!id,
  });
  
  // Format time remaining as HH:MM:SS
  const formatTimeRemaining = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  }, []);
  
  // Initialize timer when exam data is loaded
  useEffect(() => {
    if (exam && timeRemaining === null) {
      // Convert duration from minutes to seconds
      setTimeRemaining(exam.duration * 60);
    }
  }, [exam, timeRemaining]);
  
  // Submit exam mutation
  const submitExamMutation = useMutation({
    mutationFn: async (data: {examId: number, answers: {[key: string]: string}}) => {
      const response = await fetch(`/api/exams/${data.examId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers: data.answers }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit exam');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setExamResult(data);
      setShowResultDialog(true);
      // Invalidate student dashboard data to refresh exam lists
      queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Error submitting exam",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Submit exam handler
  const handleSubmitExam = useCallback(() => {
    setShowSubmitConfirmation(true);
  }, []);
  
  // Confirm submission handler
  const handleConfirmSubmit = useCallback(() => {
    if (!exam) return;
    
    setShowSubmitConfirmation(false);
    submitExamMutation.mutate({
      examId: exam.id,
      answers
    });
  }, [exam, answers, submitExamMutation]);
  
  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining === null) return;
    
    // Show warning when less than 5 minutes remain
    if (timeRemaining <= 300 && timeRemaining > 0 && !showTimeWarning) {
      setShowTimeWarning(true);
      toast({
        title: "Time is running out!",
        description: "You have less than 5 minutes remaining.",
        variant: "destructive"
      });
    }
    
    // Auto-submit when time runs out
    if (timeRemaining <= 0) {
      handleSubmitExam();
      return;
    }
    
    const timer = setTimeout(() => {
      setTimeRemaining(prev => prev !== null ? prev - 1 : null);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeRemaining, showTimeWarning, toast, handleSubmitExam]);
  
  // States for leave exam dialog
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  
  // Leave exam handlers
  const handleOpenLeaveDialog = useCallback(() => {
    setShowLeaveDialog(true);
  }, []);
  
  const handleLeaveExam = useCallback(() => {
    navigate("/student/dashboard");
  }, [navigate]);
  
  // Handle exam completion (after viewing results)
  const handleCompleteExam = useCallback(() => {
    // Invalidate relevant queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["/api/student/results"] });
    navigate("/student/dashboard");
  }, [navigate]);
  
  // Answer change handler
  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    const newAnswers = {
      ...answers,
      [questionId]: answer
    };
    
    setAnswers(newAnswers);
    
    // Update progress - count the number of questions that have answers
    const answeredQuestions = Object.keys(newAnswers).length;
    const totalQuestions = exam?.questions?.length || 1;
    const progress = Math.round((answeredQuestions / totalQuestions) * 100);
    setCurrentProgress(progress);
  }, [answers, exam?.questions?.length]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Exam Not Found</h1>
        <p className="text-muted-foreground mb-4">The exam you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate("/student/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Button>
      </div>
    );
  }
  
  // Get exam questions from the API response
  const questions = exam.questions || [];
  
  // If exam has no questions, show appropriate message
  if (!questions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">No Questions Available</h1>
        <p className="text-muted-foreground mb-4">This exam doesn't have any questions yet. Please contact your instructor.</p>
        <Button onClick={() => navigate("/student/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Exam Header */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => navigate("/student/dashboard")} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold">{exam.name}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                timeRemaining !== null && timeRemaining < 300 
                  ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" 
                  : "bg-[#121438] text-blue-400"
              }`}>
                <Clock className={`h-5 w-5 ${
                  timeRemaining !== null && timeRemaining < 300 
                    ? "text-red-500" 
                    : "text-blue-500"
                }`} />
                <span className={`font-medium ${
                  timeRemaining !== null && timeRemaining < 300 
                    ? "text-red-600 dark:text-red-400" 
                    : "text-blue-300"
                }`}>
                  {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : "--:--:--"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Exam Content */}
      <main className="flex-1 container mx-auto py-6 px-4">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Progress: {Object.keys(answers).length}/{questions.length} questions answered</span>
            <span className="text-sm font-medium">{currentProgress}%</span>
          </div>
          <Progress value={currentProgress} className="h-2" />
        </div>
        
        {/* Questions */}
        <div className="space-y-8">
          {questions.map((question, index) => (
            <Card key={question.id} className="border-primary/10 dark:border-primary/20">
              <CardContent className="pt-6">
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-medium">Question {index + 1}</h3>
                  <span className="text-sm text-primary">{question.marks} mark{question.marks > 1 ? 's' : ''}</span>
                </div>
                
                <p className="mb-6">{question.question}</p>
                
                {question.type === 'multiple_choice' && (
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    className="space-y-2"
                  >
                    {question.options?.map((option) => (
                      <div key={option} className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
                        <RadioGroupItem value={option} id={`option-${question.id}-${option}`} />
                        <Label htmlFor={`option-${question.id}-${option}`} className="flex-1 cursor-pointer py-2">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                
                {question.type === 'true_false' && (
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
                      <RadioGroupItem value="True" id={`true-${question.id}`} />
                      <Label htmlFor={`true-${question.id}`} className="flex-1 cursor-pointer py-2">
                        True
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
                      <RadioGroupItem value="False" id={`false-${question.id}`} />
                      <Label htmlFor={`false-${question.id}`} className="flex-1 cursor-pointer py-2">
                        False
                      </Label>
                    </div>
                  </RadioGroup>
                )}
                
                {(question.type === 'short_answer' || question.type === 'essay') && (
                  <Textarea
                    placeholder={question.type === 'essay' ? 'Write your detailed answer here...' : 'Type your short answer here...'}
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className={question.type === 'essay' ? 'min-h-[200px]' : 'min-h-[100px]'}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      
      {/* Exam Footer */}
      <footer className="border-t border-border py-4 px-4 sticky bottom-0 bg-background">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Total marks: {exam.totalMarks} | Duration: {exam.duration} minutes
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" onClick={handleOpenLeaveDialog}>
              Leave Exam
            </Button>
            <Button onClick={handleSubmitExam} disabled={submitExamMutation.isPending}>
              {submitExamMutation.isPending ? "Submitting..." : "Submit Exam"}
            </Button>
          </div>
        </div>
      </footer>
      
      {/* Exam Results Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exam Results</DialogTitle>
          </DialogHeader>
          
          {examResult && (
            <div className="py-4">
              <div className="grid grid-cols-1 gap-6 mb-6">
                <div className="text-center p-6 rounded-lg bg-primary/5 border border-primary/10">
                  <h3 className="text-2xl font-bold text-primary mb-2">
                    {examResult.score}/{examResult.attemptedMarks}
                  </h3>
                  <Progress value={examResult.percentage} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Your score: {examResult.percentage}% (based on questions answered)
                  </p>
                </div>
                
                <div className="text-center p-6 rounded-lg bg-primary/5 border border-primary/10">
                  <h3 className="text-2xl font-bold text-primary mb-2">
                    {examResult.rank} <span className="text-base font-medium">of {examResult.totalParticipants}</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your rank in class
                  </p>
                </div>
              </div>
              
              <p className="text-center text-sm text-muted-foreground mb-6">
                Congratulations on completing the exam! Your results have been recorded.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              onClick={handleCompleteExam} 
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirmation} onOpenChange={setShowSubmitConfirmation}>
        <DialogContent className="sm:max-w-lg" aria-describedby="submit-exam-description">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold">
              Submit Exam?
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <div className="flex justify-center mb-6">
              <div className="bg-amber-100 dark:bg-amber-900/20 p-4 rounded-full">
                <FileCheck className="h-10 w-10 text-amber-600" />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="text-center" id="submit-exam-description">
                <h4 className="font-semibold text-lg mb-2">Are you sure you want to submit your exam?</h4>
                <p className="text-sm text-muted-foreground">
                  Once submitted, you cannot change your answers.
                </p>
              </div>
              
              {exam && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                  <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Exam Summary
                  </h5>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>Exam Name:</span>
                    </div>
                    <span className="font-medium">{exam.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Questions Answered:</span>
                    </div>
                    <span className="font-medium">
                      {Object.keys(answers).length} / {exam.questions.length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span>Total Marks:</span>
                    </div>
                    <span className="font-medium">{exam.totalMarks}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span>Time Remaining:</span>
                    </div>
                    <span className="font-medium">
                      {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : '--:--:--'}
                    </span>
                  </div>
                </div>
              )}
              
              {exam && Object.keys(answers).length < exam.questions.length && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-900 dark:text-amber-400">
                        Warning: Unanswered Questions
                      </p>
                      <p className="text-amber-700 dark:text-amber-300 mt-1">
                        You have {exam.questions.length - Object.keys(answers).length} unanswered question(s). 
                        These will be marked as incorrect.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSubmitConfirmation(false)}
              className="sm:flex-1"
            >
              Review Answers
            </Button>
            <Button 
              onClick={handleConfirmSubmit}
              className="sm:flex-1 bg-primary hover:bg-primary/90"
              disabled={submitExamMutation.isPending}
            >
              {submitExamMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Exam
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Exam Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold text-red-500">Leave Exam?</DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
            </div>
            
            <p className="text-center mb-2 font-medium">
              Are you sure you want to leave this exam?
            </p>
            <p className="text-center text-sm text-muted-foreground mb-6">
              Your progress will not be saved and you will need to restart the exam from the beginning.
            </p>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowLeaveDialog(false)}
              className="sm:flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLeaveExam}
              className="sm:flex-1"
            >
              Leave Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}