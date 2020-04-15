"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
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
const path = require("path");
const vscode = require("vscode");
const goInstallTools_1 = require("./goInstallTools");
const goPath_1 = require("./goPath");
const goTools_1 = require("./goTools");
const stateUtils_1 = require("./stateUtils");
const telemetry_1 = require("./telemetry");
const util_1 = require("./util");
function runGoModEnv(folderPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const goExecutable = util_1.getBinPath('go');
        if (!goExecutable) {
            console.warn(`Failed to run "go env GOMOD" to find mod file as the "go" binary cannot be found in either GOROOT(${process.env['GOROOT']}) or PATH(${goPath_1.envPath})`);
            return;
        }
        const env = util_1.getToolsEnvVars();
        exports.GO111MODULE = env['GO111MODULE'];
        return new Promise((resolve) => {
            cp.execFile(goExecutable, ['env', 'GOMOD'], { cwd: folderPath, env: util_1.getToolsEnvVars() }, (err, stdout) => {
                if (err) {
                    console.warn(`Error when running go env GOMOD: ${err}`);
                    return resolve();
                }
                const [goMod] = stdout.split('\n');
                resolve(goMod);
            });
        });
    });
}
function isModSupported(fileuri) {
    return getModFolderPath(fileuri).then((modPath) => !!modPath);
}
exports.isModSupported = isModSupported;
exports.packagePathToGoModPathMap = {};
function getModFolderPath(fileuri) {
    return __awaiter(this, void 0, void 0, function* () {
        const pkgPath = path.dirname(fileuri.fsPath);
        if (exports.packagePathToGoModPathMap[pkgPath]) {
            return exports.packagePathToGoModPathMap[pkgPath];
        }
        // We never would be using the path under module cache for anything
        // So, dont bother finding where exactly is the go.mod file
        const moduleCache = util_1.getModuleCache();
        if (goPath_1.fixDriveCasingInWindows(fileuri.fsPath).startsWith(moduleCache)) {
            return moduleCache;
        }
        const goVersion = yield util_1.getGoVersion();
        if (goVersion.lt('1.11')) {
            return;
        }
        let goModEnvResult = yield runGoModEnv(pkgPath);
        if (goModEnvResult) {
            logModuleUsage();
            goModEnvResult = path.dirname(goModEnvResult);
            const goConfig = util_1.getGoConfig(fileuri);
            let promptFormatTool = goConfig['formatTool'] === 'goreturns';
            if (goConfig['inferGopath'] === true) {
                goConfig.update('inferGopath', false, vscode.ConfigurationTarget.WorkspaceFolder);
                vscode.window.showInformationMessage('The "inferGopath" setting is disabled for this workspace because Go modules are being used.');
            }
            if (goConfig['useLanguageServer'] === false) {
                const promptMsg = 'For better performance using Go modules, you can try the experimental Go language server, gopls.';
                const choseToUpdateLS = yield promptToUpdateToolForModules('gopls', promptMsg, goConfig);
                promptFormatTool = promptFormatTool && !choseToUpdateLS;
            }
            else if (promptFormatTool) {
                const languageServerExperimentalFeatures = goConfig.get('languageServerExperimentalFeatures');
                promptFormatTool = languageServerExperimentalFeatures['format'] === false;
            }
            if (promptFormatTool) {
                const promptMsgForFormatTool = '`goreturns` doesnt support auto-importing missing imports when using Go modules yet. Please update the "formatTool" setting to `goimports`.';
                yield promptToUpdateToolForModules('switchFormatToolToGoimports', promptMsgForFormatTool, goConfig);
            }
        }
        exports.packagePathToGoModPathMap[pkgPath] = goModEnvResult;
        return goModEnvResult;
    });
}
exports.getModFolderPath = getModFolderPath;
let moduleUsageLogged = false;
function logModuleUsage() {
    if (moduleUsageLogged) {
        return;
    }
    moduleUsageLogged = true;
    telemetry_1.sendTelemetryEventForModulesUsage();
}
const promptedToolsForCurrentSession = new Set();
function promptToUpdateToolForModules(tool, promptMsg, goConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        if (promptedToolsForCurrentSession.has(tool)) {
            return false;
        }
        const promptedToolsForModules = stateUtils_1.getFromGlobalState('promptedToolsForModules', {});
        if (promptedToolsForModules[tool]) {
            return false;
        }
        const goVersion = yield util_1.getGoVersion();
        const selected = yield vscode.window.showInformationMessage(promptMsg, 'Update', 'Later', `Don't show again`);
        let choseToUpdate = false;
        switch (selected) {
            case 'Update':
                choseToUpdate = true;
                if (!goConfig) {
                    goConfig = util_1.getGoConfig();
                }
                if (tool === 'switchFormatToolToGoimports') {
                    goConfig.update('formatTool', 'goimports', vscode.ConfigurationTarget.Global);
                }
                else {
                    goInstallTools_1.installTools([goTools_1.getTool(tool)], goVersion).then(() => {
                        if (tool === 'gopls') {
                            if (goConfig.get('useLanguageServer') === false) {
                                goConfig.update('useLanguageServer', true, vscode.ConfigurationTarget.Global);
                            }
                            if (goConfig.inspect('useLanguageServer').workspaceFolderValue === false) {
                                goConfig.update('useLanguageServer', true, vscode.ConfigurationTarget.WorkspaceFolder);
                            }
                            const reloadMsg = 'Reload VS Code window to enable the use of Go language server';
                            vscode.window.showInformationMessage(reloadMsg, 'Reload').then((selectedForReload) => {
                                if (selectedForReload === 'Reload') {
                                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                                }
                            });
                        }
                    });
                }
                promptedToolsForModules[tool] = true;
                stateUtils_1.updateGlobalState('promptedToolsForModules', promptedToolsForModules);
                break;
            case `Don't show again`:
                promptedToolsForModules[tool] = true;
                stateUtils_1.updateGlobalState('promptedToolsForModules', promptedToolsForModules);
                break;
            case 'Later':
            default:
                promptedToolsForCurrentSession.add(tool);
                break;
        }
        return choseToUpdate;
    });
}
exports.promptToUpdateToolForModules = promptToUpdateToolForModules;
const folderToPackageMapping = {};
function getCurrentPackage(cwd) {
    return __awaiter(this, void 0, void 0, function* () {
        if (folderToPackageMapping[cwd]) {
            return folderToPackageMapping[cwd];
        }
        const moduleCache = util_1.getModuleCache();
        if (cwd.startsWith(moduleCache)) {
            let importPath = cwd.substr(moduleCache.length + 1);
            const matches = /@v\d+(\.\d+)?(\.\d+)?/.exec(importPath);
            if (matches) {
                importPath = importPath.substr(0, matches.index);
            }
            folderToPackageMapping[cwd] = importPath;
            return importPath;
        }
        const goRuntimePath = util_1.getBinPath('go');
        if (!goRuntimePath) {
            console.warn(`Failed to run "go list" to find current package as the "go" binary cannot be found in either GOROOT(${process.env['GOROOT']}) or PATH(${goPath_1.envPath})`);
            return;
        }
        return new Promise((resolve) => {
            const childProcess = cp.spawn(goRuntimePath, ['list'], { cwd, env: util_1.getToolsEnvVars() });
            const chunks = [];
            childProcess.stdout.on('data', (stdout) => {
                chunks.push(stdout);
            });
            childProcess.on('close', () => {
                // Ignore lines that are empty or those that have logs about updating the module cache
                const pkgs = chunks
                    .join('')
                    .toString()
                    .split('\n')
                    .filter((line) => line && line.indexOf(' ') === -1);
                if (pkgs.length !== 1) {
                    resolve();
                    return;
                }
                folderToPackageMapping[cwd] = pkgs[0];
                resolve(pkgs[0]);
            });
        });
    });
}
exports.getCurrentPackage = getCurrentPackage;
//# sourceMappingURL=goModules.js.map