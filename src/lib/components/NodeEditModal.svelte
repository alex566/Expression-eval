<script lang="ts">
	import type { GraphNode } from '$lib/dataflow/types';
	import { PinMode } from '$lib/dataflow/types';

	interface Props {
		isOpen: boolean;
		node: GraphNode | null;
		onClose: () => void;
		onSave: (nodeId: string, updates: Record<string, any>) => void;
	}

	let { isOpen = $bindable(), node, onClose, onSave }: Props = $props();

	// Local state for editing
	let editingOutputName = $state('');
	let editingOutputType = $state('');
	let editingInputNames = $state<Record<string, string>>({});
	let editingInputTypes = $state<Record<string, string>>({});

	// Reset state when node changes
	$effect(() => {
		if (node) {
			// Initialize based on node type
			if (node.type === 'Expression' || node.type === 'If') {
				editingOutputName = node.data.outputName || 'out';
			}
			if (node.type === 'Input') {
				// Load current input schema types
				editingInputTypes = { ...(node.data.inputSchemaTypes || {}) };
			}
			if (node.type === 'Output') {
				// Load current output names
				editingInputNames = { ...(node.data.outputNames || {}) };
			}
		}
	});

	function handleSave() {
		if (!node) return;

		const updates: Record<string, any> = {};

		if (node.type === 'Expression' || node.type === 'If') {
			if (editingOutputName && editingOutputName !== 'out') {
				updates.outputName = editingOutputName;
				updates.outputNameMode = PinMode.Static;
			}
		}

		if (node.type === 'Input') {
			if (Object.keys(editingInputTypes).length > 0) {
				updates.inputSchemaTypes = editingInputTypes;
			}
		}

		if (node.type === 'Output') {
			if (Object.keys(editingInputNames).length > 0) {
				updates.outputNames = editingInputNames;
			}
		}

		onSave(node.id, updates);
		onClose();
	}

	function handleCancel() {
		onClose();
	}

	// Get available type options
	const typeOptions = ['string', 'number', 'boolean', 'int', 'double', 'bool', 'any', 'dyn'];

	// Helper to add a new input type for Input node
	function addInputType() {
		const newName = `field${Object.keys(editingInputTypes).length}`;
		editingInputTypes[newName] = 'string';
	}

	function removeInputType(name: string) {
		const { [name]: _, ...rest } = editingInputTypes;
		editingInputTypes = rest;
	}

	// Helper to add a new output name for Output node
	function addOutputName() {
		const newName = `out${Object.keys(editingInputNames).length}`;
		editingInputNames[newName] = newName;
	}

	function removeOutputName(key: string) {
		const { [key]: _, ...rest } = editingInputNames;
		editingInputNames = rest;
	}
</script>

