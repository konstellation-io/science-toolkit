"use strict";
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
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
const cp = require("child_process");
const path = require("path");
const util = require("util");
const vscode = require("vscode");
const goCover_1 = require("./goCover");
const goModules_1 = require("./goModules");
const goOutline_1 = require("./goOutline");
const goPackages_1 = require("./goPackages");
const goPath_1 = require("./goPath");
const util_1 = require("./util");
const sendSignal = 'SIGKILL';
const outputChannel = vscode.window.createOutputChannel('Go Tests');
const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
statusBarItem.command = 'go.test.cancel';
statusBarItem.text = '$(x) Cancel Running Tests';
/**
 *  testProcesses holds a list of currently running test processes.
 */
const runningTestProcesses = [];
const testFuncRegex = /^Test.*|^Example.*/;
const testMethodRegex = /^\(([^)]+)\)\.(Test.*)$/;
const benchmarkRegex = /^Benchmark.*/;
function getTestEnvVars(config) {
    const envVars = util_1.getToolsEnvVars();
    const testEnvConfig = config['testEnvVars'] || {};
    let fileEnv = {};
    let testEnvFile = config['testEnvFile'];
    if (testEnvFile) {
        testEnvFile = util_1.resolvePath(testEnvFile);
        try {
            fileEnv = goPath_1.parseEnvFile(testEnvFile);
        }
        catch (e) {
            console.log(e);
        }
    }
    Object.keys(fileEnv).forEach((key) => (envVars[key] = typeof fileEnv[key] === 'string' ? util_1.resolvePath(fileEnv[key]) : fileEnv[key]));
    Object.keys(testEnvConfig).forEach((key) => (envVars[key] =
        typeof testEnvConfig[key] === 'string' ? util_1.resolvePath(testEnvConfig[key]) : testEnvConfig[key]));
    return envVars;
}
exports.getTestEnvVars = getTestEnvVars;
function getTestFlags(goConfig, args) {
    let testFlags = goConfig['testFlags'] || goConfig['buildFlags'] || [];
    testFlags = testFlags.map((x) => util_1.resolvePath(x)); // Use copy of the flags, dont pass the actual object from config
    return args && args.hasOwnProperty('flags') && Array.isArray(args['flags']) ? args['flags'] : testFlags;
}
exports.getTestFlags = getTestFlags;
function getTestTags(goConfig) {
    return goConfig['testTags'] !== null ? goConfig['testTags'] : goConfig['buildTags'];
}
exports.getTestTags = getTestTags;
/**
 * Returns all Go unit test functions in the given source file.
 *
 * @param the URI of a Go source file.
 * @return test function symbols for the source file.
 */
function getTestFunctions(doc, token) {
    const documentSymbolProvider = new goOutline_1.GoDocumentSymbolProvider(true);
    return documentSymbolProvider
        .provideDocumentSymbols(doc, token)
        .then((symbols) => symbols[0].children)
        .then((symbols) => {
        const testify = symbols.some((sym) => sym.kind === vscode.SymbolKind.Namespace && sym.name === '"github.com/stretchr/testify/suite"');
        return symbols.filter((sym) => sym.kind === vscode.SymbolKind.Function &&
            (testFuncRegex.test(sym.name) || (testify && testMethodRegex.test(sym.name))));
    });
}
exports.getTestFunctions = getTestFunctions;
/**
 * Extracts test method name of a suite test function.
 * For example a symbol with name "(*testSuite).TestMethod" will return "TestMethod".
 *
 * @param symbolName Symbol Name to extract method name from.
 */
function extractInstanceTestName(symbolName) {
    const match = symbolName.match(testMethodRegex);
    if (!match || match.length !== 3) {
        return null;
    }
    return match[2];
}
exports.extractInstanceTestName = extractInstanceTestName;
/**
 * Gets the appropriate debug arguments for a debug session on a test function.
 * @param document  The document containing the tests
 * @param testFunctionName The test function to get the debug args
 * @param testFunctions The test functions found in the document
 */
