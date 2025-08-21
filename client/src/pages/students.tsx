import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PlusCircle, Search, Pencil, Trash2, Users, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";

// Define Student interface
interface Student {
  id: number;
  name: string;
  email: string;
  class: string;
  enrollmentDate: string;
  password?: string;
}

// Form schema for create student (password required)
const createFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  class: z.string().min(1, { message: "Class is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  enrollmentDate: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: "Please enter a valid date",
  })
}).refine(data => {
  const name = data.name.toLowerCase().trim();
  const emailLocal = data.email.toLowerCase().split('@')[0]; // Get part before @
  const emailFull = data.email.toLowerCase().trim();
  
  // Check if name matches email (full or local part)
  return name !== emailFull && name !== emailLocal;
}, {
  message: "Name cannot be the same as email address",
  path: ["email"]
});

// Form schema for edit student (password optional)
const editFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  class: z.string().min(1, { message: "Class is required" }),
  password: z.string().optional().refine(val => !val || val.length >= 6, {
    message: "Password must be at least 6 characters"
  }),
  enrollmentDate: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: "Please enter a valid date",
  })
}).refine(data => {
  const name = data.name.toLowerCase().trim();
  const emailLocal = data.email.toLowerCase().split('@')[0]; // Get part before @
  const emailFull = data.email.toLowerCase().trim();
  
  // Check if name matches email (full or local part)
  return name !== emailFull && name !== emailLocal;
}, {
  message: "Name cannot be the same as email address",
  path: ["email"]
});

