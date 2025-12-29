/**
 * Browser-compatible TypeScript type checker that uses a Web Worker
 * This allows the TypeScript compiler to run in the browser without blocking the main thread
 */

import type { Graph, GraphNode, NodeDefinition, NodeRegistry } from './types';
import type { TSTypeCheckResult } from './ts-type-checker';

/**
 * Browser-compatible TypeScript type checker using Web Worker
 */
export class TSTypeCheckerClient {
	private worker: Worker | null = null;
	private requestId = 0;
	private pendingRequests = new Map<number, { resolve: (value: any) => void; reject: (error: any) => void }>();

	constructor(private registry: NodeRegistry) {
		// Initialize worker only in browser environment
		if (typeof Worker !== 'undefined') {
			try {
				// Vite will handle the worker import with the ?worker suffix
				this.worker = new Worker(
					new URL('./ts-type-checker.worker.ts', import.meta.url),
					{ type: 'module' }
				);

				this.worker.onmessage = (event) => {
					const { id, success, result, error } = event.data;
					const pending = this.pendingRequests.get(id);
					
					if (pending) {
						this.pendingRequests.delete(id);
						if (success) {
							pending.resolve(result);
						} else {
							pending.reject(new Error(error || 'Worker request failed'));
						}
					}
				};

				this.worker.onerror = (error) => {
					console.error('TypeScript worker error:', error);
					// Reject all pending requests
					for (const [id, pending] of this.pendingRequests.entries()) {
						pending.reject(new Error('Worker error'));
						this.pendingRequests.delete(id);
					}
				};
			} catch (error) {
				console.warn('Failed to initialize TypeScript worker:', error);
				this.worker = null;
			}
		}
	}

	/**
	 * Check if the TypeScript type checker is available
	 */
	isAvailable(): boolean {
		return this.worker !== null;
	}

	/**
	 * Send a request to the worker
	 */
	private async sendRequest<T>(type: string, payload: any): Promise<T> {
		if (!this.worker) {
			throw new Error('TypeScript worker not available');
		}

		const id = this.requestId++;
		
		return new Promise((resolve, reject) => {
			this.pendingRequests.set(id, { resolve, reject });
			this.worker!.postMessage({ id, type, payload });
		});
	}

	/**
	 * Type check a graph and infer types using TypeScript
	 */
	async checkGraph(graph: Graph): Promise<TSTypeCheckResult> {
		// Serialize and deserialize to ensure clean transfer to worker
		const cleanGraph = JSON.parse(JSON.stringify(graph));
		return this.sendRequest('checkGraph', { graph: cleanGraph });
	}

	/**
	 * Check if two TypeScript types are compatible
	 */
	areTypesCompatible(sourceType: string, targetType: string): boolean {
		// For synchronous calls, we can't use the worker
		// This is a simple fallback implementation
		if (targetType === 'any' || sourceType === 'any') {
			return true;
		}
		
		// Handle 'array' as a generic array type - compatible with any TypeScript array type
		if (targetType === 'array') {
			// Source is compatible if it's any array type: T[], Array<T>, number[], etc.
			return sourceType.endsWith('[]') || sourceType.startsWith('Array<') || sourceType === 'array';
		}
		if (sourceType === 'array') {
			// Source 'array' is compatible with any array type
			return targetType.endsWith('[]') || targetType.startsWith('Array<') || targetType === 'array';
		}
		
		if (targetType.includes(' | ')) {
			const targetTypes = targetType.split(' | ').map(t => t.trim());
			return targetTypes.some(t => this.areTypesCompatible(sourceType, t));
		}
		return sourceType === targetType;
	}

	/**
	 * Get a human-readable type signature for a node
	 */
	getNodeTypeSignature(node: GraphNode, definition?: NodeDefinition): string {
		if (!definition) {
			return 'unknown';
		}

		const inputs = definition.inputs?.map(i => `${i.name}: ${i.type}`).join(', ') || '';
		const outputs = definition.outputs?.map(o => `${o.name}: ${o.type}`).join(', ') || '';
		
		return `(${inputs}) => { ${outputs} }`;
	}

	/**
	 * Clean up resources
	 */
	dispose() {
		if (this.worker) {
			this.worker.terminate();
			this.worker = null;
		}
		this.pendingRequests.clear();
	}
}
