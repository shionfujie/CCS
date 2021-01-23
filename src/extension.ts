import * as vscode from 'vscode';

class ContextsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element
	}
	getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
		return Promise.resolve([])
	}
}

export function activate(context: vscode.ExtensionContext) {
	const provider = new ContextsProvider();
	const treeView = vscode.window.createTreeView("ccs.contextExplorer", {
	  treeDataProvider: provider,
	  showCollapseAll: true,
	});
}

// this method is called when your extension is deactivated
export function deactivate() {}
