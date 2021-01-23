
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
  context.subscriptions.push(
    vscode.commands.registerCommand("ccs.createNewContext", commands.createNewContext)
  );
}

export function deactivate() {}
