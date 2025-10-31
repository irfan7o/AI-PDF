'use server';
/**
 * @fileOverview This file defines a Genkit flow for converting a PDF document to audio.
 *
 * - pdfToAudio - A function that takes a PDF data URI and a voice, and returns an audio data URI.
 * - PdfToAudioInput - The input type for the pdfToAudio function.
 * - PdfToAudioOutput - The output type for the pdfToAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const PdfToAudioInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file encoded as a data URI. Expected format: 'data:application/pdf;base64,<encoded_data>'"
    ),
  voice: z.string().describe('The voice to use for the text-to-speech conversion.'),
});
export type PdfToAudioInput = z.infer<typeof PdfToAudioInputSchema>;

const PdfToAudioOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio encoded as a data URI.'),
});
export type PdfToAudioOutput = z.infer<typeof PdfToAudioOutputSchema>;

export async function pdfToAudio(input: PdfToAudioInput): Promise<PdfToAudioOutput> {
  return pdfToAudioFlow(input);
}

async function toWav(pcmData: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels: 1,
      sampleRate: 24000,
      bitDepth: 16,
    });
    const chunks: Buffer[] = [];
    writer.on('data', (chunk: Buffer) => chunks.push(chunk));
    writer.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
    writer.on('error', reject);
    writer.end(pcmData);
  });
}

const pdfToAudioFlow = ai.defineFlow(
  {
    name: 'pdfToAudioFlow',
    inputSchema: PdfToAudioInputSchema,
    outputSchema: PdfToAudioOutputSchema,
  },
  async ({pdfDataUri, voice}) => {
    // Use reliable PDF extraction
    const { extractTextFromPdf } = await import('@/lib/pdf-extractor');
    const pdfResult = await extractTextFromPdf(pdfDataUri);
    
    if (!pdfResult.success || !pdfResult.text.trim()) {
      throw new Error(pdfResult.text || "Could not extract text from the PDF.");
    }

    // Truncate text to avoid hitting model limits, especially for large PDFs.
    const MAX_TEXT_LENGTH = 10000;
    let documentText = pdfResult.text.substring(0, MAX_TEXT_LENGTH);
    
    if (!documentText) {
        throw new Error("Could not extract text from the PDF.");
    }

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      prompt: documentText,
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
