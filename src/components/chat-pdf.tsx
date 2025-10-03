
"use client";

import { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import { FileUp, Loader, AlertCircle, FileText, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/contexts/translation-context';
import { ScrollArea } from './ui/scroll-area';

type Status = 'idle' | 'uploading' | 'selected' | 'loading' | 'error';
type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export default function ChatPdf() {
    const { t } = useTranslation();
    const [status, setStatus] = useState<Status>('idle');
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [dataUri, setDataUri] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      // Create a URL for the file to be used in the iframe
      if (file) {
        const url = URL.createObjectURL(file);
        setFileUrl(url);

        // Revoke the URL when the component unmounts or the file changes
        return () => {
          URL.revokeObjectURL(url);
          setFileUrl(null);
        };
      }
    }, [file]);

    const resetState = () => {
        setStatus('idle');
        setFile(null);
        setDataUri(null);
        setMessages([]);
        setCurrentMessage('');
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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentMessage.trim() || status === 'loading' || !dataUri) return;

        const newMessages: Message[] = [...messages, { role: 'user', content: currentMessage }];
        setMessages(newMessages);
        setCurrentMessage('');
        setStatus('loading');

        // Mock AI response for now
        // In the future, you would call a server action here with the `dataUri` and `currentMessage`
        setTimeout(() => {
            setMessages([...newMessages, { role: 'assistant', content: 'This is a mock response from the assistant.' }]);
            setStatus('selected');
        }, 1000);
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.add('border-primary', 'bg-primary/10');
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('border-primary', 'bg-primary/10');
    };


    if (status !== 'idle' && file && fileUrl) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-6xl h-[calc(100vh-10rem)]">
                <Card className="flex flex-col">
                    <CardHeader className='flex-row items-center justify-between'>
                        <CardTitle className='text-lg font-medium truncate'>{file.name}</CardTitle>
                        <Button onClick={resetState} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full">
                           <Trash2 className="h-5 w-5"/>
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-grow p-0">
                       <iframe src={fileUrl} className="w-full h-full border-0" title={file.name ?? 'PDF Preview'}/>
                    </CardContent>
                </Card>

                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>{t('floatingMenu', 'chatPdf')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden">
                       <ScrollArea className="h-full pr-4">
                            <div className="flex flex-col gap-4">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                        {msg.role === 'assistant' && <FileText className="w-6 h-6 text-primary flex-shrink-0" />}
                                        <div className={`rounded-lg p-3 max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                 {status === 'loading' && (
                                    <div className="flex items-start gap-3">
                                        <FileText className="w-6 h-6 text-primary flex-shrink-0 animate-pulse" />
                                        <div className="rounded-lg p-3 bg-muted">
                                           <Loader className="w-5 h-5 animate-spin" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter>
                         <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                             <Input 
                                 placeholder="Ask something about the document..."
                                 value={currentMessage}
                                 onChange={(e) => setCurrentMessage(e.target.value)}
                                 disabled={status === 'loading'}
                             />
                             <Button type="submit" disabled={status === 'loading' || !currentMessage.trim()}>
                                 {status === 'loading' ? <Loader className="animate-spin" /> : <Send />}
                             </Button>
                         </form>
                    </CardFooter>
                </Card>
            </div>
        );
    }
    

    return (
        <Card className="w-full max-w-lg shadow-sm rounded-xl">
             <CardHeader className="text-center">
                 <CardTitle className="font-headline text-2xl">{t('floatingMenu', 'chatPdf')}</CardTitle>
             </CardHeader>
            <CardContent
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
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
                 />
            </CardContent>
        </Card>
    );
}