function getTestFunctionDebugArgs(document, testFunctionName, testFunctions) {
    if (benchmarkRegex.test(testFunctionName)) {
        return ['-test.bench', '^' + testFunctionName + '$', '-test.run', 'a^'];
    }
    const instanceMethod = extractInstanceTestName(testFunctionName);
    if (instanceMethod) {
        const testFns = findAllTestSuiteRuns(document, testFunctions);
        const testSuiteRuns = ['-test.run', `^${testFns.map((t) => t.name).join('|')}$`];
        const testSuiteTests = ['-testify.m', `^${instanceMethod}$`];
        return [...testSuiteRuns, ...testSuiteTests];
    }
    else {
        return ['-test.run', `^${testFunctionName}$`];
    }
}
exports.getTestFunctionDebugArgs = getTestFunctionDebugArgs;
/**
 * Finds test methods containing "suite.Run()" call.
 *
 * @param doc Editor document
 * @param allTests All test functions
 */
function findAllTestSuiteRuns(doc, allTests) {
    // get non-instance test functions
    const testFunctions = allTests.filter((t) => !testMethodRegex.test(t.name));
    // filter further to ones containing suite.Run()
    return testFunctions.filter((t) => doc.getText(t.range).includes('suite.Run('));
}
exports.findAllTestSuiteRuns = findAllTestSuiteRuns;
/**
 * Returns all Benchmark functions in the given source file.
 *
 * @param the URI of a Go source file.
 * @return benchmark function symbols for the source file.
 */
function getBenchmarkFunctions(doc, token) {
    const documentSymbolProvider = new goOutline_1.GoDocumentSymbolProvider();
    return documentSymbolProvider
        .provideDocumentSymbols(doc, token)
        .then((symbols) => symbols[0].children)
        .then((symbols) => symbols.filter((sym) => sym.kind === vscode.SymbolKind.Function && benchmarkRegex.test(sym.name)));
}
exports.getBenchmarkFunctions = getBenchmarkFunctions;
/**
 * Runs go test and presents the output in the 'Go' channel.
 *
 * @param goConfig Configuration for the Go extension.
 */
