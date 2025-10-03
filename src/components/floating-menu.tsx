
'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal, FileText, MessageSquare, Music, Languages, FileImage, Image } from 'lucide-react';
import { useTranslation } from '@/contexts/translation-context';

const menuItems = [
  { name: 'pdfSummarizer', active: true, icon: <FileText/> },
  { name: 'chatPdf', active: false, icon: <MessageSquare/> },
  { name: 'pdfToAudio', active: false, icon: <Music/> },
  { name: 'pdfTranslator', active: false, icon: <Languages/> },
  { name: 'imageToPdf', active: false, icon: <FileImage/> },
  { name: 'pdfToImage', active: false, icon: <Image/> },
];

const visibleMenuItems = menuItems.slice(0, 3);

export default function FloatingMenu() {
  const { t } = useTranslation();
  return (
    <Dialog>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="rounded-full bg-card shadow-lg p-2 flex items-center space-x-2">
          <ScrollArea className="w-auto whitespace-nowrap">
            <div className="flex items-center space-x-2">
              {visibleMenuItems.map((item) => (
                <Button
                  key={item.name}
                  variant={item.active ? 'default' : 'ghost'}
                  className="rounded-full"
                  size="sm"
                >
                  {t('floatingMenu', item.name as any)}
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
                variant={item.active ? 'default' : 'outline'}
                className="w-full justify-start"
              >
                {item.icon}
                <span>{t('floatingMenu', item.name as any)}</span>
              </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
