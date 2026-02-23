
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini API
// Note: process.env.API_KEY must be configured in your build environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface SlipVerificationResult {
  isValid: boolean;
  detectedAmount: number;
  reason: string;
}

export const verifySlipWithAI = async (file: File, expectedAmount: number): Promise<SlipVerificationResult> => {
  try {
    // 1. Convert File to Base64
    const base64Data = await fileToGenerativePart(file);

    // 2. Prepare the prompt
    const prompt = `
      Analyze this image. It is supposed to be a Thai bank transfer slip.
      Task:
      1. Verify if this is a valid banking slip (looks like a transaction slip, contains date/time, bank logo).
      2. Extract the transferred amount.
      3. Compare the extracted amount with the expected amount: ${expectedAmount}.
      
      Rules:
      - The amount in the slip must be exactly ${expectedAmount} (allow for commas or decimals).
      - If the image is not a slip, valid is false.
      - If the amount does not match, valid is false.

      Return the result in JSON format only.
    `;

    // 3. Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: base64Data },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            detectedAmount: { type: Type.NUMBER },
            reason: { type: Type.STRING, description: "Short explanation in Thai language" }
          },
          required: ["isValid", "detectedAmount", "reason"]
        }
      }
    });

    // 4. Parse Response
    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");

    const result = JSON.parse(resultText) as SlipVerificationResult;
    return result;

  } catch (error) {
    console.error("AI Verification Error:", error);
    return {
      isValid: false,
      detectedAmount: 0,
      reason: "ไม่สามารถตรวจสอบสลิปได้ (AI Error)"
    };
  }
};

// Helper to convert File to Gemini-compatible inlineData
async function fileToGenerativePart(file: File): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Content = base64String.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64Content
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
