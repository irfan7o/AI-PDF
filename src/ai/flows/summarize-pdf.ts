'use server';
/**
 * @fileOverview This file defines a Genkit flow for summarizing a PDF document.
 *
 * - summarizePdf - A function that takes a PDF file buffer as input and returns a summary.
 * - SummarizePdfInput - The input type for the summarizePdf function.
 * - SummarizePdfOutput - The output type for the summarizePdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import pdf from 'pdf-parse';

const SummarizePdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file encoded as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'"
    ),
});
export type SummarizePdfInput = z.infer<typeof SummarizePdfInputSchema>;

const SummarizePdfOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the provided PDF document.'),
});
export type SummarizePdfOutput = z.infer<typeof SummarizePdfOutputSchema>;

export async function summarizePdf(input: SummarizePdfInput): Promise<SummarizePdfOutput> {
  return summarizePdfFlow(input);
}

const summarizePdfPrompt = ai.definePrompt({
  name: 'summarizePdfPrompt',
  input: {
    schema: z.object({
      document: z.string(),
    }),
  },
  output: {schema: SummarizePdfOutputSchema},
  prompt: `You are an expert at summarizing documents. Please provide a concise summary of the following document:\n\n{{{document}}}`,
});

const summarizePdfFlow = ai.defineFlow(
  {
    name: 'summarizePdfFlow',
    inputSchema: SummarizePdfInputSchema,
    outputSchema: SummarizePdfOutputSchema,
  },
  async input => {
    const pdfBuffer = Buffer.from(input.pdfDataUri.split(',')[1], 'base64');
    const pdfData = await pdf(pdfBuffer);

    const {output} = await summarizePdfPrompt({document: pdfData.text});
    return output!;
  }
);
