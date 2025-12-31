/**
 * Type Converter - Type normalization and display utilities
 * 
 * This module provides utilities to normalize and display TypeScript types
 * in the UI for better understanding.
 */

/**
 * Normalize a TypeScript type for display
 * 
 * @param type - The TypeScript type string
 * @returns The normalized type string for display
 * 
 * @example
 * normalizeType('number') // returns 'number'
 * normalizeType('string[]') // returns 'string[]'
 * normalizeType('Record<string, number>') // returns 'Record<string, number>'
 */
export function normalizeType(type: string): string {
	// Handle undefined or null inputs
	if (!type) {
		return 'unknown';
	}
	
	// Type is already in TypeScript format, just return it
	return type;
}

/**
 * For backward compatibility - maps to normalizeType
 */
export function celTypeToTypeScript(type: string): string {
	return normalizeType(type);
}

/**
 * Identity function for TypeScript types
 * For backward compatibility with old CEL-based code
 */
export function typeScriptToCelType(tsType: string): string {
	return tsType;
}