function goTest(testconfig) {
    return __awaiter(this, void 0, void 0, function* () {
        const tmpCoverPath = util_1.getTempFilePath('go-code-cover');
        const testResult = yield new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            // We do not want to clear it if tests are already running, as that could
            // lose valuable output.
            if (runningTestProcesses.length < 1) {
                outputChannel.clear();
            }
            if (!testconfig.background) {
                outputChannel.show(true);
            }
            const testTags = getTestTags(testconfig.goConfig);
            const args = ['test'];
            const testType = testconfig.isBenchmark ? 'Benchmarks' : 'Tests';
            if (testconfig.isBenchmark) {
                args.push('-benchmem', '-run=^$');
            }
            else {
                args.push('-timeout', testconfig.goConfig['testTimeout']);
                if (testconfig.applyCodeCoverage) {
                    args.push('-coverprofile=' + tmpCoverPath);
                }
            }
            if (testTags && testconfig.flags.indexOf('-tags') === -1) {
                args.push('-tags', testTags);
            }
            const testEnvVars = getTestEnvVars(testconfig.goConfig);
            const goRuntimePath = util_1.getBinPath('go');
            if (!goRuntimePath) {
                vscode.window.showErrorMessage(`Failed to run "go test" as the "go" binary cannot be found in either GOROOT(${process.env['GOROOT']}) or PATH(${goPath_1.envPath})`);
                return Promise.resolve();
            }
            const currentGoWorkspace = testconfig.isMod
                ? ''
                : goPath_1.getCurrentGoWorkspaceFromGOPATH(util_1.getCurrentGoPath(), testconfig.dir);
            let targets = targetArgs(testconfig);
            let getCurrentPackagePromise = Promise.resolve('');
            if (testconfig.isMod) {
                getCurrentPackagePromise = goModules_1.getCurrentPackage(testconfig.dir);
            }
            else if (currentGoWorkspace) {
                getCurrentPackagePromise = Promise.resolve(testconfig.dir.substr(currentGoWorkspace.length + 1));
            }
            let pkgMapPromise = Promise.resolve(null);
            if (testconfig.includeSubDirectories) {
                if (testconfig.isMod) {
                    targets = ['./...'];
                    // We need the mapping to get absolute paths for the files in the test output
                    pkgMapPromise = goPackages_1.getNonVendorPackages(testconfig.dir);
                }
                else {
                    pkgMapPromise = util_1.getGoVersion().then((goVersion) => {
                        if (goVersion.gt('1.8')) {
                            targets = ['./...'];
                            return null; // We dont need mapping, as we can derive the absolute paths from package path
                        }
                        return goPackages_1.getNonVendorPackages(testconfig.dir).then((pkgMap) => {
                            targets = Array.from(pkgMap.keys());
                            return pkgMap; // We need the individual package paths to pass to `go test`
                        });
                    });
                }
            }
            Promise.all([pkgMapPromise, getCurrentPackagePromise]).then(([pkgMap, currentPackage]) => {
                if (!pkgMap) {
                    pkgMap = new Map();
                }
                // Use the package name to be in the args to enable running tests in symlinked directories
                if (!testconfig.includeSubDirectories && currentPackage) {
                    targets.splice(0, 0, currentPackage);
                }
                const outTargets = args.slice(0);
                if (targets.length > 4) {
                    outTargets.push('<long arguments omitted>');
                }
                else {
                    outTargets.push(...targets);
                }
                args.push(...targets);
                // ensure that user provided flags are appended last (allow use of -args ...)
                // ignore user provided -run flag if we are already using it
                if (args.indexOf('-run') > -1) {
                    removeRunFlag(testconfig.flags);
                }
                args.push(...testconfig.flags);
                outTargets.push(...testconfig.flags);
                outputChannel.appendLine(['Running tool:', goRuntimePath, ...outTargets].join(' '));
                outputChannel.appendLine('');
                const tp = cp.spawn(goRuntimePath, args, { env: testEnvVars, cwd: testconfig.dir });
                const outBuf = new util_1.LineBuffer();
                const errBuf = new util_1.LineBuffer();
                // 1=ok/FAIL, 2=package, 3=time/(cached)
                const packageResultLineRE = /^(ok|FAIL)[ \t]+(.+?)[ \t]+([0-9\.]+s|\(cached\))/;
                const testResultLines = [];
                const processTestResultLine = (line) => {
                    if (!testconfig.includeSubDirectories) {
                        outputChannel.appendLine(expandFilePathInOutput(line, testconfig.dir));
                        return;
                    }
                    testResultLines.push(line);
                    const result = line.match(packageResultLineRE);
                    if (result && (pkgMap.has(result[2]) || currentGoWorkspace)) {
                        const packageNameArr = result[2].split('/');
                        const baseDir = pkgMap.get(result[2]) || path.join(currentGoWorkspace, ...packageNameArr);
                        testResultLines.forEach((testResultLine) => outputChannel.appendLine(expandFilePathInOutput(testResultLine, baseDir)));
                        testResultLines.splice(0);
                    }
                };
                // go test emits test results on stdout, which contain file names relative to the package under test
                outBuf.onLine((line) => processTestResultLine(line));
                outBuf.onDone((last) => {
                    if (last) {
                        processTestResultLine(last);
                    }
                    // If there are any remaining test result lines, emit them to the output channel.
                    if (testResultLines.length > 0) {
                        testResultLines.forEach((line) => outputChannel.appendLine(line));
                    }
                });
                // go test emits build errors on stderr, which contain paths relative to the cwd
                errBuf.onLine((line) => outputChannel.appendLine(expandFilePathInOutput(line, testconfig.dir)));
                errBuf.onDone((last) => last && outputChannel.appendLine(expandFilePathInOutput(last, testconfig.dir)));
                tp.stdout.on('data', (chunk) => outBuf.append(chunk.toString()));
                tp.stderr.on('data', (chunk) => errBuf.append(chunk.toString()));
                statusBarItem.show();
                tp.on('close', (code, signal) => {
                    outBuf.done();
                    errBuf.done();
                    if (code) {
                        outputChannel.appendLine(`Error: ${testType} failed.`);
                    }
                    else if (signal === sendSignal) {
                        outputChannel.appendLine(`Error: ${testType} terminated by user.`);
                    }
                    else {
                        outputChannel.appendLine(`Success: ${testType} passed.`);
                    }
                    const index = runningTestProcesses.indexOf(tp, 0);
                    if (index > -1) {
                        runningTestProcesses.splice(index, 1);
                    }
                    if (!runningTestProcesses.length) {
                        statusBarItem.hide();
                    }
                    resolve(code === 0);
                });
                runningTestProcesses.push(tp);
            }, (err) => {
                outputChannel.appendLine(`Error: ${testType} failed.`);
                outputChannel.appendLine(err);
                resolve(false);
            });
        }));
        if (testconfig.applyCodeCoverage) {
            yield goCover_1.applyCodeCoverageToAllEditors(tmpCoverPath, testconfig.dir);
        }
        return testResult;
    });
}
exports.goTest = goTest;
/**
 * Reveals the output channel in the UI.
 */
