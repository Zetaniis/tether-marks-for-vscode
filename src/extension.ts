// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getSortedAndFilteredMarks, Mark, BasicMarksSettings, defaultBasicMarksSettings, Mode } from 'tether-marks-core';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "tether-marks-for-vscode" is now active!');

	const getMarks = () => { return context.globalState.get("marks") as Mark[] | undefined };
	const setMarks = (marks: Mark[]) => { return context.globalState.update("marks", marks) };
	const getMarksWorkspace = () => { return context.workspaceState.get("marks") as Mark[] | undefined };
	const setMarksWorkspace = (marks: Mark[]) => { return context.workspaceState.update("marks", marks) };
	const getMarkSettings = (() => {
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

	const addOrOverwriteMark = (mark: Mark) => {
		const marks = getMarks() ?? [];
		const index = marks.findIndex((m) => m.symbol === mark.symbol);
		if (index === -1) {
			marks.push(mark);
		} else {
			marks[index] = mark;
		}
		setMarks(marks);
	};
	const gotoFileInMark = (markSymbol: string) => {
		const marks = getMarks() ?? [];
		const mark = marks.find((m) => m.symbol === markSymbol);
		if (mark) {
			vscode.commands.executeCommand('vscode.open', vscode.Uri.file(mark.filePath));
			// vscode.commands.executeCommand('vscode.openWith', vscode.Uri.file(mark.filePath), vscode.ViewColumn.Active);
		}
		else {
			vscode.window.showInformationMessage('Mark not found');
		}
	}

	const deleteMark = (markSymbol: string) => {
		const marks = getMarks() ?? [];
		const filteredMarks = marks.filter((m) => m.symbol !== markSymbol);
		setMarks(filteredMarks);
	}


	function createAndShowMarkQuickPick(marks: Mark[], mode: Mode) {
		const quickPickItems: vscode.QuickPickItem[] = marks.map((mark) => {
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

		const customQuickPick = vscode.window.createQuickPick();
		customQuickPick.items = quickPickItems
		customQuickPick.canSelectMany = false;

		const modeHandling = (symbol: string) => {
			if (mode === 'set') {
				setCurrentFileToMark(symbol);
			}
			else if (mode === 'goto') {
				gotoFileInMark(symbol);
			}
			else if (mode === 'delete') {
				deleteMark(symbol);
			}
		}

		customQuickPick.onDidChangeValue((value) => {
			modeHandling(value);
			customQuickPick.dispose();
		});

		customQuickPick.onDidAccept(() => {
			// This doesn't confrom to the quickPickItem interface, but kind of works because I embed the mark object above in quickPickItems. Hopefully won't break. 
			// @ts-expect-error
			const selectedMark = customQuickPick.selectedItems[0].mark;
			modeHandling(selectedMark.symbol);
			customQuickPick.dispose();
		});

		customQuickPick.show();
	};

	async function setCurrentFileToMark(markSymbol: string) {
		const filePath = vscode.window.activeTextEditor?.document.uri;
		if (!filePath || filePath.scheme !== 'file') {
			vscode.window.showInformationMessage('Tether marks currently only handles files.');
			return;
		}
		addOrOverwriteMark({ symbol: markSymbol, filePath: filePath.fsPath });
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('tether-marks-for-vscode.set-mark', () => {
		const marks = getSortedAndFilteredMarks(getMarks() ?? [], false, getMarkSettings());
		createAndShowMarkQuickPick(marks, 'set');

		// const chosen = vscode.window.showQuickPick(quickPickItems);
		// console.log(chosen);
		// const options = [
		// 	{ label: 'A - Item 1' },
		// 	{ label: 'B - Item 2' },
		// 	{ label: 'C - Item 3' }
		// ];

		// const picker = vscode.window.showQuickPick(options, {
		// 	onDidSelectItem: item => {
		// 		console.log(`Selected: ${item}`);
		// 	}
		// });
		// picker.then(selection => {
		// 	if (selection) {
		// 		console.log(`Selected: ${selection.label}`);
		// 	}
		// });
	});
	const disposable2 = vscode.commands.registerCommand('tether-marks-for-vscode.go-to-mark', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const marks = getSortedAndFilteredMarks(getMarks() ?? [], false, getMarkSettings());
		createAndShowMarkQuickPick(marks, 'goto');
	});
	const disposable3 = vscode.commands.registerCommand('tether-marks-for-vscode.delete-mark', () => {
		const marks = getSortedAndFilteredMarks(getMarks() ?? [], false, getMarkSettings());
		createAndShowMarkQuickPick(marks, 'delete');
	});
	const disposable4 = vscode.commands.registerCommand('tether-marks-for-vscode.add-file-to-harpoon', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from tether-marks-for-vscode!');
	});
	const disposable5 = vscode.commands.registerCommand('tether-marks-for-vscode.go-to-harpoon-mark', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from tether-marks-for-vscode!');
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);
	context.subscriptions.push(disposable4);
	context.subscriptions.push(disposable5);
}

// This method is called when your extension is deactivated
export function deactivate() { }
