import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { PlusCircle, Pencil, Trash2, FileQuestion, Search, FileText } from "lucide-react";
import { Exam } from "@shared/schema";
import { ExamModal } from "@/components/modals/exam-modal";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Exams() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const { data: response, isLoading } = useQuery<{
    exams: Exam[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: ["/api/exams", currentPage, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: debouncedSearch,
      });
      const res = await fetch(`/api/exams?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const exams = response?.exams || [];
  const pagination = response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  // Check if we should open create modal from dashboard or edit a specific exam
  useEffect(() => {
    // Check for create modal flag
    const shouldOpenModal = sessionStorage.getItem("openExamCreateModal");
    if (shouldOpenModal === "true") {
      setIsCreateModalOpen(true);
      sessionStorage.removeItem("openExamCreateModal");
    }
    
    // Check for edit exam flag
    const editExamId = sessionStorage.getItem("editExamId");
    if (editExamId && exams.length > 0) {
      // Find the exam with this ID when data is loaded
      const examToEdit = exams.find(exam => exam.id === parseInt(editExamId));
      if (examToEdit) {
        setSelectedExam(examToEdit);
        setIsEditModalOpen(true);
        sessionStorage.removeItem("editExamId");
      }
    }
  }, [exams]);



  const handleEditExam = (exam: Exam) => {
    setSelectedExam(exam);
    setIsEditModalOpen(true);
  };

  const handleDeleteExam = (exam: Exam) => {
    setSelectedExam(exam);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteExam = async () => {
    if (!selectedExam) return;
    
    try {
      const result = await apiRequest<{success: boolean}>("DELETE", `/api/exams/${selectedExam.id}`);
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Exam "${selectedExam.name}" deleted successfully`,
        });
        
        // Force refresh the queries to get the latest data
        await queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast({
        title: "Error",
        description: "Failed to delete exam",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedExam(null);
    }
  };

  const columns = [
    {
      header: "Exam Name",
      accessorKey: "name" as keyof Exam,
    },
    {
      header: "Subject",
      accessorKey: "subject" as keyof Exam,
    },
    {
      header: "Date",
      accessorKey: "date" as keyof Exam,
      cell: (exam: Exam) => format(new Date(exam.date), "MM/dd/yyyy"),
    },
    {
      header: "Start Time",
      accessorKey: "startTime" as keyof Exam,
      cell: (exam: Exam) => exam.startTime ? format(new Date(exam.startTime), "MMM dd, h:mm a") : "Not set",
    },

    {
      header: "Duration",
      accessorKey: "duration" as keyof Exam,
      cell: (exam: Exam) => `${exam.duration} minutes`,
    },
    {
      header: "Total Marks",
      accessorKey: "totalMarks" as keyof Exam,
      cell: (exam: Exam) => (
        <span className="font-medium text-primary">{exam.totalMarks}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status" as keyof Exam,
      cell: (exam: Exam) => {
        switch (exam.status) {
          case "upcoming":
            return <Badge variant="outline" className="bg-amber-800/20 text-amber-500 border-none">Upcoming</Badge>;
          case "active":
            return <Badge variant="outline" className="bg-blue-800/20 text-blue-500 border-none">Active</Badge>;
          case "completed":
            return <Badge variant="outline" className="bg-green-800/20 text-green-500 border-none">Completed</Badge>;
          default:
            return exam.status;
        }
      },
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Exam,
      cell: (exam: Exam) => (
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/exams/${exam.id}/paper`)}
            title={exam.status === "completed" ? "Cannot edit completed exams" : "Create Question Paper"}
            disabled={exam.status === "completed"}
          >
            <FileText className={`h-4 w-4 ${exam.status === "completed" ? "text-gray-400" : "text-green-500"}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleEditExam(exam)}
            disabled={exam.status === "completed"}
            title={exam.status === "completed" ? "Cannot edit completed exams" : "Edit Exam"}
          >
            <Pencil className={`h-4 w-4 ${exam.status === "completed" ? "text-gray-400" : "text-blue-500"}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteExam(exam)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Exams">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Exams</h1>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Exam
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <DataTable
          columns={columns}
          data={exams}
          isLoading={isLoading}
          emptyState={
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <FileQuestion className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No exams found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first exam to get started.
              </p>
              <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Exam
              </Button>
            </div>
          }
        />
        
        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} exams
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <ExamModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        mode="create"
      />

      {selectedExam && (
        <ExamModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          exam={selectedExam}
          mode="edit"
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the exam "{selectedExam?.name}" and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteExam} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
