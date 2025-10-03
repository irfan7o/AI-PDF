"use server";

import { summarizePdf, SummarizePdfOutput } from "@/ai/flows/summarize-pdf";
import pdfParse from "pdf-parse";

export type AnalysisResult = {
    summary: string;
    pageCount?: number;
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
    let pageCount: number | undefined = undefined;

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

    try {
      const pdfBuffer = Buffer.from(pdfDataUri.split(',')[1], 'base64');
      const pdfData = await pdfParse(pdfBuffer);
      pageCount = pdfData.numpages;
    } catch (err) {
        console.error("Error parsing PDF on server:", err);
        // We can still try to get the summary
    }


    const result = await summarizePdf({ pdfDataUri });

    if (!result.summary) {
        return { summary: "Could not generate summary.", pageCount };
    }
    
    return { summary: result.summary, pageCount };
}
