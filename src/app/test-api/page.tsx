"use client";

import { useState } from "react";
import { testApiKey } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TestAPIPage() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      const testResult = await testApiKey();
      setResult(testResult);
    } catch (error) {
      setResult({ success: false, error: "Test failed to execute" });
    }

    setTesting(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 API Key Test</CardTitle>
          <CardDescription>
            Test apakah Google AI API Key berfungsi dengan baik untuk semua
            fungsi PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTest} disabled={testing} className="w-full">
            {testing ? "Testing API Key..." : "Test API Key"}
          </Button>

          {result && (
            <div
              className={`p-4 rounded-lg ${
                result.success ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {result.success ? (
                <div className="text-green-800">
                  <h3 className="font-bold">✅ API Key Valid!</h3>
                  <p>Semua fungsi PDF siap digunakan</p>
                </div>
              ) : (
                <div className="text-red-800">
                  <h3 className="font-bold">❌ API Key Tidak Valid</h3>
                  <p className="text-sm mt-2">Error: {result.error}</p>
                  <div className="mt-4 text-sm">
                    <p>
                      <strong>Solusi:</strong>
                    </p>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>
                        Buka{" "}
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          className="text-blue-600 underline"
                        >
                          Google AI Studio
                        </a>
                      </li>
                      <li>Buat API key baru</li>
                      <li>Update file .env.local dengan API key yang benar</li>
                      <li>Restart development server</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
