"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  FileText,
  MessageSquare,
  Music,
  Languages,
  FileImage,
  Image,
} from "lucide-react";
import { useTranslation } from "@/contexts/translation-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type MenuItem = {
  name:
    | "pdfSummarizer"
    | "chatPdf"
    | "pdfToAudio"
    | "pdfTranslator"
    | "imageToPdf"
    | "pdfToImage";
  href: string;
  icon: JSX.Element;
  active: boolean; // Keep for dialog
};

const allMenuItems: MenuItem[] = [
  { name: "pdfSummarizer", href: "/", icon: <FileText />, active: false },
  {
    name: "chatPdf",
    href: "/chat-pdf",
    icon: <MessageSquare />,
    active: false,
  },
  { name: "pdfToAudio", href: "/pdf-to-audio", icon: <Music />, active: false },
  {
    name: "pdfTranslator",
    href: "/pdf-translator",
    icon: <Languages />,
    active: false,
  },
  {
    name: "imageToPdf",
    href: "/image-to-pdf",
    icon: <FileImage />,
    active: false,
  },
  { name: "pdfToImage", href: "/pdf-to-image", icon: <Image />, active: false },
];

export default function FloatingMenu({
  activeFeature,
}: {
  activeFeature?: string;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const menuItems = allMenuItems.map((item) => ({
    ...item,
    active: item.href === pathname,
  }));
  // Show all items on mobile, 4 items on desktop
  const visibleMenuItems = isMobile ? menuItems : menuItems.slice(0, 4);

  return (
    <Dialog>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 sm:bottom-6">
        <div
          className={cn(
            "rounded-full bg-card/95 backdrop-blur-md shadow-lg border border-border/50 flex items-center",
            isMobile ? "p-1.5 space-x-1" : "p-2 space-x-2"
          )}
        >
          <ScrollArea className="w-auto whitespace-nowrap">
            <div
              className={cn(
                "flex items-center",
                isMobile ? "space-x-1" : "space-x-2"
              )}
            >
              {visibleMenuItems.map((item) => (
                <Button
                  key={item.name}
                  variant={item.href === pathname ? "default" : "ghost"}
                  className={cn(
                    "rounded-full transition-all duration-200",
                    isMobile ? "text-sm px-2 py-1.5 h-9 min-w-9" : "text-sm"
                  )}
                  size={isMobile ? "sm" : "sm"}
                  asChild
                >
                  <Link href={item.href}>
                    {isMobile ? (
                      <span className="flex items-center justify-center">
                        <span className="text-sm">{item.icon}</span>
                      </span>
                    ) : (
                      t("floatingMenu", item.name as any)
                    )}
                  </Link>
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="h-2" />
          </ScrollArea>
          {!isMobile && (
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full transition-all duration-200 h-10 w-10"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DialogTrigger>
          )}
        </div>
      </div>
      <DialogContent className="sm:max-w-[425px] max-w-[90vw] mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {t("dialog", "allFeatures")}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {t("dialog", "selectFeature")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4 sm:gap-4">
          {menuItems.map((item) => (
            <Button
              key={item.name}
              variant={item.href === pathname ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-2 text-sm border-0 hover:bg-primary/10 hover:text-primary transition-all duration-200",
                isMobile ? "h-10 px-3" : "h-12 px-4",
                item.href !== pathname && "bg-muted"
              )}
              asChild
            >
              <Link href={item.href}>
                <span className={isMobile ? "text-sm" : "text-base"}>
                  {item.icon}
                </span>
                <span className={isMobile ? "text-sm" : "text-base"}>
                  {t("floatingMenu", item.name as any)}
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
