// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getSortedAndFilteredMarks, Mark, BasicMarksSettings, defaultBasicMarksSettings, Mode, findFirstUnusedRegister, removeGapsForHarpoonMarks } from 'tether-marks-core';
import * as path from 'path';

class PluginOperator {
	public context: vscode.ExtensionContext;
	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}
	public getMarks = () => { return this.context.globalState.get("marks") as Mark[] | undefined };
	public setMarks = (marks: Mark[]) => { return this.context.globalState.update("marks", marks) };
	public getMarksWorkspace = () => { return this.context.workspaceState.get("marks") as Mark[] | undefined };
	public setMarksWorkspace = (marks: Mark[]) => { return this.context.workspaceState.update("marks", marks) };
	public getMarkSettings = (() => {
		const config = vscode.workspace.getConfiguration();
		const settings: any = { ...defaultBasicMarksSettings };
		for (const key of Object.keys(defaultBasicMarksSettings)) {
			// const value = config.get(key, defaultBasicMarksSettings[key]);
			// settings[key as keyof BasicMarksSettings] = value as typeof defaultBasicMarksSettings;
			settings[key] = config.get("tetherMarks." + key);
		}
		// console.log(settings);
		return settings;
	});

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
			// vscode.commands.executeCommand('vscode.openWith', vscode.Uri.file(mark.filePath), vscode.ViewColumn.Active);
		}
		else {
			vscode.window.showInformationMessage('Mark not found');
		}
	}

	public deleteMark = (markSymbol: string) => {
		const marks = this.getMarksWorkspace() ?? [];
		let filteredMarks = marks.filter((m) => m.symbol !== markSymbol);
		if (this.getMarkSettings().harpoonRegisterGapRemoval) {
			filteredMarks = removeGapsForHarpoonMarks(filteredMarks, this.getMarkSettings().harpoonRegisterList);
		}
		this.setMarksWorkspace(filteredMarks);
	}

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


interface quickPickMarkItem extends vscode.QuickPickItem {
	mark: Mark
}

class MarkQuickPickWarpper {
	public qp: vscode.QuickPick<quickPickMarkItem> | null = null;
	public mode: Mode | null = null;
	public isHarpoon: boolean = false;
	public operator: PluginOperator;

	constructor(operator: PluginOperator) {
		this.operator = operator;

	}
	public createAndShowMarkQuickPick(mode: Mode, isHarpoon: boolean = false) {
		this.mode = mode;
		this.isHarpoon = isHarpoon;

		const marks = getSortedAndFilteredMarks(this.operator.getMarksWorkspace() ?? [], isHarpoon, this.operator.getMarkSettings());

		const quickPickItems: quickPickMarkItem[] = marks.map((mark) => {
			const fileName = path.basename(mark.filePath);
			const fileExtension = path.extname(mark.filePath).substring(1);
			const directoryPath = path.dirname(mark.filePath);
			const iconPath = vscode.ThemeIcon.File


			// console.log(`File Name: ${fileName}`);
			// console.log(`Directory Path: ${directoryPath}`);
			return {
				label: mark.symbol + " | " + fileName, description: directoryPath, mark: mark
			}
		});

		this.qp = vscode.window.createQuickPick();
		this.qp.items = quickPickItems
		this.qp.canSelectMany = false;

		const modeHandling = (symbol: string) => {
			if (mode === 'set') {
				this.operator.setCurrentFileToMark(symbol);
			}
			else if (mode === 'goto') {
				this.operator.gotoFileInMark(symbol);
			}
			else if (mode === 'delete') {
				this.operator.deleteMark(symbol);
			}
		}

		this.qp.onDidChangeValue((value) => {
			modeHandling(value);
			this.qp?.dispose();
		});

		this.qp.onDidAccept(() => {
			const selectedMark = this.qp?.selectedItems[0].mark;
			if (selectedMark) {
				modeHandling(selectedMark.symbol);
			}
			this.qp?.dispose();
		});

		this.qp.onDidChangeSelection(selection => {
			// BAD: this will run when the selection changes,
			// e.g., just from arrow keys or Ctrl+release
		});

		this.qp.title = "Tether Marks";

		this.qp.onDidHide(() => {
			// console.log("QuickPick closed");
			vscode.commands.executeCommand('setContext', 'tether-marks-for-vscode.inMarkList', false);
			// not sure if this is a good idea
			this.qp?.dispose();
		})

		this.qp.onDidChangeActive(e => {
			// console.log(e);
		});

		vscode.commands.executeCommand('setContext', 'tether-marks-for-vscode.inMarkList', true);
		this.qp.show();
	};

	public refreshQP() {
		if (!this.qp) return;

		const marks = getSortedAndFilteredMarks(this.operator.getMarksWorkspace() ?? [], this.isHarpoon, this.operator.getMarkSettings());

		const quickPickItems: quickPickMarkItem[] = marks.map((mark) => {
			const fileName = path.basename(mark.filePath);
			const fileExtension = path.extname(mark.filePath).substring(1);
			const directoryPath = path.dirname(mark.filePath);
			const iconPath = vscode.ThemeIcon.File


			// console.log(`File Name: ${fileName}`);
			// console.log(`Directory Path: ${directoryPath}`);
			return {
				label: mark.symbol + " | " + fileName, description: directoryPath, mark: mark
			}
		});

		this.qp.items = quickPickItems
	};

	public deleteHighlightedMark() {
		if (!this.qp) {
			vscode.window.showErrorMessage("This shouldn't be called when mark list is not open");
			return;
		}
		if (this.qp.activeItems.length === 0) {
			return;
		}
		const symbol = this.qp.activeItems[0].mark.symbol;
		this.operator.deleteMark(symbol)
		vscode.window.showInformationMessage('Deleted mark: ' + symbol);
		this.refreshQP();
	}

}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "tether-marks-for-vscode" is now active!');

	const op = new PluginOperator(context);
	const qpw = new MarkQuickPickWarpper(op);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('tether-marks-for-vscode.set-mark', () => {
		qpw.createAndShowMarkQuickPick('set');
	});
	const disposable2 = vscode.commands.registerCommand('tether-marks-for-vscode.go-to-mark', () => {
		qpw.createAndShowMarkQuickPick('goto');
	});
	const disposable3 = vscode.commands.registerCommand('tether-marks-for-vscode.delete-mark', () => {
		qpw.createAndShowMarkQuickPick('delete');
	});
	const disposable4 = vscode.commands.registerCommand('tether-marks-for-vscode.add-file-to-harpoon', () => {
		op.addCurrentFileToHarpoon();
	});
	const disposable5 = vscode.commands.registerCommand('tether-marks-for-vscode.go-to-harpoon-mark', () => {
		qpw.createAndShowMarkQuickPick('goto', true);
	});
	const disposable6 = vscode.commands.registerCommand('tether-marks-for-vscode.triggerKey', (args) => {
		// console.log("triggerKey: ", args);
		if (args == 'delete-highlighted-mark') {
			qpw.deleteHighlightedMark();
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);
	context.subscriptions.push(disposable4);
	context.subscriptions.push(disposable5);
	context.subscriptions.push(disposable6);
}

// This method is called when your extension is deactivated
export function deactivate() { }
