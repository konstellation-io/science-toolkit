/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const goInstallTools_1 = require("./goInstallTools");
const goModules_1 = require("./goModules");
const stateUtils_1 = require("./stateUtils");
const telemetry_1 = require("./telemetry");
const util_1 = require("./util");
class GoDebugConfigurationProvider {
    provideDebugConfigurations(folder, token) {
        return [
            {
                name: 'Launch',
                type: 'go',
                request: 'launch',
                mode: 'auto',
                program: '${fileDirname}',
                env: {},
                args: []
            }
        ];
    }
    resolveDebugConfiguration(folder, debugConfiguration, token) {
        if (debugConfiguration) {
            telemetry_1.sendTelemetryEventForDebugConfiguration(debugConfiguration);
        }
        const activeEditor = vscode.window.activeTextEditor;
        if (!debugConfiguration || !debugConfiguration.request) {
            // if 'request' is missing interpret this as a missing launch.json
            if (!activeEditor || activeEditor.document.languageId !== 'go') {
                return;
            }
            debugConfiguration = {
                name: 'Launch',
                type: 'go',
                request: 'launch',
                mode: 'auto',
                program: activeEditor.document.fileName
            };
        }
        debugConfiguration['packagePathToGoModPathMap'] = goModules_1.packagePathToGoModPathMap;
        const gopath = util_1.getCurrentGoPath(folder ? folder.uri : undefined);
        if (!debugConfiguration['env']) {
            debugConfiguration['env'] = { GOPATH: gopath };
        }
        else if (!debugConfiguration['env']['GOPATH']) {
            debugConfiguration['env']['GOPATH'] = gopath;
        }
        const goConfig = util_1.getGoConfig(folder && folder.uri);
        const goToolsEnvVars = util_1.getToolsEnvVars();
        Object.keys(goToolsEnvVars).forEach((key) => {
            if (!debugConfiguration['env'].hasOwnProperty(key)) {
                debugConfiguration['env'][key] = goToolsEnvVars[key];
            }
        });
        const dlvConfig = goConfig.get('delveConfig');
        let useApiV1 = false;
        if (debugConfiguration.hasOwnProperty('useApiV1')) {
            useApiV1 = debugConfiguration['useApiV1'] === true;
        }
        else if (dlvConfig.hasOwnProperty('useApiV1')) {
            useApiV1 = dlvConfig['useApiV1'] === true;
        }
        if (useApiV1) {
            debugConfiguration['apiVersion'] = 1;
        }
        if (!debugConfiguration.hasOwnProperty('apiVersion') && dlvConfig.hasOwnProperty('apiVersion')) {
            debugConfiguration['apiVersion'] = dlvConfig['apiVersion'];
        }
        if (!debugConfiguration.hasOwnProperty('dlvLoadConfig') && dlvConfig.hasOwnProperty('dlvLoadConfig')) {
            debugConfiguration['dlvLoadConfig'] = dlvConfig['dlvLoadConfig'];
        }
        if (!debugConfiguration.hasOwnProperty('showGlobalVariables') &&
            dlvConfig.hasOwnProperty('showGlobalVariables')) {
            debugConfiguration['showGlobalVariables'] = dlvConfig['showGlobalVariables'];
        }
        if (debugConfiguration.request === 'attach' && !debugConfiguration['cwd']) {
            debugConfiguration['cwd'] = '${workspaceFolder}';
        }
        debugConfiguration['dlvToolPath'] = util_1.getBinPath('dlv');
        if (!path.isAbsolute(debugConfiguration['dlvToolPath'])) {
            goInstallTools_1.promptForMissingTool('dlv');
            return;
        }
        if (debugConfiguration['mode'] === 'auto') {
            debugConfiguration['mode'] =
                activeEditor && activeEditor.document.fileName.endsWith('_test.go') ? 'test' : 'debug';
        }
        debugConfiguration['currentFile'] =
            activeEditor && activeEditor.document.languageId === 'go' && activeEditor.document.fileName;
        const neverAgain = { title: `Don't Show Again` };
        const ignoreWarningKey = 'ignoreDebugLaunchRemoteWarning';
        const ignoreWarning = stateUtils_1.getFromGlobalState(ignoreWarningKey);
        if (ignoreWarning !== true &&
            debugConfiguration.request === 'launch' &&
            debugConfiguration['mode'] === 'remote') {
            vscode.window
                .showWarningMessage(`Request type of 'launch' with mode 'remote' is deprecated, please use request type 'attach' with mode 'remote' instead.`, neverAgain)
                .then((result) => {
                if (result === neverAgain) {
                    stateUtils_1.updateGlobalState(ignoreWarningKey, true);
                }
            });
        }
        return debugConfiguration;
    }
}
exports.GoDebugConfigurationProvider = GoDebugConfigurationProvider;
//# sourceMappingURL=goDebugConfiguration.js.map