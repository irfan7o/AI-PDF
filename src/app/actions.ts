"use server";

import { summarizePdf, SummarizePdfOutput } from "@/ai/flows/summarize-pdf";
import { pdfToAudio, PdfToAudioOutput } from "@/ai/flows/pdf-to-audio";
import { generateVoiceSample, GenerateVoiceSampleOutput } from "@/ai/flows/generate-voice-sample";
import { translatePdf, TranslatePdfOutput } from "@/ai/flows/translate-pdf";
import { PDFDocument } from 'pdf-lib';

export type AnalysisResult = {
    summary: string;
    pageCount?: number;
}

export type AudioResult = {
    audioDataUri?: string;
    error?: string;
}

export type TranslationResult = {
    translatedPdfDataUri?: string;
    translatedText?: string;
    error?: string;
}

export type ImageToPdfResult = {
    pdfDataUri?: string;
    error?: string;
}


async function fetchAndConvertToDataURI(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF from URL: ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/pdf')) {
            throw new Error('The URL does not point to a valid PDF file.');
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return `data:application/pdf;base64,${buffer.toString('base64')}`;
    } catch (error) {
        console.error("Error fetching URL:", error);
        throw new Error("Could not fetch or process the PDF URL.");
    }
}


export async function getSummary(uri: string): Promise<AnalysisResult> {
    if (!uri) {
        throw new Error("PDF URI is required.");
    }

    let pdfDataUri: string;

    if (uri.startsWith('url:')) {
        const url = uri.substring(4);
        try {
            pdfDataUri = await fetchAndConvertToDataURI(url);
        } catch (error: any) {
             return { summary: `Failed to process URL: ${error.message}` };
        }
    } else {
        pdfDataUri = uri;
    }

    const result = await summarizePdf({ pdfDataUri });

    if (!result.summary) {
        return { summary: "Could not generate summary.", pageCount: result.pageCount };
    }
    
    return { summary: result.summary, pageCount: result.pageCount };
}

export async function getAudio(pdfDataUri: string, voice: string): Promise<AudioResult> {
    if (!pdfDataUri) {
        return { error: "PDF data URI is required." };
    }

    try {
        const result: PdfToAudioOutput = await pdfToAudio({ pdfDataUri, voice });
        return { audioDataUri: result.audioDataUri };
    } catch (error: any) {
        console.error("Error converting PDF to audio:", error);
        return { error: error.message || "Failed to convert PDF to audio." };
    }
}

export async function getVoiceSample(voice: string, name: string): Promise<AudioResult> {
    try {
        const result: GenerateVoiceSampleOutput = await generateVoiceSample({ voice, name });
        return { audioDataUri: result.audioDataUri };
    } catch (error: any) {
        console.error("Error generating voice sample:", error);
        return { error: error.message || "Failed to generate voice sample." };
    }
}

export async function getTranslation(pdfDataUri: string, targetLanguage: string): Promise<TranslationResult> {
    if (!pdfDataUri) {
        return { error: "PDF data URI is required." };
    }
     if (!targetLanguage) {
        return { error: "Target language is required." };
    }

    try {
        const result: TranslatePdfOutput = await translatePdf({ pdfDataUri, targetLanguage });
        return { 
            translatedPdfDataUri: result.translatedPdfDataUri,
            translatedText: result.translatedText
        };
    } catch (error: any) {
        console.error("Error translating PDF:", error);
        return { error: error.message || "Failed to translate PDF." };
    }
}

export async function convertImagesToPdf(imageUris: string[]): Promise<ImageToPdfResult> {
    if (!imageUris || imageUris.length === 0) {
        return { error: "No images provided for conversion." };
    }

    try {
        const pdfDoc = await PDFDocument.create();

        for (const imageUri of imageUris) {
            const imageBuffer = Buffer.from(imageUri.split(',')[1], 'base64');
            const image = await pdfDoc.embedPng(imageBuffer);
            
            const page = pdfDoc.addPage();
            const { width, height } = image.scale(1);
            page.setSize(width, height);
            
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: width,
                height: height,
            });
        }

        const pdfBytes = await pdfDoc.save();
        const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
        
        return {
            pdfDataUri: `data:application/pdf;base64,${pdfBase64}`
        };

    } catch (error: any) {
        console.error("Error converting images to PDF:", error);
        return { error: error.message || "Failed to convert images to PDF." };
    }
}
