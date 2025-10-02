
"use client";

import { useState, useRef, useEffect } from 'react';
import { FileUp, Loader, AlertCircle, File, FileText, X, Link as LinkIcon } from 'lucide-react';
import { getSummary, AnalysisResult } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

type Status = 'idle' | 'uploading' | 'selected' | 'loading' | 'success' | 'error';
type InputMode = 'file' | 'url';

export default function PdfSummarizer() {
    const [status, setStatus] = useState<Status>('idle');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [dataUri, setDataUri] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [fileName, setFileName] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [inputMode, setInputMode] = useState<InputMode>('file');
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
        let analysisUri = dataUri;
        if (inputMode === 'url') {
            if (!pdfUrl) {
                toast({
                    variant: 'destructive',
                    title: 'URL Diperlukan',
                    description: 'Silakan masukkan URL PDF.',
                });
                return;
            }
            // Basic URL validation
            try {
                new URL(pdfUrl);
            } catch (_) {
                toast({
                    variant: 'destructive',
                    title: 'URL tidak valid',
                    description: 'Silakan masukkan URL yang valid.',
                });
                return;
            }
            // In a real app, we'd fetch the PDF and convert it to a data URI.
            // For now, we'll assume the backend can handle a direct URL.
            // This is a placeholder for the fetching logic.
            // This example will pass the URL and let the action handle it.
            // A more robust solution might fetch the PDF on the client, convert to base64,
            // but that can be blocked by CORS. A server-side fetch is better.
            analysisUri = `url:${pdfUrl}`;
            setFileName(pdfUrl.substring(pdfUrl.lastIndexOf('/') + 1));
        }

        if (!analysisUri) return;

        setStatus('loading');
        try {
            // The action needs to be updated to handle a URL-based URI
            const result = await getSummary(analysisUri);
            setAnalysisResult(result);
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
            toast({
                variant: 'destructive',
                title: 'Analisis Gagal',
                description: 'Terjadi kesalahan saat meringkas PDF Anda. Silakan coba lagi.',
            });
        }
    }

    const resetState = (fullReset = true) => {
        setStatus('idle');
        setAnalysisResult(null);
        setUploadProgress(0);
        setPdfUrl('');
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
                            <h2 className="font-headline text-xl">Ringkasan untuk <Badge variant="secondary" className="max-w-[200px] truncate">{fileName}</Badge></h2>
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
                        <h2 className="mt-2 text-lg font-semibold text-destructive">Oops! Terjadi kesalahan.</h2>
                        <p className="mt-1 text-sm text-destructive/80">Kami tidak dapat menganalisis dokumen Anda. Silakan coba lagi dengan yang lain.</p>
                         <Button variant="outline" onClick={() => resetState(true)} className="mt-4">Coba Lagi</Button>
                    </div>
                );
            default:
                return (
                    <Tabs defaultValue="file" onValueChange={(value) => setInputMode(value as InputMode)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="file">
                                <FileUp className="mr-2 h-4 w-4"/>
                                Unggah File
                            </TabsTrigger>
                            <TabsTrigger value="url">
                                <LinkIcon className="mr-2 h-4 w-4"/>
                                Dari URL
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="file" className="h-[322px] pt-4">
                             <div 
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                className="relative w-full h-full cursor-pointer transition-colors"
                            >
                                <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center transition-colors group hover:border-primary hover:bg-primary/10 dark:bg-card dark:border-gray-600 dark:hover:border-primary dark:hover:bg-primary/10">
                                    {status === 'loading' && (
                                        <div className="flex flex-col items-center gap-4">
                                             <Badge className="flex items-center gap-2 p-2 px-4 rounded-lg bg-primary/80 text-primary-foreground">
                                                <File className="h-4 w-4"/>
                                                <span className="font-normal">{fileName}</span>
                                             </Badge>
                                            <Loader className="h-8 w-8 animate-spin text-primary mt-2" />
                                            <p className="text-sm text-muted-foreground">Meringkas...</p>
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
                                            <p className="text-sm text-muted-foreground mt-2">Mengunggah {fileName}...</p>
                                        </div>
                                    )}
                                    {status === 'selected' && fileName && inputMode === 'file' && (
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
                                    {(status === 'idle' || (status === 'selected' && inputMode !== 'file')) && (
                                        <>
                                            <div className="rounded-full bg-gray-200 p-3 group-hover:bg-primary/20 dark:bg-muted dark:group-hover:bg-primary/20">
                                                <FileUp className="h-8 w-8 text-gray-500 group-hover:text-primary dark:text-muted-foreground" />
                                            </div>
                                            <p className="mt-4 font-semibold text-foreground">Seret dan lepas file di sini</p>
                                            <p className="text-sm text-muted-foreground my-2">atau</p>
                                            <Button
                                              variant="ghost"
                                              onClick={() => fileInputRef.current?.click()}
                                              className="group-hover:bg-primary group-hover:text-primary-foreground bg-gray-200 dark:bg-muted border-0"
                                            >
                                              Pilih File
                                            </Button>
                                            <p className="text-xs text-muted-foreground mt-4">File PDF hingga 25MB</p>
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
                        </TabsContent>
                        <TabsContent value="url" className="h-[322px] pt-4">
                            <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:bg-card dark:border-gray-600">
                                {status === 'loading' ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader className="h-8 w-8 animate-spin text-primary" />
                                        <p className="text-sm text-muted-foreground mt-2">Meringkas...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="rounded-full bg-gray-200 p-3 dark:bg-muted">
                                            <LinkIcon className="h-8 w-8 text-gray-500 dark:text-muted-foreground" />
                                        </div>
                                        <p className="mt-4 font-semibold text-foreground">Masukkan URL PDF</p>
                                        <p className="text-sm text-muted-foreground my-2">Tempel tautan ke PDF untuk diringkas.</p>
                                        <Input 
                                            type="url"
                                            placeholder="https://example.com/document.pdf"
                                            value={pdfUrl}
                                            onChange={(e) => setPdfUrl(e.target.value)}
                                            className="mt-2"
                                            disabled={status === 'loading'}
                                        />
                                    </>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                );
        }
    };


    return (
        <Card className="w-full max-w-lg shadow-sm rounded-xl border-0">
            <CardHeader className="text-center">
                <CardTitle className="font-headline text-2xl">Ringkas PDF</CardTitle>
                <CardDescription>Unggah dokumen PDF untuk mendapatkan ringkasan singkat.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 min-h-[354px] flex items-center">
                {renderContent()}
            </CardContent>
            <CardFooter className="flex flex-col w-full">
                {status === 'success' ? (
                     <Button onClick={() => resetState(true)} variant="outline" className="w-full">Ringkas PDF Lain</Button>
                ) : (
                    <Button
                      onClick={startAnalysis}
                      disabled={status === 'loading' || status === 'uploading' || (inputMode === 'file' && status !== 'selected') || (inputMode === 'url' && !pdfUrl)}
                      className="w-full"
                    >
                      Ringkas
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
