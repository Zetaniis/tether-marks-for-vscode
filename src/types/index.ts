import { Mark } from 'tether-marks-core';
import * as vscode from 'vscode';


export interface quickPickMarkItem extends vscode.QuickPickItem {
	mark: Mark;
}
