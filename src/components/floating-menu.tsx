
'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal, FileText, MessageSquare, Music, Languages, FileImage, Image } from 'lucide-react';
import { useTranslation } from '@/contexts/translation-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type MenuItem = {
  name: 'pdfSummarizer' | 'chatPdf' | 'pdfToAudio' | 'pdfTranslator' | 'imageToPdf' | 'pdfToImage';
  href: string;
  icon: JSX.Element;
  active: boolean; // Keep for dialog
};


const allMenuItems: MenuItem[] = [
    { name: 'pdfSummarizer', href: '/', icon: <FileText/>, active: false },
    { name: 'chatPdf', href: '/chat-pdf', icon: <MessageSquare/>, active: false },
    { name: 'pdfToAudio', href: '/pdf-to-audio', icon: <Music/>, active: false },
    { name: 'pdfTranslator', href: '/pdf-translator', icon: <Languages/>, active: false },
    { name: 'imageToPdf', href: '/image-to-pdf', 'icon': <FileImage/>, active: false },
    { name: 'pdfToImage', href: '/pdf-to-image', 'icon': <Image/>, active: false },
];

export default function FloatingMenu({ activeFeature }: { activeFeature?: string }) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const menuItems = allMenuItems.map(item => ({...item, active: item.href === pathname}));
  const visibleMenuItems = menuItems.slice(0, 4);


  return (
    <Dialog>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="rounded-full bg-card shadow-lg p-2 flex items-center space-x-2">
          <ScrollArea className="w-auto whitespace-nowrap">
            <div className="flex items-center space-x-2">
              {visibleMenuItems.map((item) => (
                <Button
                  key={item.name}
                  variant={item.href === pathname ? 'default' : 'ghost'}
                  className="rounded-full"
                  size="sm"
                  asChild
                >
                  <Link href={item.href}>{t('floatingMenu', item.name as any)}</Link>
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="h-2" />
          </ScrollArea>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreHorizontal />
            </Button>
          </DialogTrigger>
        </div>
      </div>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('dialog', 'allFeatures')}</DialogTitle>
          <DialogDescription>
            {t('dialog', 'selectFeature')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {menuItems.map(item => (
            <Button
                key={item.name}
                variant={item.href === pathname ? 'default' : 'outline'}
                className="w-full justify-start gap-2"
                asChild
              >
                <Link href={item.href}>
                    {item.icon}
                    <span>{t('floatingMenu', item.name as any)}</span>
                </Link>
              </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
