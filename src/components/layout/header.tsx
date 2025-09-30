import { ThemeToggle } from '@/components/layout/theme-toggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
                <path d="M12 12a10 10 0 0 0 10 10V12H12z"/>
                <path d="m16 8-4 4-4-4"/>
                <path d="m16 16-4-4-4 4"/>
            </svg>
            <span className="font-headline text-lg font-bold sm:inline-block">StyleWise</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
