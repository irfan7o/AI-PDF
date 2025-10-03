
"use client";

import { useState, useRef, useEffect } from 'react';
import { FileUp, Loader, AlertCircle, FileText, Trash2, Link as LinkIcon } from 'lucide-react';
import { getSummary, AnalysisResult } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTranslation } from '@/contexts/translation-context';

type Status = 'idle' | 'uploading' | 'selected' | 'loading' | 'success' | 'error';
type InputMode = 'file' | 'url';

export default function PdfSummarizer() {
    const { t } = useTranslation();
    const [status, setStatus] = useState<Status>('idle');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [dataUri, setDataUri] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileSize, setFileSize] = useState<number | null>(null);
    const [pageCount, setPageCount] = useState<number | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [inputMode, setInputMode] = useState<InputMode>('file');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedFile = localStorage.getItem('uploadedPdf');
        const savedFileName = localStorage.getItem('uploadedPdfName');
        const savedFileSize = localStorage.getItem('uploadedPdfSize');
        const savedPageCount = localStorage.getItem('uploadedPdfPageCount');

        if (savedFile && savedFileName) {
            setDataUri(savedFile);
            setFileName(savedFileName);
            if (savedFileSize) setFileSize(Number(savedFileSize));
            if (savedPageCount) setPageCount(Number(savedPageCount));
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
        const area = event.currentTarget;
        area.classList.remove('border-primary', 'bg-primary/10');
        if (status !== 'idle' && status !== 'error') return;
        const file = event.dataTransfer.files?.[0];
        if (!file) return;
        processFile(file);
    };

    const processFile = (file: File) => {
        if (file.type !== 'application/pdf') {
            toast({
                variant: 'destructive',
                title: t('toast', 'invalidFileType'),
                description: t('toast', 'invalidFileTypeDesc'),
            });
            return;
        }
        
        resetState(false);
        setFileName(file.name);
        setFileSize(file.size);
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
            localStorage.setItem('uploadedPdfSize', file.size.toString());
            setUploadProgress(100);

            try {
                const result = await getSummary(dataUri);
                if (result.pageCount) {
                    setPageCount(result.pageCount);
                    localStorage.setItem('uploadedPdfPageCount', result.pageCount.toString());
                }
            } catch (error) {
                console.error("Failed to pre-fetch page count:", error);
            }
        };
        reader.readAsDataURL(file);
    };
    
    const startAnalysis = async () => {
        let analysisUri = dataUri;
        if (inputMode === 'url') {
            if (!pdfUrl) {
                toast({
                    variant: 'destructive',
                    title: t('toast', 'urlRequired'),
                    description: t('toast', 'urlRequiredDesc'),
                });
                return;
            }
            try {
                new URL(pdfUrl);
            } catch (_) {
                toast({
                    variant: 'destructive',
                    title: t('toast', 'invalidUrl'),
                    description: t('toast', 'invalidUrlDesc'),
                });
                return;
            }
            analysisUri = `url:${pdfUrl}`;
            setFileName(pdfUrl.substring(pdfUrl.lastIndexOf('/') + 1));
        }

        if (!analysisUri) return;

        setStatus('loading');
        try {
            const result = await getSummary(analysisUri);
            setAnalysisResult(result);
            if (result.pageCount) {
                setPageCount(result.pageCount);
                localStorage.setItem('uploadedPdfPageCount', result.pageCount.toString());
            }
            setStatus('success');
            setIsModalOpen(true);
        } catch (error) {
            console.error(error);
            setStatus('error');
            toast({
                variant: 'destructive',
                title: t('toast', 'analysisFailed'),
                description: t('toast', 'analysisFailedDesc'),
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
            setFileSize(null);
            setPageCount(null);
            localStorage.removeItem('uploadedPdf');
            localStorage.removeItem('uploadedPdfName');
            localStorage.removeItem('uploadedPdfSize');
            localStorage.removeItem('uploadedPdfPageCount');
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (status === 'idle' || status === 'error') {
            const area = event.currentTarget;
            area.classList.add('border-primary', 'bg-primary/10');
        }
    };
    
    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const area = event.currentTarget;
        area.classList.remove('border-primary', 'bg-primary/10');
    };

    const formatBytes = (bytes: number | null, decimals = 2) => {
        if (bytes === null || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    const isUploadDisabled = status !== 'idle' && status !== 'error';

    const FileUploadArea = () => (
        <div 
            onClick={(e) => {
                if (!isUploadDisabled) {
                     fileInputRef.current?.click()
                }
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`group relative flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors ${!isUploadDisabled ? 'cursor-pointer border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-card hover:border-primary hover:bg-primary/10' : 'cursor-default border-gray-400/30 bg-gray-50/50 dark:border-gray-700/50 dark:bg-card/50'}`}
        >
             <>
                <div className={`rounded-full p-3 transition-colors ${!isUploadDisabled ? 'bg-gray-200 group-hover:bg-primary/20 dark:bg-muted dark:group-hover:bg-primary/20' : 'bg-gray-200/50 dark:bg-muted/50'}`}>
                    <FileUp className={`h-8 w-8 transition-colors ${!isUploadDisabled ? 'text-gray-500 group-hover:text-primary dark:text-muted-foreground' : 'text-gray-400/80 dark:text-muted-foreground/50'}`} />
                </div>
                <p className={`mt-4 font-semibold ${!isUploadDisabled ? 'text-foreground' : 'text-muted-foreground/80'}`}>{t('uploadArea', 'dragAndDrop')}</p>
                <p className={`my-2 text-sm ${!isUploadDisabled ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>{t('uploadArea', 'or')}</p>
                <Button
                variant="ghost"
                disabled={isUploadDisabled}
                className={`transition-colors ${!isUploadDisabled ? 'bg-gray-200 group-hover:bg-primary group-hover:text-primary-foreground dark:bg-muted' : ''}`}
                >
                {t('uploadArea', 'chooseFile')}
                </Button>
                <p className={`mt-4 text-xs ${!isUploadDisabled ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>{t('uploadArea', 'fileSizeLimit')}</p>
             </>
            
            <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="application/pdf"
                disabled={isUploadDisabled}
            />
        </div>
    );

    const closeModal = () => {
        setIsModalOpen(false);
        setStatus('selected');
    }

    const startNew = () => {
        setIsModalOpen(false);
        resetState(true);
    }
    
    const renderContent = () => {
        switch (status) {
            case 'error':
                 return (
                    <div className="text-center p-4 rounded-lg border border-destructive bg-destructive/10 h-full flex flex-col justify-center">
                        <div className="flex justify-center">
                             <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-destructive">{t('status', 'errorTitle')}</h2>
                        <p className="mt-1 text-sm text-destructive/80">{t('status', 'errorDescription')}</p>
                         <Button variant="outline" onClick={() => resetState(true)} className="mt-4">{t('buttons', 'tryAgain')}</Button>
                    </div>
                );
            case 'idle':
                return (
                     <Tabs defaultValue="file" onValueChange={(value) => setInputMode(value as InputMode)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="file">
                                <FileUp className="mr-2 h-4 w-4"/>
                                {t('tabs', 'uploadFile')}
                            </TabsTrigger>
                            <TabsTrigger value="url">
                                <LinkIcon className="mr-2 h-4 w-4"/>
                                {t('tabs', 'fromUrl')}
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="file" className="h-[322px] pt-4">
                             <FileUploadArea />
                        </TabsContent>
                        <TabsContent value="url" className="h-[322px] pt-4">
                             <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center transition-colors hover:border-primary hover:bg-primary/10 dark:bg-card dark:border-gray-600">
                                <div className="rounded-full bg-gray-200 p-3 dark:bg-muted">
                                    <LinkIcon className="h-8 w-8 text-gray-500 dark:text-muted-foreground" />
                                </div>
                                <p className="mt-4 font-semibold text-foreground">{t('urlInput', 'title')}</p>
                                <p className="text-sm text-muted-foreground my-2">{t('urlInput', 'description')}</p>
                                <Input 
                                    type="url"
                                    placeholder="https://example.com/document.pdf"
                                    value={pdfUrl}
                                    onChange={(e) => setPdfUrl(e.target.value)}
                                    className="mt-2"
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                );
            case 'uploading':
                 return (
                    <div className="flex h-full w-full flex-col items-center justify-center">
                        <div className="relative h-20 w-20">
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">
                                {Math.round(uploadProgress)}%
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 max-w-[200px] truncate">{t('status', 'uploading')} {fileName}...</p>
                    </div>
                );
            case 'loading':
            case 'success':
            case 'selected':
                return (
                    <div className="flex h-full w-full flex-col items-center justify-center">
                        {fileName && (
                           <div className="flex flex-col items-center justify-center text-center">
                                <FileText className="h-12 w-12 text-gray-400" />
                                <p className="font-semibold mt-4 max-w-[250px] truncate">{fileName}</p>
                                <div className="text-sm text-muted-foreground mt-1">
                                    <span>{formatBytes(fileSize)}</span>
                                    {pageCount && <span> &middot; {pageCount} {t('fileInfo', 'pages')}</span>}
                                </div>
                                {status === 'loading' ? (
                                    <div className="mt-4">
                                        <Loader className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <Button 
                                        onClick={(e) => { e.stopPropagation(); resetState(true); }} 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full mt-4"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        <>
            <Card className="w-full max-w-lg shadow-sm rounded-xl">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-2xl">{t('main', 'title')}</CardTitle>
                    <CardDescription>{t('main', 'description')}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0 min-h-[354px] flex items-center justify-center">
                    {renderContent()}
                </CardContent>
                <CardFooter className="flex flex-col w-full">
                    <Button
                      onClick={startAnalysis}
                      disabled={status === 'loading' || status === 'uploading' || (inputMode === 'file' && status !== 'selected') || (inputMode === 'url' && !pdfUrl)}
                      className="w-full"
                    >
                      {status === 'loading' && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                      {t('buttons', 'summarize')}
                    </Button>
                </CardFooter>
            </Card>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                             <FileText className="h-6 w-6"/>
                             {t('dialog', 'summaryFor')} <Badge variant="secondary" className="max-w-[200px] truncate">{fileName}</Badge>
                        </DialogTitle>
                         <DialogDescription>
                            {t('dialog', 'summaryDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    {analysisResult && (
                        <ScrollArea className="h-[350px] p-4 border rounded-md bg-muted/50 my-4">
                            <p className="text-sm text-foreground">{analysisResult.summary}</p>
                        </ScrollArea>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={closeModal}>{t('buttons', 'close')}</Button>
                        <Button onClick={startNew}>{t('buttons', 'summarizeAnother')}</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
