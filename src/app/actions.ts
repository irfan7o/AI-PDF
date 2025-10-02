"use server";

import { summarizePdf, SummarizePdfOutput } from "@/ai/flows/summarize-pdf";
import { z } from "zod";

export type AnalysisResult = {
    summary: string;
}

async function fetchAndConvertToDataURI(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Gagal mengambil PDF dari URL: ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/pdf')) {
            throw new Error('URL tidak menunjuk ke file PDF yang valid.');
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return `data:application/pdf;base64,${buffer.toString('base64')}`;
    } catch (error) {
        console.error("Kesalahan saat mengambil URL:", error);
        throw new Error("Tidak dapat mengambil atau memproses URL PDF.");
    }
}


export async function getSummary(uri: string): Promise<AnalysisResult> {
    if (!uri) {
        throw new Error("URI PDF diperlukan.");
    }

    let pdfDataUri: string;

    if (uri.startsWith('url:')) {
        const url = uri.substring(4);
        try {
            pdfDataUri = await fetchAndConvertToDataURI(url);
        } catch (error: any) {
             return { summary: `Gagal memproses URL: ${error.message}` };
        }
    } else {
        pdfDataUri = uri;
    }


    const result = await summarizePdf({ pdfDataUri });

    if (!result.summary) {
        return { summary: "Tidak dapat menghasilkan ringkasan." };
    }
    
    return { summary: result.summary };
}
