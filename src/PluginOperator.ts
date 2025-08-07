import { Mark, defaultBasicMarksSettings, removeGapsForHarpoonMarks, findFirstUnusedRegister } from 'tether-marks-core';
import * as vscode from 'vscode';
import { isInWorkspace } from './vscodeUtils';
import * as path from 'node:path';

export class PluginOperator {
	public context: vscode.ExtensionContext;
	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}
	public getMarks = () => { return this.context.globalState.get("marks") as Mark[] | undefined; };
	public setMarks = (marks: Mark[]) => { return this.context.globalState.update("marks", marks); };
	public getMarksWorkspace = () => { return this.context.workspaceState.get("marks") as Mark[] | undefined; };
	public setMarksWorkspace = (marks: Mark[]) => { return this.context.workspaceState.update("marks", marks); };
	public getMarkSettings = () => {
		const config = vscode.workspace.getConfiguration();
		const settings: any = { ...defaultBasicMarksSettings };
		for (const key of Object.keys(defaultBasicMarksSettings)) {
			// const value = config.get(key, defaultBasicMarksSettings[key]);
			// settings[key as keyof BasicMarksSettings] = value as typeof defaultBasicMarksSettings;
			settings[key] = config.get("tetherMarks." + key);
		}
		// console.log(settings);
		return settings;
	};

	public addOrOverwriteMark = (mark: Mark) => {
		const marks = this.getMarksWorkspace() ?? [];
		const index = marks.findIndex((m) => m.symbol === mark.symbol);
		if (index === -1) {
			marks.push(mark);
		} else {
			marks[index] = mark;
		}
		this.setMarksWorkspace(marks);
	};
	public gotoFileInMark = async (markSymbol: string) => {
		const marks = this.getMarksWorkspace() ?? [];
		const mark = marks.find((m) => m.symbol === markSymbol);
		if (mark) {
			if (path.isAbsolute(mark.filePath)) {
				vscode.commands.executeCommand('vscode.open', vscode.Uri.file(mark.filePath));
				return;
			}

			// TODO: hacky, will break on multiple workspaces that have the files with the same relative paths,
			// consider saving workspace path and relative file path in marks 
			for (const workspace of vscode.workspace.workspaceFolders ?? []) {
				if (workspace) {
					const absPath = path.join(workspace.uri.fsPath, mark.filePath);
					vscode.commands.executeCommand('vscode.open', vscode.Uri.file(absPath));
					break;
				}
			}

		}
		else {
			vscode.window.showInformationMessage('Mark not found');
		}
	};

	public deleteMark = (markSymbol: string) => {
		const marks = this.getMarksWorkspace() ?? [];
		let filteredMarks = marks.filter((m) => m.symbol !== markSymbol);
		if (this.getMarkSettings().harpoonRegisterGapRemoval) {
			filteredMarks = removeGapsForHarpoonMarks(filteredMarks, this.getMarkSettings().harpoonRegisterList);
		}
		this.setMarksWorkspace(filteredMarks);
	};

	public async setCurrentFileToMark(markSymbol: string) {
		const fileUri = vscode.window.activeTextEditor?.document.uri;

		if (!fileUri || fileUri.scheme !== 'file') {
			vscode.window.showInformationMessage('Tether marks currently only handles files.');
			return;
		}

		const filePath = isInWorkspace(fileUri) ? vscode.workspace.asRelativePath(fileUri, false) : fileUri.fsPath;
		this.addOrOverwriteMark({ symbol: markSymbol, filePath: filePath });
	}

	public addCurrentFileToHarpoon = () => {
		const symbol = findFirstUnusedRegister(this.getMarksWorkspace() ?? [], this.getMarkSettings().harpoonRegisterList);
		if (!symbol) {
			vscode.window.showInformationMessage('No more harpoon registers available');
			return;
		}
		vscode.window.showInformationMessage('Added file to harpoon mark: ' + symbol);
		this.setCurrentFileToMark(symbol);
	};
}
