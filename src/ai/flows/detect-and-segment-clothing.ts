'use server';
/**
 * @fileOverview This file defines a Genkit flow for detecting and segmenting clothing items in an image.
 *
 * - detectAndSegmentClothing - A function that takes an image data URI as input and returns a list of segmented clothing items.
 * - DetectAndSegmentClothingInput - The input type for the detectAndSegmentClothing function, which is an image data URI.
 * - DetectAndSegmentClothingOutput - The output type for the detectAndSegmentClothing function, which is a list of segmented clothing items with details.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectAndSegmentClothingInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo containing one or more fashion outfits, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type DetectAndSegmentClothingInput = z.infer<typeof DetectAndSegmentClothingInputSchema>;

const ClothingItemSchema = z.object({
  itemType: z.string().describe('The type of clothing item detected (e.g., shirt, pants, hat, shoes).'),
  description: z.string().describe('A detailed description of the clothing item, including color, style, and any notable features.'),
  segmentedImage: z.string().describe('A data URI of the segmented image containing only this clothing item.'),
});

const DetectAndSegmentClothingOutputSchema = z.array(ClothingItemSchema);
export type DetectAndSegmentClothingOutput = z.infer<typeof DetectAndSegmentClothingOutputSchema>;

export async function detectAndSegmentClothing(
  input: DetectAndSegmentClothingInput
): Promise<DetectAndSegmentClothingOutput> {
  return detectAndSegmentClothingFlow(input);
}

const detectAndSegmentClothingPrompt = ai.definePrompt({
  name: 'detectAndSegmentClothingPrompt',
  input: {schema: DetectAndSegmentClothingInputSchema},
  output: {schema: DetectAndSegmentClothingOutputSchema},
  prompt: `You are an AI fashion assistant that analyzes images of outfits and identifies individual clothing items.

  Given the following image, identify and segment each clothing item present in the image. For each item, provide a detailed description and a data URI of the segmented image containing only that item.

  Respond in a JSON array format, where each element represents a clothing item with fields 'itemType', 'description', and 'segmentedImage'.

  Image: {{media url=photoDataUri}}
  `,
});

const detectAndSegmentClothingFlow = ai.defineFlow(
  {
    name: 'detectAndSegmentClothingFlow',
    inputSchema: DetectAndSegmentClothingInputSchema,
    outputSchema: DetectAndSegmentClothingOutputSchema,
  },
  async input => {
    const {output} = await detectAndSegmentClothingPrompt(input);
    return output!;
  }
);
