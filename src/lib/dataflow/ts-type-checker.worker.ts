/**
 * Web Worker for TypeScript type checking
 * This allows the TypeScript compiler to run in the browser without blocking the main thread
 */

import { TSTypeChecker } from './ts-type-checker';
import { nodeRegistry } from './registry';
import { registerAllNodes } from '../nodes';
import type { Graph } from './types';
import type { TSTypeCheckResult } from './ts-type-checker';

interface WorkerRequest {
	id: number;
	type: 'checkGraph' | 'areTypesCompatible' | 'getNodeTypeSignature';
	payload: any;
}

interface WorkerResponse {
	id: number;
	success: boolean;
	result?: any;
	error?: string;
}

// Register all node types
registerAllNodes();

// Initialize type checker with the global registry
const typeChecker = new TSTypeChecker(nodeRegistry);

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
	const { id, type, payload } = event.data;
	const response: WorkerResponse = { id, success: false };

	try {
		switch (type) {
			case 'checkGraph': {
				const { graph } = payload as { graph: Graph };
				
				const result = await typeChecker.checkGraph(graph);
				response.success = true;
				response.result = result;
				break;
			}

			case 'areTypesCompatible': {
				const { sourceType, targetType } = payload;
				
				const result = typeChecker.areTypesCompatible(sourceType, targetType);
				response.success = true;
				response.result = result;
				break;
			}

			case 'getNodeTypeSignature': {
				const { node, definition } = payload;
				
				const result = typeChecker.getNodeTypeSignature(node, definition);
				response.success = true;
				response.result = result;
				break;
			}

			default:
				throw new Error(`Unknown worker request type: ${type}`);
		}
	} catch (error) {
		response.error = error instanceof Error ? error.message : String(error);
	}

	self.postMessage(response);
};

// Export empty object to make this a valid ES module
export {};
