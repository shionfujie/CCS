import * as vscode from "vscode";
import * as models from "./models";
import * as provider from "./provider";

export function showContextNameInputBox(
  provider: provider.ContextsProvider,
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

export async function showContextQuickPick(
  provider: provider.ContextsProvider
): Promise<[string, vscode.QuickPickItem] | undefined> {
  const disposables: vscode.Disposable[] = [];
  try {
    return await createContextQuickPick(disposables, provider.contexts());
  } catch {
    return; // Probably cancelled
  } finally {
    disposables.forEach((d) => d.dispose());
  }
}

function createContextQuickPick(
  disposables: vscode.Disposable[],
  contexts: models.Context[]
): Promise<[string, vscode.QuickPickItem]> {
  const quickPick = vscode.window.createQuickPick();
  quickPick.items = [
    new NewContextPickItem(),
    ...contexts.map((c) => new ContextPickItem(c)),
  ];
  quickPick.placeholder = "To which context shall the item be added?";
  return new Promise((resolve, reject) => {
    disposables.push(
      quickPick.onDidAccept(() => {
        quickPick.hide();
        resolve([quickPick.value, quickPick.selectedItems[0]]);
      }),
      quickPick.onDidHide(() => {
        quickPick.hide();
        reject();
      })
    );
    quickPick.show();
  });
}

export class NewContextPickItem implements vscode.QuickPickItem {
  label: string = "$(add)\tCreate New Context";
  alwaysShow = true;
}

export class ContextPickItem implements vscode.QuickPickItem {
  label: string;
  constructor(readonly context: models.Context) {
    this.label = `$(extensions)\t${context.name()}`;
  }
}
