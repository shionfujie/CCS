import * as path from "path";
import * as vscode from "vscode";

export class Context extends vscode.TreeItem {
  constructor(private _name: string) {
    super(_name, vscode.TreeItemCollapsibleState.Expanded);
    this.id = _name;
  }
  name() {
    return this._name;
  }

  private _items: ContextItem[] = [];
  items(): ContextItem[] {
    return [...this._items].sort((item, item1) => {
      const typeDiff =
        this.sortBy == SortBy.Category ? item1.type - item.type : 0;
      if (typeDiff != 0) {
        return typeDiff;
      }
      return item.name.localeCompare(item1.name);
    });
  }

  sortBy: SortBy = SortBy.Category;

  async getOrAddContextItem(
    resource: vscode.Uri
  ): Promise<[ContextItem, boolean]> {
    const items = this._items;
    const repr = resource.toString();
    var item = items.find((item) => item.resource.toString() == repr);
    if (item) {
      return [item, false];
    }
    item = await NewContextItem(this, resource);
    this._items.push(item);
    return [item, true];
  }
}

enum SortBy {
  Name = 0,
  Category,
}

class ContextItem extends vscode.TreeItem {
  constructor(
    readonly context: Context,
    readonly resource: vscode.Uri,
    readonly type: vscode.FileType
  ) {
    super(path.basename(resource.path));
    if (type == vscode.FileType.Directory) {
      this.label = this.label + "/";
    }
  }

  readonly name: string = this.label as string;
}

async function NewContextItem(context: Context, resource: vscode.Uri) {
  const stat = await vscode.workspace.fs.stat(resource);
  return new ContextItem(context, resource, stat.type);
}

export class ContextsProvider
  implements vscode.TreeDataProvider<vscode.TreeItem> {
  constructor(private _contexts: Context[]) {}

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
    
    if (element instanceof Context) {
      return Promise.resolve(element.items());
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

  refresh(elem?: vscode.TreeItem): void {
    this._onDidChangeTreeData.fire(elem);
  }

  private findContext(name: String): Context | undefined {
    return this._contexts.find((c) => c.name() == name);
  }
}
