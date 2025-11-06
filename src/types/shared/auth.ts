/**
 * Extended Request interface with auth user.
 * @interface AuthenticatedRequest
 * @extends Request
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    authenticated: boolean;
    expires: number;
  };
}

/**
 * JWT payload interface.
 * @interface JWTPayload
 */
export interface JWTPayload {
  authenticated: boolean;
  iat: number;
  exp: number;
}