import * as vscode from "vscode";
import * as models from "./models";

export function Commands(
  provider: models.ContextsProvider,
  treeView: vscode.TreeView<vscode.TreeItem>
) {
  async function createNewContext() {
    const context = await getOrCreateContext(provider);
    if (context) {
      provider.refresh();
      await treeView.reveal(context, {
        select: true,
        focus: true,
        expand: true,
      });
    }
  }
  return {
      createNewContext
  }
}

async function getOrCreateContext(
  provider: models.ContextsProvider,
  value?: string
) {
  const result = await showContextNameInputBox(provider, value);
  if (!result) {
    return;
  }
  return provider.getOrCreateContext(result);
}

function showContextNameInputBox(
  provider: models.ContextsProvider,
  value?: string
) {
  return vscode.window.showInputBox({
    placeHolder: "New context name",
    prompt: "Please enter a name for your new context",
    value,
    validateInput: (newContext: string) =>
      provider.validateNewContextName(newContext),
  });
}
