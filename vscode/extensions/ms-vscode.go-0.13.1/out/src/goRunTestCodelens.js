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
const vscode = require("vscode");
const vscode_1 = require("vscode");
const goBaseCodelens_1 = require("./goBaseCodelens");
const goOutline_1 = require("./goOutline");
const testUtils_1 = require("./testUtils");
const util_1 = require("./util");
class GoRunTestCodeLensProvider extends goBaseCodelens_1.GoBaseCodeLensProvider {
    constructor() {
        super(...arguments);
        this.benchmarkRegex = /^Benchmark.+/;
        this.debugConfig = {
            name: 'Launch',
            type: 'go',
            request: 'launch',
            mode: 'test',
            env: {
                GOPATH: util_1.getCurrentGoPath() // Passing current GOPATH to Delve as it runs in another process
            }
        };
    }
    provideCodeLenses(document, token) {
        if (!this.enabled) {
            return [];
        }
        const config = util_1.getGoConfig(document.uri);
        const codeLensConfig = config.get('enableCodeLens');
        const codelensEnabled = codeLensConfig ? codeLensConfig['runtest'] : false;
        if (!codelensEnabled || !document.fileName.endsWith('_test.go')) {
            return [];
        }
        return Promise.all([
            this.getCodeLensForPackage(document, token),
            this.getCodeLensForFunctions(config, document, token)
        ]).then(([pkg, fns]) => {
            let res = [];
            if (pkg && Array.isArray(pkg)) {
                res = res.concat(pkg);
            }
            if (fns && Array.isArray(fns)) {
                res = res.concat(fns);
            }
            return res;
        });
    }
    getCodeLensForPackage(document, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const documentSymbolProvider = new goOutline_1.GoDocumentSymbolProvider();
            const symbols = yield documentSymbolProvider.provideDocumentSymbols(document, token);
            const pkg = symbols[0];
            if (!pkg) {
                return [];
            }
            const range = pkg.range;
            const packageCodeLens = [
                new vscode_1.CodeLens(range, {
                    title: 'run package tests',
                    command: 'go.test.package'
                }),
                new vscode_1.CodeLens(range, {
                    title: 'run file tests',
                    command: 'go.test.file'
                })
            ];
            if (symbols[0].children.some((sym) => sym.kind === vscode.SymbolKind.Function && this.benchmarkRegex.test(sym.name))) {
                packageCodeLens.push(new vscode_1.CodeLens(range, {
                    title: 'run package benchmarks',
                    command: 'go.benchmark.package'
                }), new vscode_1.CodeLens(range, {
                    title: 'run file benchmarks',
                    command: 'go.benchmark.file'
                }));
            }
            return packageCodeLens;
        });
    }
    getCodeLensForFunctions(vsConfig, document, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const codelens = [];
            const testPromise = testUtils_1.getTestFunctions(document, token).then((testFunctions) => {
                testFunctions.forEach((func) => {
                    const runTestCmd = {
                        title: 'run test',
                        command: 'go.test.cursor',
                        arguments: [{ functionName: func.name }]
                    };
                    codelens.push(new vscode_1.CodeLens(func.range, runTestCmd));
                    const debugTestCmd = {
                        title: 'debug test',
                        command: 'go.debug.cursor',
                        arguments: [{ functionName: func.name }]
                    };
                    codelens.push(new vscode_1.CodeLens(func.range, debugTestCmd));
                });
            });
            const benchmarkPromise = testUtils_1.getBenchmarkFunctions(document, token).then((benchmarkFunctions) => {
                benchmarkFunctions.forEach((func) => {
                    const runBenchmarkCmd = {
                        title: 'run benchmark',
                        command: 'go.benchmark.cursor',
                        arguments: [{ functionName: func.name }]
                    };
                    codelens.push(new vscode_1.CodeLens(func.range, runBenchmarkCmd));
                    const debugTestCmd = {
                        title: 'debug benchmark',
                        command: 'go.debug.cursor',
                        arguments: [{ functionName: func.name }]
                    };
                    codelens.push(new vscode_1.CodeLens(func.range, debugTestCmd));
                });
            });
            yield Promise.all([testPromise, benchmarkPromise]);
            return codelens;
        });
    }
}
exports.GoRunTestCodeLensProvider = GoRunTestCodeLensProvider;
//# sourceMappingURL=goRunTestCodelens.js.map