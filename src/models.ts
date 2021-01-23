import * as path from "path";
import * as vscode from "vscode";

class Context extends vscode.TreeItem {
  constructor(private _name: string) {
    super(_name, vscode.TreeItemCollapsibleState.Expanded);
    this.id = _name;
  }
  name() {
    return this._name;
  }
}

class ContextItem extends vscode.TreeItem {
  constructor(
    readonly context: Context,
    _resource: vscode.Uri,
    readonly type: vscode.FileType
  ) {
    super(path.basename(_resource.path));
    if (type == vscode.FileType.Directory) {
      this.label = this.label + "/";
    }
  }

  readonly name: string = this.label as string;
}

export class ContextsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    constructor(private _contexts: Context[]) {}
  
    private _onDidChangeTreeData = new vscode.EventEmitter<
      vscode.TreeItem | undefined | null | void
    >();
  
    getTreeItem(
      element: vscode.TreeItem
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
      return element;
    }
  
    getChildren(
      element?: vscode.TreeItem
    ): vscode.ProviderResult<vscode.TreeItem[]> {
      if (!element) {
        return Promise.resolve(
          this._contexts.sort((c, c1) => c.name().localeCompare(c1.name()))
        );
      }
      return Promise.resolve([]);
    }
  
    getParent(element: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem> {
      if (element instanceof ContextItem) {
        return element.context;
      }
      return null;
    }
  
    getOrCreateContext(contextname: string) {
      var context = this.findContext(contextname);
      if (context) {
        return context;
      }
      context = new Context(contextname);
      this._contexts.push(context);
      return context;
    }
  
    validateNewContextName(name: String): string | undefined {
      if (name.length == 0) {
        return "Context name expected to be non-empty";
      }
      if (this.findContext(name)) {
        return `Context '${name}' already exists`;
      }
      return undefined;
    }
  
    refresh(): void {
      this._onDidChangeTreeData.fire();
    }
  
    private findContext(name: String): Context | undefined {
      return this._contexts.find((c) => c.name() == name);
    }
  }
