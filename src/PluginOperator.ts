import { defaultBasicMarksSettings, removeGapsForHarpoonMarks, findFirstUnusedRegister } from 'tether-marks-core';
import * as vscode from 'vscode';
import { isFile as isFileOnDisk, isInWorkspace } from './vscodeUtils';
import * as path from 'node:path';
import { VscodeMark } from './types';

export class PluginOperator {
	public context: vscode.ExtensionContext;
	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}
	public getMarks = () => { return this.context.globalState.get("marks") as VscodeMark[] | undefined; };
	public setMarks = (marks: VscodeMark[]) => { return this.context.globalState.update("marks", marks); };
	public getMarksWorkspace = () => { return this.context.workspaceState.get("marks") as VscodeMark[] | undefined; };
	public setMarksWorkspace = (marks: VscodeMark[]) => { return this.context.workspaceState.update("marks", marks); };
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

	public addOrOverwriteMark = (mark: VscodeMark) => {
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
			if (path.isAbsolute(mark.filePath) && mark.workspacePath === "") {
				vscode.commands.executeCommand('vscode.open', vscode.Uri.file(mark.filePath));
				return;
			}

			if (mark.workspacePath === "") {
				vscode.window.showErrorMessage("This should not have happened: filePath is not abosolute and workspacePath is empty");
				return
			}

			// const workspaceName = path.basename(mark.workspacePath);
			// const workspace = vscode.workspace.workspaceFolders?.find((w) => w.name === workspaceName);		

			// if (!workspace){
			// 	vscode.window.showErrorMessage("Workspace not found for the mark" + markSymbol + ": " + mark.filePath + " in " + mark.workspacePath);
			// 	return
			// }


			const absPath = path.join(mark.workspacePath, mark.filePath);
			vscode.commands.executeCommand('vscode.open', vscode.Uri.file(absPath));

			// // TODO: hacky, will break on workspace with multiple folders that have the files with the same relative paths,
			// // consider saving folder path and relative file path in marks
			// for (const workspace of vscode.workspace.workspaceFolders ?? []) {
			// 	const absPath = path.join(workspace.uri.fsPath, mark.filePath);
			// 	vscode.commands.executeCommand('vscode.open', vscode.Uri.file(absPath));
			// 	break;
			// }
			return
		}

		vscode.window.showInformationMessage('Mark not found');
	};

	public deleteMark = (markSymbol: string) => {
		const marks = this.getMarksWorkspace() ?? [];
		let filteredMarks = marks.filter((m) => m.symbol !== markSymbol);
		if (this.getMarkSettings().harpoonRegisterGapRemoval) {
			filteredMarks = removeGapsForHarpoonMarks(filteredMarks, this.getMarkSettings().harpoonRegisterList);
		}
		this.setMarksWorkspace(filteredMarks);
	};

	public async setCurrentFileToMark(markSymbol: string): Promise<boolean> {
		const fileUri = vscode.window.activeTextEditor?.document.uri;

		if (!fileUri || !(await isFileOnDisk(fileUri))) {
			vscode.window.showInformationMessage('Tether marks currently only handles files.');
			return false;
		}

		const workspacePath = vscode.workspace.getWorkspaceFolder(fileUri)?.uri?.path ?? "";
		const filePath = workspacePath !== "" ? vscode.workspace.asRelativePath(fileUri, false) : fileUri.path;
		this.addOrOverwriteMark({ symbol: markSymbol, filePath: filePath, workspacePath: workspacePath });
		return true;
	}

	public addCurrentFileToHarpoon = async () => {
		const symbol = findFirstUnusedRegister(this.getMarksWorkspace() ?? [], this.getMarkSettings().harpoonRegisterList);
		if (!symbol) {
			vscode.window.showInformationMessage('No more harpoon registers available');
			return;
		}
		const success = await this.setCurrentFileToMark(symbol);
		if (success) {
			vscode.window.showInformationMessage('Added file to harpoon mark: ' + symbol);

		}
	}
}
