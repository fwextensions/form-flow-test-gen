import { createOpenAI } from '@ai-sdk/openai'; 
import { streamText, StreamingTextResponse } from 'ai'; 
import { NextResponse } from 'next/server';

// Initialize OpenAI client
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: 'strict', // Add strict compatibility mode for OpenAI API
});

export const runtime = 'edge'; 

// Helper function to recursively extract input fields from components
function extractInputFields(components: any[]): any[] {
  let fields: any[] = [];
  if (!Array.isArray(components)) {
    return fields; // Return empty if components is not an array
  }

  components.forEach(component => {
    // Condition Change: Add only if input=true AND it does NOT have nested components
    if (component.input === true && component.key && !component.components) { 
      // It's an input field we care about
      fields.push({
        key: component.key,
        label: component.label || component.key,
        type: component.type || 'textfield', // Default type if missing
        // Add other relevant properties if needed (e.g., validation, options)
        validate: component.validate,
        data: component.data, // For select options etc.
        values: component.values, // For radio/select boxes
      });
    } 
    // Always recurse if nested components exist, regardless of parent's input flag
    else if (component.components && Array.isArray(component.components)) {
      // Recursively search nested components (e.g., inside panels, columns, fieldsets, pages)
      fields = fields.concat(extractInputFields(component.components));
    }
    // Add checks for other container types if necessary (e.g., component.columns, component.rows)
  });
  return fields;
}

export async function POST(req: Request) {
  try {
    // 1. Expect 'schema' and 'numTestSets' from the request body
    const { schema, numTestSets } = await req.json();
    const count = numTestSets || 5; // Default to 5 if not provided

    if (!schema || !schema.components || !Array.isArray(schema.components)) {
      return NextResponse.json(
        { error: 'Invalid or missing schema components in request body' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
       return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 } 
       );
    }

    // 2. Extract input fields from the schema
    const inputFields = extractInputFields(schema.components);

    if (inputFields.length === 0) {
      return NextResponse.json(
        { error: 'No input fields found in the provided schema structure' },
        { status: 400 }
      );
    }

    // Construct the prompt using extracted fields
    const systemPrompt = `You are an expert test data generator. Generate realistic test data for a web form based on the provided schema structure. Adhere strictly to all instructions. Output ONLY the raw JSON array.`;
    const userPrompt = `
      Generate ${count} distinct sets of test data for the following form input fields:
      
      Input Fields (including type, label, key, validation, and options if any):
      ${JSON.stringify(inputFields, null, 2)}

      Instructions:
      1. For each of the ${count} sets, provide plausible values for *all* input fields listed.
      2. Adhere strictly to the input types (e.g., text, email, number, select, checkbox, radio, date).
      3. Consider field labels and keys to generate contextually appropriate data.
      4. If validation rules (e.g., required, minLength, maxLength, pattern, custom) are present, ensure the generated data complies.
      5. For selection fields (select, radio, selectboxes), choose valid options from the 'data' or 'values' properties if provided, otherwise generate plausible ones.
      6. Format the output as a JSON array, where each element is an object representing one test set. Each object should have keys corresponding to the input field keys and the generated values.
      7. Ensure the JSON is valid.
      8. Do NOT include explanations or introductory text, only the JSON array.
      9. Provide only the raw JSON array as the response, without any surrounding text or markdown formatting.
    `;

    console.log(userPrompt);

    // 4. Call OpenAI API
    const result = await streamText({
      model: openai('gpt-4o-mini'), 
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7, 
    });

    // 5. Return the stream using the AI SDK's response helpers
    // Use toTextStreamResponse for simple text streaming
    return result.toTextStreamResponse(); 

  } catch (error) {
    console.error("API Error:", error);
    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      // Check for specific error types if needed
      if (errorMessage.includes('API key')) {
        statusCode = 500; // Indicate server config issue
      }
    }
    
    // Check if it's a Next.js specific error or JSON parsing error
    if (error instanceof SyntaxError) { // Likely JSON parsing error from req.json()
      errorMessage = 'Invalid JSON in request body';
      statusCode = 400;
    }

    return NextResponse.json(
      { error: `API route error: ${errorMessage}` },
      { status: statusCode }
    );
  }
}
