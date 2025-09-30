"use server";

import { summarizePdf, SummarizePdfOutput } from "@/ai/flows/summarize-pdf";

export type AnalysisResult = {
    summary: string;
}

export async function getSummary(pdfDataUri: string): Promise<AnalysisResult> {
    if (!pdfDataUri) {
        throw new Error("PDF data URI is required.");
    }

    const result = await summarizePdf({ pdfDataUri });

    if (!result.summary) {
        return { summary: "Could not generate summary." };
    }
    
    return { summary: result.summary };
}
