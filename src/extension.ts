
import * as vscode from "vscode";
import {Commands} from "./commands";
import { ContextsProvider } from "./provider";
import { Storage} from './storage';
import {NewContextsAdapter} from './adapter'


export async function activate(context: vscode.ExtensionContext) {
  const storage = Storage(NewContextsAdapter())
  const provider = new ContextsProvider(await storage.GetContexts());
  const treeView = vscode.window.createTreeView("ccs.contextExplorer", {
    treeDataProvider: provider,
    showCollapseAll: true,
  });
  const commands = Commands(provider, treeView, storage)
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
    vscode.commands.registerCommand("ccs.showInExplorer", commands.ShowInExplorer),
    vscode.commands.registerCommand("ccs.searchContext", commands.SearchContext),
    vscode.commands.registerCommand("ccs.refresh", async () => provider.refresh(await storage.GetContexts())),
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
