
'use client';

import * as React from "react"
import { Check, Globe } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation, type Language } from "@/contexts/translation-context";

const languages: { value: Language, label: string }[] = [
    { value: "en", label: "English" },
    { value: "id", label: "Indonesia" },
    { value: "ru", label: "Русский" },
    { value: "hi", label: "हिन्दी" },
    { value: "es", label: "Español" },
    { value: "de", label: "Deutsch" },
    { value: "zh", label: "中文" },
    { value: "ja", label: "日本語" },
    { value: "ko", label: "한국어" },
]

export default function LanguageSelector() {
  const { language, setLanguage } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="icon" className="rounded-full shadow-lg">
          <Globe />
          <span className="sr-only">Select Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onSelect={() => setLanguage(lang.value)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
                <span>{lang.label}</span>
                {language === lang.value && <Check className="h-4 w-4" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
