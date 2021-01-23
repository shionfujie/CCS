
import * as vscode from "vscode";
import * as cmd from "./commands";
import { ContextsProvider } from "./provider";
import * as storage from './storage';


export async function activate(context: vscode.ExtensionContext) {
  const provider = new ContextsProvider(await storage.GetContexts());
  const treeView = vscode.window.createTreeView("ccs.contextExplorer", {
    treeDataProvider: provider,
    showCollapseAll: true,
  });
  const commands = cmd.Commands(provider, treeView)
  context.subscriptions.push(
    vscode.commands.registerCommand("ccs.createNewContext", commands.CreateNewContext),
    vscode.commands.registerCommand("ccs.renameContext", commands.RenameContext),
    vscode.commands.registerCommand("ccs.removeContext", commands.RemoveContext),
    vscode.commands.registerCommand("ccs.viewContextDocument", commands.ViewContextDocument),
    vscode.commands.registerCommand("ccs.sortByName", commands.SortByName),
    vscode.commands.registerCommand("ccs.sortByCategory", commands.SortByCategory),
    vscode.commands.registerCommand("ccs.addItemToContext", commands.AddItemToContext),
    vscode.commands.registerCommand("ccs.removeItemFromContext", commands.RemoveItemFromContext),
    vscode.commands.registerCommand("ccs.openItemInEditor", commands.OpenItemInEditor),
    vscode.commands.registerCommand("ccs.searchContext", commands.SearchContext),
    vscode.commands.registerCommand("ccs.refresh", () => provider.refresh()),
    provider.onDidChangeTreeData(() => storage.SaveContexts(provider.contexts())),
    vscode.workspace.onWillDeleteFiles((event) => {
      event.waitUntil(
        (async () => {
          for (const f of event.files) {
            await provider.removeResourceFromContexts(f);
          }
          provider.refresh();
        })()
      );
    })
  );
}

export function deactivate() {}