function showTestOutput() {
    outputChannel.show(true);
}
exports.showTestOutput = showTestOutput;
/**
 * Iterates the list of currently running test processes and kills them all.
 */
function cancelRunningTests() {
    return new Promise((resolve, reject) => {
        runningTestProcesses.forEach((tp) => {
            tp.kill(sendSignal);
        });
        // All processes are now dead. Empty the array to prepare for the next run.
        runningTestProcesses.splice(0, runningTestProcesses.length);
        resolve(true);
    });
}
exports.cancelRunningTests = cancelRunningTests;
function expandFilePathInOutput(output, cwd) {
    const lines = output.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const matches = lines[i].match(/^\s*(.+.go):(\d+):/);
        if (matches && matches[1] && !path.isAbsolute(matches[1])) {
            lines[i] = lines[i].replace(matches[1], path.join(cwd, matches[1]));
        }
    }
    return lines.join('\n');
}
/**
 * Get the test target arguments.
 *
 * @param testconfig Configuration for the Go extension.
 */
function targetArgs(testconfig) {
    let params = [];
    if (testconfig.functions) {
        if (testconfig.isBenchmark) {
            params = ['-bench', util.format('^(%s)$', testconfig.functions.join('|'))];
        }
        else {
            let testFunctions = testconfig.functions;
            let testifyMethods = testFunctions.filter((fn) => testMethodRegex.test(fn));
            if (testifyMethods.length > 0) {
                // filter out testify methods
                testFunctions = testFunctions.filter((fn) => !testMethodRegex.test(fn));
                testifyMethods = testifyMethods.map(extractInstanceTestName);
            }
            // we might skip the '-run' param when running only testify methods, which will result
            // in running all the test methods, but one of them should call testify's `suite.Run(...)`
            // which will result in the correct thing to happen
            if (testFunctions.length > 0) {
                params = params.concat(['-run', util.format('^(%s)$', testFunctions.join('|'))]);
            }
            if (testifyMethods.length > 0) {
                params = params.concat(['-testify.m', util.format('^(%s)$', testifyMethods.join('|'))]);
            }
        }
        return params;
    }
    if (testconfig.isBenchmark) {
        params = ['-bench', '.'];
    }
    return params;
}
function removeRunFlag(flags) {
    const index = flags.indexOf('-run');
    if (index !== -1) {
        flags.splice(index, 2);
    }
}
//# sourceMappingURL=testUtils.js.map