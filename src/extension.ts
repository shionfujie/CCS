
import * as vscode from "vscode";
import * as models from "./models"
import * as cmd from "./commands"


export function activate(context: vscode.ExtensionContext) {
  const provider = new models.ContextsProvider([]);
  const treeView = vscode.window.createTreeView("ccs.contextExplorer", {
    treeDataProvider: provider,
    showCollapseAll: true,
  });
  const commands = cmd.Commands(provider, treeView)
  provider.onDidChangeTreeData(() => {

  });
  context.subscriptions.push(
    vscode.commands.registerCommand("ccs.createNewContext", commands.CreateNewContext),
    vscode.commands.registerCommand("ccs.removeContext", commands.RemoveContext),
    vscode.commands.registerCommand("ccs.addItemToContext", commands.AddItemToContext),
    vscode.commands.registerCommand("css.removeItemFromContext", commands.RemoveItemFromContext)
  );
}

export function deactivate() {}
