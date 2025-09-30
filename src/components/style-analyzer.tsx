"use client";

import { useState } from 'react';
import { UploadCloud, Loader, AlertCircle, File, FileText } from 'lucide-react';
import { getSummary, AnalysisResult } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function PdfSummarizer() {
    const [status, setStatus] = useState<Status>('idle');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const { toast } = useToast();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        processFile(file);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
        if (!file) return;
        processFile(file);
    };

    const processFile = (file: File) => {
        if (file.type !== 'application/pdf') {
            toast({
                variant: 'destructive',
                title: 'Invalid File Type',
                description: 'Please upload a PDF file.',
            });
            return;
        }

        setStatus('loading');
        setAnalysisResult(null);
        setFileName(file.name);

        const reader = new FileReader();
        reader.onloadend = async () => {
            const dataUri = reader.result as string;
            setPreviewUrl(dataUri);
            startAnalysis(dataUri);
        };
        reader.readAsDataURL(file);
    };
    
    const startAnalysis = async (dataUri: string) => {
        if (!dataUri) return;

        try {
            const result = await getSummary(dataUri);
            setAnalysisResult(result);
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: 'There was an error summarizing your PDF. Please try again.',
            });
        }
    }

    const resetState = () => {
        setStatus('idle');
        setAnalysisResult(null);
        setPreviewUrl(null);
        setFileName(null);
    };

    if (status === 'success' && analysisResult) {
         return (
            <div className="w-full max-w-2xl">
                <Card className="shadow-2xl">
                    <CardHeader>
                         <CardTitle className="font-headline text-2xl flex items-center gap-2">
                            <FileText className="h-6 w-6"/>
                            Summary for <Badge variant="secondary">{fileName}</Badge>
                        </CardTitle>
                        <CardDescription>Here is the summary of your document.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-64 p-4 border rounded-md bg-muted/50">
                            <p className="text-sm text-foreground">{analysisResult.summary}</p>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={resetState} variant="outline">Summarize Another PDF</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="text-center">
                <CardTitle className="font-headline text-2xl">Summarize PDF</CardTitle>
                <CardDescription>Upload a PDF document to get a concise summary.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
                <div 
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="relative w-full cursor-pointer transition-colors"
                >
                    <div className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-12 text-center transition-colors hover:border-primary hover:bg-primary/10">
                        {status === 'loading' && fileName ? (
                            <div className="flex flex-col items-center gap-4">
                                 <Badge className="flex items-center gap-2 p-2 px-4 rounded-lg bg-primary/80 text-primary-foreground">
                                    <File className="h-4 w-4"/>
                                    <span className="font-normal">{fileName}</span>
                                </Badge>
                                <Loader className="h-8 w-8 animate-spin text-primary mt-2" />
                                <p className="text-sm text-muted-foreground">Summarizing...</p>
                            </div>
                        ) : (
                            <>
                                <div className="rounded-full bg-primary/20 p-3">
                                    <UploadCloud className="h-8 w-8 text-primary" />
                                </div>
                                <p className="mt-4 font-semibold text-foreground">
                                    Drag and Drop file here or{' '}
                                    <label htmlFor="file-upload" className="cursor-pointer font-bold text-primary underline underline-offset-2">
                                        Choose file
                                    </label>
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">PDF files up to 25MB</p>
                            </>
                        )}
                        <input
                            id="file-upload"
                            type="file"
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            onChange={handleFileChange}
                            accept="application/pdf"
                            disabled={status === 'loading'}
                        />
                    </div>
                </div>
                
                 {status === 'error' && (
                    <div className="mt-4 text-center p-4 rounded-lg border border-destructive bg-destructive/10">
                        <div className="flex justify-center">
                             <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-destructive">Oops! Something went wrong.</h2>
                        <p className="mt-1 text-sm text-destructive/80">We couldn't analyze your document. Please try again with a different one.</p>
                         <Button variant="outline" onClick={resetState} className="mt-4">Try Again</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
