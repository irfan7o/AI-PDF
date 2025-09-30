"use client";

import { useState } from 'react';
import { UploadCloud, Loader, AlertCircle, ShoppingCart, ExternalLink } from 'lucide-react';
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

        const reader = new FileReader();
        reader.onloadend = async () => {
            const dataUri = reader.result as string;
            setPreviewUrl(dataUri);
            try {
                const result = await getStyleSuggestions(dataUri);
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
        };
        reader.readAsDataURL(file);
    };
    
    const resetState = () => {
        setStatus('idle');
        setAnalysisResult(null);
        setPreviewUrl(null);
    };

    return (
        <section className="container mx-auto px-4 py-8 md:py-12">
            <div className="mx-auto max-w-3xl text-center">
                <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Discover Your Style
                </h1>
                <p className="mt-4 text-muted-foreground md:text-xl">
                    Upload a photo of an outfit, and our AI will break it down and find you similar items to shop.
                </p>
            </div>

            <div className="mx-auto mt-8 max-w-5xl">
                {status === 'idle' && (
                     <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/50 bg-card p-12 text-center transition-colors hover:border-primary hover:bg-accent/50"
                    >
                        <UploadCloud className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 font-semibold text-foreground">Drag & drop an image, or click to upload</p>
                        <p className="text-sm text-muted-foreground">PNG, JPG, or WEBP</p>
                        <input
                            type="file"
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/webp"
                        />
                    </div>
                )}
                
                {status === 'loading' && (
                    <div className="text-center p-12 rounded-lg border border-border bg-card">
                        <div className="flex justify-center">
                            <Loader className="h-12 w-12 animate-spin text-primary" />
                        </div>
                        <h2 className="mt-4 font-headline text-2xl font-semibold">Analyzing your style...</h2>
                        <p className="mt-2 text-muted-foreground">Our AI is working its magic. This might take a moment.</p>
                        {previewUrl && (
                             <div className="mt-8 flex justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={previewUrl}
                                    alt="Uploaded outfit"
                                    className="rounded-lg object-contain h-48 w-auto"
                                />
                            </div>
                        )}
                    </div>
                )}
                
                {status === 'error' && (
                    <div className="text-center p-12 rounded-lg border border-destructive bg-destructive/10">
                        <div className="flex justify-center">
                             <AlertCircle className="h-12 w-12 text-destructive" />
                        </div>
                        <h2 className="mt-4 font-headline text-2xl font-semibold text-destructive">Oops! Something went wrong.</h2>
                        <p className="mt-2 text-destructive/80">We couldn't analyze your image. Please try again with a different one.</p>
                        <Button onClick={resetState} className="mt-6">Try Again</Button>
                    </div>
                )}

                {status === 'success' && analysisResult && (
                    <div>
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
                )}
            </div>
        </section>
    );
}
