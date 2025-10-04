'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a voice sample.
 *
 * - generateVoiceSample - A function that takes a voice name and returns an audio data URI.
 * - GenerateVoiceSampleInput - The input type for the generateVoiceSample function.
 * - GenerateVoiceSampleOutput - The output type for the generateVoiceSample function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GenerateVoiceSampleInputSchema = z.object({
  voice: z.string().describe('The voice to use for the text-to-speech conversion.'),
  name: z.string().describe('The name of the voice to announce.'),
});
export type GenerateVoiceSampleInput = z.infer<typeof GenerateVoiceSampleInputSchema>;

const GenerateVoiceSampleOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio encoded as a data URI.'),
});
export type GenerateVoiceSampleOutput = z.infer<typeof GenerateVoiceSampleOutputSchema>;

export async function generateVoiceSample(input: GenerateVoiceSampleInput): Promise<GenerateVoiceSampleOutput> {
  return generateVoiceSampleFlow(input);
}

async function toWav(pcmData: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels: 1,
      sampleRate: 24000,
      bitDepth: 16,
    });
    const chunks: Buffer[] = [];
    writer.on('data', chunk => chunks.push(chunk));
    writer.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
    writer.on('error', reject);
    writer.end(pcmData);
  });
}

const generateVoiceSampleFlow = ai.defineFlow(
  {
    name: 'generateVoiceSampleFlow',
    inputSchema: GenerateVoiceSampleInputSchema,
    outputSchema: GenerateVoiceSampleOutputSchema,
  },
  async ({voice, name}) => {
    const sampleText = `Hello, I am ${name}. This is what my voice sounds like.`;
    
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      prompt: sampleText,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // @ts-ignore - The `prebuiltVoiceConfig` is valid but may not be in the type definition yet.
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    if (!media || !media.url) {
      throw new Error('Audio generation failed. No media was returned.');
    }
    
    const pcmData = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    const wavBase64 = await toWav(pcmData);

    return {
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
