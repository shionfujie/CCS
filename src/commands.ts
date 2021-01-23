import * as vscode from "vscode";
import * as models from "./models";
import * as provider from "./provider";
import * as storage from "./storage";
import * as ui from "./ui";

export function Commands(
  provider: provider.ContextsProvider,
  treeView: vscode.TreeView<vscode.TreeItem>
) {
  async function CreateNewContext() {
    const context = await createOrGetContext(provider);
    if (!context) {
      return;
    }
    provider.refresh();
    await treeView.reveal(context, {
      select: true,
      focus: true,
      expand: true,
    });
  }
  async function RenameContext(context: models.Context) {
    const name = await ui.showContextNameInputBox(provider, context.name());
    if (!name) {
      return;
    }
    context.rename(name);
    provider.refresh();
    await treeView.reveal(context, {
      select: true,
      focus: true,
      expand: true,
    });
  }
  async function RemoveContext(context: models.Context) {
    provider.removeContext(context);
    provider.refresh();
    if (context.contextDocument()) {
      await storage.DeleteContextDir(context.name())
    }
  }
  async function ViewContextDocument(context: models.Context) {
    var cd = context.contextDocument();
    if (!cd) {
      const filepath = await storage.CreateContextDocument(context.name());
      cd = context.addContextDocument(filepath);
      provider.refresh();
    }

    await vscode.commands.executeCommand("markdown.showPreview", cd.resource);
    await treeView.reveal(cd, {
      select: true,
      focus: true,
    });
  }
  function SortByName(context: models.Context) {
    if (context.sortBy != models.SortBy.Name) {
      context.sortBy = models.SortBy.Name;
      provider.refresh();
    }
  }
  function SortByCategory(context: models.Context) {
    if (context.sortBy != models.SortBy.Category) {
      context.sortBy = models.SortBy.Category;
      provider.refresh();
    }
  }
  async function AddItemToContext(arg: any) {
    var uri: vscode.Uri | undefined;
    if (arg === undefined) {
      uri = vscode.window.activeTextEditor?.document.uri;
    } else if (arg instanceof vscode.Uri) {
      uri = arg;
    }
    if (uri === undefined) {
      return;
    }
    const result = await getOrCreateContext(provider, uri);
    if (!result) {
      return;
    }
    var [item, added] = result;
    if (added) {
      provider.refresh();
    }
    await treeView.reveal(item, {
      select: true,
      focus: true,
    });
  }
  function RemoveItemFromContext(item: models.ContextItem) {
    item.context.removeContextItem(item);
    provider.refresh();
  }
  function OpenItemInEditor(item: models.ContextItem) {
    if (item.type == vscode.FileType.Directory) {
      vscode.commands.executeCommand("revealInExplorer", item.resource);
      return;
    }
    vscode.commands.executeCommand("vscode.open", item.resource);
  }
  async function SearchContext() {
    const contexts = provider.contexts();
    const items = contexts.map((c) => c.name());
    const result = await vscode.window.showQuickPick(items, {
      placeHolder: "Search contexts",
    });
    if (!result) {
      return;
    }
    const chosenContext = provider.findContext(result) as models.Context;
    await treeView.reveal(chosenContext, {
      select: true,
      focus: true,
      expand: true,
    });
  }
  return {
    CreateNewContext,
    RenameContext,
    RemoveContext,
    ViewContextDocument,
    SortByName,
    SortByCategory,
    AddItemToContext,
    RemoveItemFromContext,
    OpenItemInEditor,
    SearchContext,
  };
}

// First prompting the context's name being created
// Returns a new context or existing one if there is such coinciding in its name
async function createOrGetContext(
  provider: provider.ContextsProvider,
  value?: string
) {
  const result = await ui.showContextNameInputBox(provider, value);
  if (!result) {
    return;
  }
  return provider.getOrCreateContext(result);
}

// Showing a quick pick to choose a existing context or to create new one
// Returns the item paired with the status which is true the item was newly
// added to a context or false if the context was already containing it
// During the process the user may choose to cancel. In those cases, it
// returns undefined
async function getOrCreateContext(
  provider: provider.ContextsProvider,
  uri: vscode.Uri
) {
  const result = await ui.showContextQuickPick(provider);
  if (!result) {
    return;
  }
  const [value, selectedItem] = result;
  var context: models.Context | undefined;
  if (selectedItem instanceof ui.ContextPickItem) {
    context = selectedItem.context;
  } else if (selectedItem instanceof ui.NewContextPickItem) {
    // Chosen to create a new context
    if (!provider.validateNewContextName(value)) {
      context = provider.getOrCreateContext(value);
    } else {
      context = await createOrGetContext(provider, value);
    }
  }
  if (!context) {
    return;
  }
  return await provider.getOrAddContextItem(context, uri)
}
