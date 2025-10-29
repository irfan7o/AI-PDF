import ChatPdf from "@/components/chat-pdf";
import FloatingMenu from "@/components/floating-menu";
import Header from "@/components/layout/header";

export default function ChatPdfPage() {
  return (
    <>
      <Header />
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 px-3 py-4 pt-16 pb-20 sm:px-4 sm:pt-20 sm:pb-24 md:px-6">
        <ChatPdf />
        <FloatingMenu activeFeature="chatPdf" />
      </div>
    </>
  );
}
