import { Sheet } from '../domain/types';

export class HistoryManager {
  private undoStack: Sheet[] = [];
  private redoStack: Sheet[] = [];
  private maxHistory: number = 50;

  public pushState(sheet: Sheet) {
    this.undoStack.push(JSON.parse(JSON.stringify(sheet)));
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo stack on new action
  }

  public undo(currentSheet: Sheet): Sheet | null {
    if (this.undoStack.length === 0) return null;
    this.redoStack.push(JSON.parse(JSON.stringify(currentSheet)));
    return this.undoStack.pop() || null;
  }

  public redo(currentSheet: Sheet): Sheet | null {
    if (this.redoStack.length === 0) return null;
    this.undoStack.push(JSON.parse(JSON.stringify(currentSheet)));
    return this.redoStack.pop() || null;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
