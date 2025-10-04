
"use client";

import { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import { FileUp, Loader, AlertCircle, Trash2, FileText, Music, User, Play, Pause, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/contexts/translation-context';
import { getAudio, AudioResult, getVoiceSample } from '@/app/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDescriptionComponent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'uploading' | 'selected' | 'converting' | 'success' | 'error';

const voices = [
    { id: 'Algenib', name: 'Algenib', gender: 'Male' },
    { id: 'Achernar', name: 'Achernar', gender: 'Female' },
    { id: 'arkab', name: 'Arkab', gender: 'Male' },
    { id: 'deneb', name: 'Deneb', gender: 'Female' },
    { id: 'hadar', name: 'Hadar', gender: 'Male' },
    { id: 'rasalhague', name: 'Rasalhague', gender: 'Female' },
    { id: 'shaula', name: 'Shaula', gender: 'Female' },
    { id: 'spica', name: 'Spica', gender: 'Male' },
];

export default function PdfToAudio() {
    const { t } = useTranslation();
    const [status, setStatus] = useState<Status>('idle');
    const [file, setFile] = useState<File | null>(null);
    const [dataUri, setDataUri] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [audioResult, setAudioResult] = useState<AudioResult | null>(null);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState('');
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const sampleAudioRef = useRef<HTMLAudioElement>(new Audio());
    const [isPlaying, setIsPlaying] = useState(false);
    const [playingSample, setPlayingSample] = useState<string | null>(null);
    const [loadingSample, setLoadingSample] = useState<string | null>(null);

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

     useEffect(() => {
        const sampleAudio = sampleAudioRef.current;
        const onEnded = () => setPlayingSample(null);
        sampleAudio.addEventListener('ended', onEnded);
        return () => {
            sampleAudio.removeEventListener('ended', onEnded);
        };
    }, []);

    const resetState = () => {
        setStatus('idle');
        setFile(null);
        setDataUri(null);
        setAudioResult(null);
        setSelectedVoice('');
        setUploadProgress(0);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
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

    const handleGenerate = async () => {
        if (!dataUri || !selectedVoice) return;

        setStatus('converting');
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

    const handlePlaySample = async (voiceId: string, voiceName: string) => {
        if (playingSample === voiceId) {
            sampleAudioRef.current.pause();
            setPlayingSample(null);
            return;
        }

        if (sampleAudioRef.current.src) {
             sampleAudioRef.current.pause();
        }

        setLoadingSample(voiceId);
        setPlayingSample(null);

        try {
            const result = await getVoiceSample(voiceId, voiceName);
            if (result.audioDataUri) {
                sampleAudioRef.current.src = result.audioDataUri;
                sampleAudioRef.current.play();
                setPlayingSample(voiceId);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not play voice sample.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not play voice sample.' });
        } finally {
            setLoadingSample(null);
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

    const renderVoiceSelectionModal = () => (
        <Dialog open={isVoiceModalOpen} onOpenChange={setIsVoiceModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('voiceSelection', 'title')}</DialogTitle>
                    <DialogDescriptionComponent>{t('voiceSelection', 'description')}</DialogDescriptionComponent>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {voices.map((voice) => (
                             <Label 
                                key={voice.id} 
                                className={cn("cursor-pointer rounded-lg border p-4 transition-colors hover:bg-accent flex justify-between items-center", selectedVoice === voice.id ? "border-primary bg-primary/10" : "")}
                                onClick={() => {
                                    setSelectedVoice(voice.id);
                                    setIsVoiceModalOpen(false);
                                }}
                            >
                                <div className="flex flex-col gap-1">
                                    <h4 className="font-semibold">{voice.name}</h4>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        <p className="text-sm">{voice.gender}</p>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className='h-8 w-8 rounded-full hover:bg-primary hover:text-primary-foreground'
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handlePlaySample(voice.id, voice.name);
                                    }}
                                    disabled={loadingSample === voice.id}
                                >
                                   {loadingSample === voice.id ? <Loader className="h-4 w-4 animate-spin"/> : (playingSample === voice.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />)}
                                </Button>
                            </Label>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );

    return (
        <>
            <Card className="w-full max-w-lg shadow-sm rounded-xl">
                 <CardHeader className="text-center">
                     <CardTitle className="font-headline text-2xl">{t('floatingMenu', 'pdfToAudio')}</CardTitle>
                     <CardDescription>{t('main', 'pdfToAudioDescription')}</CardDescription>
                 </CardHeader>
                <CardContent
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => status === 'idle' && fileInputRef.current?.click()}
                    className="p-6 pt-0"
                >
                    <div className={`group w-full min-h-[300px] h-full rounded-lg border-2 border-dashed p-12 text-center transition-colors flex flex-col items-center justify-center ${status === 'idle' ? 'cursor-pointer hover:border-primary hover:bg-primary/10' : ''}`}>
                        {status === 'idle' && (
                             <div className="flex flex-col items-center justify-center h-full">
                                 <div className="rounded-full p-3 bg-gray-200 dark:bg-muted">
                                     <FileUp className="h-8 w-8 text-gray-500 dark:text-muted-foreground" />
                                 </div>
                                 <p className="mt-4 font-semibold text-foreground">{t('uploadArea', 'dragAndDrop')}</p>
                                 <p className="my-2 text-sm text-muted-foreground">{t('uploadArea', 'or')}</p>
                                 <Button variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground" onClick={(e) => {e.stopPropagation(); fileInputRef.current?.click()}}>{t('uploadArea', 'chooseFile')}</Button>
                             </div>
                        )}
                        {status === 'uploading' && (
                            <div className="flex h-full w-full flex-col items-center justify-center">
                                <Loader className="h-12 w-12 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground mt-4">{t('status', 'uploading')} {Math.round(uploadProgress)}%</p>
                            </div>
                        )}
                        {(status === 'selected' || status === 'converting' || status === 'success' || status === 'error') && file && (
                             <div className="text-center">
                                 <FileText className="h-12 w-12 mx-auto text-primary" />
                                 <p className="font-semibold mt-4">{file.name}</p>
                                 <p className="text-sm text-muted-foreground">
                                     {formatFileSize(file.size)}
                                 </p>
                                 <Button onClick={resetState} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full h-8 w-8 mt-2" disabled={status === 'converting'}>
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
                             </div>
                        )}
                    </div>
                     <input
                         ref={fileInputRef}
                         id="file-upload"
                         type="file"
                         className="hidden"
                         onChange={handleFileChange}
                         disabled={status !== 'idle'}
                     />
                </CardContent>

                <CardFooter className="flex-col gap-4">
                    {status === 'success' && audioResult?.audioDataUri && (
                        <div className="flex flex-col items-center gap-4 p-4 rounded-lg bg-muted w-full">
                            <h3 className="font-semibold">{t('audioPlayer', 'title')}</h3>
                            <div className='flex items-center gap-4'>
                                <Button onClick={togglePlayPause} size="icon" className='rounded-full h-14 w-14'>
                                    {isPlaying ? <Pause className='h-6 w-6'/> : <Play className='h-6 w-6'/>}
                                </Button>
                                <audio ref={audioRef} src={audioResult.audioDataUri} className="hidden"></audio>
                            </div>
                        </div>
                    )}
                    
                    {status === 'converting' && (
                        <div className="flex flex-col items-center gap-2">
                           <Loader className="h-8 w-8 animate-spin text-primary" />
                           <p className="text-muted-foreground">{t('status', 'converting')}</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-2 w-full items-center">
                         <Button variant="outline" size="sm" onClick={() => setIsVoiceModalOpen(true)} disabled={status === 'converting' || status === 'uploading' || status === 'idle'}>
                             <ListMusic className="mr-2" />
                             {selectedVoice ? voices.find(v => v.id === selectedVoice)?.name : "Select Voice"}
                         </Button>
                         <Button onClick={handleGenerate} disabled={!dataUri || !selectedVoice || status === 'converting' || status === 'uploading'} className="w-full">
                             <Music className="mr-2" />
                             Generate Audio
                         </Button>
                    </div>
                </CardFooter>
            </Card>

            {renderVoiceSelectionModal()}
        </>
    );
}



    
