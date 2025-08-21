import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable } from "@/components/ui/data-table";
import { Download, BarChart2, Filter } from "lucide-react";
import { ResultWithDetails } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Results() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [selectedExam, setSelectedExam] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { toast } = useToast();
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const { data: response, isLoading } = useQuery<{
    results: ResultWithDetails[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: ["/api/results", currentPage, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: debouncedSearch,
      });
      const res = await fetch(`/api/results?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const results = response?.results || [];
  const pagination = response?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  // Extract unique students and exams for filters
  const uniqueStudents = useMemo(() => {
    const students = new Map();
    results.forEach(result => {
      if (result.student?.id) {
        students.set(result.student.id, result.student.name);
      }
    });
    return Array.from(students, ([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [results]);

  const uniqueExams = useMemo(() => {
    const exams = new Map();
    results.forEach(result => {
      if (result.exam?.id) {
        exams.set(result.exam.id, result.exam.name);
      }
    });
    return Array.from(exams, ([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [results]);

  const filteredResults = results.filter((result) => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = result.student?.name.toLowerCase().includes(query) ||
        result.exam?.name.toLowerCase().includes(query) ||
        result.exam?.subject.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    // Student filter
    if (selectedStudent !== "all" && result.student?.id !== parseInt(selectedStudent)) {
      return false;
    }
    
    // Exam filter
    if (selectedExam !== "all" && result.exam?.id !== parseInt(selectedExam)) {
      return false;
    }
    
    // Date filter
    if (selectedDate) {
      const resultDate = new Date(result.submittedAt);
      const filterDate = new Date(selectedDate);
      // Compare only the date part, not time
      if (resultDate.toDateString() !== filterDate.toDateString()) {
        return false;
      }
    }
    
    return true;
  });

  const handleExport = () => {
    try {
      // Generate CSV content
      const headers = ["Student", "Exam", "Score", "Percentage", "Date"];
      const csvContent = [
        headers.join(","),
        ...filteredResults.map((result) => {
          return [
            `"${result.student.name}"`,
            `"${result.exam.name}"`,
            result.score,
            `${parseFloat(result.percentage as string)}%`,
            result.submittedAt ? format(new Date(result.submittedAt), "yyyy-MM-dd") : "",
          ].join(",");
        }),
      ].join("\n");

      // Create blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `results-${format(new Date(), "yyyy-MM-dd")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Successful",
        description: "Results have been exported to CSV",
      });
    } catch (error) {
      console.error("Error exporting results:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export results",
        variant: "destructive",
      });
    }
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90) {
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-none">{percentage}%</Badge>;
    } else if (percentage >= 70) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-none">{percentage}%</Badge>;
    } else if (percentage >= 50) {
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-none">{percentage}%</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-none">{percentage}%</Badge>;
    }
  };

  const columns = [
    {
      header: "Student",
      accessorKey: "student" as keyof ResultWithDetails,
      cell: (result: ResultWithDetails) => result.student.name,
    },
    {
      header: "Exam",
      accessorKey: "exam" as keyof ResultWithDetails,
      cell: (result: ResultWithDetails) => result.exam.name,
    },
    {
      header: "Score",
      accessorKey: "percentage" as keyof ResultWithDetails,
      cell: (result: ResultWithDetails) => getScoreBadge(parseFloat(result.percentage as string)),
    },
    {
      header: "Date",
      accessorKey: "submittedAt" as keyof ResultWithDetails,
      cell: (result: ResultWithDetails) => result.submittedAt ? format(new Date(result.submittedAt), "MM/dd/yyyy") : "N/A",
    },
  ];

  return (
    <AppShell title="Results">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Results</h1>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Results
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <SearchInput
            placeholder="Search results..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
          
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4">
            {/* Student Filter */}
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {uniqueStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Exam Filter */}
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {uniqueExams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id.toString()}>
                      {exam.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className="flex-1 min-w-[200px]">
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setIsDatePickerOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Clear Filters */}
            {(selectedStudent !== "all" || selectedExam !== "all" || selectedDate || searchQuery) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedStudent("all");
                  setSelectedExam("all");
                  setSelectedDate(undefined);
                  setSearchQuery("");
                }}
                className="h-10"
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredResults}
          isLoading={isLoading}
          emptyState={
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <BarChart2 className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">No results found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Results will appear here once exams are completed.
              </p>
            </div>
          }
        />
        
        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} results
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
    </AppShell>
  );
}
