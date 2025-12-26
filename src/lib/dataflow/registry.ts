import type { NodeDefinition, NodeRegistry } from './types';

/**
 * Implementation of the node registry
 */
export class DefaultNodeRegistry implements NodeRegistry {
	private definitions: Map<string, NodeDefinition> = new Map();

	register(definition: NodeDefinition): void {
		this.definitions.set(definition.type, definition);
	}

	get(type: string): NodeDefinition | undefined {
		return this.definitions.get(type);
	}

	getAll(): NodeDefinition[] {
		return Array.from(this.definitions.values());
	}

	getByCategory(category: string): NodeDefinition[] {
		return this.getAll().filter((def) => def.category === category);
	}
}

// Global registry instance
export const nodeRegistry = new DefaultNodeRegistry();
