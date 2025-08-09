import * as path from 'path';
import { Mark, Mode, getSortedAndFilteredMarks } from 'tether-marks-core';
import * as vscode from 'vscode';
import { quickPickMarkItem } from './types';
import { PluginOperator } from './PluginOperator';

export class MarkQuickPickWrapper {
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

		const quickPickItems: quickPickMarkItem[] = this.prepareQuickPickItems(marks);

		this.qp = vscode.window.createQuickPick();
		this.qp.items = quickPickItems;
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
		};

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
		});

		this.qp.onDidChangeActive(e => {
			// console.log(e);
		});

		vscode.commands.executeCommand('setContext', 'tether-marks-for-vscode.inMarkList', true);
		this.qp.show();
	};

	private prepareQuickPickItems(marks : Mark[]): quickPickMarkItem[] {
		return marks.map((mark) => {
			const fileName = path.basename(mark.filePath);
			const fileExtension = path.extname(mark.filePath).substring(1);
			const directoryPath = path.dirname(mark.filePath) === "." ? "" : path.dirname(mark.filePath);
			const iconPath = vscode.ThemeIcon.File;


			// console.log(`File Name: ${fileName}`);
			// console.log(`Directory Path: ${directoryPath}`);
			return {
				label: mark.symbol + "\t" + fileName, description: directoryPath, mark: mark
			};
		});
	}

	public refreshQP(pickedItemIndex: number = 0) {
		if (!this.qp) return;

		const marks = getSortedAndFilteredMarks(this.operator.getMarksWorkspace() ?? [], this.isHarpoon, this.operator.getMarkSettings());

		const quickPickItems = this.prepareQuickPickItems(marks);

		this.qp.items = quickPickItems;
		if (this.qp.items.length !== 0) {
			const boundedIndex = Math.min(Math.max(pickedItemIndex, 0), this.qp.items.length - 1);
			this.qp.activeItems = [this.qp.items[boundedIndex]];
		}
	};

	public deleteHighlightedMark() {
		if (!this.qp) {
			vscode.window.showErrorMessage("This shouldn't be called when mark list is not open");
			return;
		}
		if (this.qp.activeItems.length === 0) {
			return;
		}
		const symbolToDelete = this.qp.activeItems[0].mark.symbol;
		this.operator.deleteMark(symbolToDelete);
		vscode.window.showInformationMessage('Deleted mark: ' + symbolToDelete);

		// making sure that the list highlights the item with the index of the deleted item if possible
		const ind = this.qp.items.findIndex((item) => item.mark.symbol === symbolToDelete);
		this.refreshQP(ind);
	}
}
