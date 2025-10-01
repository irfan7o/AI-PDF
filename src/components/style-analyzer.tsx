
"use client";

import { useState, useRef, useEffect } from 'react';
import { FileUp, Loader, AlertCircle, File, FileText, X } from 'lucide-react';
import { getSummary, AnalysisResult } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

type Status = 'idle' | 'uploading' | 'selected' | 'loading' | 'success' | 'error';

export default function PdfSummarizer() {
    const [status, setStatus] = useState<Status>('idle');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [dataUri, setDataUri] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedFile = localStorage.getItem('uploadedPdf');
        const savedFileName = localStorage.getItem('uploadedPdfName');
        if (savedFile && savedFileName) {
            setDataUri(savedFile);
            setFileName(savedFileName);
            setStatus('selected');
        }
    }, []);

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
        
        resetState(false);
        setFileName(file.name);
        setStatus('uploading');

        const reader = new FileReader();
        reader.onprogress = (event) => {
            if (event.lengthComputable) {
                const progress = (event.loaded / event.total) * 100;
                setUploadProgress(progress);
            }
        };
        reader.onloadend = async () => {
            const dataUri = reader.result as string;
            setDataUri(dataUri);
            setStatus('selected');
            localStorage.setItem('uploadedPdf', dataUri);
            localStorage.setItem('uploadedPdfName', file.name);
            setUploadProgress(100);
        };
        reader.readAsDataURL(file);
    };
    
    const startAnalysis = async () => {
        if (!dataUri) return;
        setStatus('loading');
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

    const resetState = (fullReset = true) => {
        setStatus('idle');
        setAnalysisResult(null);
        setUploadProgress(0);
        if (fullReset) {
            setDataUri(null);
            setFileName(null);
            localStorage.removeItem('uploadedPdf');
            localStorage.removeItem('uploadedPdfName');
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    
    const removeFile = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        resetState(true);
    };

    const renderContent = () => {
        switch (status) {
            case 'success':
                return analysisResult && (
                    <div className="w-full">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="h-6 w-6"/>
                            <h2 className="font-headline text-xl">Summary for <Badge variant="secondary">{fileName}</Badge></h2>
                        </div>
                        <ScrollArea className="h-[258px] p-4 border rounded-md bg-muted/50">
                            <p className="text-sm text-foreground">{analysisResult.summary}</p>
                        </ScrollArea>
                    </div>
                );
            case 'error':
                 return (
                    <div className="mt-4 text-center p-4 rounded-lg border border-destructive bg-destructive/10 h-full flex flex-col justify-center">
                        <div className="flex justify-center">
                             <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-destructive">Oops! Something went wrong.</h2>
                        <p className="mt-1 text-sm text-destructive/80">We couldn't analyze your document. Please try again with a different one.</p>
                         <Button variant="outline" onClick={() => resetState(true)} className="mt-4">Try Again</Button>
                    </div>
                );
            default:
                return (
                     <div 
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="relative w-full h-[322px] cursor-pointer transition-colors"
                    >
                        <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center transition-colors group hover:border-primary hover:bg-primary/10">
                            {status === 'loading' && (
                                <div className="flex flex-col items-center gap-4">
                                     <Badge className="flex items-center gap-2 p-2 px-4 rounded-lg bg-primary/80 text-primary-foreground">
                                        <File className="h-4 w-4"/>
                                        <span className="font-normal">{fileName}</span>
                                     </Badge>
                                    <Loader className="h-8 w-8 animate-spin text-primary mt-2" />
                                    <p className="text-sm text-muted-foreground">Summarizing...</p>
                                </div>
                            )}
                            {status === 'uploading' && (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative h-20 w-20">
                                        <Progress value={uploadProgress} asCircle={true} />
                                        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">
                                            {Math.round(uploadProgress)}%
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">Uploading {fileName}...</p>
                                </div>
                            )}
                            {status === 'selected' && fileName && (
                                <div className="flex flex-col items-center gap-4">
                                    <Badge className="relative flex items-center gap-2 p-2 px-4 rounded-lg bg-primary/80 text-primary-foreground">
                                        <File className="h-4 w-4"/>
                                        <span className="font-normal">{fileName}</span>
                                         <button onClick={removeFile} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                </div>
                            )}
                            {(status === 'idle') && (
                                <>
                                    <div className="rounded-full bg-gray-200 p-3 group-hover:bg-primary/20">
                                        <FileUp className="h-8 w-8 text-gray-500 group-hover:text-primary" />
                                    </div>
                                    <p className="mt-4 font-semibold text-foreground">Drag and Drop file here</p>
                                    <p className="text-sm text-muted-foreground my-2">or</p>
                                    <Button
                                      variant="outline"
                                      onClick={() => fileInputRef.current?.click()}
                                      className="group-hover:bg-primary group-hover:text-primary-foreground"
                                    >
                                      Choose file
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-4">PDF files up to 25MB</p>
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                id="file-upload"
                                type="file"
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                onChange={handleFileChange}
                                accept="application/pdf"
                                disabled={status === 'loading' || status === 'uploading'}
                            />
                        </div>
                    </div>
                );
        }
    };


    return (
        <Card className="w-full max-w-lg shadow-lg">
            <CardHeader className="text-center">
                <CardTitle className="font-headline text-2xl">Summarize PDF</CardTitle>
                <CardDescription>Upload a PDF document to get a concise summary.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 min-h-[350px]">
                {renderContent()}
            </CardContent>
            <CardFooter className="flex flex-col w-full">
                {status === 'success' ? (
                     <Button onClick={() => resetState(true)} variant="outline" className="w-full">Summarize Another PDF</Button>
                ) : (
                    <Button
                      onClick={startAnalysis}
                      disabled={status !== 'selected'}
                      className="w-full"
                    >
                      Summarize
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

    