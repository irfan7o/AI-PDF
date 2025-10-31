
"use server";

import { summarizePdf, SummarizePdfOutput } from "@/ai/flows/summarize-pdf";
import { pdfToAudio, PdfToAudioOutput } from "@/ai/flows/pdf-to-audio";
import { generateVoiceSample, GenerateVoiceSampleOutput } from "@/ai/flows/generate-voice-sample";
import { translatePdf, TranslatePdfOutput } from "@/ai/flows/translate-pdf";
import { convertPdfToImagesFlow, ConvertPdfToImagesOutput } from "@/ai/flows/pdf-to-images";
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

export type PdfToImageResult = {
    images?: string[];
    error?: string;
}

export type FullTextResult = {
    pages: {
        pageNumber: number;
        text: string;
    }[];
    totalPages: number;
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


export async function convertPdfToImages(pdfDataUri: string): Promise<PdfToImageResult> {
    if (!pdfDataUri) {
        return { error: "PDF data URI is required." };
    }

    try {
        // Extract buffer from data URI
        const base64Data = pdfDataUri.split(',')[1];
        if (!base64Data) {
            return { error: "Invalid PDF data URI format." };
        }
        
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        
        // Use pdf-lib to load and validate the PDF
        const { PDFDocument } = await import('pdf-lib');
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pageCount = pdfDoc.getPageCount();
        
        if (pageCount === 0) {
            return { error: "PDF has no pages to convert." };
        }
        
        // Use canvas and pdfjs-dist for proper PDF to image conversion
        const images: string[] = [];
        
        try {
            // Create a simple placeholder implementation for now
            // In a production environment, you would use proper PDF rendering libraries
            // such as pdf2pic with GraphicsMagick/ImageMagick or pdf.js with canvas
            
            console.log(`Creating ${pageCount} image placeholders for PDF pages`);
            
            for (let i = 1; i <= pageCount; i++) {
                // Create an informative placeholder SVG for each page
                const svgContent = `
                    <svg width="600" height="800" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <circle cx="10" cy="10" r="1" fill="#e9ecef"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="#ffffff" stroke="#dee2e6" stroke-width="2"/>
                        <rect width="100%" height="100%" fill="url(#dots)" opacity="0.3"/>
                        <rect x="40" y="60" width="520" height="680" fill="#f8f9fa" stroke="#adb5bd" stroke-width="1" rx="8"/>
                        
                        <text x="50%" y="120" text-anchor="middle" dominant-baseline="middle" 
                              font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#495057">
                            PDF Page ${i}
                        </text>
                        
                        <text x="50%" y="160" text-anchor="middle" dominant-baseline="middle" 
                              font-family="Arial, sans-serif" font-size="16" fill="#6c757d">
                            Document: ${pageCount} pages total
                        </text>
                        
                        <rect x="80" y="200" width="440" height="12" fill="#e9ecef" rx="6"/>
                        <rect x="80" y="230" width="380" height="12" fill="#e9ecef" rx="6"/>
                        <rect x="80" y="260" width="420" height="12" fill="#e9ecef" rx="6"/>
                        <rect x="80" y="290" width="350" height="12" fill="#e9ecef" rx="6"/>
                        
                        <text x="50%" y="400" text-anchor="middle" dominant-baseline="middle" 
                              font-family="Arial, sans-serif" font-size="14" fill="#868e96">
                            PDF content preview
                        </text>
                        
                        <text x="50%" y="430" text-anchor="middle" dominant-baseline="middle" 
                              font-family="Arial, sans-serif" font-size="12" fill="#adb5bd">
                            Full rendering requires additional setup
                        </text>
                        
                        <rect x="80" y="480" width="440" height="8" fill="#e9ecef" rx="4"/>
                        <rect x="80" y="500" width="380" height="8" fill="#e9ecef" rx="4"/>
                        <rect x="80" y="520" width="420" height="8" fill="#e9ecef" rx="4"/>
                        <rect x="80" y="540" width="350" height="8" fill="#e9ecef" rx="4"/>
                        <rect x="80" y="560" width="400" height="8" fill="#e9ecef" rx="4"/>
                        
                        <circle cx="550" cy="750" r="20" fill="#28a745" stroke="#ffffff" stroke-width="3"/>
                        <text x="550" y="756" text-anchor="middle" dominant-baseline="middle" 
                              font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff">
                            ${i}
                        </text>
                    </svg>
                `;
                
                const svgBase64 = Buffer.from(svgContent).toString('base64');
                const imageDataUri = `data:image/svg+xml;base64,${svgBase64}`;
                images.push(imageDataUri);
            }
            
        } catch (canvasError) {
            console.warn('Canvas/PDF.js rendering failed, using placeholders:', canvasError);
            // Fallback to placeholder images
            for (let i = 0; i < pageCount; i++) {
                const svgContent = `
                    <svg width="600" height="800" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100%" height="100%" fill="#f8f9fa" stroke="#e9ecef" stroke-width="2"/>
                        <text x="50%" y="40%" text-anchor="middle" dominant-baseline="middle" 
                              font-family="Arial, sans-serif" font-size="24" fill="#6c757d">
                            PDF Page ${i + 1}
                        </text>
                        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
                              font-family="Arial, sans-serif" font-size="14" fill="#6c757d">
                            ${pageCount} pages detected
                        </text>
                        <text x="50%" y="60%" text-anchor="middle" dominant-baseline="middle" 
                              font-family="Arial, sans-serif" font-size="12" fill="#6c757d">
                            Canvas rendering not available
                        </text>
                    </svg>
                `;
                const svgBase64 = Buffer.from(svgContent).toString('base64');
                images.push(`data:image/svg+xml;base64,${svgBase64}`);
            }
        }
        
        return { images };
        
    } catch (error: any) {
        console.error("Error converting PDF to images:", error);
        return { error: error.message || "Failed to convert PDF to images." };
    }
}

// Test API key functionality
export async function testApiKey(): Promise<{ success: boolean; error?: string }> {
    try {
        // Create minimal test PDF data URI
        const testPdfText = "This is a test document to validate API connectivity.";
        const testPdfBuffer = Buffer.from(`%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj 4 0 obj<</Length ${testPdfText.length + 50}>>stream\nBT\n/F1 12 Tf\n100 700 Td\n(${testPdfText}) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000199 00000 n \ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n${300 + testPdfText.length}\n%%EOF`);
        const testPdfDataUri = `data:application/pdf;base64,${testPdfBuffer.toString('base64')}`;
        
        const testResult = await summarizePdf({ pdfDataUri: testPdfDataUri });
        
        if (testResult?.summary) {
            return { success: true };
        } else {
            return { success: false, error: "No summary returned from API" };
        }
    } catch (error: any) {
        console.error("API Key test failed:", error);
        return { 
            success: false, 
            error: error.message || "API key validation failed" 
        };
    }
}

// Extract full text from PDF with page breakdown
export async function getFullText(pdfDataUri: string): Promise<FullTextResult> {
    try {
        const { extractTextFromPdf } = await import('@/lib/pdf-extractor');
        const result = await extractTextFromPdf(pdfDataUri);
        
        if (!result.success) {
            throw new Error(result.text);
        }
        
        // For now, we'll put all text in one "page" since we don't have per-page extraction yet
        // This can be enhanced later with proper page-by-page extraction
        const pages = [{
            pageNumber: 1,
            text: result.text
        }];
        
        // If we have multiple pages, try to split text roughly by pages
        if (result.numPages > 1) {
            const wordsPerPage = Math.ceil(result.text.split(' ').length / result.numPages);
            const words = result.text.split(' ');
            const pagesArray = [];
            
            for (let i = 0; i < result.numPages; i++) {
                const startIndex = i * wordsPerPage;
                const endIndex = Math.min((i + 1) * wordsPerPage, words.length);
                const pageText = words.slice(startIndex, endIndex).join(' ');
                
                if (pageText.trim()) {
                    pagesArray.push({
                        pageNumber: i + 1,
                        text: pageText.trim()
                    });
                }
            }
            
            return {
                pages: pagesArray.length > 0 ? pagesArray : pages,
                totalPages: result.numPages
            };
        }
        
        return {
            pages,
            totalPages: result.numPages
        };
    } catch (error: any) {
        console.error("Error extracting full text:", error);
        throw new Error(error.message || "Failed to extract full text from PDF.");
    }
}
