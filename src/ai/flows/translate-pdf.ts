'use server';
/**
 * @fileOverview This file defines a Genkit flow for translating a PDF document.
 *
 * - translatePdf - A function that takes a PDF data URI and a target language, and returns a new translated PDF data URI.
 * - TranslatePdfInput - The input type for the translatePdf function.
 * - TranslatePdfOutput - The output type for the translatePdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {PDFDocument, rgb, StandardFonts} from 'pdf-lib';

const TranslatePdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file encoded as a data URI. Expected format: 'data:application/pdf;base64,<encoded_data>'"
    ),
  targetLanguage: z.string().describe('The language to translate the document into (e.g., "Spanish", "Japanese").'),
});
export type TranslatePdfInput = z.infer<typeof TranslatePdfInputSchema>;

const TranslatePdfOutputSchema = z.object({
  translatedPdfDataUri: z.string().describe('The translated PDF document encoded as a data URI.'),
  translatedText: z.string().describe('The full translated text.'),
});
export type TranslatePdfOutput = z.infer<typeof TranslatePdfOutputSchema>;

export async function translatePdf(input: TranslatePdfInput): Promise<TranslatePdfOutput> {
  return translatePdfFlow(input);
}

const translationPrompt = ai.definePrompt({
    name: 'translationPrompt',
    input: { schema: z.object({ text: z.string(), targetLanguage: z.string() }) },
    output: { schema: z.object({ translatedText: z.string() }) },
    prompt: `Translate the following text into {{{targetLanguage}}}. Do not add any extra commentary, just provide the translated text.

Text to translate:
---
{{{text}}}
---
`,
});

async function createPdfWithText(text: string): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = text.split('\n\n'); // Simple pagination logic

    for (const pageText of pages) {
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const fontSize = 12;
        page.drawText(pageText, {
            x: 50,
            y: height - 4 * fontSize,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
            maxWidth: width - 100,
            lineHeight: 15,
        });
    }

    return pdfDoc.save();
}

const translatePdfFlow = ai.defineFlow(
  {
    name: 'translatePdfFlow',
    inputSchema: TranslatePdfInputSchema,
    outputSchema: TranslatePdfOutputSchema,
  },
  async ({pdfDataUri, targetLanguage}) => {
    // Use reliable PDF extraction
    const { extractTextFromPdf } = await import('@/lib/pdf-extractor');
    const pdfResult = await extractTextFromPdf(pdfDataUri);
    
    if (!pdfResult.success || !pdfResult.text.trim()) {
      throw new Error(pdfResult.text || "Could not extract text from the PDF.");
    }
    
    // Truncate text to a reasonable length for translation to avoid hitting model limits
    const MAX_TEXT_LENGTH = 15000;
    let documentText = pdfResult.text.substring(0, MAX_TEXT_LENGTH);
    
    const { output } = await translationPrompt({ text: documentText, targetLanguage });
    if (!output) {
      throw new Error("Could not generate translation.");
    }

    const translatedPdfBytes = await createPdfWithText(output.translatedText);
    const translatedPdfBase64 = Buffer.from(translatedPdfBytes).toString('base64');
    
    return {
      translatedPdfDataUri: `data:application/pdf;base64,${translatedPdfBase64}`,
      translatedText: output.translatedText,
    };
  }
);
