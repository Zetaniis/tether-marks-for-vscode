import * as vscode from 'vscode';

export function isInWorkspace(uri: vscode.Uri): boolean {
    return vscode.workspace.getWorkspaceFolder(uri) !== undefined;
}

export async function isFile(uri: vscode.Uri){
    try {
        await vscode.workspace.fs.stat(uri);
        return true;
    } catch (err) {
        return false;
    }
}