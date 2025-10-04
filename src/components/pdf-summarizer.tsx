
"use client";

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { FileUp, Loader, AlertCircle, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/contexts/translation-context';
import { getSummary, AnalysisResult } from '@/app/actions';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'uploading' | 'selected' | 'loading' | 'error' | 'success';
type FullTextResult = {
    pages: {
        pageNumber: number;
        text: string;
    }[];
}

export default function PdfSummarizer() {
    const { t } = useTranslation();
    const [status, setStatus] = useState<Status>('idle');
    const [dataUri, setDataUri] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileSize, setFileSize] = useState<number | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [url, setUrl] = useState('');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [fullTextResult, setFullTextResult] = useState<FullTextResult | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setStatus('idle');
        setDataUri(null);
        setFileName(null);
        setFileSize(null);
        setUrl('');
        setAnalysisResult(null);
        setFullTextResult(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (status !== 'idle') return;
        const file = event.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const processFile = (file: File) => {
        if (file.type !== 'application/pdf') {
            toast({ variant: 'destructive', title: t('toast', 'invalidFileType'), description: t('toast', 'invalidFileTypeDesc') });
            return;
        }
        setFileName(file.name);
        setFileSize(file.size);
        setStatus('uploading');
        const reader = new FileReader();
        reader.onprogress = (event) => {
            if (event.lengthComputable) {
                setUploadProgress((event.loaded / event.total) * 100);
            }
        };
        reader.onloadend = () => {
            setDataUri(reader.result as string);
            setStatus('selected');
        };
        reader.readAsDataURL(file);
    };

    const handleSummarize = async () => {
        let uriToSummarize = dataUri;

        if (url) {
            try {
                new URL(url);
            } catch (_) {
                toast({ variant: 'destructive', title: t('toast', 'invalidUrl'), description: t('toast', 'invalidUrlDesc') });
                return;
            }
            uriToSummarize = `url:${url}`;
        }

        if (!uriToSummarize) {
            toast({ variant: 'destructive', title: t('toast', 'urlRequired'), description: t('toast', 'urlRequiredDesc') });
            return;
        }

        setStatus('loading');
        
        try {
            const result = await getSummary(uriToSummarize);
            if (result.summary.startsWith('Failed to process')) {
                 setStatus('error');
                 toast({ variant: "destructive", title: t('toast', 'analysisFailed'), description: result.summary });
                 return;
            }
            setAnalysisResult(result);
            // This part is faked for now, as we don't get full text from the action
            const fakeFullText: FullTextResult = {
                pages: Array.from({ length: result.pageCount || 1 }, (_, i) => ({
                    pageNumber: i + 1,
                    text: `This is the full text content for page ${i + 1}. In a real application, this would contain all the text extracted from the corresponding page in the PDF document. This allows users to read, copy, or review the exact text from the original file. This feature is useful for detailed analysis or when the summary is not enough. This fake data is for demonstration purposes. This is the full text content for page ${i + 1}. In a real application, this would contain all the text extracted from the corresponding page in the PDF document. This allows users to read, copy, or review the exact text from the original file.`
                }))
            };
            setFullTextResult(fakeFullText);

            setStatus('success');
        } catch (error) {
             setStatus('error');
             toast({ variant: "destructive", title: t('toast', 'analysisFailed'), description: (error as Error).message });
        }
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const formatFileSize = (bytes: number | null) => {
        if (bytes === null) return '';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getDialogTitle = () => {
        if (fileName) {
            return fileName;
        }
        if (url) {
            try {
                return new URL(url).pathname.split('/').pop() || url;
            } catch (error) {
                return url;
            }
        }
        return '';
    };

    return (
        <Card className="w-full max-w-lg shadow-sm rounded-xl">
            <CardHeader className="text-center">
                <CardTitle className="font-headline text-2xl">{t('main', 'title')}</CardTitle>
                <CardDescription>{t('main', 'description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="uploadFile">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="uploadFile">{t('tabs', 'uploadFile')}</TabsTrigger>
                        <TabsTrigger value="fromUrl">{t('tabs', 'fromUrl')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="uploadFile">
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => status === 'idle' && fileInputRef.current?.click()}
                            className={cn(
                                "w-full min-h-[200px] mt-4 rounded-lg border-2 border-dashed p-12 text-center transition-colors flex items-center justify-center",
                                status === 'idle' && "cursor-pointer hover:border-primary hover:bg-primary/10"
                            )}
                        >
                            {status === 'idle' && (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <div className="rounded-full p-3 bg-gray-200 dark:bg-muted">
                                        <FileUp className="h-8 w-8 text-gray-500 dark:text-muted-foreground" />
                                    </div>
                                    <p className="mt-4 font-semibold text-foreground">{t('uploadArea', 'dragAndDrop')}</p>
                                    <p className="my-2 text-sm text-muted-foreground">{t('uploadArea', 'or')}</p>
                                    <Button variant="ghost">{t('uploadArea', 'chooseFile')}</Button>
                                </div>
                            )}
                            {status === 'uploading' && (
                                <div className="flex h-full w-full flex-col items-center justify-center">
                                    <Loader className="h-12 w-12 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground mt-4">{t('status', 'uploading')} {Math.round(uploadProgress)}%</p>
                                </div>
                            )}
                            {(status === 'selected' || status === 'loading' || status === 'success') && fileName && (
                                <div className="text-center">
                                    <FileText className="h-12 w-12 mx-auto text-primary" />
                                    <p className="font-semibold mt-4">{fileName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatFileSize(fileSize)}
                                        {analysisResult?.pageCount && ` - ${analysisResult.pageCount} ${t('fileInfo', 'pages')}`}
                                    </p>
                                    <Button onClick={resetState} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full h-8 w-8 mt-2" disabled={status === 'loading'}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            {status === 'error' && (
                                <div className="text-center p-4 rounded-lg h-full flex flex-col justify-center">
                                    <div className="flex justify-center">
                                        <AlertCircle className="h-8 w-8 text-destructive" />
                                    </div>
                                    <h2 className="mt-2 text-lg font-semibold text-destructive">{t('status', 'errorTitle')}</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">{t('status', 'errorDescription')}</p>
                                    <Button variant="outline" onClick={resetState} className="mt-4">{t('buttons', 'tryAgain')}</Button>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept="application/pdf"
                        />
                    </TabsContent>
                    <TabsContent value="fromUrl">
                        <div className="p-4 text-center">
                            <h3 className="text-lg font-semibold">{t('urlInput', 'title')}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{t('urlInput', 'description')}</p>
                            <Input
                                type="url"
                                placeholder="https://example.com/document.pdf"
                                value={url}
                                onChange={(e) => { setUrl(e.target.value); if(dataUri) { setDataUri(null); setFileName(null); } }}
                                className="mt-4"
                            />
                        </div>
                    </TabsContent>
                </Tabs>
                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={handleSummarize} disabled={(!dataUri && !url) || status === 'loading'} className="w-full">
                        {status === 'loading' ? <Loader className="animate-spin" /> : t('buttons', 'summarize')}
                    </Button>
                </div>
            </CardContent>

            <Dialog open={status === 'success'} onOpenChange={(open) => !open && resetState()}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('dialog', 'resultsFor')} <span className="font-mono">{getDialogTitle()}</span></DialogTitle>
                         <DialogDescription>
                             {analysisResult?.pageCount} {t('fileInfo', 'pages')}
                         </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="summary" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="summary">{t('tabs', 'summary')}</TabsTrigger>
                        <TabsTrigger value="fullText">{t('tabs', 'fullText')}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="summary">
                         {analysisResult && (
                             <Textarea
                                 readOnly
                                 value={analysisResult.summary}
                                 className="my-4 h-80 resize-none bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
                             />
                         )}
                      </TabsContent>
                      <TabsContent value="fullText">
                         {fullTextResult && (
                             <Textarea
                                 readOnly
                                 value={fullTextResult.pages.map(p => `--- ${t('dialog', 'page')} ${p.pageNumber} ---\n${p.text}`).join('\n\n')}
                                 className="my-4 h-80 resize-none bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
                             />
                         )}
                      </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

        </Card>
    );
}

    