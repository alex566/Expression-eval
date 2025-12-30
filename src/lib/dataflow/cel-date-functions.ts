/**
 * Custom CEL functions for date operations
 * These functions provide date manipulation capabilities in CEL expressions
 */

import { celFunc, celOverload } from '@bufbuild/cel';
import type { CelFunc } from '@bufbuild/cel';

/**
 * Create custom date functions for CEL
 * Returns an array of CelFunc to be registered with the CEL environment
 */
export function createDateFunctions(): CelFunc[] {
	return [
		// createDate(dateString: string) -> int
		// Creates a timestamp from an ISO date string
		celFunc('createDate', [
			celOverload(['string'], 'int', (dateStr: string): bigint => {
				const date = new Date(dateStr);
				if (isNaN(date.getTime())) {
					throw new Error(`Invalid date string: ${dateStr}`);
				}
				return BigInt(date.getTime());
			})
		]),
		
		// addDays(timestamp: int, days: int) -> int
		// Adds days to a timestamp and returns new timestamp
		celFunc('addDays', [
			celOverload(['int', 'int'], 'int', (timestamp: bigint, days: bigint): bigint => {
				const date = new Date(Number(timestamp));
				date.setDate(date.getDate() + Number(days));
				return BigInt(date.getTime());
			})
		]),
		
		// addHours(timestamp: int, hours: int) -> int
		// Adds hours to a timestamp and returns new timestamp
		celFunc('addHours', [
			celOverload(['int', 'int'], 'int', (timestamp: bigint, hours: bigint): bigint => {
				const date = new Date(Number(timestamp));
				date.setHours(date.getHours() + Number(hours));
				return BigInt(date.getTime());
			})
		]),
		
		// formatDate(timestamp: int, format: string) -> string
		// Formats a timestamp to a string
		celFunc('formatDate', [
			celOverload(['int', 'string'], 'string', (timestamp: bigint, format: string): string => {
				const date = new Date(Number(timestamp));
				
				switch (format) {
					case 'iso':
						return date.toISOString();
					case 'locale':
						return date.toLocaleString();
					case 'date':
						return date.toDateString();
					case 'time':
						return date.toTimeString();
					case 'timestamp':
						return date.getTime().toString();
					default:
						return date.toISOString();
				}
			})
		])
	];
}
