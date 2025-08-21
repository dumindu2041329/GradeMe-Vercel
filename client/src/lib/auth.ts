import { apiRequest } from "./queryClient";
import { User } from "@shared/schema";
import { queryClient } from "./queryClient";

interface LoginCredentials {
  email: string;
  password: string;
}

export async function login(credentials: LoginCredentials): Promise<User> {
  const user = await apiRequest<User>("POST", "/api/auth/login", credentials);
  // Invalidate the session query to force a refresh
  queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
  return user;
}

export async function studentLogin(credentials: LoginCredentials): Promise<User> {
  const user = await apiRequest<User>("POST", "/api/auth/student/login", credentials);
  // Invalidate the session query to force a refresh
  queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
  return user;
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
  // Invalidate the session query to force a refresh
  queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
}

export async function getSession(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/session", {
      credentials: "include",
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error("Failed to fetch session");
    }
    
    const data = await response.json();
    // The session endpoint returns { user, authenticated, redirectTo }
    // We need to extract just the user object
    return data.user || null;
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
}
