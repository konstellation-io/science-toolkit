/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const path = require("path");
const vscode = require("vscode");
const goInstallTools_1 = require("./goInstallTools");
const goModules_1 = require("./goModules");
const util_1 = require("./util");
const missingToolMsg = 'Missing tool: ';
function definitionLocation(document, position, goConfig, includeDocs, token) {
    const adjustedPos = adjustWordPosition(document, position);
    if (!adjustedPos[0]) {
        return Promise.resolve(null);
    }
    const word = adjustedPos[1];
    position = adjustedPos[2];
    if (!goConfig) {
        goConfig = util_1.getGoConfig(document.uri);
    }
    const toolForDocs = goConfig['docsTool'] || 'godoc';
    return goModules_1.getModFolderPath(document.uri).then((modFolderPath) => {
        const input = {
            document,
            position,
            word,
            includeDocs,
            isMod: !!modFolderPath,
            cwd: modFolderPath && modFolderPath !== util_1.getModuleCache()
                ? modFolderPath
                : util_1.getWorkspaceFolderPath(document.uri) || path.dirname(document.fileName)
        };
        if (toolForDocs === 'godoc') {
            return definitionLocation_godef(input, token);
        }
        else if (toolForDocs === 'guru') {
            return definitionLocation_guru(input, token);
        }
        return definitionLocation_gogetdoc(input, token, true);
    });
}
exports.definitionLocation = definitionLocation;
function adjustWordPosition(document, position) {
    const wordRange = document.getWordRangeAtPosition(position);
    const lineText = document.lineAt(position.line).text;
    const word = wordRange ? document.getText(wordRange) : '';
    if (!wordRange ||
        lineText.startsWith('//') ||
        util_1.isPositionInString(document, position) ||
        word.match(/^\d+.?\d+$/) ||
        util_1.goKeywords.indexOf(word) > 0) {
        return [false, null, null];
    }
    if (position.isEqual(wordRange.end) && position.isAfter(wordRange.start)) {
        position = position.translate(0, -1);
    }
    return [true, word, position];
}
exports.adjustWordPosition = adjustWordPosition;
const godefImportDefinitionRegex = /^import \(.* ".*"\)$/;
function definitionLocation_godef(input, token, useReceivers = true) {
    const godefTool = 'godef';
    const godefPath = util_1.getBinPath(godefTool);
    if (!path.isAbsolute(godefPath)) {
        return Promise.reject(missingToolMsg + godefTool);
    }
    const offset = util_1.byteOffsetAt(input.document, input.position);
    const env = util_1.getToolsEnvVars();
    let p;
    if (token) {
        token.onCancellationRequested(() => util_1.killProcess(p));
    }
    return new Promise((resolve, reject) => {
        // Spawn `godef` process
        const args = ['-t', '-i', '-f', input.document.fileName, '-o', offset.toString()];
        // if (useReceivers) {
        // 	args.push('-r');
        // }
        p = cp.execFile(godefPath, args, { env, cwd: input.cwd }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    return reject(missingToolMsg + godefTool);
                }
                if (err) {
                    if (input.isMod &&
                        !input.includeDocs &&
                        stderr &&
                        stderr.startsWith(`godef: no declaration found for`)) {
                        goModules_1.promptToUpdateToolForModules('godef', `To get the Go to Definition feature when using Go modules, please update your version of the "godef" tool.`);
                        return reject(stderr);
                    }
                    if (stderr.indexOf('flag provided but not defined: -r') !== -1) {
                        goInstallTools_1.promptForUpdatingTool('godef');
                        p = null;
                        return definitionLocation_godef(input, token, false).then(resolve, reject);
                    }
                    return reject(err.message || stderr);
                }
                const result = stdout.toString();
                const lines = result.split('\n');
                let match = /(.*):(\d+):(\d+)/.exec(lines[0]);
                if (!match) {
                    // TODO: Gotodef on pkg name:
                    // /usr/local/go/src/html/template\n
                    return resolve(null);
                }
                const [_, file, line, col] = match;
                const pkgPath = path.dirname(file);
                const definitionInformation = {
                    file,
                    line: +line - 1,
                    column: +col - 1,
                    declarationlines: lines.slice(1),
                    toolUsed: 'godef',
                    doc: null,
                    name: null
                };
                if (!input.includeDocs || godefImportDefinitionRegex.test(definitionInformation.declarationlines[0])) {
                    return resolve(definitionInformation);
                }
                match = /^\w+ \(\*?(\w+)\)/.exec(lines[1]);
                util_1.runGodoc(input.cwd, pkgPath, match ? match[1] : '', input.word, token)
                    .then((doc) => {
                    if (doc) {
                        definitionInformation.doc = doc;
                    }
                    resolve(definitionInformation);
                })
                    .catch((runGoDocErr) => {
                    console.log(runGoDocErr);
                    resolve(definitionInformation);
                });
            }
            catch (e) {
                reject(e);
            }
        });
        if (p.pid) {
            p.stdin.end(input.document.getText());
        }
    });
}
function definitionLocation_gogetdoc(input, token, useTags) {
    const gogetdoc = util_1.getBinPath('gogetdoc');
    if (!path.isAbsolute(gogetdoc)) {
        return Promise.reject(missingToolMsg + 'gogetdoc');
    }
    const offset = util_1.byteOffsetAt(input.document, input.position);
    const env = util_1.getToolsEnvVars();
    let p;
    if (token) {
        token.onCancellationRequested(() => util_1.killProcess(p));
    }
    return new Promise((resolve, reject) => {
        const gogetdocFlagsWithoutTags = [
            '-u',
            '-json',
            '-modified',
            '-pos',
            input.document.fileName + ':#' + offset.toString()
        ];
        const buildTags = util_1.getGoConfig(input.document.uri)['buildTags'];
        const gogetdocFlags = buildTags && useTags ? [...gogetdocFlagsWithoutTags, '-tags', buildTags] : gogetdocFlagsWithoutTags;
        p = cp.execFile(gogetdoc, gogetdocFlags, { env, cwd: input.cwd }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    return reject(missingToolMsg + 'gogetdoc');
                }
                if (stderr && stderr.startsWith('flag provided but not defined: -tags')) {
                    p = null;
                    return definitionLocation_gogetdoc(input, token, false).then(resolve, reject);
                }
                if (err) {
                    if (input.isMod && !input.includeDocs && stdout.startsWith(`gogetdoc: couldn't get package for`)) {
                        goModules_1.promptToUpdateToolForModules('gogetdoc', `To get the Go to Definition feature when using Go modules, please update your version of the "gogetdoc" tool.`);
                        return resolve(null);
                    }
                    return reject(err.message || stderr);
                }
                const goGetDocOutput = JSON.parse(stdout.toString());
                const match = /(.*):(\d+):(\d+)/.exec(goGetDocOutput.pos);
                const definitionInfo = {
                    file: null,
                    line: 0,
                    column: 0,
                    toolUsed: 'gogetdoc',
                    declarationlines: goGetDocOutput.decl.split('\n'),
                    doc: goGetDocOutput.doc,
                    name: goGetDocOutput.name
                };
                if (!match) {
                    return resolve(definitionInfo);
                }
                const [_, file, line, col] = match;
                definitionInfo.file = match[1];
                definitionInfo.line = +match[2] - 1;
                definitionInfo.column = +match[3] - 1;
                return resolve(definitionInfo);
            }
            catch (e) {
                reject(e);
            }
        });
        if (p.pid) {
            p.stdin.end(util_1.getFileArchive(input.document));
        }
    });
}
function definitionLocation_guru(input, token) {
    const guru = util_1.getBinPath('guru');
    if (!path.isAbsolute(guru)) {
        return Promise.reject(missingToolMsg + 'guru');
    }
    const offset = util_1.byteOffsetAt(input.document, input.position);
    const env = util_1.getToolsEnvVars();
    let p;
    if (token) {
        token.onCancellationRequested(() => util_1.killProcess(p));
    }
    return new Promise((resolve, reject) => {
        p = cp.execFile(guru, ['-json', '-modified', 'definition', input.document.fileName + ':#' + offset.toString()], { env }, (err, stdout, stderr) => {
            try {
                if (err && err.code === 'ENOENT') {
                    return reject(missingToolMsg + 'guru');
                }
                if (err) {
                    return reject(err.message || stderr);
                }
                const guruOutput = JSON.parse(stdout.toString());
                const match = /(.*):(\d+):(\d+)/.exec(guruOutput.objpos);
                const definitionInfo = {
                    file: null,
                    line: 0,
                    column: 0,
                    toolUsed: 'guru',
                    declarationlines: [guruOutput.desc],
                    doc: null,
                    name: null
                };
                if (!match) {
                    return resolve(definitionInfo);
                }
                const [_, file, line, col] = match;
                definitionInfo.file = match[1];
                definitionInfo.line = +match[2] - 1;
                definitionInfo.column = +match[3] - 1;
                return resolve(definitionInfo);
            }
            catch (e) {
                reject(e);
            }
        });
        if (p.pid) {
            p.stdin.end(util_1.getFileArchive(input.document));
        }
    });
}
function parseMissingError(err) {
    if (err) {
        // Prompt for missing tool is located here so that the
        // prompts dont show up on hover or signature help
        if (typeof err === 'string' && err.startsWith(missingToolMsg)) {
            return [true, err.substr(missingToolMsg.length)];
        }
    }
    return [false, null];
}
exports.parseMissingError = parseMissingError;
class GoDefinitionProvider {
    constructor(goConfig) {
        this.goConfig = null;
        this.goConfig = goConfig;
    }
    provideDefinition(document, position, token) {
        return definitionLocation(document, position, this.goConfig, false, token).then((definitionInfo) => {
            if (definitionInfo == null || definitionInfo.file == null) {
                return null;
            }
            const definitionResource = vscode.Uri.file(definitionInfo.file);
            const pos = new vscode.Position(definitionInfo.line, definitionInfo.column);
            return new vscode.Location(definitionResource, pos);
        }, (err) => {
            const miss = parseMissingError(err);
            if (miss[0]) {
                goInstallTools_1.promptForMissingTool(miss[1]);
            }
            else if (err) {
                return Promise.reject(err);
            }
            return Promise.resolve(null);
        });
    }
}
exports.GoDefinitionProvider = GoDefinitionProvider;
//# sourceMappingURL=goDeclaration.js.map