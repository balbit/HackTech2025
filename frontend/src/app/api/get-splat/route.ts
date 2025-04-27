import { NextResponse } from "next/server";

// Mock data storage - in a real app, this would be in a database
let splatStatus: 'unavailable' | 'processing' | 'done' = 'unavailable';

export async function GET() {
  // In a real implementation, this would check the backend for the actual status
  return NextResponse.json({ status: splatStatus });
}

// This function would normally not be exported, but we're using it for the mock implementation
export function updateSplatStatus(status: 'unavailable' | 'processing' | 'done') {
  splatStatus = status;
} 