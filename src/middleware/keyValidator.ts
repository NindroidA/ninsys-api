/**
 * @fileoverview API Key Validation Handler
 * @description Middleware to validate API keys.
 */

/**
 * 
 * @param req Express request obj
 * @param res Express response obj
 * @param next Express next function (unused but required for error middleware)
 * @returns 
 */
export const validateApiKey = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.TERMINAL_API_KEY;
  
  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};