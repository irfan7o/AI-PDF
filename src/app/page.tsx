import StyleAnalyzer from '@/components/style-analyzer';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
      <StyleAnalyzer />
    </div>
  );
}
