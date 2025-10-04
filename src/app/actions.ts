"use server";

import { summarizePdf, SummarizePdfOutput } from "@/ai/flows/summarize-pdf";
import { pdfToAudio, PdfToAudioOutput } from "@/ai/flows/pdf-to-audio";

export type AnalysisResult = {
    summary: string;
    pageCount?: number;
}

export type AudioResult = {
    audioDataUri?: string;
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
