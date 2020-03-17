"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
exports.extensionId = 'ms-vscode.Go';
const extension = vscode.extensions.getExtension(exports.extensionId);
const extensionVersion = extension ? extension.packageJSON.version : '';
const aiKey = 'AIF-d9b70cd4-b9f9-4d70-929b-a071c400b217';
function sendTelemetryEventForModulesUsage() {
    /* __GDPR__
        "modules" : {}
    */
    sendTelemetryEvent('modules');
}
exports.sendTelemetryEventForModulesUsage = sendTelemetryEventForModulesUsage;
function sendTelemetryEventForAddImportCmd(arg) {
    /* __GDPR__
        "addImportCmd" : {
            "from" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        }
    */
    sendTelemetryEvent('addImportCmd', { from: (arg && arg.from) || 'cmd' });
}
exports.sendTelemetryEventForAddImportCmd = sendTelemetryEventForAddImportCmd;
function sendTelemetryEventForGopkgs(timeTaken) {
    /* __GDPR__
        "gopkgs" : {
            "tool" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "timeTaken": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true }
        }
    */
    sendTelemetryEvent('gopkgs', {}, { timeTaken });
}
exports.sendTelemetryEventForGopkgs = sendTelemetryEventForGopkgs;
function sendTelemetryEventForFormatting(formatTool, timeTaken) {
    /* __GDPR__
        "format" : {
            "tool" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "timeTaken": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true }
        }
    */
    sendTelemetryEvent('format', { tool: formatTool }, { timeTaken });
}
exports.sendTelemetryEventForFormatting = sendTelemetryEventForFormatting;
function sendTelemetryEventForDebugConfiguration(debugConfiguration) {
    /* __GDPR__
        "debugConfiguration" : {
            "request" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "mode" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "useApiV<NUMBER>": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "apiVersion": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "stopOnEntry": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        }
    */
    sendTelemetryEvent('debugConfiguration', {
        request: debugConfiguration.request,
        mode: debugConfiguration.mode,
        useApiV1: debugConfiguration.useApiV1,
        apiVersion: debugConfiguration.apiVersion,
        stopOnEntry: debugConfiguration.stopOnEntry
    });
}
exports.sendTelemetryEventForDebugConfiguration = sendTelemetryEventForDebugConfiguration;
function sendTelemetryEventForConfig(goConfig) {
    /* __GDPR__
        "goConfig" : {
            "buildOnSave" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "buildFlags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
            "buildTags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
            "formatTool": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "formatFlags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
            "generateTestsFlags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
            "lintOnSave": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "lintFlags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
            "lintTool": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "vetOnSave": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "vetFlags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
            "testOnSave": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "testFlags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
            "coverOnSave": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "coverOnTestPackage": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "coverageDecorator": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "coverageOptions": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "gopath": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
            "goroot": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
            "inferGopath": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "toolsGopath": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
            "gocodeAutoBuild": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "gocodePackageLookupMode": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "useCodeSnippetsOnFunctionSuggest": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "useCodeSnippetsOnFunctionSuggestWithoutType": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "autocompleteUnimportedPackages": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "docsTool": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "useLanguageServer": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "languageServerExperimentalFeatures": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "includeImports": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "addTags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
            "removeTags": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
            "editorContextMenuCommands": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "liveErrors": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "codeLens": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "alternateTools": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
            "useGoProxyToCheckForToolUpdates": { "classification": "CustomerContent", "purpose": "FeatureInsight" }
        }
    */
    sendTelemetryEvent('goConfig', {
        buildOnSave: goConfig['buildOnSave'] + '',
        buildFlags: goConfig['buildFlags'],
        buildTags: goConfig['buildTags'],
        formatOnSave: goConfig['formatOnSave'] + '',
        formatTool: goConfig['formatTool'],
        formatFlags: goConfig['formatFlags'],
        lintOnSave: goConfig['lintOnSave'] + '',
        lintFlags: goConfig['lintFlags'],
        lintTool: goConfig['lintTool'],
        generateTestsFlags: goConfig['generateTestsFlags'],
        vetOnSave: goConfig['vetOnSave'] + '',
        vetFlags: goConfig['vetFlags'],
        testOnSave: goConfig['testOnSave'] + '',
        testFlags: goConfig['testFlags'],
        coverOnSave: goConfig['coverOnSave'] + '',
        coverOnTestPackage: goConfig['coverOnTestPackage'] + '',
        coverageDecorator: goConfig['coverageDecorator'],
        coverageOptions: goConfig['coverageOptions'],
        gopath: goConfig['gopath'] ? 'set' : '',
        goroot: goConfig['goroot'] ? 'set' : '',
        inferGopath: goConfig['inferGopath'] + '',
        toolsGopath: goConfig['toolsGopath'] ? 'set' : '',
        gocodeAutoBuild: goConfig['gocodeAutoBuild'] + '',
        gocodePackageLookupMode: goConfig['gocodePackageLookupMode'] + '',
        useCodeSnippetsOnFunctionSuggest: goConfig['useCodeSnippetsOnFunctionSuggest'] + '',
        useCodeSnippetsOnFunctionSuggestWithoutType: goConfig['useCodeSnippetsOnFunctionSuggestWithoutType'] + '',
        autocompleteUnimportedPackages: goConfig['autocompleteUnimportedPackages'] + '',
        docsTool: goConfig['docsTool'],
        useLanguageServer: goConfig['useLanguageServer'] + '',
        languageServerExperimentalFeatures: JSON.stringify(goConfig['languageServerExperimentalFeatures']),
        includeImports: goConfig['gotoSymbol'] && goConfig['gotoSymbol']['includeImports'] + '',
        addTags: JSON.stringify(goConfig['addTags']),
        removeTags: JSON.stringify(goConfig['removeTags']),
        editorContextMenuCommands: JSON.stringify(goConfig['editorContextMenuCommands']),
        liveErrors: JSON.stringify(goConfig['liveErrors']),
        codeLens: JSON.stringify(goConfig['enableCodeLens']),
        alternateTools: JSON.stringify(goConfig['alternateTools']),
        useGoProxyToCheckForToolUpdates: goConfig['useGoProxyToCheckForToolUpdates'] + ''
    });
}
exports.sendTelemetryEventForConfig = sendTelemetryEventForConfig;
function sendTelemetryEventForKillingProcess(msg, matches) {
    /* __GDPR__
        "errorKillingProcess" : {
            "message" : { "classification": "CallstackOrException", "purpose": "PerformanceAndHealth" },
            "stack": { "classification": "CallstackOrException", "purpose": "PerformanceAndHealth" }
        }
    */
    sendTelemetryEvent('errorKillingProcess', { message: msg, stack: matches });
}
exports.sendTelemetryEventForKillingProcess = sendTelemetryEventForKillingProcess;
function sendTelemetryEventForGoVersion(goVersion) {
    /* __GDPR__
        "getGoVersion" : {
            "version" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        }
    */
    sendTelemetryEvent('getGoVersion', { version: `${goVersion}` });
}
exports.sendTelemetryEventForGoVersion = sendTelemetryEventForGoVersion;
function disposeTelemetryReporter() {
    if (telemtryReporter) {
        return telemtryReporter.dispose();
    }
    return Promise.resolve(null);
}
exports.disposeTelemetryReporter = disposeTelemetryReporter;
let telemtryReporter;
function sendTelemetryEvent(eventName, properties, measures) {
    telemtryReporter = telemtryReporter
        ? telemtryReporter
        : new vscode_extension_telemetry_1.default(exports.extensionId, extensionVersion, aiKey);
    telemtryReporter.sendTelemetryEvent(eventName, properties, measures);
}
//# sourceMappingURL=telemetry.js.map