import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRoute, useLocation } from "wouter";
import { Exam, insertExamSchema } from "@shared/schema";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, FileText, Edit2, Trash2, Search, PlusCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schemas
const examFormSchema = insertExamSchema.extend({
  description: z.string().optional(),
});

const questionFormSchema = z.object({
  question: z.string().min(1, "Question is required"),
  type: z.enum(["multiple_choice", "written"]),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  marks: z.number().min(1, "Marks must be at least 1"),
}).refine((data) => {
  if (data.type === "multiple_choice") {
    // For multiple choice, require at least 2 options and a correct answer
    return data.options && 
           data.options.filter(opt => opt.trim().length > 0).length >= 2 &&
           data.correctAnswer && data.correctAnswer.trim().length > 0;
  }
  return true;
}, {
  message: "Multiple choice questions require at least 2 options and a correct answer",
  path: ["options"]
});

type ExamFormValues = z.infer<typeof examFormSchema>;
type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface Question {
  id: string;
  question: string;
  type: "multiple_choice" | "written";
  options?: string[];
  correctAnswer?: string;
  marks: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export default function PaperCreationPage() {
  const [match, params] = useRoute("/exams/:examId/paper");
  const examId = params?.examId ? parseInt(params.examId) : null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for UI
  const [isEditingExam, setIsEditingExam] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [addAnother, setAddAnother] = useState(false);

  // Fetch exam data
  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      if (!examId) return null;
      const response = await apiRequest('GET', `/api/exams/${examId}`);
      return response as Exam;
    },
    enabled: !!examId,
  });

  // Fetch questions from JSON file - refresh on mount and window focus
  const { data: paperData, isLoading: questionsLoading, refetch: refetchPaper } = useQuery({
    queryKey: ['paper', examId],
    queryFn: async () => {
      if (!examId) return null;
      const response = await apiRequest('GET', `/api/papers/${examId}?_t=${Date.now()}`);
      return response;
    },
    enabled: !!examId,
    staleTime: 0, // No cache - always fetch fresh data
    gcTime: 0, // Don't keep in cache
    refetchOnWindowFocus: true, // Refetch when user returns to the page
    refetchOnMount: 'always', // Always fetch fresh data on component mount
    refetchInterval: 2000, // Auto-refresh every 2 seconds while on the page
  });

  // Local state for immediate frontend display with smart sync
  const [localQuestions, setLocalQuestions] = useState<Question[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // Update local questions when paper data loads or changes with conflict resolution
  useEffect(() => {
    if (paperData) {
      setHasInitiallyLoaded(true);
      if (paperData.questions && Array.isArray(paperData.questions)) {
        // Always sync from server data on load/refresh to prevent phantom questions
        setLocalQuestions(paperData.questions);
        setLastSyncTime(Date.now());
        console.log('✓ Questions synchronized from server:', paperData.questions.length, 'questions');
      } else {
        // If paperData exists but has no questions, ensure local state is empty
        setLocalQuestions([]);
        console.log('✓ No questions found in paper, cleared local state');
      }
    }
  }, [paperData]);

  // Removed automatic refresh on visibility/focus changes

  // Removed automatic periodic sync - questions now refresh only on user actions

  const questions = localQuestions;

  // Forms
  const examForm = useForm<ExamFormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      name: "",
      subject: "",
      date: new Date(),
      duration: 60,
      totalMarks: 100,
      status: "upcoming",
      description: "",
    },
  });

  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: "",
      type: "multiple_choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      marks: 1,
    },
  });

  // Update exam form when data loads
  useEffect(() => {
    if (exam) {
      examForm.reset({
        name: exam.name || "",
        subject: exam.subject || "",
        date: exam.date ? new Date(exam.date) : new Date(),
        duration: exam.duration || 60,
        totalMarks: exam.totalMarks || 100,
        status: exam.status || "upcoming",
        description: exam.description || "",
      });
    }
  }, [exam, examForm]);

  // Mutations
  const updateExamMutation = useMutation({
    mutationFn: async (data: ExamFormValues) => {
      if (!examId) throw new Error("Exam ID is required");
      return apiRequest("PUT", `/api/exams/${examId}`, data);
    },
    onSuccess: () => {
      toast({ title: "Exam updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      setIsEditingExam(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating exam",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      if (!examId) throw new Error("Exam ID is required");
      
      // Create optimistic question for instant UI feedback
      const optimisticQuestion: Question = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question: data.question,
        type: data.type,
        options: data.type === "multiple_choice" ? data.options?.filter(opt => opt.trim() !== "") : undefined,
        correctAnswer: data.type === "multiple_choice" ? data.correctAnswer : undefined,
        marks: data.marks,
        orderIndex: questions.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Immediately update UI
      setLocalQuestions(prev => [...prev, optimisticQuestion]);
      
      // Handle dialog closing and form reset immediately for better UX
      if (!addAnother) {
        setIsQuestionDialogOpen(false);
      }
      
      questionForm.reset({
        question: "",
        type: data.type,
        options: ["", "", "", ""],
        correctAnswer: "",
        marks: data.marks,
      });
      setEditingQuestion(null);
      
      // Call API in background
      const questionData = {
        examId,
        question: data.question,
        type: data.type,
        options: data.type === "multiple_choice" ? data.options?.filter(opt => opt.trim() !== "") : undefined,
        correctAnswer: data.type === "multiple_choice" ? data.correctAnswer : undefined,
        marks: data.marks,
        orderIndex: questions.length,
      };
      
      const response = await apiRequest("POST", "/api/questions", questionData);
      
      // Replace optimistic question with real one from server
      setLocalQuestions(prev => 
        prev.map(q => q.id === optimisticQuestion.id ? response : q)
      );
      
      // Invalidate queries and refetch to ensure data consistency
      await queryClient.invalidateQueries({ queryKey: ['paper', examId] });
      await refetchPaper();
      
      return response;
    },
    onSuccess: (newQuestion: Question) => {
      toast({ 
        title: "Question added",
        description: `${addAnother ? 'Ready for next question' : 'Question added successfully'}`,
      });
      
      // Focus back to question input for faster entry
      if (addAnother) {
        setTimeout(() => {
          const questionInput = document.querySelector('textarea[placeholder="Enter question"]') as HTMLTextAreaElement;
          questionInput?.focus();
        }, 100);
      }
    },
    onError: (error: any) => {
      // Revert the optimistic update on error
      setLocalQuestions(prev => prev.slice(0, -1));
      toast({
        title: "Error adding question",
        description: error.message,
        variant: "destructive",
      });
      setIsQuestionDialogOpen(true); // Reopen dialog for retry
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues & { id: string }) => {
      if (!examId) throw new Error("Exam ID is required");
      
      const originalQuestion = questions.find(q => q.id === data.id);
      const updatedQuestion: Question = {
        id: data.id,
        question: data.question,
        type: data.type,
        options: data.type === "multiple_choice" ? data.options?.filter(opt => opt.trim() !== "") : undefined,
        correctAnswer: data.type === "multiple_choice" ? data.correctAnswer : undefined,
        marks: data.marks,
        orderIndex: originalQuestion?.orderIndex || 0,
        createdAt: originalQuestion?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Immediately update local state for instant UI feedback
      setLocalQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
      setIsQuestionDialogOpen(false);
      questionForm.reset({
        question: "",
        type: "multiple_choice",
        options: ["", "", "", ""],
        correctAnswer: "",
        marks: 1,
      });
      setEditingQuestion(null);
      
      // Call API to persist changes
      const updateData = {
        examId,
        question: data.question,
        type: data.type,
        options: data.type === "multiple_choice" ? data.options?.filter(opt => opt.trim() !== "") : undefined,
        correctAnswer: data.type === "multiple_choice" ? data.correctAnswer : undefined,
        marks: data.marks,
      };
      
      const response = await apiRequest("PUT", `/api/questions/${data.id}`, updateData);
      
      // Refetch paper data to ensure consistency
      await queryClient.invalidateQueries({ queryKey: ['paper', examId] });
      await refetchPaper();
      
      return { updatedQuestion, originalQuestion, response };
    },
    onSuccess: ({ updatedQuestion }) => {
      toast({ 
        title: "Question updated",
        description: `Question "${updatedQuestion.question.substring(0, 50)}${updatedQuestion.question.length > 50 ? '...' : ''}" updated successfully`,
      });
    },
    onError: (error: any, variables) => {
      // Revert the optimistic update on error
      const originalQuestion = questions.find(q => q.id === variables.id);
      if (originalQuestion) {
        setLocalQuestions(prev => prev.map(q => q.id === variables.id ? originalQuestion : q));
      }
      toast({
        title: "Error updating question",
        description: error.message,
        variant: "destructive",
      });
      setIsQuestionDialogOpen(true); // Reopen dialog for retry
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      if (!examId) throw new Error("Exam ID is required");
      
      const questionToDelete = questions.find(q => q.id === questionId);
      
      // Immediately update local state for instant UI feedback
      setLocalQuestions(prev => prev.filter(q => q.id !== questionId));
      
      // Call API to persist deletion
      await apiRequest("DELETE", `/api/questions/${questionId}?examId=${examId}`);
      
      // Refetch paper data to ensure consistency
      await queryClient.invalidateQueries({ queryKey: ['paper', examId] });
      await refetchPaper();
      
      return { questionId, questionToDelete };
    },
    onSuccess: ({ questionToDelete }) => {
      toast({ 
        title: "Question deleted",
        description: `Question "${questionToDelete?.question.substring(0, 50)}${questionToDelete?.question.length! > 50 ? '...' : ''}" deleted successfully`,
      });
    },
    onError: (error: any, questionId: string) => {
      // Revert the optimistic update on error
      const questionToRestore = questions.find(q => q.id === questionId);
      if (questionToRestore) {
        setLocalQuestions(prev => [...prev, questionToRestore].sort((a, b) => a.orderIndex - b.orderIndex));
      }
      toast({
        title: "Error deleting question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleExamSubmit = (data: ExamFormValues) => {
    updateExamMutation.mutate(data);
  };

  const handleQuestionSubmit = (data: QuestionFormValues) => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({ ...data, id: editingQuestion.id });
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    questionForm.reset({
      question: question.question,
      type: question.type,
      options: question.options || ["", "", "", ""],
      correctAnswer: question.correctAnswer || "",
      marks: question.marks,
    });
    setIsQuestionDialogOpen(true);
  };

  const handleDeleteQuestion = (questionId: string) => {
    deleteQuestionMutation.mutate(questionId);
  };

  const filteredQuestions = questions.filter(q =>
    q.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!examId) {
    return (
      <AppShell title="Paper Creation">
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-foreground">No exam selected</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please select an exam to create or edit its paper.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setLocation("/exams")}>
                    <Plus className="mr-2 h-4 w-4" />
                    View Exams
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (examLoading) {
    return (
      <AppShell title="Paper Creation">
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">Loading exam details...</div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (!exam) {
    return (
      <AppShell title="Paper Creation">
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-foreground">Exam not found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  The requested exam could not be found.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setLocation("/exams")}>
                    Back to Exams
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  // Block access if exam status is completed
  if (exam.status === "completed") {
    return (
      <AppShell title="Paper Creation">
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-foreground">Access Restricted</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cannot modify papers for completed exams. This exam has already been completed and can no longer be edited.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setLocation("/exams")}>
                    Back to Exams
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Paper Creation">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Paper Creation</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage exam details and questions for {exam.name}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {questionsLoading && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Syncing...
              </div>
            )}
            <Badge variant={exam.status === "active" ? "default" : "secondary"}>
              {exam.status}
            </Badge>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/exams")}
              size="sm"
              className="whitespace-nowrap"
            >
              Back to Exams
            </Button>
          </div>
        </div>

        {/* Exam Details Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Exam Information
              </CardTitle>
              {!isEditingExam && (
                <Button variant="outline" size="sm" onClick={() => setIsEditingExam(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditingExam ? (
              <Form {...examForm}>
                <form onSubmit={examForm.handleSubmit(handleExamSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={examForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter exam name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={examForm.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a subject" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Mathematics">Mathematics</SelectItem>
                              <SelectItem value="Physics">Physics</SelectItem>
                              <SelectItem value="Chemistry">Chemistry</SelectItem>
                              <SelectItem value="Biology">Biology</SelectItem>
                              <SelectItem value="English">English</SelectItem>
                              <SelectItem value="History">History</SelectItem>
                              <SelectItem value="Geography">Geography</SelectItem>
                              <SelectItem value="Computer Science">Computer Science</SelectItem>
                              <SelectItem value="Economics">Economics</SelectItem>
                              <SelectItem value="Psychology">Psychology</SelectItem>
                              <SelectItem value="Philosophy">Philosophy</SelectItem>
                              <SelectItem value="Sociology">Sociology</SelectItem>
                              <SelectItem value="Political Science">Political Science</SelectItem>
                              <SelectItem value="Art">Art</SelectItem>
                              <SelectItem value="Music">Music</SelectItem>
                              <SelectItem value="Physical Education">Physical Education</SelectItem>
                              <SelectItem value="French">French</SelectItem>
                              <SelectItem value="Spanish">Spanish</SelectItem>
                              <SelectItem value="Statistics">Statistics</SelectItem>
                              <SelectItem value="Environmental Science">Environmental Science</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={examForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter duration" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel>Total Marks</FormLabel>
                      <Input 
                        type="number" 
                        value={questions.reduce((sum, q) => sum + q.marks, 0)}
                        disabled
                        className="bg-muted"
                      />
                    </FormItem>
                    <FormField
                      control={examForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="upcoming">Upcoming</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={examForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter exam description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditingExam(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateExamMutation.isPending}
                    >
                      {updateExamMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Exam Name</label>
                  <p className="text-sm">{exam.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject</label>
                  <p className="text-sm">{exam.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Duration</label>
                  <p className="text-sm">{exam.duration} minutes</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Marks</label>
                  <p className="text-sm">{questions.reduce((sum, q) => sum + q.marks, 0)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p className="text-sm">{new Date(exam.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm capitalize">{exam.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{exam.description || "No description provided"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions Section */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <CardTitle>Questions ({questions.length})</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        // Force invalidate the query cache to ensure fresh data
                        await queryClient.invalidateQueries({ queryKey: ['paper', examId] });
                        
                        // Manually refetch with a fresh timestamp to bypass any server caching
                        const freshData = await refetchPaper();
                        
                        // Force immediate update of local questions state
                        if (freshData.data?.questions) {
                          setLocalQuestions(freshData.data.questions);
                          setLastSyncTime(Date.now());
                        }
                        
                        toast({
                          title: "Questions refreshed",
                          description: freshData.data?.questions ? 
                            `Loaded ${freshData.data.questions.length} questions from storage` : 
                            "No questions found in storage",
                        });
                        
                        console.log('🔄 Manual refresh completed:', {
                          questionsCount: freshData.data?.questions?.length || 0,
                          timestamp: new Date().toISOString()
                        });
                      } catch (error) {
                        console.error('Error during manual refresh:', error);
                        toast({
                          title: "Refresh failed",
                          description: "Could not load latest questions. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={questionsLoading}
                    className="whitespace-nowrap"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${questionsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingQuestion(null);
                        questionForm.reset();
                      }} className="whitespace-nowrap w-full sm:w-auto">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto w-[calc(100vw-2rem)] sm:w-full">
                      <DialogHeader>
                        <DialogTitle>
                          {editingQuestion ? "Edit Question" : "Add New Question"}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...questionForm}>
                        <form onSubmit={questionForm.handleSubmit(handleQuestionSubmit)} className="space-y-4">
                          <FormField
                            control={questionForm.control}
                            name="question"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Question</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Enter question" {...field} className="min-h-[80px]" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={questionForm.control}
                              name="type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Question Type</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                      <SelectItem value="written">Written</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={questionForm.control}
                              name="marks"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Marks</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="Enter marks" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {questionForm.watch("type") === "multiple_choice" && (
                            <div className="space-y-2">
                              <FormLabel>Options</FormLabel>
                              {[0, 1, 2, 3].map((index) => (
                                <FormField
                                  key={index}
                                  control={questionForm.control}
                                  name={`options.${index}`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          placeholder={`Option ${String.fromCharCode(65 + index)}`} 
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          )}

                          {questionForm.watch("type") === "multiple_choice" && (
                            <FormField
                              control={questionForm.control}
                              name="correctAnswer"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Correct Answer</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select correct answer" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {questionForm.watch("options")?.map((option, index) => (
                                        option && (
                                          <SelectItem key={index} value={option}>
                                            {String.fromCharCode(65 + index)}. {option}
                                          </SelectItem>
                                        )
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          {/* Add Another Checkbox for faster question creation */}
                          {!editingQuestion && (
                            <div className="flex items-center space-x-2 pt-2 border-t">
                              <input
                                type="checkbox"
                                id="addAnother"
                                checked={addAnother}
                                onChange={(e) => setAddAnother(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <label htmlFor="addAnother" className="text-sm text-muted-foreground">
                                Keep dialog open to add more questions quickly
                              </label>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                setIsQuestionDialogOpen(false);
                                setAddAnother(false);
                              }}
                              className="order-2 sm:order-1"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit"
                              disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                              className="order-1 sm:order-2"
                            >
                              {editingQuestion ? "Update Question" : "Add Question"}
                              {!editingQuestion && (
                                <span className="ml-2 text-xs opacity-70">(Ctrl+Enter)</span>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {questionsLoading ? (
              <div className="text-center py-8">Loading questions...</div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-foreground">
                  {searchTerm ? "No questions found" : "No questions yet"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchTerm ? "Try adjusting your search term" : "Start by adding your first question"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question, index) => (
                  <Card key={question.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {question.type === "multiple_choice" ? "Multiple Choice" : "Written"}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {question.marks} {question.marks === 1 ? "mark" : "marks"}
                            </Badge>
                          </div>
                          <h4 className="text-sm font-medium break-words">
                            Q{index + 1}. {question.question}
                          </h4>
                          {question.options && question.options.length > 0 && (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="break-words">
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                </div>
                              ))}
                            </div>
                          )}
                          {question.correctAnswer && (
                            <p className="text-sm text-green-600 mt-2 break-words">
                              <strong>Answer:</strong> {question.correctAnswer}
                            </p>
                          )}
                        </div>
                        <div className="flex w-full sm:w-auto gap-2 mt-3 sm:mt-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditQuestion(question)}
                            className="flex-1 sm:flex-initial min-h-[40px]"
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="flex-1 sm:flex-initial min-h-[40px]">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-md mx-4">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Question</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this question? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                                <AlertDialogCancel className="order-2 sm:order-1">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteQuestion(question.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 order-1 sm:order-2"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>


      </div>
    </AppShell>
  );
}