{#if isOpen && node}
	<div class="modal-backdrop" onclick={handleCancel} role="presentation">
		<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog">
			<div class="modal-header">
				<h2>Edit {node.type} Node</h2>
				<button class="close-btn" onclick={handleCancel}>×</button>
			</div>

			<div class="modal-content">
				{#if node.type === 'Expression'}
					<div class="form-group">
						<label for="output-name">Output Pin Name:</label>
						<input
							id="output-name"
							type="text"
							bind:value={editingOutputName}
							placeholder="out"
						/>
						<p class="help-text">
							Set a custom name for the output pin (default: "out"). This makes the pin name static.
						</p>
					</div>
				{/if}

				{#if node.type === 'If'}
					<div class="form-group">
						<label for="output-name">Output Pin Name:</label>
						<input
							id="output-name"
							type="text"
							bind:value={editingOutputName}
							placeholder="out"
						/>
						<p class="help-text">
							Set a custom name for the output pin (default: "out"). This makes the pin name static.
						</p>
					</div>
				{/if}

				{#if node.type === 'Input'}
					<div class="form-group">
						<label>Input Schema Types:</label>
						<p class="help-text">
							Define the type for each field in the input data. This overrides inferred types.
						</p>
						{#each Object.entries(editingInputTypes) as [name, type]}
							<div class="input-row">
								<input
									type="text"
									value={name}
									onchange={(e) => {
										const newName = e.currentTarget.value;
										if (newName !== name) {
											const { [name]: value, ...rest } = editingInputTypes;
											editingInputTypes = { ...rest, [newName]: value };
										}
									}}
									placeholder="Field name"
								/>
								<select
									value={type}
									onchange={(e) => {
										editingInputTypes[name] = e.currentTarget.value;
									}}
								>
									{#each typeOptions as option}
										<option value={option}>{option}</option>
									{/each}
								</select>
								<button
									class="remove-btn"
									onclick={() => removeInputType(name)}
									title="Remove field"
								>
									×
								</button>
							</div>
						{/each}
						<button class="add-btn" onclick={addInputType}>+ Add Field</button>
					</div>
				{/if}

				{#if node.type === 'Output'}
					<div class="form-group">
						<label>Output Names:</label>
						<p class="help-text">
							Define custom names for the output fields. By default, names are inferred from connections.
						</p>
						{#each Object.entries(editingInputNames) as [key, name]}
							<div class="input-row">
								<input
									type="text"
									value={name}
									onchange={(e) => {
										editingInputNames[key] = e.currentTarget.value;
									}}
									placeholder="Output name"
								/>
								<button
									class="remove-btn"
									onclick={() => removeOutputName(key)}
									title="Remove output"
								>
									×
								</button>
							</div>
						{/each}
						<button class="add-btn" onclick={addOutputName}>+ Add Output</button>
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button class="btn btn-cancel" onclick={handleCancel}>Cancel</button>
				<button class="btn btn-save" onclick={handleSave}>Save</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: var(--vscode-sidebar-bg, #252526);
		border: 1px solid var(--vscode-border, #3c3c3c);
		border-radius: 4px;
		width: 90%;
		max-width: 500px;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid var(--vscode-border, #3c3c3c);
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.125rem;
		color: var(--vscode-text, #cccccc);
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--vscode-text, #cccccc);
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.7;
	}

	.close-btn:hover {
		opacity: 1;
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--vscode-text, #cccccc);
		font-weight: 600;
		font-size: 0.875rem;
	}

	.form-group input[type='text'],
	.form-group select {
		width: 100%;
		padding: 0.5rem;
		background: var(--vscode-editor-bg, #1e1e1e);
		border: 1px solid var(--vscode-border, #3c3c3c);
		color: var(--vscode-text, #cccccc);
		border-radius: 2px;
		font-family: inherit;
		font-size: 0.875rem;
	}

	.form-group input[type='text']:focus,
	.form-group select:focus {
		outline: none;
		border-color: var(--vscode-accent, #007acc);
	}

	.help-text {
		margin-top: 0.25rem;
		font-size: 0.75rem;
		color: var(--vscode-text-muted, #858585);
	}

	.input-row {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		align-items: center;
	}

	.input-row input[type='text'] {
		flex: 1;
	}

	.input-row select {
		width: auto;
		min-width: 120px;
	}

	.remove-btn {
		background: var(--vscode-error, #f48771);
		color: white;
		border: none;
		border-radius: 2px;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.remove-btn:hover {
		background: #d44a2c;
	}

	.add-btn {
		background: var(--vscode-accent, #007acc);
		color: white;
		border: none;
		border-radius: 2px;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		cursor: pointer;
		font-family: inherit;
	}

	.add-btn:hover {
		background: var(--vscode-accent-hover, #005a9e);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding: 1rem;
		border-top: 1px solid var(--vscode-border, #3c3c3c);
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 2px;
		font-size: 0.875rem;
		cursor: pointer;
		font-family: inherit;
	}

	.btn-cancel {
		background: transparent;
		color: var(--vscode-text, #cccccc);
		border: 1px solid var(--vscode-border, #3c3c3c);
	}

	.btn-cancel:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.btn-save {
		background: var(--vscode-accent, #007acc);
		color: white;
	}

	.btn-save:hover {
		background: var(--vscode-accent-hover, #005a9e);
	}
</style>
