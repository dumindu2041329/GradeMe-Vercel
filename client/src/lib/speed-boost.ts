import { supabase } from './supabase.js';

// High-performance cache with automatic cleanup
const speedCache = new Map();
const CACHE_DURATION = 300000; // 5 minutes

function getCached(key: string) {
  const item = speedCache.get(key);
  if (!item || Date.now() > item.expires) {
    speedCache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key: string, data: any) {
  speedCache.set(key, {
    data,
    expires: Date.now() + CACHE_DURATION
  });
}

function clearPattern(pattern: string) {
  const keys = Array.from(speedCache.keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      speedCache.delete(key);
    }
  });
}

// Connection optimization
let connectionIndex = 0;
const connections = Array(5).fill(supabase);

function getConnection() {
  connectionIndex = (connectionIndex + 1) % connections.length;
  return connections[connectionIndex];
}

// Speed-optimized operations
export const speedOps = {
  // Fast student operations
  async getStudents() {
    const cached = getCached('students_all');
    if (cached) return { data: cached, error: null, fromCache: true };
    
    const result = await getConnection()
      .from('students')
      .select('*')
      .order('name');
    
    if (result.data) setCache('students_all', result.data);
    return { ...result, fromCache: false };
  },

  async getStudent(id: string) {
    const cached = getCached(`student_${id}`);
    if (cached) return { data: cached, error: null, fromCache: true };
    
    const result = await getConnection()
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    
    if (result.data) setCache(`student_${id}`, result.data);
    return { ...result, fromCache: false };
  },

  async createStudent(student: any) {
    const result = await getConnection()
      .from('students')
      .insert(student)
      .select()
      .single();
    
    if (!result.error) clearPattern('student');
    return result;
  },

  async updateStudent(id: string, updates: any) {
    const result = await getConnection()
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (!result.error) clearPattern('student');
    return result;
  },

  async deleteStudent(id: string) {
    const result = await getConnection()
      .from('students')
      .delete()
      .eq('id', id);
    
    if (!result.error) clearPattern('student');
    return result;
  },

  // Fast exam operations
  async getExams() {
    const cached = getCached('exams_all');
    if (cached) return { data: cached, error: null, fromCache: true };
    
    const result = await getConnection()
      .from('exams')
      .select('*')
      .order('date', { ascending: false });
    
    if (result.data) setCache('exams_all', result.data);
    return { ...result, fromCache: false };
  },

  async getExam(id: string) {
    const cached = getCached(`exam_${id}`);
    if (cached) return { data: cached, error: null, fromCache: true };
    
    const result = await getConnection()
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (result.data) setCache(`exam_${id}`, result.data);
    return { ...result, fromCache: false };
  },

  async createExam(exam: any) {
    const result = await getConnection()
      .from('exams')
      .insert(exam)
      .select()
      .single();
    
    if (!result.error) clearPattern('exam');
    return result;
  },

  async updateExam(id: string, updates: any) {
    const result = await getConnection()
      .from('exams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (!result.error) clearPattern('exam');
    return result;
  },

  async deleteExam(id: string) {
    const result = await getConnection()
      .from('exams')
      .delete()
      .eq('id', id);
    
    if (!result.error) clearPattern('exam');
    return result;
  },

  // Fast results with joins
  async getResults() {
    const cached = getCached('results_joined');
    if (cached) return { data: cached, error: null, fromCache: true };
    
    const result = await getConnection()
      .from('results')
      .select(`
        *,
        student:students(id, name, email),
        exam:exams(id, name, subject)
      `)
      .order('created_at', { ascending: false });
    
    if (result.data) setCache('results_joined', result.data);
    return { ...result, fromCache: false };
  },

  async getStudentResults(studentId: string) {
    const cached = getCached(`student_results_${studentId}`);
    if (cached) return { data: cached, error: null, fromCache: true };
    
    const result = await getConnection()
      .from('results')
      .select(`
        *,
        exam:exams(id, name, subject, date)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    
    if (result.data) setCache(`student_results_${studentId}`, result.data);
    return { ...result, fromCache: false };
  },

  async createResult(result: any) {
    const response = await getConnection()
      .from('results')
      .insert(result)
      .select()
      .single();
    
    if (!response.error) clearPattern('result');
    return response;
  },

  async updateResult(id: string, updates: any) {
    const response = await getConnection()
      .from('results')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (!response.error) clearPattern('result');
    return response;
  },

  async deleteResult(id: string) {
    const response = await getConnection()
      .from('results')
      .delete()
      .eq('id', id);
    
    if (!response.error) clearPattern('result');
    return response;
  },

  // User operations
  async getUser(id: string) {
    const cached = getCached(`user_${id}`);
    if (cached) return { data: cached, error: null, fromCache: true };
    
    const result = await getConnection()
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (result.data) setCache(`user_${id}`, result.data);
    return { ...result, fromCache: false };
  },

  async getUserByEmail(email: string) {
    const cached = getCached(`user_email_${email}`);
    if (cached) return { data: cached, error: null, fromCache: true };
    
    const result = await getConnection()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (result.data) setCache(`user_email_${email}`, result.data);
    return { ...result, fromCache: false };
  }
};

// Batch operations for bulk data
export const batchOps = {
  async insertStudents(students: any[]) {
    const batchSize = 1000;
    const results = [];
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      const result = await getConnection()
        .from('students')
        .insert(batch)
        .select();
      results.push(result);
    }
    
    clearPattern('student');
    return results;
  },

  async insertResults(results: any[]) {
    const batchSize = 1000;
    const responses = [];
    
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      const result = await getConnection()
        .from('results')
        .insert(batch)
        .select();
      responses.push(result);
    }
    
    clearPattern('result');
    return responses;
  }
};

// Real-time with cache invalidation
export const speedRealtime = {
  subscribe(table: string, callback: (payload: any) => void) {
    return supabase
      .channel(`speed_${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        clearPattern(table);
        callback(payload);
      })
      .subscribe();
  },

  unsubscribe(channel: any) {
    return supabase.removeChannel(channel);
  }
};

// Performance monitoring
export const speedMonitor = {
  getCacheSize() {
    return speedCache.size;
  },

  clearCache() {
    speedCache.clear();
  },

  async healthCheck() {
    const start = performance.now();
    
    try {
      const result = await getConnection()
        .from('users')
        .select('count')
        .limit(1);
      
      const duration = performance.now() - start;
      
      return {
        healthy: !result.error,
        responseTime: Math.round(duration),
        cacheSize: speedCache.size,
        connections: connections.length
      };
    } catch (error) {
      return {
        healthy: false,
        error: error,
        responseTime: performance.now() - start,
        cacheSize: speedCache.size
      };
    }
  }
};

export default speedOps;