"use server";

import { detectAndSegmentClothing } from "@/ai/flows/detect-and-segment-clothing";
import { generateShoppingSuggestions, GenerateShoppingSuggestionsOutput } from "@/ai/flows/generate-shopping-suggestions";

export type AnalyzedOutfit = {
    items: {
        itemType: string;
        description: string;
        segmentedImage: string;
        shoppingSuggestions?: GenerateShoppingSuggestionsOutput['suggestions'][0];
    }[];
}

export async function getStyleSuggestions(photoDataUri: string): Promise<AnalyzedOutfit> {
    if (!photoDataUri) {
        throw new Error("Image data URI is required.");
    }

    const segmentedItems = await detectAndSegmentClothing({ photoDataUri });

    if (!segmentedItems || segmentedItems.length === 0) {
        return { items: [] };
    }
    
    const itemDescriptions = segmentedItems.map(item => item.description);
    const shoppingSuggestions = await generateShoppingSuggestions({ clothingItems: itemDescriptions });

    const analyzedItems = segmentedItems.map((item, index) => {
        const suggestionForItem = shoppingSuggestions.suggestions[index];

        return {
            ...item,
            shoppingSuggestions: suggestionForItem,
        };
    });

    return { items: analyzedItems };
}
