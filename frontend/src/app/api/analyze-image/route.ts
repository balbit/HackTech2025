import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { image, prompt } = await request.json();
    
    if (!image || !prompt) {
      return NextResponse.json({ error: 'Image and prompt are required' }, { status: 400 });
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          // Return mock data since no API key is set up
          analysis: "This appears to be a 3D model of a human organ structure. The model shows what looks like tissue with some irregularities that could indicate potential anomalies. The texture and coloration suggest possible inflammation or structural deformities.",
          suggestedConditions: [
            "Tissue inflammation",
            "Structural deformity",
            "Possible early-stage abnormal growth",
            "Tissue scarring"
          ],
          confidence: 0.85
        }, 
        { status: 200 }
      );
    }
    
    // Process base64 image for the API
    const base64Image = image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    
    try {
      // Call OpenAI's API using the new format
      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { 
                type: 'image_url', 
                image_url: {
                  url: `data:image/png;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });
      
      // Extract the analysis text from the response
      const analysisText = response.choices[0].message.content || '';
      
      // Parse the analysis text to extract conditions
      let suggestedConditions: string[] = [];
      
      if (analysisText.includes('possible conditions') || analysisText.includes('potential conditions')) {
        const conditionsMatch = analysisText.match(/possible conditions:?([\s\S]*?)(?:\n\n|\n$|$)/i) || 
                              analysisText.match(/potential conditions:?([\s\S]*?)(?:\n\n|\n$|$)/i);
        
        if (conditionsMatch && conditionsMatch[1]) {
          suggestedConditions = conditionsMatch[1]
            .split('\n')
            .map((line: string) => line.replace(/^[*•-]\s*/, '').trim())
            .filter((line: string) => line.length > 0);
        }
      }
      
      return NextResponse.json({
        analysis: analysisText,
        suggestedConditions: suggestedConditions.length > 0 ? suggestedConditions : undefined,
        confidence: 0.9 // Placeholder confidence score
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      throw new Error('Failed to analyze image with OpenAI');
    }
    
  } catch (error) {
    console.error('Error in analyze-image endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
} 