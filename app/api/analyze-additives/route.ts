import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("AIzaSyCZPRF0WYgbNUSfM5Pt4HWw6RWM90gjwik");

export async function POST(request: NextRequest) {
  try {
    const { ingredients, productName } = await request.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze the ingredients list for "${productName}" and identify all preservatives and food additives (like colors, emulsifiers, stabilizers, flavor enhancers, sweeteners, etc).

Ingredients: ${ingredients}

Return ONLY a JSON array with this exact format, no additional text:
[
  {
    "name": "Exact name from ingredients",
    "code": "E-number if applicable, otherwise null",
    "type": "preservative" or "additive",
    "description": "Brief explanation of what it does (1 sentence)",
    "healthConcerns": "Any known health concerns or 'Generally recognized as safe' (1 sentence)"
  }
]

Rules:
- Only include actual preservatives and additives, not natural ingredients
- Be accurate with E-numbers
- Keep descriptions simple and clear
- If no preservatives/additives found, return empty array []`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Extract JSON from response (remove markdown code blocks if present)
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Extract JSON array
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    const additives = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ additives });
  } catch (error) {
    console.error('Error analyzing additives:', error);
    return NextResponse.json({ additives: [] }, { status: 500 });
  }
}