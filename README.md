# Tether marks for vscode
Assign files to key registers, and quickly jump to them with a single keystroke. Inspired by vim global marks functionality and [Harpoon](https://github.com/ThePrimeagen/harpoon) Neovim plugin.

![image](/assets/image.png)

## Features
- Set marks for files using key symbol registers.
- Navigate to files using a list of set marks.
- Use [Harpoon](https://github.com/ThePrimeagen/harpoon)-like workflow in your Vscode.
- Set custom key symbols as registers. You can use anything as long as it is a single keystroke (excluding modifiers: ctrl, shift, alt) and is considered as one symbol. 

## Release Notes

Check [CHANGELOG](CHANGELOG.md)

## Potential future features
- direct navigation to previous/next harpoon mark
- undo/redo marks modifications
- expanding marks to store:
    - cli commands
    - vscode commands
    - non text editor windows
- storing mark data in .vscode folder per workspace

## Naming convention
- Register - key symbol that will be used to tether to files. 
- Mark - key value pair, where key is the register (the key symbol) and value is the path of the file that has been marked by that register. 
