
import PdfToImage from '@/components/pdf-to-image';
import FloatingMenu from '@/components/floating-menu';
import Header from '@/components/layout/header';

export default function PdfToImagePage() {
  return (
    <>
      <Header />
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4 pt-20 pb-24">
        <PdfToImage />
        <FloatingMenu activeFeature="pdfToImage" />
      </div>
    </>
  );
}
