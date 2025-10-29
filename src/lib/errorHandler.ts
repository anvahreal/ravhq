import { PostgrestError } from "@supabase/supabase-js";

/**
 * Maps Supabase errors to user-friendly messages
 * Prevents database schema and internal details from being exposed
 */
export const getErrorMessage = (error: unknown): string => {
  if (!error) return "An unexpected error occurred";

  // Handle Supabase PostgrestError
  if (typeof error === "object" && error !== null && "code" in error) {
    const pgError = error as PostgrestError;
    
    // Map common PostgreSQL error codes to user-friendly messages
    switch (pgError.code) {
      case "23505": // unique_violation
        return "This item already exists";
      case "23503": // foreign_key_violation
        return "Cannot complete operation due to related data";
      case "23502": // not_null_violation
        return "Required information is missing";
      case "42501": // insufficient_privilege
        return "You don't have permission to perform this action";
      case "PGRST116": // JWT expired
        return "Your session has expired. Please log in again";
      default:
        // Generic message for unknown database errors
        return "Unable to complete operation. Please try again";
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Only return the message if it's a known safe message
    const safeMessages = [
      "network error",
      "fetch failed",
      "failed to fetch",
    ];
    
    const lowerMessage = error.message.toLowerCase();
    if (safeMessages.some(msg => lowerMessage.includes(msg))) {
      return "Network error. Please check your connection";
    }
    
    // Default to generic message
    return "An error occurred. Please try again";
  }

  return "An unexpected error occurred";
};

/**
 * Validates UUID format to prevent invalid queries
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
