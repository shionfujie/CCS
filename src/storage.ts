import * as path from "path";
import * as vscode from "vscode";
import * as models from "./models";

export async function CreateContextDocument(contextname: string) {
  const filepath = getContextDocumentUri(contextname);
  const wEdit = new vscode.WorkspaceEdit();
  const pos = new vscode.Position(0, 0);
  wEdit.createFile(filepath);
  wEdit.insert(filepath, pos, `# Context: ${contextname}\n## Description`);
  await vscode.workspace.applyEdit(wEdit);
  return filepath;
}

export function DeleteContextDir(contextname: string): Thenable<void> {
  return vscode.workspace.fs.delete(getContextDir(contextname), {
    recursive: true,
  });
}

export async function GetContexts() {
  const filepath = getContextsJsonUri();
  if (!(await isExist(filepath))) {
    return [];
  }

  const document = await vscode.workspace.openTextDocument(filepath);
  const contexts: models.Context[] = [];
  var contextsJson;
  try {
    contextsJson = JSON.parse(document.getText()).contexts;
  } catch {
    return [];
  }
  for (const contextJson of contextsJson) {
    const context = new models.Context(contextJson.name);
    contexts.push(context);
    context.sortBy = contextJson.sortBy;
    if (contextJson.contextDescription) {
      context.addContextDocument(
        vscode.Uri.parse(contextJson.contextDescription.resource)
      );
    }
    for (const itemJson of contextJson.items) {
      context.addContextItem(
        new models.ContextItem(
          context,
          vscode.Uri.parse(itemJson.resource),
          itemJson.type
        )
      );
    }
  }
  return contexts;
}

export async function SaveContexts(contexts: models.Context[]) {
  const filepath = getContextsJsonUri();

  var wEdit = new vscode.WorkspaceEdit();
  wEdit.createFile(filepath, { overwrite: true });
  await vscode.workspace.applyEdit(wEdit);

  wEdit = new vscode.WorkspaceEdit();
  const pos = new vscode.Position(0, 0);
  const json = {
    contexts: contexts.map((c) => c.toJson()),
  };
  wEdit.insert(filepath, pos, JSON.stringify(json));
  await vscode.workspace.applyEdit(wEdit);
}

function isExist(resource: vscode.Uri) {
  return vscode.workspace.fs.stat(resource).then(
    () => true,
    () => false
  );
}

function getContextDocumentUri(contextname: string): vscode.Uri {
  const dir = getContextDir(contextname);
  return dir.with({ path: path.join(dir.path, "Context Document.md") });
}

function getContextDir(contextname: string): vscode.Uri {
  const dir = getExtensionDir();
  return dir.with({ path: path.join(dir.path, contextname) });
}

function getContextsJsonUri(): vscode.Uri {
  const dir = getExtensionDir();
  return dir.with({ path: path.join(dir.path, `contexts.json`) });
}

function getExtensionDir(): vscode.Uri {
  const wd = vscode.workspace.workspaceFolders![0].uri;
  return wd.with({ path: path.join(wd.path, ".ccs") });
}
