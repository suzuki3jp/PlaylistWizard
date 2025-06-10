import type { CommandInterface } from "./command";

export class CommandHistory {
  private commands: CommandInterface[] = [];
  private currentCommandIndex = -1;

  public undoable(): boolean {
    return this.currentCommandIndex >= 0;
  }

  public redoable(): boolean {
    return this.currentCommandIndex < this.commands.length - 1;
  }

  addCommand(command: CommandInterface): this {
    // Remove any commands after the current index
    this.commands = this.commands.slice(0, this.currentCommandIndex + 1);
    this.commands.push(command);
    this.currentCommandIndex++;
    return this;
  }

  async redo() {
    if (this.redoable()) {
      const command = this.commands[++this.currentCommandIndex];
      await command.redo();
    }
  }

  async undo() {
    if (this.undoable()) {
      const command = this.commands[this.currentCommandIndex--];
      await command.undo();
    }
  }
}
