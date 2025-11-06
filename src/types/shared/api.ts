/**
 * @fileoverview API Response Types
 * @description TypeScript definitions for API responses and health checks.
 */

/**
 * API response wrapper.
 * @template T The type of data being returned
 * @interface ApiResponse
 */
export interface ApiResponse<T = any> {
  success: boolean;  // whether the request was a success
  data?: T;          // response payload
  error?: string;    // error msg (if failed)
  timestamp: string; // ISO timestamp of the response
}

/**
 * System health check info.
 * @interface HealthCheck
 */
export interface HealthCheck {
  status: 'healthy' | 'unhealthy'; // overall system health status
  uptime: number;                  // system uptime in seconds
  memory: {                        // memory usage stats
    used: number;                  // used memory in MB
    total: number;                 // total allocated memory in MB
  };
  services: {                      // stats of integrated services
    govee: boolean;                // Govee API connection status
    cogworks: boolean;             // Cogworks Bot connection status
  };
}