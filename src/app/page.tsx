import FloatingMenu from '@/components/floating-menu';
import Header from '@/components/layout/header';
import PdfSummarizer from '@/components/style-analyzer';

export default function Home() {
  return (
    <>
      <Header />
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
        <PdfSummarizer />
        <FloatingMenu />
      </div>
    </>
  );
}
