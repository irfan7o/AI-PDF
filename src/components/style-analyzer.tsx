"use client";

import { useState } from 'react';
import { UploadCloud, Loader, AlertCircle, ShoppingCart, ExternalLink, X, File, Download } from 'lucide-react';
import { getStyleSuggestions, AnalyzedOutfit } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function StyleAnalyzer() {
    const [status, setStatus] = useState<Status>('idle');
    const [analysisResult, setAnalysisResult] = useState<AnalyzedOutfit | null>(null);
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
        if (!file.type.startsWith('image/')) {
            toast({
                variant: 'destructive',
                title: 'Invalid File Type',
                description: 'Please upload an image file (PNG, JPG, or WEBP).',
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
        };
        reader.readAsDataURL(file);
    };
    
    const startAnalysis = async () => {
        if (!previewUrl) return;

        try {
            const result = await getStyleSuggestions(previewUrl);
            setAnalysisResult(result);
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: 'There was an error analyzing your image. Please try again.',
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
            <div className="w-full max-w-5xl">
                <div className="text-center mb-8">
                    <h2 className="font-headline text-3xl font-bold">Analysis Complete!</h2>
                    <p className="text-muted-foreground mt-2">We've identified {analysisResult.items.length} items from your outfit.</p>
                    <Button onClick={resetState} variant="outline" className="mt-4">Upload Another Image</Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                   {analysisResult.items.map((item, index) => (
                        <Card key={index} className="flex flex-col overflow-hidden shadow-md transition-shadow hover:shadow-xl">
                            <CardHeader className="p-0">
                                <div className="aspect-square w-full bg-muted/30 flex items-center justify-center p-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                        src={item.segmentedImage} 
                                        alt={item.itemType}
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-4">
                                <CardTitle className="font-headline text-lg">{item.itemType}</CardTitle>
                                <CardDescription className="mt-1 text-sm">{item.description}</CardDescription>
                            </CardContent>
                            <CardFooter className="flex-col items-start gap-3 p-4 pt-0">
                                {item.shoppingSuggestions && item.shoppingSuggestions.ecommerceLinks.length > 0 ? (
                                    <>
                                        <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground"><ShoppingCart className="h-4 w-4"/> Shop Similar Items</h3>
                                        <ScrollArea className="h-32 w-full pr-3">
                                            <div className="flex flex-col gap-2">
                                            {item.shoppingSuggestions.ecommerceLinks.map((link, linkIndex) => (
                                                <a 
                                                    key={linkIndex} 
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between text-sm p-2 rounded-md bg-secondary hover:bg-accent transition-colors group"
                                                >
                                                    <span className="font-medium">Shop on <Badge variant="secondary">{link.platform}</Badge></span>
                                                    <ExternalLink className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                                </a>
                                            ))}
                                            </div>
                                        </ScrollArea>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground py-4">No shopping suggestions found for this item.</p>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Upload file</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
                <div 
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="relative w-full cursor-pointer transition-colors"
                >
                    <div className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/50 bg-primary/10 p-12 text-center transition-colors hover:border-primary hover:bg-primary/20">
                        {status === 'loading' && fileName ? (
                            <div className="flex flex-col items-center gap-4">
                                 <Badge className="flex items-center gap-2 p-2 px-4 rounded-lg bg-primary/80 text-primary-foreground">
                                    <File className="h-4 w-4"/>
                                    <span className="font-normal">{fileName}</span>
                                </Badge>
                                <Loader className="h-8 w-8 animate-spin text-primary mt-2" />
                                <p className="text-sm text-muted-foreground">Analyzing...</p>
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
                            </>
                        )}
                        <input
                            id="file-upload"
                            type="file"
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/webp"
                            disabled={status === 'loading'}
                        />
                    </div>
                </div>
                <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                    <span>Supported formats: PNG, JPG, WEBP</span>
                    <span>Maximum size: 25MB</span>
                </div>
                
                 {status === 'error' && (
                    <div className="mt-4 text-center p-4 rounded-lg border border-destructive bg-destructive/10">
                        <div className="flex justify-center">
                             <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-destructive">Oops! Something went wrong.</h2>
                        <p className="mt-1 text-sm text-destructive/80">We couldn't analyze your image. Please try again with a different one.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-4 p-6 pt-2">
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={resetState}>Cancel</Button>
                    <Button onClick={startAnalysis} disabled={!previewUrl || status === 'loading'}>Next</Button>
                </div>
            </CardFooter>
        </Card>
    );
}
