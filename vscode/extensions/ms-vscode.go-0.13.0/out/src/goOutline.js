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
const util_1 = require("./util");
var GoOutlineImportsOptions;
(function (GoOutlineImportsOptions) {
    GoOutlineImportsOptions[GoOutlineImportsOptions["Include"] = 0] = "Include";
    GoOutlineImportsOptions[GoOutlineImportsOptions["Exclude"] = 1] = "Exclude";
    GoOutlineImportsOptions[GoOutlineImportsOptions["Only"] = 2] = "Only";
})(GoOutlineImportsOptions = exports.GoOutlineImportsOptions || (exports.GoOutlineImportsOptions = {}));
function documentSymbols(options, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const decls = yield runGoOutline(options, token);
        return convertToCodeSymbols(options.document, decls, options.importsOption !== GoOutlineImportsOptions.Exclude, util_1.makeMemoizedByteOffsetConverter(Buffer.from(options.document.getText())));
    });
}
exports.documentSymbols = documentSymbols;
function runGoOutline(options, token) {
    return new Promise((resolve, reject) => {
        const gooutline = util_1.getBinPath('go-outline');
        const gooutlineFlags = ['-f', options.fileName];
        if (options.importsOption === GoOutlineImportsOptions.Only) {
            gooutlineFlags.push('-imports-only');
        }
        if (options.document) {
            gooutlineFlags.push('-modified');
        }
        let p;
        if (token) {
            token.onCancellationRequested(() => util_1.killProcess(p));
        }
        // Spawn `go-outline` process
        p = cp.execFile(gooutline, gooutlineFlags, { env: util_1.getToolsEnvVars() }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    goInstallTools_1.promptForMissingTool('go-outline');
                }
                if (stderr && stderr.startsWith('flag provided but not defined: ')) {
                    goInstallTools_1.promptForUpdatingTool('go-outline');
                    if (stderr.startsWith('flag provided but not defined: -imports-only')) {
                        options.importsOption = GoOutlineImportsOptions.Include;
                    }
                    if (stderr.startsWith('flag provided but not defined: -modified')) {
                        options.document = null;
                    }
                    p = null;
                    return runGoOutline(options, token).then((results) => {
                        return resolve(results);
                    });
                }
                if (err) {
                    return resolve(null);
                }
                const result = stdout.toString();
                const decls = JSON.parse(result);
                return resolve(decls);
            }
            catch (e) {
                reject(e);
            }
        });
        if (options.document && p.pid) {
            p.stdin.end(util_1.getFileArchive(options.document));
        }
    });
}
exports.runGoOutline = runGoOutline;
const goKindToCodeKind = {
    package: vscode.SymbolKind.Package,
    import: vscode.SymbolKind.Namespace,
    variable: vscode.SymbolKind.Variable,
    constant: vscode.SymbolKind.Constant,
    type: vscode.SymbolKind.TypeParameter,
    function: vscode.SymbolKind.Function,
    struct: vscode.SymbolKind.Struct,
    interface: vscode.SymbolKind.Interface
};
function convertToCodeSymbols(document, decls, includeImports, byteOffsetToDocumentOffset) {
    const symbols = [];
    (decls || []).forEach((decl) => {
        if (!includeImports && decl.type === 'import') {
            return;
        }
        if (decl.label === '_' && decl.type === 'variable') {
            return;
        }
        const label = decl.receiverType ? `(${decl.receiverType}).${decl.label}` : decl.label;
        const start = byteOffsetToDocumentOffset(decl.start - 1);
        const end = byteOffsetToDocumentOffset(decl.end - 1);
        const startPosition = document.positionAt(start);
        const endPosition = document.positionAt(end);
        const symbolRange = new vscode.Range(startPosition, endPosition);
        const selectionRange = startPosition.line === endPosition.line
            ? symbolRange
            : new vscode.Range(startPosition, document.lineAt(startPosition.line).range.end);
        if (decl.type === 'type') {
            const line = document.lineAt(document.positionAt(start));
            const regexStruct = new RegExp(`^\\s*type\\s+${decl.label}\\s+struct\\b`);
            const regexInterface = new RegExp(`^\\s*type\\s+${decl.label}\\s+interface\\b`);
            decl.type = regexStruct.test(line.text) ? 'struct' : regexInterface.test(line.text) ? 'interface' : 'type';
        }
        const symbolInfo = new vscode.DocumentSymbol(label, decl.type, goKindToCodeKind[decl.type], symbolRange, selectionRange);
        symbols.push(symbolInfo);
        if (decl.children) {
            symbolInfo.children = convertToCodeSymbols(document, decl.children, includeImports, byteOffsetToDocumentOffset);
        }
    });
    return symbols;
}
class GoDocumentSymbolProvider {
    constructor(includeImports) {
        this.includeImports = includeImports;
    }
    provideDocumentSymbols(document, token) {
        if (typeof this.includeImports !== 'boolean') {
            const gotoSymbolConfig = util_1.getGoConfig(document.uri)['gotoSymbol'];
            this.includeImports = gotoSymbolConfig ? gotoSymbolConfig['includeImports'] : false;
        }
        const options = {
            fileName: document.fileName,
            document,
            importsOption: this.includeImports ? GoOutlineImportsOptions.Include : GoOutlineImportsOptions.Exclude
        };
        return documentSymbols(options, token);
    }
}
exports.GoDocumentSymbolProvider = GoDocumentSymbolProvider;
//# sourceMappingURL=goOutline.js.map