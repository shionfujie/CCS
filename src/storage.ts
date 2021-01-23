import * as path from "path";
import * as vscode from "vscode";
import * as models from "./models";
import * as adapter from "./adapter";

export interface Storage {
    CreateContextDocument(contextname: string): Thenable<vscode.Uri>
    DeleteContextDir(contextname: string): Thenable<void>
    GetContexts(): Thenable<models.Context[]>
    SaveContexts(contexts: models.Context[]): Thenable<void>
}

export function Storage(adapter: adapter.Adapter<models.Context[]>): Storage {
  async function CreateContextDocument(contextname: string) {
    const filepath = getContextDocumentUri(contextname);
    const wEdit = new vscode.WorkspaceEdit();
    const pos = new vscode.Position(0, 0);
    wEdit.createFile(filepath);
    wEdit.insert(filepath, pos, `# Context: ${contextname}\n## Description`);
    await vscode.workspace.applyEdit(wEdit);
    return filepath;
  }
  function DeleteContextDir(contextname: string): Thenable<void> {
    return vscode.workspace.fs.delete(getContextDir(contextname), {
      recursive: true,
    });
  }
  async function GetContexts() {
    const filepath = getContextsJsonUri();
    if (!(await isExist(filepath))) {
      return [];
    }
    const document = await vscode.workspace.openTextDocument(filepath);
    try {
      const contexts = JSON.parse(document.getText()).contexts;
      return adapter.Unmarshal(contexts)
    } catch {
      return [];
    }
  }
  async function SaveContexts(contexts: models.Context[]) {
    const filepath = getContextsJsonUri();

    var wEdit = new vscode.WorkspaceEdit();
    wEdit.createFile(filepath, { overwrite: true });
    await vscode.workspace.applyEdit(wEdit);

    wEdit = new vscode.WorkspaceEdit();
    const pos = new vscode.Position(0, 0);
    const data = JSON.stringify({ contexts: adapter.Marshal(contexts) });
    wEdit.insert(filepath, pos, data);
    await vscode.workspace.applyEdit(wEdit);
  }
  return {
      CreateContextDocument,
      DeleteContextDir,
      GetContexts,
      SaveContexts
  }
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
