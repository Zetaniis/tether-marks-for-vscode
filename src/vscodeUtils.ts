import * as vscode from 'vscode';

export function isInWorkspace(uri: vscode.Uri): boolean {
    return vscode.workspace.getWorkspaceFolder(uri) !== undefined;
}