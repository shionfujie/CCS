import * as path from "path";
import * as vscode from "vscode";

abstract class SerializableTreeItem extends vscode.TreeItem {
  abstract toJson(): any;
}

export class Context extends SerializableTreeItem {
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
      throw new Error(`'${this._name}' already has its context document`);
    }
    this._contextDocument = new ContextDocument(this, resource);
    return this._contextDocument;
  }

  addContextItem(item: ContextItem) {
    this._items.push(item);
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

  getContextItem(resource: vscode.Uri): ContextItem | undefined {
    const repr = resource.toString();
    return this._items.find((item) => item.resource.toString() == repr);
  }

  toJson() {
    return {
      name: this.name(),
      sortBy: this.sortBy,
      contextDescription: this._contextDocument?.toJson(),
      items: this._items.map((i) => i.toJson()),
    };
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
    this.contextValue = "ccs.contextItem";
    this.command = {
      title: "open",
      command: "ccs.openItemInEditor",
      arguments: [this],
    };
    this.resourceUri = resource;
    this.name = this.label as string;
    this._ext = path.extname(this.resource.path);
  }

  readonly name: string;

  private _ext: string;
  ext() {
    return this._ext;
  }

  toJson(): any {
    return {
      resource: this.resource.toString(),
      type: this.type,
    };
  }
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
    this.resourceUri = undefined;
  }
}
