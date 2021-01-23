import * as vscode from "vscode";
import * as models from "./models";

export interface Adapter<T> {
  Marshal(t: T): any;
  Unmarshal(a: any): T;
}

export function NewContextsAdapter(): Adapter<models.Context[]> {
  return new ContextsAdapter(new ContextAdapter(new ContextItemAdapter()));
}

class ContextsAdapter implements Adapter<models.Context[]> {
  constructor(private contextAdapter: Adapter<models.Context>) {}
  Marshal(contexts: models.Context[]) {
    return contexts.map((c) => this.contextAdapter.Marshal(c));
  }
  Unmarshal(contextsJson: any): models.Context[] {
    const contexts: models.Context[] = [];
    for (const json of contextsJson) {
      contexts.push(this.contextAdapter.Unmarshal(json));
    }
    return contexts;
  }
}

class ContextAdapter implements Adapter<models.Context> {
  constructor(private itemAdapter: Adapter<models.ContextItem>) {}

  Marshal(context: models.Context) {
    const contextDocument = context.contextDocument();
    return {
      name: context.name(),
      sortBy: context.sortBy,
      contextDocument: contextDocument
        ? this.itemAdapter.Marshal(contextDocument)
        : undefined,
      items: context.items().map((item) => this.itemAdapter.Marshal(item)),
    };
  }
  Unmarshal(json: any): models.Context {
    const context = new models.Context(json.name);
    context.sortBy = json.sortBy;
    if (json.contextDocument) {
      context.addContextDocument(
        vscode.Uri.parse(json.contextDocument.resource)
      );
    }
    for (const itemJson of json.items) {
      context.addContextItem(
        new models.ContextItem(
          context,
          vscode.Uri.parse(itemJson.resource),
          itemJson.type
        )
      );
    }
    return context;
  }
}

class ContextItemAdapter implements Adapter<models.ContextItem> {
  Marshal(item: models.ContextItem) {
    return {
      resource: item.resource.toString(),
      type: item.type,
    };
  }
  Unmarshal(a: any): models.ContextItem {
    throw new Error("context item can only be unmarshaled through context");
  }
}
