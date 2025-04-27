import { NextRequest, NextResponse } from "next/server";
import { updateSplatStatus } from "@/utils/splatStatus";

// Backend API URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8080';

export async function POST(request: NextRequest) {
  try {
    // Parse the form data from the request
    const formData = await request.formData();
    const images = formData.getAll('images');
    
    if (!images || images.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No images provided' },
        { status: 400 }
      );
    }

    // Set status to processing before sending to backend
    updateSplatStatus('processing');

    // Convert images to base64 format
    const imageBase64Array = await Promise.all(
      images.map(async (image) => {
        if (image instanceof File) {
          const arrayBuffer = await image.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          return buffer.toString('base64');
        }
        return null;
      })
    ).then(results => results.filter(Boolean));

    // Send the images to the backend
    const response = await fetch(`${BACKEND_URL}/api/splat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images: imageBase64Array }),
    });

    if (!response.ok) {
      // If there was an error, reset status to unavailable
      updateSplatStatus('unavailable');
      const error = await response.json();
      throw new Error(error.detail || 'Failed to process images');
    }
    
    // Status remains 'processing' while the backend works on it
    // The get-splat endpoint will check if the file exists and update to 'done' when ready

    return NextResponse.json({ 
      success: true, 
      message: 'Images received, processing started'
    });

  } catch (error) {
    console.error('Error handling image upload:', error);
    // Reset status to unavailable on error
    updateSplatStatus('unavailable');
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to process images' },
      { status: 500 }
    );
  }
} 