import { Mark, defaultBasicMarksSettings, removeGapsForHarpoonMarks, findFirstUnusedRegister } from 'tether-marks-core';
import * as vscode from 'vscode';

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
	public gotoFileInMark = (markSymbol: string) => {
		const marks = this.getMarksWorkspace() ?? [];
		const mark = marks.find((m) => m.symbol === markSymbol);
		if (mark) {
			vscode.commands.executeCommand('vscode.open', vscode.Uri.file(mark.filePath));
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
		const filePath = vscode.window.activeTextEditor?.document.uri;
		if (!filePath || filePath.scheme !== 'file') {
			vscode.window.showInformationMessage('Tether marks currently only handles files.');
			return;
		}
		this.addOrOverwriteMark({ symbol: markSymbol, filePath: filePath.fsPath });
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
