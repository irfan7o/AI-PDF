
"use client";

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { FileUp, Loader, AlertCircle, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/translation-context';
import { convertImagesToPdf, ImageToPdfResult } from '@/app/actions';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type Status = 'idle' | 'uploading' | 'selected' | 'converting' | 'success' | 'error';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  dataUri: string;
}

export default function ImageToPdf() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const [status, setStatus] = useState<Status>('idle');
    const [images, setImages] = useState<ImageFile[]>([]);
    const [pdfResult, setPdfResult] = useState<ImageToPdfResult | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const resetState = () => {
        setStatus('idle');
        setImages([]);
        setPdfResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) processFiles(Array.from(files));
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('border-primary', 'bg-primary/10');
        const files = event.dataTransfer.files;
        if (files) processFiles(Array.from(files));
    };

    const processFiles = (filesToProcess: File[]) => {
        const validImageFiles = filesToProcess.filter(file => file.type.startsWith('image/'));
        if (validImageFiles.length !== filesToProcess.length) {
            toast({ variant: 'destructive', title: t('toast', 'invalidFileType'), description: t('toast', 'invalidImageFileTypeDesc') });
        }

        if (validImageFiles.length === 0) return;

        setStatus('uploading');
        const newImages: ImageFile[] = [];
        let loadedCount = 0;

        validImageFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newImages.push({
                    id: `${file.name}-${Date.now()}-${index}`,
                    file,
                    preview: URL.createObjectURL(file),
                    dataUri: reader.result as string,
                });
                loadedCount++;
                if (loadedCount === validImageFiles.length) {
                    setImages(prev => [...prev, ...newImages]);
                    setStatus('selected');
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleConvert = async () => {
        if (images.length === 0) return;
        setStatus('converting');
        const imageUris = images.map(img => img.dataUri);
        const result = await convertImagesToPdf(imageUris);
        if (result.error) {
            setStatus('error');
            toast({ variant: "destructive", title: t('status', 'errorTitle'), description: result.error });
        } else {
            setPdfResult(result);
            setStatus('success');
        }
    };
    
    const removeImage = (id: string) => {
        const newImages = images.filter(image => image.id !== id);
        setImages(newImages);
        if (newImages.length === 0) {
            resetState();
        }
    }
    
    const handleDragStart = (e: DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
    };

    const handleDragEnter = (e: DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
        const newImages = [...images];
        const draggedItem = newImages[dragItem.current!];
        newImages.splice(dragItem.current!, 1);
        newImages.splice(dragOverItem.current!, 0, draggedItem);
        dragItem.current = dragOverItem.current;
        setImages(newImages);
    };

    const handleDragEnd = () => {
        dragItem.current = null;
        dragOverItem.current = null;
    };
    
    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if(status === 'idle') event.currentTarget.classList.add('border-primary', 'bg-primary/10');
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('border-primary', 'bg-primary/10');
    };

    if (status !== 'idle') {
        return (
            <Card className="w-full max-w-2xl shadow-sm rounded-xl">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-center">{t('floatingMenu', 'imageToPdf')}</CardTitle>
                    <CardDescription className="text-center">
                        You have {images.length} image{images.length > 1 ? 's' : ''} ready to be converted. Drag to reorder, then convert.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {images.map((image, index) => (
                            <div 
                                key={image.id} 
                                className="relative group aspect-square border rounded-lg overflow-hidden"
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <Image src={image.preview} alt={image.file.name} fill style={{ objectFit: 'cover' }} />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => removeImage(image.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                         <label htmlFor="file-upload-more" className="cursor-pointer aspect-square">
                            <div
                                className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors h-full w-full p-0"
                            >
                                <FileUp className="h-8 w-8"/>
                                <p className="text-xs mt-2 text-center">{t('uploadArea', 'addMore')}</p>
                            </div>
                         </label>
                         <input
                            ref={fileInputRef}
                            id="file-upload-more"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/*"
                            multiple
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                    {status === 'converting' && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader className="animate-spin" />
                            <p>{t('status', 'convertingToPdf')}</p>
                        </div>
                    )}
                    {status === 'success' && pdfResult?.pdfDataUri ? (
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                            <a href={pdfResult.pdfDataUri} download="converted.pdf" className="w-full">
                                <Button className="w-full">{t('buttons', 'download')}</Button>
                            </a>
                            <Button variant="outline" onClick={resetState} className="w-full">{t('buttons', 'convertAnother')}</Button>
                        </div>
                    ) : (
                        <Button onClick={handleConvert} disabled={status === 'converting' || images.length === 0} className="w-full">
                            {t('buttons', 'convertToPdf')}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        );
    }

    return (
        <>
            <Card className="w-full max-w-lg shadow-sm rounded-xl">
                 <CardHeader className="text-center">
                     <CardTitle className="font-headline text-2xl">{t('floatingMenu', 'imageToPdf')}</CardTitle>
                     <CardDescription>{t('main', 'imageToPdfDescription')}</CardDescription>
                 </CardHeader>
                <CardContent
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 pt-0"
                >
                    <div className={cn("group w-full min-h-[300px] h-full rounded-lg border-2 border-dashed p-12 text-center transition-colors flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/10")}>
                        {status === 'idle' && (
                             <div className="flex flex-col items-center justify-center h-full">
                                 <div className="rounded-full p-3 bg-gray-200 dark:bg-muted">
                                     <ImageIcon className="h-8 w-8 text-gray-500 dark:text-muted-foreground" />
                                 </div>
                                 <p className="mt-4 font-semibold text-foreground">{t('uploadArea', 'dragAndDropImages')}</p>
                                 <p className="my-2 text-sm text-muted-foreground">{t('uploadArea', 'or')}</p>
                                 <Button 
                                   variant={isMobile ? "default" : "ghost"} 
                                   className={cn(
                                     isMobile ? "bg-primary text-primary-foreground hover:bg-primary/90" : "group-hover:bg-primary group-hover:text-primary-foreground"
                                   )} 
                                   onClick={(e) => {e.stopPropagation(); fileInputRef.current?.click()}}
                                 >
                                   {t('uploadArea', 'chooseFiles')}
                                 </Button>
                             </div>
                        )}
                    </div>
                     <input
                         ref={fileInputRef}
                         id="file-upload"
                         type="file"
                         className="hidden"
                         onChange={handleFileChange}
                         accept="image/*"
                         multiple
                     />
                </CardContent>
            </Card>
        </>
    );
}
