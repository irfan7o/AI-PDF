
'use server';
/**
 * @fileOverview This file defines a Genkit flow for converting a PDF document to a series of images.
 *
 * - convertPdfToImages - A function that takes a PDF data URI and returns an array of image data URIs.
 * - ConvertPdfToImagesInput - The input type for the convertPdfToImages function.
 * - ConvertPdfToImagesOutput - The output type for the convertPdfToImages function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConvertPdfToImagesInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file encoded as a data URI. Expected format: 'data:application/pdf;base64,<encoded_data>'"
    ),
});
export type ConvertPdfToImagesInput = z.infer<typeof ConvertPdfToImagesInputSchema>;

const ConvertPdfToImagesOutputSchema = z.object({
  images: z.array(z.string().describe("A data URI of a generated image from a PDF page.")).describe("An array of image data URIs, one for each page of the PDF."),
});
export type ConvertPdfToImagesOutput = z.infer<typeof ConvertPdfToImagesOutputSchema>;

export async function convertPdfToImagesFlow(input: ConvertPdfToImagesInput): Promise<ConvertPdfToImagesOutput> {
  return pdfToImagesFlow(input);
}

const pdfToImagesFlow = ai.defineFlow(
  {
    name: 'pdfToImagesFlow',
    inputSchema: ConvertPdfToImagesInputSchema,
    outputSchema: ConvertPdfToImagesOutputSchema,
  },
  async ({pdfDataUri}) => {
    
    const { output } = await ai.generate({
        prompt: `Convert each page of the following PDF document into a JPG image.
    
PDF: {{media url=pdfDataUri}}`,
        output: {
            schema: ConvertPdfToImagesOutputSchema,
        },
    });

    if (!output || !output.images || output.images.length === 0) {
      throw new Error('Image generation failed. No images were returned.');
    }
    
    return {
      images: output.images,
    };
  }
);
