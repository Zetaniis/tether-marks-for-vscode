// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { PluginOperator } from './PluginOperator';
import { MarkQuickPickWarpper } from './MarkQuickPickWarpper';

export function activate(context: vscode.ExtensionContext) {
	const op = new PluginOperator(context);
	const qpw = new MarkQuickPickWarpper(op);

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
