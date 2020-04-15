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
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const goLanguageServer_1 = require("./goLanguageServer");
const goPath_1 = require("./goPath");
const goStatus_1 = require("./goStatus");
const goTools_1 = require("./goTools");
const util_1 = require("./util");
// declinedUpdates tracks the tools that the user has declined to update.
const declinedUpdates = [];
// declinedUpdates tracks the tools that the user has declined to install.
const declinedInstalls = [];
function installAllTools(updateExistingToolsOnly = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const goVersion = yield util_1.getGoVersion();
        const allTools = goTools_1.getConfiguredTools(goVersion);
        // Update existing tools by finding all tools the user has already installed.
        if (updateExistingToolsOnly) {
            installTools(allTools.filter((tool) => {
                const toolPath = util_1.getBinPath(tool.name);
                return toolPath && path.isAbsolute(toolPath);
            }), goVersion);
            return;
        }
        // Otherwise, allow the user to select which tools to install or update.
        vscode.window
            .showQuickPick(allTools.map((x) => {
            const item = {
                label: x.name,
                description: x.description
            };
            return item;
        }), {
            canPickMany: true,
            placeHolder: 'Select the tools to install/update.'
        })
            .then((selectedTools) => {
            if (!selectedTools) {
                return;
            }
            installTools(selectedTools.map((x) => goTools_1.getTool(x.label)), goVersion);
        });
    });
}
exports.installAllTools = installAllTools;
/**
 * Installs given array of missing tools. If no input is given, the all tools are installed
 *
 * @param string[] array of tool names to be installed
 */
