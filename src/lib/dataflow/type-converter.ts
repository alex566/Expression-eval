/**
 * Type Converter - Converts CEL types to TypeScript types
 * 
 * This module provides utilities to convert CEL (Common Expression Language) types
 * to their TypeScript equivalents for better display and understanding in the UI.
 */

import { parseTypeString } from './type-inference';

/**
 * Convert a CEL type to its TypeScript equivalent
 * 
 * @param celType - The CEL type string (e.g., 'int', 'list(string)', 'map(string, int)')
 * @returns The TypeScript type string (e.g., 'number', 'string[]', 'Record<string, number>')
 * 
 * @example
 * celTypeToTypeScript('int') // returns 'number'
 * celTypeToTypeScript('bool') // returns 'boolean'
 * celTypeToTypeScript('list(string)') // returns 'string[]'
 * celTypeToTypeScript('map(string, int)') // returns 'Record<string, number>'
 */
export function celTypeToTypeScript(celType: string): string {
	// Handle primitive types
	switch (celType) {
		case 'null':
			return 'null';
		case 'bool':
			return 'boolean';
		case 'int':
		case 'uint':
		case 'double':
			return 'number';
		case 'string':
			return 'string';
		case 'bytes':
			return 'Uint8Array';
		case 'any':
			return 'any';
		case 'dyn':
			return 'unknown';
		// Special Google protobuf types
		case 'google.protobuf.Timestamp':
			return 'Date';
		case 'google.protobuf.Duration':
			return 'Duration';
		// User-friendly aliases
		case 'Date':
			return 'Date';
	}
	
	// Parse complex types with generics
	const parsed = parseTypeString(celType);
	
	// Handle list types: list(T) -> T[]
	if (parsed.base === 'list') {
		if (parsed.params.length === 0) {
			return 'unknown[]';
		}
		const elementType = celTypeToTypeScript(parsed.params[0]);
		return `${elementType}[]`;
	}
	
	// Handle map types: map(K, V) -> Record<K, V>
	if (parsed.base === 'map') {
		if (parsed.params.length < 2) {
			return 'Record<string, unknown>';
		}
		const keyType = celTypeToTypeScript(parsed.params[0]);
		const valueType = celTypeToTypeScript(parsed.params[1]);
		return `Record<${keyType}, ${valueType}>`;
	}
	
	// If we don't recognize the type, return it as-is
	// This ensures we don't lose information for custom types
	return celType;
}

/**
 * Convert a TypeScript type back to CEL type (reverse conversion)
 * This is useful for situations where we need to work with CEL internally
 * 
 * @param tsType - The TypeScript type string
 * @returns The CEL type string
 */
export function typeScriptToCelType(tsType: string): string {
	// Handle primitive types
	switch (tsType) {
		case 'null':
			return 'null';
		case 'boolean':
			return 'bool';
		case 'number':
			return 'double'; // Default to double for generic number type
		case 'string':
			return 'string';
		case 'Uint8Array':
			return 'bytes';
		case 'any':
			return 'any';
		case 'unknown':
			return 'dyn';
		case 'Date':
		case 'Duration':
			return tsType;
	}
	
	// Handle array types: T[] -> list(T)
	if (tsType.endsWith('[]')) {
		const elementType = tsType.slice(0, -2);
		const celElementType = typeScriptToCelType(elementType);
		return `list(${celElementType})`;
	}
	
	// Handle Record types: Record<K, V> -> map(K, V)
	const recordMatch = tsType.match(/^Record<(.+),\s*(.+)>$/);
	if (recordMatch) {
		const keyType = typeScriptToCelType(recordMatch[1]);
		const valueType = typeScriptToCelType(recordMatch[2]);
		return `map(${keyType}, ${valueType})`;
	}
	
	// Return as-is if not recognized
	return tsType;
}
