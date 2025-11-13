/**
 * Find the closest color from a list of available colors
 * Uses Euclidean distance in RGB color space
 */

import { Color3 } from "@babylonjs/core";

/**
 * Calculate the Euclidean distance between two colors in RGB space
 */
function colorDistance(color1: Color3, color2: Color3): number {
    const rDiff = color1.r - color2.r;
    const gDiff = color1.g - color2.g;
    const bDiff = color1.b - color2.b;

    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

/**
 * Find the closest color from a list of available colors
 * @param targetColor The color to match (hex string like "#FFFFFF")
 * @param availableColors Array of available colors (hex strings)
 * @returns The closest matching color from the available list
 */
export function findClosestColor(targetColor: string, availableColors: string[]): string {
    if (!targetColor || !availableColors || availableColors.length === 0) {
        return targetColor;
    }

    // Check if exact match exists
    const exactMatch = availableColors.find(c => c.toLowerCase() === targetColor.toLowerCase());
    if (exactMatch) {
        return exactMatch;
    }

    // Convert target color to Color3
    let targetColor3: Color3;
    try {
        targetColor3 = Color3.FromHexString(targetColor);
    } catch (e) {
        // If target color is invalid, return first available color
        console.warn(`Invalid target color ${targetColor}, using first available color`);
        return availableColors[0];
    }

    // Find closest color by distance
    let closestColor = availableColors[0];
    let minDistance = Number.MAX_VALUE;

    for (const availableColor of availableColors) {
        try {
            const availableColor3 = Color3.FromHexString(availableColor);
            const distance = colorDistance(targetColor3, availableColor3);

            if (distance < minDistance) {
                minDistance = distance;
                closestColor = availableColor;
            }
        } catch (e) {
            console.warn(`Invalid available color ${availableColor}, skipping`);
        }
    }

    return closestColor;
}
