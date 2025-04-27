// This file handles tracking the status of the splat generation process
// Since the backend doesn't have a specific endpoint to check processing status,
// we need to track this on the frontend

type SplatStatus = 'unavailable' | 'processing' | 'done';

// We use a simple in-memory store for the demo
// In a production app, this would use a more persistent solution like a database
let currentStatus: SplatStatus = 'unavailable';

/**
 * Update the current splat processing status
 */
export function updateSplatStatus(status: SplatStatus): void {
  currentStatus = status;
}

/**
 * Get the current splat processing status
 */
export function getSplatStatus(): SplatStatus {
  return currentStatus;
} 