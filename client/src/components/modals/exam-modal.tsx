import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertExamSchema, Exam } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, ClockIcon, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formSchema = insertExamSchema.extend({
  date: z.date(),
  startTime: z.date().optional().nullable(),
  subject: z.string().min(2, "Subject must be at least 2 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  totalMarks: z.coerce.number().min(1, "Total marks must be at least 1"),
  status: z.enum(["upcoming", "active", "completed"]),
});

type ExamFormValues = z.infer<typeof formSchema>;

interface ExamModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  exam?: ExamFormValues & { id: number };
  mode: "create" | "edit";
}

export function ExamModal({ isOpen, onOpenChange, exam, mode }: ExamModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ExamFormValues | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const defaultValues: Partial<ExamFormValues> = {
    name: exam?.name || "",
    subject: exam?.subject || "",
    date: exam?.date ? new Date(exam.date) : new Date(),
    startTime: exam?.startTime ? new Date(exam.startTime) : null,
    duration: exam?.duration || 60,
    totalMarks: exam?.totalMarks || 100,
    status: exam?.status || "upcoming",
  };

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = (data: ExamFormValues) => {
    // Store the form data and show confirmation dialog
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingFormData) return;
    
    try {
      setIsSubmitting(true);
      setShowConfirmDialog(false);
      console.log("Submitting exam form with data:", pendingFormData);
      
      // Convert date and times to ISO strings for API request
      const examData = {
        ...pendingFormData,
        date: pendingFormData.date.toISOString(),
        startTime: pendingFormData.startTime ? pendingFormData.startTime.toISOString() : null,
      };
      
      if (mode === "create") {
        const newExam = await apiRequest<Exam>("POST", "/api/exams", examData);
        console.log("Created exam:", newExam);
        
        toast({
          title: "Success",
          description: `Exam "${newExam.name}" created successfully`,
        });
        
        // Force refresh the queries to get the latest data
        await queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
        
        // Close modal and redirect to paper creation page
        onOpenChange(false);
        navigate(`/exams/${newExam.id}/paper`);
        
        // Reset form fields on successful creation
        form.reset({
          name: "",
          subject: "",
          date: new Date(),
          duration: 60,
          totalMarks: 100,
          status: "upcoming"
        });
      } else if (mode === "edit" && exam) {
        const updatedExam = await apiRequest<Exam>("PUT", `/api/exams/${exam.id}`, examData);
        console.log("Updated exam:", updatedExam);
        
        toast({
          title: "Success",
          description: `Exam "${updatedExam.name}" updated successfully`,
        });
        
        // Force refresh the queries to get the latest data
        await queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error submitting exam form:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to save exam. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setPendingFormData(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby="exam-modal-description">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Exam" : "Edit Exam"}
          </DialogTitle>
          <DialogDescription id="exam-modal-description">
            {mode === "create" 
              ? "Add a new exam to the system by filling out the form below." 
              : "Update the exam details using the form below."
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Mathematics Final" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
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
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="totalMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Marks</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Exam Date</FormLabel>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setIsDatePickerOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Time</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "h:mm a")
                          ) : (
                            <span>Pick start time</span>
                          )}
                          <ClockIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="start">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-sm font-medium">Hour</label>
                              <Select
                                value={field.value ? format(field.value, "HH") : ""}
                                onValueChange={(hour) => {
                                  const currentMinute = field.value ? format(field.value, "mm") : "00";
                                  const date = new Date();
                                  date.setHours(parseInt(hour), parseInt(currentMinute), 0, 0);
                                  field.onChange(date);
                                }}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue placeholder="00" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                      {i.toString().padStart(2, '0')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Minute</label>
                              <Select
                                value={field.value ? format(field.value, "mm") : ""}
                                onValueChange={(minute) => {
                                  const currentHour = field.value ? format(field.value, "HH") : "00";
                                  const date = new Date();
                                  date.setHours(parseInt(currentHour), parseInt(minute), 0, 0);
                                  field.onChange(date);
                                }}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue placeholder="00" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 60 }, (_, i) => (
                                    <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                      {i.toString().padStart(2, '0')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => field.onChange(null)}
                          >
                            Clear
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const now = new Date();
                              field.onChange(now);
                            }}
                          >
                            Now
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {mode === "edit" && (
              <FormField
                control={form.control}
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
                        <SelectItem 
                          value="upcoming"
                          disabled={exam?.status === "active"}
                        >
                          Upcoming
                        </SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    {exam?.status === "active" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Cannot change active exam back to upcoming while students may be taking it
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Are you sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {mode === "create" ? (
              <div className="space-y-3">
                <span className="block">You are about to create a new exam with the following details:</span>
                <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
                  <div className="font-medium">{pendingFormData?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Subject: {pendingFormData?.subject} • 
                    Date: {pendingFormData?.date ? format(pendingFormData.date, "PPP") : ""} •
                    Duration: {pendingFormData?.duration} minutes
                  </div>
                  {pendingFormData?.startTime && (
                    <div className="text-sm text-muted-foreground">
                      Start Time: {format(pendingFormData.startTime, "h:mm a")}
                    </div>
                  )}
                </div>
                <span className="text-sm block">
                  This action will create the exam and redirect you to the paper creation page.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="block">You are about to update the exam details.</span>
                <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
                  <div className="font-medium">{pendingFormData?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Changes will be saved immediately.
                  </div>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingFormData(null)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirmSubmit}
            className="bg-primary hover:bg-primary/90"
          >
            {mode === "create" ? "Create Exam" : "Update Exam"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}