import { Mark } from 'tether-marks-core';
import * as vscode from 'vscode';


export interface QuickPickMarkItem extends vscode.QuickPickItem {
	mark: Mark;
}

export interface VscodeMark extends Mark {
	workspacePath: string; // when this is "", it should follow that the filePath is absolute 
}