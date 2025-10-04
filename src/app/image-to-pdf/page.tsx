import ImageToPdf from '@/components/image-to-pdf';
import FloatingMenu from '@/components/floating-menu';
import Header from '@/components/layout/header';

export default function ImageToPdfPage() {
  return (
    <>
      <Header />
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4 pt-20 pb-24">
        <ImageToPdf />
        <FloatingMenu activeFeature="imageToPdf" />
      </div>
    </>
  );
}
