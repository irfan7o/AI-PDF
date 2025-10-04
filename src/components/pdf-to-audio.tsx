
"use client";

import { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import { FileUp, Loader, AlertCircle, Trash2, FileText, Music, User, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/translation-context';
import { getAudio, AudioResult } from '@/app/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from './ui/scroll-area';

type Status = 'idle' | 'uploading' | 'selected' | 'converting' | 'success' | 'error';

const voices = [
    { id: 'onyx', name: 'Onyx', gender: 'Male' },
    { id: 'nova', name: 'Nova', gender: 'Female' },
    { id: 'shimmer', name: 'Shimmer', gender: 'Female' },
    { id: 'echo', name: 'Echo', gender: 'Male' },
    { id: 'fable', name: 'Fable', gender: 'Male' },
    { id: 'alloy', name: 'Alloy', gender: 'Male' },
];

export default function PdfToAudio() {
    const { t } = useTranslation();
    const [status, setStatus] = useState<Status>('idle');
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [dataUri, setDataUri] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [audioResult, setAudioResult] = useState<AudioResult | null>(null);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState(voices[0].id);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setFileUrl(url);
            return () => {
                URL.revokeObjectURL(url);
                setFileUrl(null);
            };
        }
    }, [file]);
    
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
        };
    }, [audioResult]);

    const resetState = () => {
        setStatus('idle');
        setFile(null);
        setDataUri(null);
        setAudioResult(null);
        setUploadProgress(0);
        setIsVoiceModalOpen(false);
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

    const handleConvert = async () => {
        if (!dataUri) return;

        setStatus('converting');
        setIsVoiceModalOpen(false);

        const result = await getAudio(dataUri, selectedVoice);

        if (result.error || !result.audioDataUri) {
            setStatus('error');
            toast({ variant: "destructive", title: t('status', 'errorTitle'), description: result.error || t('status', 'errorDescription') });
        } else {
            setAudioResult(result);
            setStatus('success');
        }
    };
    
    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (audio) {
            if (isPlaying) {
                audio.pause();
            } else {
                audio.play();
            }
        }
    };

    const renderFileUpload = () => (
         <Card className="w-full max-w-lg shadow-sm rounded-xl">
             <CardHeader className="text-center">
                 <CardTitle className="font-headline text-2xl">{t('floatingMenu', 'pdfToAudio')}</CardTitle>
                 <CardDescription>{t('main', 'pdfToAudioDescription')}</CardDescription>
             </CardHeader>
            <CardContent
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="p-6 pt-0"
            >
                <div className="w-full min-h-[300px] h-full rounded-lg border-2 border-dashed p-12 text-center transition-colors flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/10">
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
                </div>
                 <input
                     ref={fileInputRef}
                     id="file-upload"
                     type="file"
                     className="hidden"
                     onChange={handleFileChange}
                     accept="application/pdf"
                 />
            </CardContent>
        </Card>
    );

    const renderPdfViewer = () => {
        if (!file || !fileUrl) return null;
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-6xl h-[calc(100vh-18rem)]">
                <Card className="flex flex-col">
                    <CardHeader className='flex-row items-center justify-between p-3 border-b'>
                        <CardTitle className='text-sm font-medium truncate'>{file.name}</CardTitle>
                        <Button onClick={resetState} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full h-8 w-8">
                           <Trash2 className="h-4 w-4"/>
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-grow p-0">
                       <iframe src={fileUrl} className="w-full h-full border-0" title={file.name ?? 'PDF Preview'}/>
                    </CardContent>
                </Card>

                <Card className="flex flex-col h-full items-center justify-center">
                    <CardHeader>
                        <CardTitle>{t('floatingMenu', 'pdfToAudio')}</CardTitle>
                        <CardDescription className="text-center">{t('main', 'pdfToAudioCta')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {status === 'converting' ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader className="h-12 w-12 animate-spin text-primary" />
                                <p className="text-muted-foreground">{t('status', 'converting')}</p>
                            </div>
                        ) : status === 'success' && audioResult?.audioDataUri ? (
                            <div className="flex flex-col items-center gap-4 p-4 rounded-lg bg-muted w-full">
                                <h3 className="font-semibold">{t('audioPlayer', 'title')}</h3>
                                <div className='flex items-center gap-4'>
                                <Button onClick={togglePlayPause} size="icon" className='rounded-full h-14 w-14'>
                                    {isPlaying ? <Pause className='h-6 w-6'/> : <Play className='h-6 w-6'/>}
                                </Button>
                                <audio ref={audioRef} src={audioResult.audioDataUri} className="hidden"></audio>
                                </div>
                                <Button variant="link" onClick={resetState}>{t('buttons', 'convertAnother')}</Button>
                            </div>
                        ) : (
                             <Button size="lg" onClick={() => setIsVoiceModalOpen(true)}>
                                 <Music className="mr-2" />
                                 {t('buttons', 'convertToAudio')}
                            </Button>
                        )}
                    </CardContent>
                     {status === 'error' && (
                         <CardFooter className="flex-col gap-2 text-center">
                             <AlertCircle className="h-8 w-8 text-destructive" />
                             <h2 className="mt-2 text-lg font-semibold text-destructive">{t('status', 'errorTitle')}</h2>
                             <p className="mt-1 text-sm text-muted-foreground">{t('status', 'errorDescription')}</p>
                             <Button variant="outline" onClick={resetState} className="mt-4">{t('buttons', 'tryAgain')}</Button>
                         </CardFooter>
                     )}
                </Card>
            </div>
        );
    };

    const renderVoiceSelectionModal = () => (
        <Dialog open={isVoiceModalOpen} onOpenChange={setIsVoiceModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('voiceSelection', 'title')}</DialogTitle>
                    <DialogDescription>{t('voiceSelection', 'description')}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-6">
                    <RadioGroup value={selectedVoice} onValueChange={setSelectedVoice} className="grid grid-cols-2 gap-4 mt-4">
                        {voices.map((voice) => (
                            <Label key={voice.id} htmlFor={voice.id} className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-accent has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground has-[input:checked]:border-primary">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold">{voice.name}</h4>
                                    <RadioGroupItem value={voice.id} id={voice.id} className="sr-only" />
                                    <User className="h-5 w-5" />
                                </div>
                                <p className="text-sm opacity-80">{voice.gender}</p>
                            </Label>
                        ))}
                    </RadioGroup>
                </ScrollArea>
                <div className="flex justify-end mt-4">
                    <Button onClick={handleConvert}>{t('buttons', 'confirmAndConvert')}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );

    if (status === 'idle' || status === 'uploading') {
        return renderFileUpload();
    }
    
    return (
        <>
            {renderPdfViewer()}
            {renderVoiceSelectionModal()}
        </>
    );
}
