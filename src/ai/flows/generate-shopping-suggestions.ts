// src/ai/flows/generate-shopping-suggestions.ts
'use server';

/**
 * @fileOverview Generates shopping suggestions for clothing items detected in an image.
 *
 * - generateShoppingSuggestions - A function that takes clothing item descriptions and generates shopping suggestions.
 * - GenerateShoppingSuggestionsInput - The input type for the generateShoppingSuggestions function.
 * - GenerateShoppingSuggestionsOutput - The return type for the generateShoppingSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateShoppingSuggestionsInputSchema = z.object({
  clothingItems: z.array(
    z.string().describe('A description of a clothing item detected in the image.')
  ).describe('An array of clothing item descriptions.'),
});
export type GenerateShoppingSuggestionsInput = z.infer<typeof GenerateShoppingSuggestionsInputSchema>;

const GenerateShoppingSuggestionsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      item: z.string().describe('The name of the clothing item.'),
      description: z.string().describe('A description of the suggested item.'),
      ecommerceLinks: z.array(
        z.object({
          platform: z.string().describe('The e-commerce platform (e.g., Shopee, Amazon).'),
          url: z.string().url().describe('The URL to the product on the e-commerce platform.'),
        }).describe('E-commerce link for the suggested item')
      ).describe('A list of e-commerce links where the item can be purchased.'),
    }).describe('A suggested clothing item with details and e-commerce links.')
  ).describe('An array of shopping suggestions for the detected clothing items.'),
});
export type GenerateShoppingSuggestionsOutput = z.infer<typeof GenerateShoppingSuggestionsOutputSchema>;

export async function generateShoppingSuggestions(input: GenerateShoppingSuggestionsInput): Promise<GenerateShoppingSuggestionsOutput> {
  return generateShoppingSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateShoppingSuggestionsPrompt',
  input: {schema: GenerateShoppingSuggestionsInputSchema},
  output: {schema: GenerateShoppingSuggestionsOutputSchema},
  prompt: `You are a personal shopping assistant. Given a list of clothing items, you will find similar items on e-commerce websites and provide links to purchase them.

Clothing Items:
{{#each clothingItems}}
- {{{this}}}
{{/each}}

For each clothing item, suggest similar items and provide a list of e-commerce links where they can be purchased. Prioritize Shopee, but include other e-commerce platforms if the item is not available on Shopee.

Format your response as a JSON object that conforms to the following schema:
${JSON.stringify(GenerateShoppingSuggestionsOutputSchema.describe('schema').shape, null, 2)}`,
});

const generateShoppingSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateShoppingSuggestionsFlow',
    inputSchema: GenerateShoppingSuggestionsInputSchema,
    outputSchema: GenerateShoppingSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
