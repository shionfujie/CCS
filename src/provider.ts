import * as path from "path";
import * as vscode from "vscode";
import * as models from "./models";

export class ContextsProvider
  implements vscode.TreeDataProvider<vscode.TreeItem> {
  constructor(private _contexts: models.Context[]) {}

  contexts() {
    return this._contexts;
  }

  private _onDidChangeTreeData = new vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

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

    if (element instanceof models.Context) {
      var items = element.items();
      const contextDocument = element.contextDocument();
      if (contextDocument) {
        items = [contextDocument, ...items];
      }
      return Promise.resolve(items);
    }

    return Promise.resolve([]);
  }

  getParent(element: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem> {
    if (element instanceof models.ContextItem) {
      return element.context;
    }
    return null;
  }

  getOrCreateContext(contextname: string) {
    var context = this.findContext(contextname);
    if (context) {
      return context;
    }
    context = new models.Context(contextname);
    this._contexts.push(context);
    return context;
  }

  removeContext(context: models.Context) {
    this._contexts = this._contexts.filter((c) => c.name() != context.name());
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

  async getOrAddContextItem(
    context: models.Context,
    resource: vscode.Uri
  ): Promise<[models.ContextItem, boolean]> {
    var item = context.getContextItem(resource)
    if (item) {
      return [item, false];
    }
    item = await newContextItem(context, resource);
    context.addContextItem(item);
    return [item, true];
  }

  async removeResourceFromContexts(resource: vscode.Uri) {
    const fs = vscode.workspace.fs;
    const stat = await fs.stat(resource);
    if (stat.type != vscode.FileType.Directory) {
      this._contexts.forEach((c) => c.removeContextItemUri(resource));
      return;
    }
    // Remove recursively
    for (const [filename] of await fs.readDirectory(resource)) {
      const filepath = resource.with({
        path: path.join(resource.path, filename),
      });
      await this.removeResourceFromContexts(filepath);
    }
  }

  refresh(elem?: vscode.TreeItem): void {
    this._onDidChangeTreeData.fire(elem);
  }

  findContext(name: String): models.Context | undefined {
    return this._contexts.find((c) => c.name() == name);
  }
}

async function newContextItem(context: models.Context, resource: vscode.Uri) {
  const stat = await vscode.workspace.fs.stat(resource);
  return new models.ContextItem(context, resource, stat.type);
}
