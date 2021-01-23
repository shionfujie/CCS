import * as path from "path";
import * as vscode from "vscode";

export class Context extends vscode.TreeItem {
  constructor(private _name: string) {
    super(_name, vscode.TreeItemCollapsibleState.Expanded);
    this.id = _name;
    this.contextValue = "ccs.context";
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
      const extDiff =
        this.sortBy == SortBy.Category
          ? item.ext().localeCompare(item1.ext())
          : 0;
      if (extDiff != 0) {
        return extDiff;
      }
      return item.name.localeCompare(item1.name);
    });
  }

  private _contextDocument: ContextDocument | undefined = undefined;
  contextDocument(): ContextDocument | undefined {
    return this._contextDocument;
  }

  sortBy: SortBy = SortBy.Name;

  rename(name: string) {
    this._name = name;
    this.label = name;
  }

  addContextDocument(resource: vscode.Uri): ContextDocument {
    if (this._contextDocument) {
        throw new Error(`'${this._name}' already has its context document`)
    }
    this._contextDocument = new ContextDocument(this, resource);
    return this._contextDocument;
  }

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

  removeContextItem(item: ContextItem) {
    this.removeContextItemUri(item.resource);
  }

  removeContextItemUri(resource: vscode.Uri) {
    const repr = resource.toString();
    if (this._contextDocument?.resource?.toString() == resource.toString()) {
      this._contextDocument = undefined;
    }
    this._items = this._items.filter(
      (item) => item.resource.toString() != repr
    );
  }
}

export enum SortBy {
  Name = 0,
  Category,
}

export class ContextItem extends vscode.TreeItem {
  constructor(
    readonly context: Context,
    readonly resource: vscode.Uri,
    readonly type: vscode.FileType
  ) {
    super(path.basename(resource.path));
    if (type == vscode.FileType.Directory) {
      this.label = this.label + "/";
    }
    this.name = this.label as string;
    this._ext = path.extname(this.resource.path);
    this.contextValue = "ccs.contextItem";
    this.command = {
      title: "open",
      command: "ccs.openItemInEditor",
      arguments: [this],
    };
  }

  readonly name: string;

  private _ext: string;
  ext() {
    return this._ext;
  }
}

async function NewContextItem(context: Context, resource: vscode.Uri) {
  const stat = await vscode.workspace.fs.stat(resource);
  return new ContextItem(context, resource, stat.type);
}

class ContextDocument extends ContextItem {
  constructor(readonly context: Context, resource: vscode.Uri) {
    super(context, resource, vscode.FileType.File);
    this.label = "Context Document";
    this.command = {
      title: "preview",
      command: "markdown.showPreview",
      arguments: [resource],
    };
  }
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

  removeContext(context: Context) {
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

  refresh(elem?: vscode.TreeItem): void {
    this._onDidChangeTreeData.fire(elem);
  }

  findContext(name: String): Context | undefined {
    return this._contexts.find((c) => c.name() == name);
  }
}
