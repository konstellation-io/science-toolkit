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
class GoWorkspaceSymbolProvider {
    constructor() {
        this.goKindToCodeKind = {
            package: vscode.SymbolKind.Package,
            import: vscode.SymbolKind.Namespace,
            var: vscode.SymbolKind.Variable,
            type: vscode.SymbolKind.Interface,
            func: vscode.SymbolKind.Function,
            const: vscode.SymbolKind.Constant
        };
    }
    provideWorkspaceSymbols(query, token) {
        const convertToCodeSymbols = (decls, symbols) => {
            decls.forEach((decl) => {
                let kind;
                if (decl.kind !== '') {
                    kind = this.goKindToCodeKind[decl.kind];
                }
                const pos = new vscode.Position(decl.line, decl.character);
                const symbolInfo = new vscode.SymbolInformation(decl.name, kind, new vscode.Range(pos, pos), vscode.Uri.file(decl.path), '');
                symbols.push(symbolInfo);
            });
        };
        const root = util_1.getWorkspaceFolderPath(vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri);
        const goConfig = util_1.getGoConfig();
        if (!root && !goConfig.gotoSymbol.includeGoroot) {
            vscode.window.showInformationMessage('No workspace is open to find symbols.');
            return;
        }
        return getWorkspaceSymbols(root, query, token, goConfig).then((results) => {
            const symbols = [];
            convertToCodeSymbols(results, symbols);
            return symbols;
        });
    }
}
exports.GoWorkspaceSymbolProvider = GoWorkspaceSymbolProvider;
function getWorkspaceSymbols(workspacePath, query, token, goConfig, ignoreFolderFeatureOn = true) {
    if (!goConfig) {
        goConfig = util_1.getGoConfig();
    }
    const gotoSymbolConfig = goConfig['gotoSymbol'];
    const calls = [];
    const ignoreFolders = gotoSymbolConfig ? gotoSymbolConfig['ignoreFolders'] : [];
    const baseArgs = ignoreFolderFeatureOn && ignoreFolders && ignoreFolders.length > 0 ? ['-ignore', ignoreFolders.join(',')] : [];
    calls.push(callGoSymbols([...baseArgs, workspacePath, query], token));
    if (gotoSymbolConfig.includeGoroot) {
        const goRoot = process.env['GOROOT'];
        const gorootCall = callGoSymbols([...baseArgs, goRoot, query], token);
        calls.push(gorootCall);
    }
    return Promise.all(calls)
        .then(([...results]) => [].concat(...results))
        .catch((err) => {
        if (err && err.code === 'ENOENT') {
            goInstallTools_1.promptForMissingTool('go-symbols');
        }
        if (err.message.startsWith('flag provided but not defined: -ignore')) {
            goInstallTools_1.promptForUpdatingTool('go-symbols');
            return getWorkspaceSymbols(workspacePath, query, token, goConfig, false);
        }
    });
}
exports.getWorkspaceSymbols = getWorkspaceSymbols;
function callGoSymbols(args, token) {
    const gosyms = util_1.getBinPath('go-symbols');
    const env = util_1.getToolsEnvVars();
    let p;
    if (token) {
        token.onCancellationRequested(() => util_1.killProcess(p));
    }
    return new Promise((resolve, reject) => {
        p = cp.execFile(gosyms, args, { maxBuffer: 1024 * 1024, env }, (err, stdout, stderr) => {
            if (err && stderr && stderr.startsWith('flag provided but not defined: -ignore')) {
                return reject(new Error(stderr));
            }
            else if (err) {
                return reject(err);
            }
            const result = stdout.toString();
            const decls = JSON.parse(result);
            return resolve(decls);
        });
    });
}
//# sourceMappingURL=goSymbol.js.map