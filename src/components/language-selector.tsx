
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

const languages = [
    { value: "en", label: "English" },
    { value: "id", label: "Indonesia" },
    { value: "ru", label: "Russia" },
    { value: "hi", label: "India" },
    { value: "es", label: "Spanyol" },
    { value: "de", label: "German" },
    { value: "zh", label: "Cina" },
    { value: "ja", label: "Jepang" },
    { value: "ko", label: "Korea" },
]

export default function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = React.useState("en")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="icon" className="rounded-full shadow-lg">
          <Globe />
          <span className="sr-only">Select Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.value}
            onSelect={() => setSelectedLanguage(language.value)}
          >
            <div className="flex items-center justify-between w-full">
                <span>{language.label}</span>
                {selectedLanguage === language.value && <Check className="h-4 w-4" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
