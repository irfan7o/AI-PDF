"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  X,
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
};

const allMenuItems: MenuItem[] = [
  { name: "pdfSummarizer", href: "/", icon: <FileText className="h-5 w-5" /> },
  {
    name: "chatPdf",
    href: "/chat-pdf",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    name: "pdfToAudio",
    href: "/pdf-to-audio",
    icon: <Music className="h-5 w-5" />,
  },
  {
    name: "pdfTranslator",
    href: "/pdf-translator",
    icon: <Languages className="h-5 w-5" />,
  },
  {
    name: "imageToPdf",
    href: "/image-to-pdf",
    icon: <FileImage className="h-5 w-5" />,
  },
  {
    name: "pdfToImage",
    href: "/pdf-to-image",
    icon: <Image className="h-5 w-5" />,
  },
];

export default function MobileNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (!isMobile) return null;

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-2 right-2 z-50 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-accent md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[350px]">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Pilih fitur yang ingin Anda gunakan
          </SheetDescription>
        </SheetHeader>
        <nav className="mt-6">
          <div className="space-y-2">
            {allMenuItems.map((item) => {
              const isActive = item.href === pathname;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.icon}
                  <span>{t("floatingMenu", item.name as any)}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
