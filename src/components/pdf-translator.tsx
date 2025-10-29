
"use client";

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { FileUp, Loader, AlertCircle, Trash2, FileText, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/translation-context';
import { getTranslation, TranslationResult } from '@/app/actions';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'uploading' | 'selected' | 'translating' | 'success' | 'error';

const targetLanguages = [
    { value: "English", label: "English" },
    { value: "Indonesian", label: "Indonesian" },
    { value: "Russian", label: "Russian" },
    { value: "Hindi", label: "Hindi" },
    { value: "Spanish", label: "Spanish" },
    { value: "German", label: "German" },
    { value: "Chinese (Simplified)", label: "Chinese (Simplified)" },
    { value: "Japanese", label: "Japanese" },
    { value: "Korean", label: "Korean" },
    { value: "French", label: "French" },
    { value: "Arabic", label: "Arabic" },
    { value: "Portuguese", label: "Portuguese" },
];

export default function PdfTranslator() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const [status, setStatus] = useState<Status>('idle');
    const [file, setFile] = useState<File | null>(null);
    const [dataUri, setDataUri] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
    const [targetLanguage, setTargetLanguage] = useState<string>('');
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setStatus('idle');
        setFile(null);
        setDataUri(null);
        setTranslationResult(null);
        setTargetLanguage('');
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) processFile(selectedFile);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('border-primary', 'bg-primary/10');
        const droppedFile = event.dataTransfer.files?.[0];
        if (droppedFile) processFile(droppedFile);
    };

    const processFile = (fileToProcess: File) => {
        if (fileToProcess.type !== 'application/pdf') {
            toast({ variant: 'destructive', title: t('toast', 'invalidFileType'), description: t('toast', 'invalidFileTypeDesc') });
            return;
        }
        
        resetState();
        setFile(fileToProcess);
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
        reader.readAsDataURL(fileToProcess);
    };

    const handleTranslate = async () => {
        if (!dataUri || !targetLanguage) return;

        setStatus('translating');
        const result = await getTranslation(dataUri, targetLanguage);

        if (result.error || !result.translatedPdfDataUri) {
            setStatus('error');
            toast({ variant: "destructive", title: t('status', 'errorTitle'), description: result.error || t('status', 'errorDescription') });
        } else {
            setTranslationResult(result);
            setStatus('success');
        }
    };
    
    const formatFileSize = (bytes: number | null) => {
        if (bytes === null) return '';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if(status === 'idle') {
            event.currentTarget.classList.add('border-primary', 'bg-primary/10');
        }
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('border-primary', 'bg-primary/10');
    };

    return (
        <>
            <Card className="w-full max-w-lg shadow-sm rounded-xl">
                 <CardHeader className="text-center">
                     <CardTitle className="font-headline text-2xl">{t('floatingMenu', 'pdfTranslator')}</CardTitle>
                     <CardDescription>{t('main', 'pdfTranslatorDescription')}</CardDescription>
                 </CardHeader>
                <CardContent
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => status === 'idle' && fileInputRef.current?.click()}
                    className="p-6 pt-0"
                >
                    <div className={cn(
                        "group w-full min-h-[300px] h-full rounded-lg border-2 border-dashed p-12 text-center transition-colors flex flex-col items-center justify-center",
                        status === 'idle' && "cursor-pointer hover:border-primary hover:bg-primary/10"
                    )}>
                        {status === 'idle' && (
                             <div className="flex flex-col items-center justify-center h-full">
                                 <div className="rounded-full p-3 bg-gray-200 dark:bg-muted">
                                     <FileUp className="h-8 w-8 text-gray-500 dark:text-muted-foreground" />
                                 </div>
                                 <p className="mt-4 font-semibold text-foreground">{t('uploadArea', 'dragAndDrop')}</p>
                                 <p className="my-2 text-sm text-muted-foreground">{t('uploadArea', 'or')}</p>
                                 <Button 
                                   variant={isMobile ? "default" : "ghost"} 
                                   className={cn(
                                     isMobile ? "bg-primary text-primary-foreground hover:bg-primary/90" : "group-hover:bg-primary group-hover:text-primary-foreground"
                                   )} 
                                   onClick={(e) => {e.stopPropagation(); fileInputRef.current?.click()}}
                                 >
                                   {t('uploadArea', 'chooseFile')}
                                 </Button>
                             </div>
                        )}
                        {status === 'uploading' && (
                            <div className="flex h-full w-full flex-col items-center justify-center">
                                <Loader className="h-12 w-12 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground mt-4">{t('status', 'uploading')} {Math.round(uploadProgress)}%</p>
                            </div>
                        )}
                        {(status === 'selected' || status === 'translating' || status === 'success' || status === 'error') && file && (
                             <div className="text-center">
                                 <FileText className="h-12 w-12 mx-auto text-primary" />
                                 <p className="font-semibold mt-4">{file.name}</p>
                                 <p className="text-sm text-muted-foreground">
                                     {formatFileSize(file.size)}
                                 </p>
                                 <Button onClick={resetState} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full h-8 w-8 mt-2" disabled={status === 'translating'}>
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
                         disabled={status !== 'idle'}
                     />
                </CardContent>

                <CardFooter className="flex-col gap-4">
                    {status === 'translating' && (
                        <div className="flex flex-col items-center gap-2">
                           <Loader className="h-8 w-8 animate-spin text-primary" />
                           <p className="text-muted-foreground">{t('status', 'translating')}</p>
                        </div>
                    )}
                    
                    <div className="flex flex-col gap-2 w-full items-center">
                         <Select onValueChange={setTargetLanguage} value={targetLanguage} disabled={status === 'translating' || status === 'uploading' || status === 'idle'}>
                            <SelectTrigger className="focus:ring-0 focus:ring-offset-0">
                                <SelectValue placeholder={t('translation', 'selectLanguage')} />
                            </SelectTrigger>
                            <SelectContent>
                                {targetLanguages.map(lang => (
                                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <Button onClick={handleTranslate} disabled={!dataUri || !targetLanguage || status === 'translating' || status === 'uploading'} className="w-full">
                             <Languages className="mr-2" />
                             {t('buttons', 'translate')}
                         </Button>
                    </div>

                    {status === 'success' && translationResult?.translatedPdfDataUri && (
                         <div className="flex flex-col gap-4 w-full items-center pt-4 border-t">
                            <h3 className="font-semibold text-center">{t('translation', 'successTitle')}</h3>
                             <a href={translationResult.translatedPdfDataUri} download={`translated-${file?.name || 'document'}.pdf`} className='w-full'>
                                 <Button className="w-full">
                                     {t('buttons', 'download')}
                                 </Button>
                             </a>
                             <Button variant="outline" onClick={resetState} className="w-full">
                                {t('buttons', 'translateAnother')}
                             </Button>
                         </div>
                    )}
                </CardFooter>
            </Card>
        </>
    );
}
