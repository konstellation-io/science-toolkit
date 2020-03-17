/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const vscode = require("vscode");
const goInstallTools_1 = require("./goInstallTools");
const util_1 = require("./util");
function addTags(commandArgs) {
    const args = getCommonArgs();
    if (!args) {
        return;
    }
    getTagsAndOptions(util_1.getGoConfig()['addTags'], commandArgs).then(([tags, options, transformValue]) => {
        if (!tags && !options) {
            return;
        }
        if (tags) {
            args.push('--add-tags');
            args.push(tags);
        }
        if (options) {
            args.push('--add-options');
            args.push(options);
        }
        if (transformValue) {
            args.push('--transform');
            args.push(transformValue);
        }
        runGomodifytags(args);
    });
}
exports.addTags = addTags;
function removeTags(commandArgs) {
    const args = getCommonArgs();
    if (!args) {
        return;
    }
    getTagsAndOptions(util_1.getGoConfig()['removeTags'], commandArgs).then(([tags, options]) => {
        if (!tags && !options) {
            args.push('--clear-tags');
            args.push('--clear-options');
        }
        if (tags) {
            args.push('--remove-tags');
            args.push(tags);
        }
        if (options) {
            args.push('--remove-options');
            args.push(options);
        }
        runGomodifytags(args);
    });
}
exports.removeTags = removeTags;
function getCommonArgs() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No editor is active.');
        return;
    }
    if (!editor.document.fileName.endsWith('.go')) {
        vscode.window.showInformationMessage('Current file is not a Go file.');
        return;
    }
    const args = ['-modified', '-file', editor.document.fileName, '-format', 'json'];
    if (editor.selection.start.line === editor.selection.end.line &&
        editor.selection.start.character === editor.selection.end.character) {
        // Add tags to the whole struct
        const offset = util_1.byteOffsetAt(editor.document, editor.selection.start);
        args.push('-offset');
        args.push(offset.toString());
    }
    else if (editor.selection.start.line <= editor.selection.end.line) {
        // Add tags to selected lines
        args.push('-line');
        args.push(`${editor.selection.start.line + 1},${editor.selection.end.line + 1}`);
    }
    return args;
}
function getTagsAndOptions(config, commandArgs) {
    const tags = commandArgs && commandArgs.hasOwnProperty('tags') ? commandArgs['tags'] : config['tags'];
    const options = commandArgs && commandArgs.hasOwnProperty('options') ? commandArgs['options'] : config['options'];
    const promptForTags = commandArgs && commandArgs.hasOwnProperty('promptForTags')
        ? commandArgs['promptForTags']
        : config['promptForTags'];
    const transformValue = commandArgs && commandArgs.hasOwnProperty('transform') ? commandArgs['transform'] : config['transform'];
    if (!promptForTags) {
        return Promise.resolve([tags, options, transformValue]);
    }
    return vscode.window
        .showInputBox({
        value: tags,
        prompt: 'Enter comma separated tag names'
    })
        .then((inputTags) => {
        return vscode.window
            .showInputBox({
            value: options,
            prompt: 'Enter comma separated options'
        })
            .then((inputOptions) => {
            return [inputTags, inputOptions, transformValue];
        });
    });
}
function runGomodifytags(args) {
    const gomodifytags = util_1.getBinPath('gomodifytags');
    const editor = vscode.window.activeTextEditor;
    const input = util_1.getFileArchive(editor.document);
    const p = cp.execFile(gomodifytags, args, { env: util_1.getToolsEnvVars() }, (err, stdout, stderr) => {
        if (err && err.code === 'ENOENT') {
            goInstallTools_1.promptForMissingTool('gomodifytags');
            return;
        }
        if (err) {
            vscode.window.showInformationMessage(`Cannot modify tags: ${stderr}`);
            return;
        }
        const output = JSON.parse(stdout);
        vscode.window.activeTextEditor.edit((editBuilder) => {
            editBuilder.replace(new vscode.Range(output.start - 1, 0, output.end, 0), output.lines.join('\n') + '\n');
        });
    });
    if (p.pid) {
        p.stdin.end(input);
    }
}
//# sourceMappingURL=goModifytags.js.map