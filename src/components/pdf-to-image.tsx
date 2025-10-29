"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import {
  FileUp,
  Loader,
  AlertCircle,
  Trash2,
  FileText,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/translation-context";
import { convertPdfToImages, PdfToImageResult } from "@/app/actions";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Image from "next/image";

type Status =
  | "idle"
  | "uploading"
  | "selected"
  | "converting"
  | "success"
  | "error";

export default function PdfToImage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<Status>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [dataUri, setDataUri] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageResult, setImageResult] = useState<PdfToImageResult | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStatus("idle");
    setFile(null);
    setDataUri(null);
    setImageResult(null);
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
    event.currentTarget.classList.remove("border-primary", "bg-primary/10");
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  };

  const processFile = (fileToProcess: File) => {
    if (fileToProcess.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: t("toast", "invalidFileType"),
        description: t("toast", "invalidFileTypeDesc"),
      });
      return;
    }

    resetState();
    setFile(fileToProcess);
    setStatus("uploading");

    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress((event.loaded / event.total) * 100);
      }
    };
    reader.onloadend = () => {
      setDataUri(reader.result as string);
      setStatus("selected");
    };
    reader.readAsDataURL(fileToProcess);
  };

  const handleConvert = async () => {
    if (!dataUri) return;

    setStatus("converting");
    const result = await convertPdfToImages(dataUri);

    if (result.error || !result.images) {
      setStatus("error");
      toast({
        variant: "destructive",
        title: t("status", "errorTitle"),
        description: result.error || t("status", "errorDescription"),
      });
    } else {
      setImageResult(result);
      setStatus("success");
    }
  };

  const handleDownloadImage = (imageUri: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageUri;
    link.download = `${file?.name.replace(".pdf", "") || "image"}-page-${
      index + 1
    }.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number | null) => {
    if (bytes === null) return "";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (status === "idle") {
      event.currentTarget.classList.add("border-primary", "bg-primary/10");
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove("border-primary", "bg-primary/10");
  };

  if (status === "success" && imageResult?.images) {
    return (
      <Card className="w-full max-w-4xl shadow-sm rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">
            {t("pdfToImage", "successTitle")}
          </CardTitle>
          <CardDescription>
            {t("pdfToImage", "successDescription", {
              count: imageResult.images.length,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto p-1">
            {imageResult.images.map((imageUri, index) => (
              <div
                key={index}
                className="relative group aspect-[7/10] border rounded-lg overflow-hidden"
              >
                <Image
                  src={imageUri}
                  alt={`Page ${index + 1}`}
                  layout="fill"
                  objectFit="contain"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    onClick={() => handleDownloadImage(imageUri, index)}
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button onClick={resetState} className="w-full sm:w-auto">
            {t("buttons", "convertAnother")}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full max-w-lg shadow-sm rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">
            {t("floatingMenu", "pdfToImage")}
          </CardTitle>
          <CardDescription>
            {t("main", "pdfToImageDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => status === "idle" && fileInputRef.current?.click()}
          className="p-6 pt-0"
        >
          <div
            className={cn(
              "group w-full min-h-[300px] h-full rounded-lg border-2 border-dashed p-12 text-center transition-colors flex flex-col items-center justify-center",
              status === "idle" &&
                "cursor-pointer hover:border-primary hover:bg-primary/10"
            )}
          >
            {status === "idle" && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="rounded-full p-3 bg-gray-200 dark:bg-muted">
                  <FileUp className="h-8 w-8 text-gray-500 dark:text-muted-foreground" />
                </div>
                <p className="mt-4 font-semibold text-foreground">
                  {t("uploadArea", "dragAndDrop")}
                </p>
                <p className="my-2 text-sm text-muted-foreground">
                  {t("uploadArea", "or")}
                </p>
                <Button
                  variant={isMobile ? "default" : "ghost"}
                  className={cn(
                    isMobile
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "group-hover:bg-primary group-hover:text-primary-foreground"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  {t("uploadArea", "chooseFile")}
                </Button>
              </div>
            )}
            {status === "uploading" && (
              <div className="flex h-full w-full flex-col items-center justify-center">
                <Loader className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground mt-4">
                  {t("status", "uploading")} {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
            {(status === "selected" ||
              status === "converting" ||
              status === "error") &&
              file && (
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto text-primary" />
                  <p className="font-semibold mt-4">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  <Button
                    onClick={resetState}
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full h-8 w-8 mt-2"
                    disabled={status === "converting"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            {status === "error" && (
              <div className="text-center p-4 rounded-lg h-full flex flex-col justify-center">
                <div className="flex justify-center">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="mt-2 text-lg font-semibold text-destructive">
                  {t("status", "errorTitle")}
                </h2>
                <Button variant="outline" onClick={resetState} className="mt-4">
                  {t("buttons", "tryAgain")}
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
            accept="application/pdf"
            disabled={status !== "idle"}
          />
        </CardContent>

        <CardFooter className="flex-col gap-4">
          {status === "converting" ? (
            <div className="flex flex-col items-center gap-2">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                {t("status", "convertingToImage")}
              </p>
            </div>
          ) : (
            <Button
              onClick={handleConvert}
              disabled={status !== "selected"}
              className="w-full"
            >
              <ImageIcon className="mr-2" />
              {t("buttons", "convertToImage")}
            </Button>
          )}
        </CardFooter>
      </Card>
    </>
  );
}
