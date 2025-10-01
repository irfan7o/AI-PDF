
'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const menuItems = [
  { name: 'PDF Summarizer', active: true },
  { name: 'Chat PDF', active: false },
  { name: 'PDF to Audio', active: false },
  { name: 'PDF Translator', active: false },
];

export default function FloatingMenu() {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="rounded-full bg-card border shadow-lg p-2">
        <ScrollArea className="w-auto whitespace-nowrap">
          <div className="flex items-center space-x-2">
            {menuItems.map((item) => (
              <Button
                key={item.name}
                variant={item.active ? 'default' : 'ghost'}
                className="rounded-full"
                size="sm"
              >
                {item.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>
      </div>
    </div>
  );
}
