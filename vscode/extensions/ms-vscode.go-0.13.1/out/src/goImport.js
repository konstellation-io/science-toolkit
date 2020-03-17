/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const vscode = require("vscode");
const goInstallTools_1 = require("./goInstallTools");
const goOutline_1 = require("./goOutline");
const goPackages_1 = require("./goPackages");
const goPath_1 = require("./goPath");
const telemetry_1 = require("./telemetry");
const util_1 = require("./util");
const missingToolMsg = 'Missing tool: ';
function listPackages(excludeImportedPkgs = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const importedPkgs = excludeImportedPkgs && vscode.window.activeTextEditor
            ? yield getImports(vscode.window.activeTextEditor.document)
            : [];
        const pkgMap = yield goPackages_1.getImportablePackages(vscode.window.activeTextEditor.document.fileName, true);
        const stdLibs = [];
        const nonStdLibs = [];
        pkgMap.forEach((value, key) => {
            if (importedPkgs.some((imported) => imported === key)) {
                return;
            }
            if (value.isStd) {
                stdLibs.push(key);
            }
            else {
                nonStdLibs.push(key);
            }
        });
        return [...stdLibs.sort(), ...nonStdLibs.sort()];
    });
}
exports.listPackages = listPackages;
/**
 * Returns the imported packages in the given file
 *
 * @param document TextDocument whose imports need to be returned
 * @returns Array of imported package paths wrapped in a promise
 */
function getImports(document) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            fileName: document.fileName,
            importsOption: goOutline_1.GoOutlineImportsOptions.Only,
            document
        };
        const symbols = yield goOutline_1.documentSymbols(options, null);
        if (!symbols || !symbols.length) {
            return [];
        }
        // import names will be of the form "math", so strip the quotes in the beginning and the end
        const imports = symbols[0].children
            .filter((x) => x.kind === vscode.SymbolKind.Namespace)
            .map((x) => x.name.substr(1, x.name.length - 2));
        return imports;
    });
}
function askUserForImport() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const packages = yield listPackages(true);
            return vscode.window.showQuickPick(packages);
        }
        catch (err) {
            if (typeof err === 'string' && err.startsWith(missingToolMsg)) {
                goInstallTools_1.promptForMissingTool(err.substr(missingToolMsg.length));
            }
        }
    });
}
function getTextEditForAddImport(arg) {
    // Import name wasn't provided
    if (arg === undefined) {
        return null;
    }
    const { imports, pkg } = util_1.parseFilePrelude(vscode.window.activeTextEditor.document.getText());
    if (imports.some((block) => block.pkgs.some((pkgpath) => pkgpath === arg))) {
        return [];
    }
    const multis = imports.filter((x) => x.kind === 'multi');
    if (multis.length > 0) {
        // There is a multiple import declaration, add to the last one
        const lastImportSection = multis[multis.length - 1];
        if (lastImportSection.end === -1) {
            // For some reason there was an empty import section like `import ()`
            return [vscode.TextEdit.insert(new vscode.Position(lastImportSection.start + 1, 0), `import "${arg}"\n`)];
        }
        // Add import at the start of the block so that goimports/goreturns can order them correctly
        return [vscode.TextEdit.insert(new vscode.Position(lastImportSection.start + 1, 0), '\t"' + arg + '"\n')];
    }
    else if (imports.length > 0) {
        // There are some number of single line imports, which can just be collapsed into a block import.
        const edits = [];
        edits.push(vscode.TextEdit.insert(new vscode.Position(imports[0].start, 0), 'import (\n\t"' + arg + '"\n'));
        imports.forEach((element) => {
            const currentLine = vscode.window.activeTextEditor.document.lineAt(element.start).text;
            const updatedLine = currentLine.replace(/^\s*import\s*/, '\t');
            edits.push(vscode.TextEdit.replace(new vscode.Range(element.start, 0, element.start, currentLine.length), updatedLine));
        });
        edits.push(vscode.TextEdit.insert(new vscode.Position(imports[imports.length - 1].end + 1, 0), ')\n'));
        return edits;
    }
    else if (pkg && pkg.start >= 0) {
        // There are no import declarations, but there is a package declaration
        return [vscode.TextEdit.insert(new vscode.Position(pkg.start + 1, 0), '\nimport (\n\t"' + arg + '"\n)\n')];
    }
    else {
        // There are no imports and no package declaration - give up
        return [];
    }
}
exports.getTextEditForAddImport = getTextEditForAddImport;
function addImport(arg) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found to add imports.');
        return;
    }
    const p = arg && arg.importPath ? Promise.resolve(arg.importPath) : askUserForImport();
    p.then((imp) => {
        if (!imp) {
            return;
        }
        telemetry_1.sendTelemetryEventForAddImportCmd(arg);
        const edits = getTextEditForAddImport(imp);
        if (edits && edits.length > 0) {
            const edit = new vscode.WorkspaceEdit();
            edit.set(editor.document.uri, edits);
            vscode.workspace.applyEdit(edit);
        }
    });
}
exports.addImport = addImport;
function addImportToWorkspace() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found to determine current package.');
        return;
    }
    const selection = editor.selection;
    let importPath = '';
    if (!selection.isEmpty) {
        let selectedText = editor.document.getText(selection).trim();
        if (selectedText.length > 0) {
            if (selectedText.indexOf(' ') === -1) {
                // Attempt to load a partial import path based on currently selected text
                if (!selectedText.startsWith('"')) {
                    selectedText = '"' + selectedText;
                }
                if (!selectedText.endsWith('"')) {
                    selectedText = selectedText + '"';
                }
            }
            importPath = util_1.getImportPath(selectedText);
        }
    }
    if (importPath === '') {
        // Failing that use the current line
        const selectedText = editor.document.lineAt(selection.active.line).text;
        importPath = util_1.getImportPath(selectedText);
    }
    if (importPath === '') {
        vscode.window.showErrorMessage('No import path to add');
        return;
    }
    const goRuntimePath = util_1.getBinPath('go');
    if (!goRuntimePath) {
        vscode.window.showErrorMessage(`Failed to run "go list" to find the package as the "go" binary cannot be found in either GOROOT(${process.env['GOROOT']}) or PATH(${goPath_1.envPath})`);
        return;
    }
    const env = util_1.getToolsEnvVars();
    cp.execFile(goRuntimePath, ['list', '-f', '{{.Dir}}', importPath], { env }, (err, stdout, stderr) => {
        const dirs = (stdout || '').split('\n');
        if (!dirs.length || !dirs[0].trim()) {
            vscode.window.showErrorMessage(`Could not find package ${importPath}`);
            return;
        }
        const importPathUri = vscode.Uri.file(dirs[0]);
        const existingWorkspaceFolder = vscode.workspace.getWorkspaceFolder(importPathUri);
        if (existingWorkspaceFolder !== undefined) {
            vscode.window.showInformationMessage('Already available under ' + existingWorkspaceFolder.name);
            return;
        }
        vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: importPathUri });
    });
}
exports.addImportToWorkspace = addImportToWorkspace;
//# sourceMappingURL=goImport.js.map