type CreateStudentFormValues = z.infer<typeof createFormSchema>;
type EditStudentFormValues = z.infer<typeof editFormSchema>;

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: response, isLoading } = useQuery<{
    students: Student[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: ["/api/students", currentPage, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: debouncedSearch,
      });
      const res = await fetch(`/api/students?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const students = response?.students || [];
  const pagination = response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const onCreateSubmit = async (data: CreateStudentFormValues) => {
    try {
      setIsSubmitting(true);
      
      const newStudent = await apiRequest<Student>("POST", "/api/students", data);
      console.log("Created student:", newStudent);
      
      toast({
        title: "Student Created Successfully",
        description: `${newStudent.name} has been added to the system and can now access their student account.`,
      });
      
      // Force refresh to get the latest data
      await queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      
      // Reset the form and close the modal
      createForm.reset();
      setIsCreateModalOpen(false);
    } catch (error: any) {
      console.error("Error creating student:", error);
      
      // Handle specific error responses from the server
      let errorTitle = "Failed to Create Student";
      let errorMessage = "Unable to create the student account. Please try again.";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // Customize titles based on error type
        if (errorMessage.includes("email address already exists")) {
          errorTitle = "Email Already in Use";
          errorMessage = "This email address is already registered. Please use a different email address.";
        } else if (errorMessage.includes("Name cannot be the same")) {
          errorTitle = "Invalid Name/Email";
          errorMessage = "Student name cannot be the same as the email address. Please choose a different name.";
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onEditSubmit = async (data: EditStudentFormValues) => {
    if (!selectedStudent) return;
    
    try {
      setIsSubmitting(true);
      
      // Remove password from data if it's empty (don't update password)
      const updateData = { ...data };
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password;
      }
      
      const updatedStudent = await apiRequest<Student>("PUT", `/api/students/${selectedStudent.id}`, updateData);
      console.log("Updated student:", updatedStudent);
      
      toast({
        title: "Student Updated Successfully",
        description: `${updatedStudent.name}'s information has been updated in the system.`,
      });
      
      // Force refresh to get the latest data
      await queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      
      setIsEditModalOpen(false);
      setSelectedStudent(null);
    } catch (error: any) {
      console.error("Error updating student:", error);
      
      // Handle specific error responses from the server
      let errorTitle = "Failed to Update Student";
      let errorMessage = "Unable to update the student information. Please try again.";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // Customize titles based on error type
        if (errorMessage.includes("email address already exists")) {
          errorTitle = "Email Already in Use";
          errorMessage = "This email address is already registered by another student. Please use a different email address.";
        } else if (errorMessage.includes("Name cannot be the same")) {
          errorTitle = "Invalid Name/Email";
          errorMessage = "Student name cannot be the same as the email address. Please choose a different name.";
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onDeleteConfirm = async () => {
    if (!selectedStudent) return;
    
    try {
      setIsSubmitting(true);
      
      const result = await apiRequest<{success: boolean}>("DELETE", `/api/students/${selectedStudent.id}`);
      console.log("Delete student result:", result);
      
      if (result.success) {
        toast({
          title: "Student Removed Successfully",
          description: `${selectedStudent.name} has been permanently removed from the system.`,
        });
        
        // Force refresh to get the latest data
        await queryClient.invalidateQueries({ queryKey: ["/api/students"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      }
      
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
    } catch (error: any) {
      console.error("Error deleting student:", error);
      
      let errorTitle = "Failed to Delete Student";
      let errorMessage = "Unable to remove the student from the system. Please try again.";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form for creating a new student
  const createForm = useForm<CreateStudentFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      name: "",
      email: "",
      class: "",
      password: "",
      enrollmentDate: new Date().toISOString().split('T')[0],
    },
  });
  
  // Form for editing an existing student
  const editForm = useForm<EditStudentFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: "",
      email: "",
      class: "",
      password: "",
      enrollmentDate: new Date().toISOString().split('T')[0],
    },
  });
  
  // Check if we should open create modal from dashboard
  useEffect(() => {
    const shouldOpenModal = sessionStorage.getItem("openStudentCreateModal");
    if (shouldOpenModal === "true") {
      setIsCreateModalOpen(true);
      sessionStorage.removeItem("openStudentCreateModal");
    }
  }, []);

  // Reset edit form when selected student changes
  useEffect(() => {
    if (selectedStudent) {
      editForm.reset({
        name: selectedStudent.name,
        email: selectedStudent.email,
        class: selectedStudent.class,
        password: "",
        enrollmentDate: selectedStudent.enrollmentDate ? new Date(selectedStudent.enrollmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
    }
  }, [selectedStudent, editForm]);

  return (
    <AppShell title="Students" sidebar="admin">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Students</h1>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Name</TableHead>
                <TableHead className="font-medium">Email</TableHead>
                <TableHead className="font-medium">Class</TableHead>
                <TableHead className="font-medium">Enrollment Date</TableHead>
                <TableHead className="font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : students.length > 0 ? (
                students.map((student: Student) => (
                  <TableRow key={student.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.enrollmentDate ? format(new Date(student.enrollmentDate), "MM/dd/yyyy") : "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditStudent(student)} className="text-blue-500 hover:text-blue-400">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteStudent(student)} className="text-red-500 hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center p-8">
                      <Users className="h-10 w-10 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium">No students found</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add your first student to get started.
                      </p>
                      <Button 
                        className="mt-4 bg-primary hover:bg-primary/90"
                        onClick={() => setIsCreateModalOpen(true)}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Student
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} students
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                    className={currentPage === i + 1 ? "" : "w-10"}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Create Student Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
            <DialogDescription>
              Create a new student account in the system
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Grade 1">Grade 1</SelectItem>
                        <SelectItem value="Grade 2">Grade 2</SelectItem>
                        <SelectItem value="Grade 3">Grade 3</SelectItem>
                        <SelectItem value="Grade 4">Grade 4</SelectItem>
                        <SelectItem value="Grade 5">Grade 5</SelectItem>
                        <SelectItem value="Grade 6">Grade 6</SelectItem>
                        <SelectItem value="Grade 7">Grade 7</SelectItem>
                        <SelectItem value="Grade 8">Grade 8</SelectItem>
                        <SelectItem value="Grade 9">Grade 9</SelectItem>
                        <SelectItem value="Grade 10">Grade 10</SelectItem>
                        <SelectItem value="Grade 11">Grade 11</SelectItem>
                        <SelectItem value="Grade 12">Grade 12</SelectItem>
                        <SelectItem value="Grade 13">Grade 13</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="••••••" 
                          type={showCreatePassword ? "text" : "password"} 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCreatePassword(!showCreatePassword)}
                        >
                          {showCreatePassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="enrollmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enrollment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Student"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Student Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Grade 1">Grade 1</SelectItem>
                        <SelectItem value="Grade 2">Grade 2</SelectItem>
                        <SelectItem value="Grade 3">Grade 3</SelectItem>
                        <SelectItem value="Grade 4">Grade 4</SelectItem>
                        <SelectItem value="Grade 5">Grade 5</SelectItem>
                        <SelectItem value="Grade 6">Grade 6</SelectItem>
                        <SelectItem value="Grade 7">Grade 7</SelectItem>
                        <SelectItem value="Grade 8">Grade 8</SelectItem>
                        <SelectItem value="Grade 9">Grade 9</SelectItem>
                        <SelectItem value="Grade 10">Grade 10</SelectItem>
                        <SelectItem value="Grade 11">Grade 11</SelectItem>
                        <SelectItem value="Grade 12">Grade 12</SelectItem>
                        <SelectItem value="Grade 13">Grade 13</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password (leave blank to keep current)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="••••••" 
                          type={showEditPassword ? "text" : "password"} 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                        >
                          {showEditPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="enrollmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enrollment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Student"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student <strong>{selectedStudent?.name}</strong> and remove all their associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteConfirm}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
