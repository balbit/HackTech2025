import { NextResponse } from "next/server";
import { getSplatStatus, updateSplatStatus } from "@/utils/splatStatus";

// Backend API URLs
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8080';

export async function GET() {
  try {
    // First check our local status tracking
    const currentStatus = getSplatStatus();
    
    // Try to fetch the splat file from the backend
    const response = await fetch(`${BACKEND_URL}/api/get-splat`, {
      method: 'GET',
      cache: 'no-store', // Ensure we don't use cached responses
    });

    // If we got the file successfully
    if (response.ok) {
      // If we successfully got the splat file, it's done
      // Update our local status
      updateSplatStatus('done');
      
      // Get the file as an arrayBuffer to pass through
      const fileBuffer = await response.arrayBuffer();
      
      // Return the file with the proper content type
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'model/vnd.usdz+zip',
          'Content-Disposition': 'inline; filename="splat.usdz"'
        }
      });
    } else if (response.status === 404) {
      // If the file is not found but we're in processing state, keep that state
      // Otherwise set to unavailable
      if (currentStatus !== 'processing') {
        updateSplatStatus('unavailable');
      }
      
      return NextResponse.json({ status: currentStatus });
    } else {
      // Handle other error cases
      return NextResponse.json({ status: currentStatus, error: 'Failed to check splat status' });
    }
  } catch (error) {
    console.error('Error checking splat status:', error);
    // Return our local status in case of connection error
    return NextResponse.json({ status: getSplatStatus(), error: 'Failed to connect to backend' });
  }
} 