function installTools(missing, goVersion) {
    const goRuntimePath = util_1.getBinPath('go');
    if (!goRuntimePath) {
        vscode.window.showErrorMessage(`Failed to run "go get" to install the packages as the "go" binary cannot be found in either GOROOT(${process.env['GOROOT']}) or PATH(${goPath_1.envPath})`);
        return;
    }
    if (!missing) {
        return;
    }
    // http.proxy setting takes precedence over environment variables
    const httpProxy = vscode.workspace.getConfiguration('http', null).get('proxy');
    let envForTools = Object.assign({}, process.env);
    if (httpProxy) {
        envForTools = Object.assign({}, process.env, {
            http_proxy: httpProxy,
            HTTP_PROXY: httpProxy,
            https_proxy: httpProxy,
            HTTPS_PROXY: httpProxy
        });
    }
    goStatus_1.outputChannel.show();
    goStatus_1.outputChannel.clear();
    // If the go.toolsGopath is set, use its value as the GOPATH for the "go get" child process.
    // Else use the Current Gopath
    let toolsGopath = util_1.getToolsGopath();
    if (toolsGopath) {
        // User has explicitly chosen to use toolsGopath, so ignore GOBIN
        envForTools['GOBIN'] = '';
        goStatus_1.outputChannel.appendLine(`Using the value ${toolsGopath} from the go.toolsGopath setting.`);
    }
    else {
        toolsGopath = util_1.getCurrentGoPath();
        goStatus_1.outputChannel.appendLine(`go.toolsGopath setting is not set. Using GOPATH ${toolsGopath}`);
    }
    if (toolsGopath) {
        const paths = toolsGopath.split(path.delimiter);
        toolsGopath = paths[0];
        envForTools['GOPATH'] = toolsGopath;
    }
    else {
        const msg = 'Cannot install Go tools. Set either go.gopath or go.toolsGopath in settings.';
        vscode.window.showInformationMessage(msg, 'Open User Settings', 'Open Workspace Settings').then((selected) => {
            switch (selected) {
                case 'Open User Settings':
                    vscode.commands.executeCommand('workbench.action.openGlobalSettings');
                    break;
                case 'Open Workspace Settings':
                    vscode.commands.executeCommand('workbench.action.openWorkspaceSettings');
                    break;
            }
        });
        return;
    }
    let installingMsg = `Installing ${missing.length} ${missing.length > 1 ? 'tools' : 'tool'} at `;
    if (envForTools['GOBIN']) {
        installingMsg += `the configured GOBIN: ${envForTools['GOBIN']}`;
    }
    else {
        installingMsg += toolsGopath + path.sep + 'bin';
    }
    // If the user is on Go >= 1.11, tools should be installed with modules enabled.
    // This ensures that users get the latest tagged version, rather than master,
    // which may be unstable.
    let modulesOff = false;
    if (goVersion.lt('1.11')) {
        modulesOff = true;
    }
    else {
        installingMsg += ' in module mode.';
    }
    goStatus_1.outputChannel.appendLine(installingMsg);
    missing.forEach((missingTool) => {
        goStatus_1.outputChannel.appendLine('  ' + missingTool.name);
    });
    goStatus_1.outputChannel.appendLine(''); // Blank line for spacing.
    // Install tools in a temporary directory, to avoid altering go.mod files.
    const toolsTmpDir = fs.mkdtempSync(util_1.getTempFilePath('go-tools-'));
    return missing
        .reduce((res, tool) => {
        return res.then((sofar) => new Promise((resolve, reject) => {
            // Disable modules for tools which are installed with the "..." wildcard.
            // TODO: ... will be supported in Go 1.13, so enable these tools to use modules then.
            const modulesOffForTool = modulesOff || goTools_1.disableModulesForWildcard(tool, goVersion);
            let tmpGoModFile;
            if (modulesOffForTool) {
                envForTools['GO111MODULE'] = 'off';
            }
            else {
                envForTools['GO111MODULE'] = 'on';
                // Write a temporary go.mod file to avoid version conflicts.
                tmpGoModFile = path.join(toolsTmpDir, 'go.mod');
                fs.writeFileSync(tmpGoModFile, 'module tools');
            }
            const opts = {
                env: envForTools,
                cwd: toolsTmpDir
            };
            const callback = (err, stdout, stderr) => {
                // Make sure to delete the temporary go.mod file, if it exists.
                if (tmpGoModFile && fs.existsSync(tmpGoModFile)) {
                    fs.unlinkSync(tmpGoModFile);
                }
                if (err) {
                    goStatus_1.outputChannel.appendLine('Installing ' + goTools_1.getImportPath(tool, goVersion) + ' FAILED');
                    const failureReason = tool.name + ';;' + err + stdout.toString() + stderr.toString();
                    resolve([...sofar, failureReason]);
                }
                else {
                    goStatus_1.outputChannel.appendLine('Installing ' + goTools_1.getImportPath(tool, goVersion) + ' SUCCEEDED');
                    resolve([...sofar, null]);
                }
            };
            let closeToolPromise = Promise.resolve(true);
            const toolBinPath = util_1.getBinPath(tool.name);
            if (path.isAbsolute(toolBinPath) && goTools_1.isGocode(tool)) {
                closeToolPromise = new Promise((innerResolve) => {
                    cp.execFile(toolBinPath, ['close'], {}, (err, stdout, stderr) => {
                        if (stderr && stderr.indexOf(`rpc: can't find service Server.`) > -1) {
                            goStatus_1.outputChannel.appendLine('Installing gocode aborted as existing process cannot be closed. Please kill the running process for gocode and try again.');
                            return innerResolve(false);
                        }
                        innerResolve(true);
                    });
                });
            }
            closeToolPromise.then((success) => {
                if (!success) {
                    resolve([...sofar, null]);
                    return;
                }
                const args = ['get', '-v'];
                // Only get tools at master if we are not using modules.
                if (modulesOffForTool) {
                    args.push('-u');
                }
                // Tools with a "mod" suffix should not be installed,
                // instead we run "go build -o" to rename them.
                if (goTools_1.hasModSuffix(tool)) {
                    args.push('-d');
                }
                args.push(goTools_1.getImportPath(tool, goVersion));
                cp.execFile(goRuntimePath, args, opts, (err, stdout, stderr) => {
                    if (stderr.indexOf('unexpected directory layout:') > -1) {
                        goStatus_1.outputChannel.appendLine(`Installing ${tool.name} failed with error "unexpected directory layout". Retrying...`);
                        cp.execFile(goRuntimePath, args, opts, callback);
                    }
                    else if (!err && goTools_1.hasModSuffix(tool)) {
                        const outputFile = path.join(toolsGopath, 'bin', process.platform === 'win32' ? `${tool.name}.exe` : tool.name);
                        cp.execFile(goRuntimePath, ['build', '-o', outputFile, goTools_1.getImportPath(tool, goVersion)], opts, callback);
                    }
                    else {
                        callback(err, stdout, stderr);
                    }
                });
            });
        }));
    }, Promise.resolve([]))
        .then((res) => {
        goStatus_1.outputChannel.appendLine(''); // Blank line for spacing
        const failures = res.filter((x) => x != null);
        if (failures.length === 0) {
            if (goTools_1.containsString(missing, 'go-langserver') || goTools_1.containsString(missing, 'gopls')) {
                goStatus_1.outputChannel.appendLine('Reload VS Code window to use the Go language server');
            }
            goStatus_1.outputChannel.appendLine('All tools successfully installed. You are ready to Go :).');
            return;
        }
        goStatus_1.outputChannel.appendLine(failures.length + ' tools failed to install.\n');
        failures.forEach((failure) => {
            const reason = failure.split(';;');
            goStatus_1.outputChannel.appendLine(reason[0] + ':');
            goStatus_1.outputChannel.appendLine(reason[1]);
        });
    });
}
exports.installTools = installTools;
function promptForMissingTool(toolName) {
    return __awaiter(this, void 0, void 0, function* () {
        const tool = goTools_1.getTool(toolName);
        // If user has declined to install this tool, don't prompt for it.
        if (goTools_1.containsTool(declinedInstalls, tool)) {
            return;
        }
        const goVersion = yield util_1.getGoVersion();
        // Show error messages for outdated tools.
        if (goVersion.lt('1.9')) {
            let outdatedErrorMsg;
            switch (tool.name) {
                case 'golint':
                    outdatedErrorMsg =
                        'golint no longer supports go1.8 or below, update your settings to use golangci-lint as go.lintTool and install golangci-lint';
                    break;
                case 'gotests':
                    outdatedErrorMsg =
                        'Generate unit tests feature is not supported as gotests tool needs go1.9 or higher.';
                    break;
            }
            if (outdatedErrorMsg) {
                vscode.window.showInformationMessage(outdatedErrorMsg);
                return;
            }
        }
        const installOptions = ['Install'];
        let missing = yield getMissingTools(goVersion);
        if (!goTools_1.containsTool(missing, tool)) {
            return;
        }
        missing = missing.filter((x) => x === tool || tool.isImportant);
        if (missing.length > 1) {
            // Offer the option to install all tools.
            installOptions.push('Install All');
        }
        const msg = `The "${tool.name}" command is not available. Run "go get -v ${goTools_1.getImportPath(tool, goVersion)}" to install.`;
        vscode.window.showInformationMessage(msg, ...installOptions).then((selected) => {
            switch (selected) {
                case 'Install':
                    installTools([tool], goVersion);
                    break;
                case 'Install All':
                    installTools(missing, goVersion);
                    goStatus_1.hideGoStatus();
                    break;
                default:
                    // The user has declined to install this tool.
                    declinedInstalls.push(tool);
                    break;
            }
        });
    });
}
exports.promptForMissingTool = promptForMissingTool;
function promptForUpdatingTool(toolName) {
    return __awaiter(this, void 0, void 0, function* () {
        const tool = goTools_1.getTool(toolName);
        // If user has declined to update, then don't prompt.
        if (goTools_1.containsTool(declinedUpdates, tool)) {
            return;
        }
        const goVersion = yield util_1.getGoVersion();
        const updateMsg = `Your version of ${tool.name} appears to be out of date. Please update for an improved experience.`;
        vscode.window.showInformationMessage(updateMsg, 'Update').then((selected) => {
            switch (selected) {
                case 'Update':
                    installTools([tool], goVersion);
                    break;
                default:
                    declinedUpdates.push(tool);
                    break;
            }
        });
    });
}
exports.promptForUpdatingTool = promptForUpdatingTool;
function updateGoPathGoRootFromConfig() {
    const goroot = util_1.getGoConfig()['goroot'];
    if (goroot) {
        process.env['GOROOT'] = util_1.resolvePath(goroot);
    }
    if (process.env['GOPATH'] && process.env['GOROOT'] && process.env['GOPROXY']) {
        return Promise.resolve();
    }
    // If GOPATH is still not set, then use the one from `go env`
    const goRuntimePath = util_1.getBinPath('go');
    if (!goRuntimePath) {
        vscode.window.showErrorMessage(`Failed to run "go env" to find GOPATH as the "go" binary cannot be found in either GOROOT(${process.env['GOROOT']}) or PATH(${goPath_1.envPath})`);
        return;
    }
    const goRuntimeBasePath = path.dirname(goRuntimePath);
    // cgo and a few other Go tools expect Go binary to be in the path
    let pathEnvVar;
    if (process.env.hasOwnProperty('PATH')) {
        pathEnvVar = 'PATH';
    }
    else if (process.platform === 'win32' && process.env.hasOwnProperty('Path')) {
        pathEnvVar = 'Path';
    }
    if (goRuntimeBasePath &&
        pathEnvVar &&
        process.env[pathEnvVar] &&
        process.env[pathEnvVar].split(path.delimiter).indexOf(goRuntimeBasePath) === -1) {
        process.env[pathEnvVar] += path.delimiter + goRuntimeBasePath;
    }
    return new Promise((resolve, reject) => {
        cp.execFile(goRuntimePath, ['env', 'GOPATH', 'GOROOT', 'GOPROXY'], (err, stdout, stderr) => {
            if (err) {
                return reject();
            }
            const envOutput = stdout.split('\n');
            if (!process.env['GOPATH'] && envOutput[0].trim()) {
                process.env['GOPATH'] = envOutput[0].trim();
            }
            if (!process.env['GOROOT'] && envOutput[1] && envOutput[1].trim()) {
                process.env['GOROOT'] = envOutput[1].trim();
            }
            if (!process.env['GOPROXY'] && envOutput[2] && envOutput[2].trim()) {
                process.env['GOPROXY'] = envOutput[2].trim();
            }
            return resolve();
        });
    });
}
exports.updateGoPathGoRootFromConfig = updateGoPathGoRootFromConfig;
let alreadyOfferedToInstallTools = false;
function offerToInstallTools() {
    return __awaiter(this, void 0, void 0, function* () {
        if (alreadyOfferedToInstallTools) {
            return;
        }
        alreadyOfferedToInstallTools = true;
        const goVersion = yield util_1.getGoVersion();
        let missing = yield getMissingTools(goVersion);
        missing = missing.filter((x) => x.isImportant);
        if (missing.length > 0) {
            goStatus_1.showGoStatus('Analysis Tools Missing', 'go.promptforinstall', 'Not all Go tools are available on the GOPATH');
            vscode.commands.registerCommand('go.promptforinstall', () => {
                const installItem = {
                    title: 'Install',
                    command() {
                        goStatus_1.hideGoStatus();
                        installTools(missing, goVersion);
                    }
                };
                const showItem = {
                    title: 'Show',
                    command() {
                        goStatus_1.outputChannel.clear();
                        goStatus_1.outputChannel.appendLine('Below tools are needed for the basic features of the Go extension.');
                        missing.forEach((x) => goStatus_1.outputChannel.appendLine(x.name));
                    }
                };
                vscode.window
                    .showInformationMessage('Failed to find some of the Go analysis tools. Would you like to install them?', installItem, showItem)
                    .then((selection) => {
                    if (selection) {
                        selection.command();
                    }
                    else {
                        goStatus_1.hideGoStatus();
                    }
                });
            });
        }
        const usingSourceGraph = goPath_1.getToolFromToolPath(goLanguageServer_1.getLanguageServerToolPath()) === 'go-langserver';
        if (usingSourceGraph && goVersion.gt('1.10')) {
            const promptMsg = 'The language server from Sourcegraph is no longer under active development and it does not support Go modules as well. Please install and use the language server from Google or disable the use of language servers altogether.';
            const disableLabel = 'Disable language server';
            const installLabel = 'Install';
            vscode.window.showInformationMessage(promptMsg, installLabel, disableLabel).then((selected) => {
                if (selected === installLabel) {
                    installTools([goTools_1.getTool('gopls')], goVersion).then(() => {
                        vscode.window.showInformationMessage('Reload VS Code window to enable the use of Go language server');
                    });
                }
                else if (selected === disableLabel) {
                    const goConfig = util_1.getGoConfig();
                    const inspectLanguageServerSetting = goConfig.inspect('useLanguageServer');
                    if (inspectLanguageServerSetting.globalValue === true) {
                        goConfig.update('useLanguageServer', false, vscode.ConfigurationTarget.Global);
                    }
                    else if (inspectLanguageServerSetting.workspaceFolderValue === true) {
                        goConfig.update('useLanguageServer', false, vscode.ConfigurationTarget.WorkspaceFolder);
                    }
                }
            });
        }
    });
}
exports.offerToInstallTools = offerToInstallTools;
function getMissingTools(goVersion) {
    const keys = goTools_1.getConfiguredTools(goVersion);
    return Promise.all(keys.map((tool) => new Promise((resolve, reject) => {
        const toolPath = util_1.getBinPath(tool.name);
        fs.exists(toolPath, (exists) => {
            resolve(exists ? null : tool);
        });
    }))).then((res) => {
        return res.filter((x) => x != null);
    });
}
//# sourceMappingURL=goInstallTools.js.map