'use strict';
const elementId = {
    configName: "configName",
    configNameInvalid: "configNameInvalid",
    configSelection: "configSelection",
    addConfigDiv: "addConfigDiv",
    addConfigBtn: "addConfigBtn",
    addConfigInputDiv: "addConfigInputDiv",
    addConfigOk: "addConfigOk",
    addConfigCancel: "addConfigCancel",
    addConfigName: "addConfigName",
    compilerPath: "compilerPath",
    compilerPathInvalid: "compilerPathInvalid",
    knownCompilers: "knownCompilers",
    noCompilerPathsDetected: "noCompilerPathsDetected",
    compilerArgs: "compilerArgs",
    intelliSenseMode: "intelliSenseMode",
    intelliSenseModeInvalid: "intelliSenseModeInvalid",
    includePath: "includePath",
    includePathInvalid: "includePathInvalid",
    defines: "defines",
    cStandard: "cStandard",
    cppStandard: "cppStandard",
    windowsSdkVersion: "windowsSdkVersion",
    macFrameworkPath: "macFrameworkPath",
    macFrameworkPathInvalid: "macFrameworkPathInvalid",
    compileCommands: "compileCommands",
    compileCommandsInvalid: "compileCommandsInvalid",
    configurationProvider: "configurationProvider",
    forcedInclude: "forcedInclude",
    forcedIncludeInvalid: "forcedIncludeInvalid",
    mergeConfigurations: "mergeConfigurations",
    dotConfig: "dotConfig",
    dotConfigInvalid: "dotConfigInvalid",
    recursiveIncludesPriority: "recursiveIncludes.priority",
    recursiveIncludesOrder: "recursiveIncludes.order",
    browsePath: "browsePath",
    browsePathInvalid: "browsePathInvalid",
    limitSymbolsToIncludedHeaders: "limitSymbolsToIncludedHeaders",
    databaseFilename: "databaseFilename",
    databaseFilenameInvalid: "databaseFilenameInvalid",
    showAdvanced: "showAdvanced",
    advancedSection: "advancedSection"
};
class SettingsApp {
    vsCodeApi;
    updating = false;
    constructor() {
        this.vsCodeApi = acquireVsCodeApi();
        window.addEventListener("keydown", this.onTabKeyDown.bind(this));
        window.addEventListener("message", this.onMessageReceived.bind(this));
        this.addEventsToConfigNameChanges();
        this.addEventsToInputValues();
        document.getElementById(elementId.knownCompilers)?.addEventListener("change", this.onKnownCompilerSelect.bind(this));
        const oldState = this.vsCodeApi.getState();
        const advancedShown = oldState && oldState.advancedShown;
        const advancedSection = document.getElementById(elementId.advancedSection);
        if (advancedSection) {
            advancedSection.style.display = advancedShown ? "block" : "none";
        }
        document.getElementById(elementId.showAdvanced)?.classList.toggle(advancedShown ? "collapse" : "expand", true);
        document.getElementById(elementId.showAdvanced)?.addEventListener("click", this.onShowAdvanced.bind(this));
        this.vsCodeApi.postMessage({
            command: "initialized"
        });
    }
    addEventsToInputValues() {
        const elements = document.getElementsByName("inputValue");
        elements.forEach(el => {
            el.addEventListener("change", this.onChanged.bind(this, el.id));
        });
        document.getElementById(elementId.limitSymbolsToIncludedHeaders)?.addEventListener("change", this.onChangedCheckbox.bind(this, elementId.limitSymbolsToIncludedHeaders));
        document.getElementById(elementId.mergeConfigurations)?.addEventListener("change", this.onChangedCheckbox.bind(this, elementId.mergeConfigurations));
    }
    addEventsToConfigNameChanges() {
        document.getElementById(elementId.configName)?.addEventListener("change", this.onConfigNameChanged.bind(this));
        document.getElementById(elementId.configSelection)?.addEventListener("change", this.onConfigSelect.bind(this));
        document.getElementById(elementId.addConfigBtn)?.addEventListener("click", this.onAddConfigBtn.bind(this));
        document.getElementById(elementId.addConfigOk)?.addEventListener("click", this.onAddConfigConfirm.bind(this, true));
        document.getElementById(elementId.addConfigCancel)?.addEventListener("click", this.onAddConfigConfirm.bind(this, false));
    }
    onTabKeyDown(e) {
        if (e.keyCode === 9) {
            document.body.classList.add("tabbing");
            window.removeEventListener("keydown", this.onTabKeyDown);
            window.addEventListener("mousedown", this.onMouseDown.bind(this));
        }
    }
    onMouseDown() {
        document.body.classList.remove("tabbing");
        window.removeEventListener("mousedown", this.onMouseDown);
        window.addEventListener("keydown", this.onTabKeyDown.bind(this));
    }
    onShowAdvanced() {
        const isShown = document.getElementById(elementId.advancedSection).style.display === "block";
        document.getElementById(elementId.advancedSection).style.display = isShown ? "none" : "block";
        this.vsCodeApi.setState({ advancedShown: !isShown });
        const element = document.getElementById(elementId.showAdvanced);
        element.classList.toggle("collapse");
        element.classList.toggle("expand");
    }
    onAddConfigBtn() {
        this.showElement(elementId.addConfigDiv, false);
        this.showElement(elementId.addConfigInputDiv, true);
    }
    onAddConfigConfirm(request) {
        this.showElement(elementId.addConfigInputDiv, false);
        this.showElement(elementId.addConfigDiv, true);
        if (request) {
            const el = document.getElementById(elementId.addConfigName);
            if (el.value !== undefined && el.value !== "") {
                this.vsCodeApi.postMessage({
                    command: "addConfig",
                    name: el.value
                });
                el.value = "";
            }
        }
    }
    onConfigNameChanged() {
        if (this.updating) {
            return;
        }
        const configName = document.getElementById(elementId.configName);
        const list = document.getElementById(elementId.configSelection);
        if (configName.value === "") {
            document.getElementById(elementId.configName).value = list.options[list.selectedIndex].value;
            return;
        }
        list.options[list.selectedIndex].value = configName.value;
        list.options[list.selectedIndex].text = configName.value;
        this.onChanged(elementId.configName);
    }
    onConfigSelect() {
        if (this.updating) {
            return;
        }
        const el = document.getElementById(elementId.configSelection);
        document.getElementById(elementId.configName).value = el.value;
        this.vsCodeApi.postMessage({
            command: "configSelect",
            index: el.selectedIndex
        });
    }
    onKnownCompilerSelect() {
        if (this.updating) {
            return;
        }
        const el = document.getElementById(elementId.knownCompilers);
        document.getElementById(elementId.compilerPath).value = el.value;
        this.onChanged(elementId.compilerPath);
        this.vsCodeApi.postMessage({
            command: "knownCompilerSelect"
        });
    }
    fixKnownCompilerSelection() {
        const compilerPath = document.getElementById(elementId.compilerPath).value.toLowerCase();
        const knownCompilers = document.getElementById(elementId.knownCompilers);
        for (let n = 0; n < knownCompilers.options.length; n++) {
            if (compilerPath === knownCompilers.options[n].value.toLowerCase()) {
                knownCompilers.value = knownCompilers.options[n].value;
                return;
            }
        }
        knownCompilers.value = '';
    }
    onChangedCheckbox(id) {
        if (this.updating) {
            return;
        }
        const el = document.getElementById(id);
        this.vsCodeApi.postMessage({
            command: "change",
            key: id,
            value: el.checked
        });
    }
    onChanged(id) {
        if (this.updating) {
            return;
        }
        const el = document.getElementById(id);
        if (id === elementId.compilerPath) {
            this.fixKnownCompilerSelection();
        }
        this.vsCodeApi.postMessage({
            command: "change",
            key: id,
            value: el.value
        });
    }
    onMessageReceived(e) {
        const message = e.data;
        switch (message.command) {
            case 'updateConfig':
                this.updateConfig(message.config);
                break;
            case 'updateErrors':
                this.updateErrors(message.errors);
                break;
            case 'setKnownCompilers':
                this.setKnownCompilers(message.compilers);
                break;
            case 'updateConfigSelection':
                this.updateConfigSelection(message);
                break;
        }
    }
    updateConfig(config) {
        this.updating = true;
        try {
            const joinEntries = (input) => (input && input.length) ? input.join("\n") : "";
            document.getElementById(elementId.configName).value = config.name;
            document.getElementById(elementId.compilerPath).value = config.compilerPath ?? "";
            this.fixKnownCompilerSelection();
            document.getElementById(elementId.compilerArgs).value = joinEntries(config.compilerArgs);
            document.getElementById(elementId.intelliSenseMode).value = config.intelliSenseMode ?? "${default}";
            document.getElementById(elementId.includePath).value = joinEntries(config.includePath);
            document.getElementById(elementId.defines).value = joinEntries(config.defines);
            document.getElementById(elementId.cStandard).value = config.cStandard;
            document.getElementById(elementId.cppStandard).value = config.cppStandard;
            document.getElementById(elementId.windowsSdkVersion).value = config.windowsSdkVersion ?? "";
            document.getElementById(elementId.macFrameworkPath).value = joinEntries(config.macFrameworkPath);
            document.getElementById(elementId.compileCommands).value = joinEntries(config.compileCommands);
            document.getElementById(elementId.mergeConfigurations).checked = config.mergeConfigurations;
            document.getElementById(elementId.configurationProvider).value = config.configurationProvider ?? "";
            document.getElementById(elementId.forcedInclude).value = joinEntries(config.forcedInclude);
            document.getElementById(elementId.dotConfig).value = config.dotConfig ?? "";
            if (config.recursiveIncludes) {
                document.getElementById(elementId.recursiveIncludesPriority).value = config.recursiveIncludes.priority ?? "${default}";
                document.getElementById(elementId.recursiveIncludesOrder).value = config.recursiveIncludes.order ?? "${default}";
            }
            if (config.browse) {
                document.getElementById(elementId.browsePath).value = joinEntries(config.browse.path);
                document.getElementById(elementId.limitSymbolsToIncludedHeaders).checked =
                    config.browse.limitSymbolsToIncludedHeaders && config.browse.limitSymbolsToIncludedHeaders;
                document.getElementById(elementId.databaseFilename).value = config.browse.databaseFilename ?? "";
            }
            else {
                document.getElementById(elementId.browsePath).value = "";
                document.getElementById(elementId.limitSymbolsToIncludedHeaders).checked = false;
                document.getElementById(elementId.databaseFilename).value = "";
            }
        }
        finally {
            this.updating = false;
        }
    }
    updateErrors(errors) {
        this.updating = true;
        try {
            this.showErrorWithInfo(elementId.configNameInvalid, errors.name);
            this.showErrorWithInfo(elementId.intelliSenseModeInvalid, errors.intelliSenseMode);
            this.showErrorWithInfo(elementId.compilerPathInvalid, errors.compilerPath);
            this.showErrorWithInfo(elementId.includePathInvalid, errors.includePath);
            this.showErrorWithInfo(elementId.macFrameworkPathInvalid, errors.macFrameworkPath);
            this.showErrorWithInfo(elementId.forcedIncludeInvalid, errors.forcedInclude);
            this.showErrorWithInfo(elementId.compileCommandsInvalid, errors.compileCommands);
            this.showErrorWithInfo(elementId.browsePathInvalid, errors.browsePath);
            this.showErrorWithInfo(elementId.databaseFilenameInvalid, errors.databaseFilename);
            this.showErrorWithInfo(elementId.dotConfigInvalid, errors.dotConfig);
        }
        finally {
            this.updating = false;
        }
    }
    showErrorWithInfo(elementID, errorInfo) {
        this.showElement(elementID, errorInfo ? true : false);
        document.getElementById(elementID).textContent = errorInfo ? errorInfo : "";
    }
    updateConfigSelection(message) {
        this.updating = true;
        try {
            const list = document.getElementById(elementId.configSelection);
            list.options.length = 0;
            for (const name of message.selections) {
                const option = document.createElement("option");
                option.text = name;
                option.value = name;
                list.append(option);
            }
            list.selectedIndex = message.selectedIndex;
        }
        finally {
            this.updating = false;
        }
    }
    setKnownCompilers(compilers) {
        this.updating = true;
        try {
            const list = document.getElementById(elementId.knownCompilers);
            if (list.firstChild) {
                return;
            }
            if (compilers.length === 0) {
                const noCompilerSpan = document.getElementById(elementId.noCompilerPathsDetected);
                const option = document.createElement("option");
                option.text = noCompilerSpan.textContent ?? "";
                option.disabled = true;
                list.append(option);
            }
            else {
                for (const path of compilers) {
                    const option = document.createElement("option");
                    option.text = path;
                    option.value = path;
                    list.append(option);
                }
            }
            this.showElement(elementId.compilerPath, true);
            this.showElement(elementId.knownCompilers, true);
            list.value = "";
        }
        finally {
            this.updating = false;
        }
    }
    showElement(elementID, show) {
        document.getElementById(elementID).style.display = show ? "block" : "none";
    }
}
const app = new SettingsApp();
//# sourceMappingURL=settings.js.map
// SIG // Begin signature block
// SIG // MIInRwYJKoZIhvcNAQcCoIInODCCJzQCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // 2LRXv8Hkjl8FsjnqmhPhRIIFwSHDyW6u1I/UYtEtaWag
// SIG // ggy6MIIF9TCCA92gAwIBAgITMwAAAh1NGchO1w9XSAAA
// SIG // AAACHTANBgkqhkiG9w0BAQsFADBXMQswCQYDVQQGEwJV
// SIG // UzEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5n
// SIG // IFBDQSAyMDI0MB4XDTI2MDQxNjE4NTk0M1oXDTI3MDQx
// SIG // NTE4NTk0M1owdDELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEeMBwG
// SIG // A1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMIIBIjAN
// SIG // BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0L3sF8cf
// SIG // YGWRQumLNVgWsvASfJBgOCUJx+QjGn6jgEpU6SvR/KOW
// SIG // V017dHGlUEzTFD7eOOcF2A/nRbWilk8A59SOdqFEqwvb
// SIG // yYp9RrKrfs8iiS+Q4N3kF20DUetQ5jMttBi0yDt0hXnf
// SIG // UX4v6KYYAixhSw0d69Crx48DG/42FktHHpVf+C89uy3w
// SIG // HpJvL/ROSF2nol2wFGGSitPdJ+AlZdyQbWzfvQ7SPUjb
// SIG // v8o76M1udv7u0V/07aWvyg5abqJGfmXG75rXfbq/YBS7
// SIG // 2c4eNaPTLBP3JULXWhVhr7qOibmv57aYJHstxOf7wRXv
// SIG // jCTxuqYXZ7qOq+e2bnQrnYiNWwIDAQABo4IBmzCCAZcw
// SIG // DgYDVR0PAQH/BAQDAgeAMB8GA1UdJQQYMBYGCisGAQQB
// SIG // gjdMCAEGCCsGAQUFBwMDMB0GA1UdDgQWBBR+kLjMKnDx
// SIG // tIUJUOnOYwrU0y61XjBFBgNVHREEPjA8pDowODEeMBwG
// SIG // A1UECxMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMRYwFAYD
// SIG // VQQFEw0yMzAwMTIrNTA3NTU5MB8GA1UdIwQYMBaAFH9Z
// SIG // P1Qh2q1P7wXl5qPXLQaUEggxMGAGA1UdHwRZMFcwVaBT
// SIG // oFGGT2h0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lv
// SIG // cHMvY3JsL01pY3Jvc29mdCUyMENvZGUlMjBTaWduaW5n
// SIG // JTIwUENBJTIwMjAyNC5jcmwwbQYIKwYBBQUHAQEEYTBf
// SIG // MF0GCCsGAQUFBzAChlFodHRwOi8vd3d3Lm1pY3Jvc29m
// SIG // dC5jb20vcGtpb3BzL2NlcnRzL01pY3Jvc29mdCUyMENv
// SIG // ZGUlMjBTaWduaW5nJTIwUENBJTIwMjAyNC5jcnQwDAYD
// SIG // VR0TAQH/BAIwADANBgkqhkiG9w0BAQsFAAOCAgEASk22
// SIG // Do88Exvw1xms/bOvn0Hmk7Q3BZjGPuVMlRQso+z7/uYt
// SIG // +6n1/JUi/7QSH2EH1rDLgUJX2bqyQ+q+B1Sdgnh/tX4I
// SIG // qvHXB3VSqGd0mtql6F93KvYkvHFW9Oge/uf1yeyNDsRx
// SIG // /Xw7Lyd098OVf2bQCBZi65fj9ArRvvdrs0bJ9J023RYz
// SIG // pCzC1jywFN0x6ISkZUhDIBSaT5JuZ+VAGd+cV+hVgqwy
// SIG // 7Eim+eeW04n8GvJiQcHZaH9G5n2InR/ncWdRXQ8by5zZ
// SIG // fc3irAOJHo2miKqiD4LocALYuUJewZUzaCTcMQrwZqlt
// SIG // jEC5wpGDf1VVLEd1dsf63Ezc6AX/2f0qUTr3WgNmTjnd
// SIG // boqFybd7XS0O7x6aqYm9Cn1q/xVl1tdKt/FcXwp0UAas
// SIG // 20rs7Ue5xDLs1+wpPgf12jw13daoe9vkGMgdGdlc1pjv
// SIG // c7J2/VKv3cLvCxnkKp8ruu0gxgAr514otn2/flEuPdlU
// SIG // 510pxSsqsIM1MhTLWStf7B2E7+mxuE7UFMoEMUzfmVfm
// SIG // iSJSjtjKme2yqwJzs0vZujYKE3VjqtdW0zmcCpSBFfxI
// SIG // VfUlpA5naUf4Tz09r+kxI+BfD0/8x40XsyFOXPwxpbf1
// SIG // YWP6StF5CbRMjJpktQTLY1P66gWVTCJt3Z8ULP0wQcq/
// SIG // gn/Gda+2on0FUPlkqs4wgga9MIIEpaADAgECAhMzAAAA
// SIG // OTu2Nxm/Bh1nAAAAAAA5MA0GCSqGSIb3DQEBDAUAMIGI
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQDEylNaWNy
// SIG // b3NvZnQgUm9vdCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkg
// SIG // MjAxMTAeFw0yNDA4MDgyMDU0MThaFw0zNjAzMjIyMjEz
// SIG // MDRaMFcxCzAJBgNVBAYTAlVTMR4wHAYDVQQKExVNaWNy
// SIG // b3NvZnQgQ29ycG9yYXRpb24xKDAmBgNVBAMTH01pY3Jv
// SIG // c29mdCBDb2RlIFNpZ25pbmcgUENBIDIwMjQwggIiMA0G
// SIG // CSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQDYAZwe4zjH
// SIG // qpUWBzWtuub+CGPXx/EyoXph3zyDXtYKS2ld3YYN9uFs
// SIG // B9Oi3B26Z7AbpAgzYra8qNHbUvxFuiP8hC/2y0mPISqW
// SIG // 30LlrrAT6/ams2HA8Qlv6p42+SbCNbPGzToN21QE70FS
// SIG // +LXH9N2k8nLM/EHgnTNJf8h0TmyfUKmszNa+lTxDieyy
// SIG // /rhBG+98OkArobPPWtbr9c3qzmDJ7J3kUcAm6cltdSHI
// SIG // IFNHESgw6taY1ScyGyBevqIl120XjrIHiPM7tRckHytH
// SIG // 1ZGsmvEplR0P7Tn9t5meFvZNEYttkFvad1IEguTlA5LS
// SIG // scXAphi+rVy3zhklhyCFeGK0yU0+jzbcuURKIxybmRwK
// SIG // 5BfVZx0xEVqE4wM3yN5D/uW+GpVHYYAGe7bTrtW1Z13x
// SIG // 2qj2Jdqz7NtI4tNyzlVrIf62nYBNe3rOYS/repVdHlR6
// SIG // 1YbLLETlibs9jFzAre4sO5RTxvS1yho7JqJ59oKLRnRy
// SIG // LhIOSZyTCVZosXeS0ZZJoGEWSs4cUgsMqBiKtD4WgO2P
// SIG // lT3LeaQh5Io3CCA5tJ5ZCvtCsnqaJXKhptE/xmEETIRy
// SIG // ZRjjplUKKd+sFFVGJJVMvvrw1nhIBKOLO4cTepiG39jE
// SIG // iEP4iHzGYCcQuvaLpDFFwqzgt0pBP8SJIKX5dtjDNYrZ
// SIG // Gd+ZzV5DKJVNZQIDAQABo4IBTjCCAUowDgYDVR0PAQH/
// SIG // BAQDAgGGMBAGCSsGAQQBgjcVAQQDAgEAMB0GA1UdDgQW
// SIG // BBR/WT9UIdqtT+8F5eaj1y0GlBIIMTAZBgkrBgEEAYI3
// SIG // FAIEDB4KAFMAdQBiAEMAQTAPBgNVHRMBAf8EBTADAQH/
// SIG // MB8GA1UdIwQYMBaAFHItOgIxkEO5FAVO4eqnxzHRI4k0
// SIG // MFoGA1UdHwRTMFEwT6BNoEuGSWh0dHA6Ly9jcmwubWlj
// SIG // cm9zb2Z0LmNvbS9wa2kvY3JsL3Byb2R1Y3RzL01pY1Jv
// SIG // b0NlckF1dDIwMTFfMjAxMV8wM18yMi5jcmwwXgYIKwYB
// SIG // BQUHAQEEUjBQME4GCCsGAQUFBzAChkJodHRwOi8vd3d3
// SIG // Lm1pY3Jvc29mdC5jb20vcGtpL2NlcnRzL01pY1Jvb0Nl
// SIG // ckF1dDIwMTFfMjAxMV8wM18yMi5jcnQwDQYJKoZIhvcN
// SIG // AQEMBQADggIBABSUHzgoT+6J5+nyyDCq0pTdVmCsAxYA
// SIG // HXcpjlDtxazPHewf1v4kOg8V7A5+w+VuMDMGHi8rLXBK
// SIG // n5I8+DVEUYGs8jLuckc0IeC6owOLUrU3CYdaKRMaO55+
// SIG // T7jwWJ27tPkx0rlR03tFU0z1YYpcv6Yhaw6N2sUPT+Av
// SIG // jpecnrftoE33pCAkucUvnGH0iL4J9CZLFQVTGFSOUBbv
// SIG // 6oZy4bBBRFMxvH779IY4JDvpZKVfbcuhpDeL3Z3e8muk
// SIG // Omkfct+GojNapsWsQYujlJ8jZen5Lrp/3YkxZ2Ay06aT
// SIG // pK/5oOVknwog1TDQsbY+MDyguTph5tQ0CLfzDaJG2x91
// SIG // BrBT9UG87C6HLkqiwrx9PSKN3wz05rHEfWO+RuKl+0U1
// SIG // /AHQT6NCOjhKI39/c7hWbdKjh5uuWFkBOvXGTNrnhNTA
// SIG // dOXTTYByvYExO8yryv34PAdqo1vPDE/1heVebr2Rramv
// SIG // RUi9kWswKwPqwz7n+iRmM+B6YDGRweEurM1kimAb9FYr
// SIG // As38YHlPnarl1vW3dGrmJTgefAz3DmCnXN0nveIPsS+K
// SIG // XBIWweeCToAJMGE7v/XS3h9qQ6niWQAAVQ1kUAml3zuS
// SIG // 4MisCgi2F6YoK2WAo1EgXK/lXvDxVjIVU0JdL+KvCfwF
// SIG // JkDeVuJ9dNXGNi+AOxk0BtYd9hxwL30BElj9MYIZ5TCC
// SIG // GeECAQEwbjBXMQswCQYDVQQGEwJVUzEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSgwJgYDVQQDEx9N
// SIG // aWNyb3NvZnQgQ29kZSBTaWduaW5nIFBDQSAyMDI0AhMz
// SIG // AAACHU0ZyE7XD1dIAAAAAAIdMA0GCWCGSAFlAwQCAQUA
// SIG // oIGuMBkGCSqGSIb3DQEJAzEMBgorBgEEAYI3AgEEMBwG
// SIG // CisGAQQBgjcCAQsxDjAMBgorBgEEAYI3AgEVMC8GCSqG
// SIG // SIb3DQEJBDEiBCA/PY4hulRE7hjFIIGoy84eawxkKrSa
// SIG // U/JjITbPXTGSszBCBgorBgEEAYI3AgEMMTQwMqAUgBIA
// SIG // TQBpAGMAcgBvAHMAbwBmAHShGoAYaHR0cDovL3d3dy5t
// SIG // aWNyb3NvZnQuY29tMA0GCSqGSIb3DQEBAQUABIIBACWq
// SIG // GhBgspAP6p42UFInh3H/yvcY3FmWzaid5O4KOD2yjYwn
// SIG // Db//m9M1jwUbY23sfJc9Fl3xOgiA+Z0AbWLyAA/gHN7I
// SIG // yq5N1d4WVIUHIUn8hnh/pBCaYKMAV8lV1rjKUla8FqS4
// SIG // 8awy2YAeZvx3gV4APtx58mrkEUDYUnmjK7Ci7bEIHbSW
// SIG // QiDFBdqtTAhjjMQrOUvfoMehyoJVmX8XWWXURlBO5paJ
// SIG // CBWqsUWz6+UWSSCAWZJAuYVtldBkqwTLoSz1aogFMhzN
// SIG // RqqpRQBu/Y/1vO09IM/F7Vdb7DPNqZLYJI5qZibCU46c
// SIG // Wlarf1nUZVxhAC2L/wwVZcJdyI+py8qhgheXMIIXkwYK
// SIG // KwYBBAGCNwMDATGCF4Mwghd/BgkqhkiG9w0BBwKgghdw
// SIG // MIIXbAIBAzEPMA0GCWCGSAFlAwQCAQUAMIIBUgYLKoZI
// SIG // hvcNAQkQAQSgggFBBIIBPTCCATkCAQEGCisGAQQBhFkK
// SIG // AwEwMTANBglghkgBZQMEAgEFAAQguU7NTOJnn70inL/V
// SIG // /qhCSTgKFmSNTBl0Xhh2tEYbQJwCBmqqwtUYjRgTMjAy
// SIG // NjA5MjIwMTU1MTcuMjc2WjAEgAIB9KCB0aSBzjCByzEL
// SIG // MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24x
// SIG // EDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jv
// SIG // c29mdCBDb3Jwb3JhdGlvbjElMCMGA1UECxMcTWljcm9z
// SIG // b2Z0IEFtZXJpY2EgT3BlcmF0aW9uczEnMCUGA1UECxMe
// SIG // blNoaWVsZCBUU1MgRVNOOjMzMDMtMDVFMC1EOTQ3MSUw
// SIG // IwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2
// SIG // aWNloIIR7TCCByAwggUIoAMCAQICEzMAAAIhM8A1+9IP
// SIG // IaQAAQAAAiEwDQYJKoZIhvcNAQELBQAwfDELMAkGA1UE
// SIG // BhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNV
// SIG // BAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBD
// SIG // b3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRp
// SIG // bWUtU3RhbXAgUENBIDIwMTAwHhcNMjYwMjE5MTkzOTU0
// SIG // WhcNMjcwNTE3MTkzOTU0WjCByzELMAkGA1UEBhMCVVMx
// SIG // EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1Jl
// SIG // ZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3Jh
// SIG // dGlvbjElMCMGA1UECxMcTWljcm9zb2Z0IEFtZXJpY2Eg
// SIG // T3BlcmF0aW9uczEnMCUGA1UECxMeblNoaWVsZCBUU1Mg
// SIG // RVNOOjMzMDMtMDVFMC1EOTQ3MSUwIwYDVQQDExxNaWNy
// SIG // b3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNlMIICIjANBgkq
// SIG // hkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA23EwAqlNWL0a
// SIG // HMli9jy/X8n//lC7Nqiu1NWmbEZw2Up5Qq+yu44AN3hQ
// SIG // hCS+QWe3VEwtA3mXqX/mQvuxxGweCHc5iX0AFAxRXq6m
// SIG // OVUx5kLz9lwN5VkhY++NInXBlB4JT+R/z2wiVOxgB1j9
// SIG // h3XAo3cdZWAKNAPsyyO8cJ00HjMjl19tdhIOFJgzzyYM
// SIG // XUzMOlhVVrAT1kQYuYA4sctrPu0fAA5OZWwQRQweYdAo
// SIG // 6zViDe7ggMxeYO7a6y/J1yCqddJo/UcYXBkPrZYbelSL
// SIG // 3coEVU1BncxQdv5wbyakPZMcRZbUEk+9HxHceE8miqMP
// SIG // 3+fgUoeM+P/X+zVyFVUy5//JHCQH0ahZka6xbdyCm8u1
// SIG // a85mLqEFg9JZjRbRkOewayZD6zxQD3pNQC7XG2+xR950
// SIG // Kb4vJ4M/zBV//nJ5jRVhVNvVVS5swfV7y2cW2L5Hnrbd
// SIG // JoeZX7XnjdqxMFMq3ayrn8/YdkuqW2rXvgtodNgq18Ep
// SIG // GtMens6U5hpCCSxbdubm/1GFzS3R3bMRg+hH3JDiKCWL
// SIG // JuDEvRf70qizRyvPSNL0ywZ4EBKeiyBZCDWp0U9z7Tcd
// SIG // 6TSkSiUQC3Oi+poVuIS+Ghy++Paj30O9reagDJucYimD
// SIG // ICdlmp4nUSzbiNudSSDe62mngP9r29FxZGXCG00daX0B
// SIG // rHKOFNIObY8CAwEAAaOCAUkwggFFMB0GA1UdDgQWBBTm
// SIG // IyLOamuqX7qrj8sitRU6+UAwpzAfBgNVHSMEGDAWgBSf
// SIG // pxVdAF5iXYP05dJlpxtTNRnpcjBfBgNVHR8EWDBWMFSg
// SIG // UqBQhk5odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtp
// SIG // b3BzL2NybC9NaWNyb3NvZnQlMjBUaW1lLVN0YW1wJTIw
// SIG // UENBJTIwMjAxMCgxKS5jcmwwbAYIKwYBBQUHAQEEYDBe
// SIG // MFwGCCsGAQUFBzAChlBodHRwOi8vd3d3Lm1pY3Jvc29m
// SIG // dC5jb20vcGtpb3BzL2NlcnRzL01pY3Jvc29mdCUyMFRp
// SIG // bWUtU3RhbXAlMjBQQ0ElMjAyMDEwKDEpLmNydDAMBgNV
// SIG // HRMBAf8EAjAAMBYGA1UdJQEB/wQMMAoGCCsGAQUFBwMI
// SIG // MA4GA1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQsFAAOC
// SIG // AgEAOCP925HZ08Q9qxbptzBfMVSnRJKIQDm23j60PtH6
// SIG // +W0Ypo8/bFZCk/+4HI+DjHApUmBviHV+jKdxGLCx1n47
// SIG // 8H8xaHmRPsk23QY/9VR2UEbgpsOkKnlQk28Np50u5wcZ
// SIG // 1nfaGV2z1KahGsB+Q6l0GlhYEfQOCllSvyL11QzI9T5T
// SIG // whEtT9yaJzW3YZJJM+PaybijpuW+3vwR/JaKgJlzl0XN
// SIG // tssVlUzFqxKeKbJZr/Hk+1aGPF/43SmEz1RF7H5i21RX
// SIG // KszLgfLxRn1MlrFkTkvMIKu5UGH1nGKoezcpqAE1/sFm
// SIG // Ct81hu2kXIjxlAM8513X/mh7SFp0CzWuRxZkl5ImpN30
// SIG // rqa1mGYh4bmIxNeoa6AKXAR6ZvvEv5DaoZvVo0F/tgcZ
// SIG // 2L/iXo8upak4vHywS0tOvVl1cP6bX+SFfhbWJd+Br1aH
// SIG // oN9VKFJlVWXtUg1CZJvXQ13PJf6gQ2IgCE9ggrD08rfV
// SIG // wPSVbh8XT+t5+wob1gDv+O0Ebgg7FJRSaFsMgcJe43mK
// SIG // WkVTLULdIriTBho4BGiV9UP9o/LF1Eb03Hixww/YqVrd
// SIG // PdmQ1jEHIg0ZoRzRTl9XZ4wb5P5NVDHIPfe4+aGM5wJ0
// SIG // qSb5YP+AT92lRNIf2B9ioLCm1ODV2RwIyV49kpaqNQtd
// SIG // eQhuqgWWhZDPFurz2Qpuap0nszowggdxMIIFWaADAgEC
// SIG // AhMzAAAAFcXna54Cm0mZAAAAAAAVMA0GCSqGSIb3DQEB
// SIG // CwUAMIGIMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
// SIG // aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
// SIG // ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQD
// SIG // EylNaWNyb3NvZnQgUm9vdCBDZXJ0aWZpY2F0ZSBBdXRo
// SIG // b3JpdHkgMjAxMDAeFw0yMTA5MzAxODIyMjVaFw0zMDA5
// SIG // MzAxODMyMjVaMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAk
// SIG // BgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAy
// SIG // MDEwMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKC
// SIG // AgEA5OGmTOe0ciELeaLL1yR5vQ7VgtP97pwHB9KpbE51
// SIG // yMo1V/YBf2xK4OK9uT4XYDP/XE/HZveVU3Fa4n5KWv64
// SIG // NmeFRiMMtY0Tz3cywBAY6GB9alKDRLemjkZrBxTzxXb1
// SIG // hlDcwUTIcVxRMTegCjhuje3XD9gmU3w5YQJ6xKr9cmmv
// SIG // Haus9ja+NSZk2pg7uhp7M62AW36MEBydUv626GIl3GoP
// SIG // z130/o5Tz9bshVZN7928jaTjkY+yOSxRnOlwaQ3KNi1w
// SIG // jjHINSi947SHJMPgyY9+tVSP3PoFVZhtaDuaRr3tpK56
// SIG // KTesy+uDRedGbsoy1cCGMFxPLOJiss254o2I5JasAUq7
// SIG // vnGpF1tnYN74kpEeHT39IM9zfUGaRnXNxF803RKJ1v2l
// SIG // IH1+/NmeRd+2ci/bfV+AutuqfjbsNkz2K26oElHovwUD
// SIG // o9Fzpk03dJQcNIIP8BDyt0cY7afomXw/TNuvXsLz1dhz
// SIG // PUNOwTM5TI4CvEJoLhDqhFFG4tG9ahhaYQFzymeiXtco
// SIG // dgLiMxhy16cg8ML6EgrXY28MyTZki1ugpoMhXV8wdJGU
// SIG // lNi5UPkLiWHzNgY1GIRH29wb0f2y1BzFa/ZcUlFdEtsl
// SIG // uq9QBXpsxREdcu+N+VLEhReTwDwV2xo3xwgVGD94q0W2
// SIG // 9R6HXtqPnhZyacaue7e3PmriLq0CAwEAAaOCAd0wggHZ
// SIG // MBIGCSsGAQQBgjcVAQQFAgMBAAEwIwYJKwYBBAGCNxUC
// SIG // BBYEFCqnUv5kxJq+gpE8RjUpzxD/LwTuMB0GA1UdDgQW
// SIG // BBSfpxVdAF5iXYP05dJlpxtTNRnpcjBcBgNVHSAEVTBT
// SIG // MFEGDCsGAQQBgjdMg30BATBBMD8GCCsGAQUFBwIBFjNo
// SIG // dHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL0Rv
// SIG // Y3MvUmVwb3NpdG9yeS5odG0wEwYDVR0lBAwwCgYIKwYB
// SIG // BQUHAwgwGQYJKwYBBAGCNxQCBAweCgBTAHUAYgBDAEEw
// SIG // CwYDVR0PBAQDAgGGMA8GA1UdEwEB/wQFMAMBAf8wHwYD
// SIG // VR0jBBgwFoAU1fZWy4/oolxiaNE9lJBb186aGMQwVgYD
// SIG // VR0fBE8wTTBLoEmgR4ZFaHR0cDovL2NybC5taWNyb3Nv
// SIG // ZnQuY29tL3BraS9jcmwvcHJvZHVjdHMvTWljUm9vQ2Vy
// SIG // QXV0XzIwMTAtMDYtMjMuY3JsMFoGCCsGAQUFBwEBBE4w
// SIG // TDBKBggrBgEFBQcwAoY+aHR0cDovL3d3dy5taWNyb3Nv
// SIG // ZnQuY29tL3BraS9jZXJ0cy9NaWNSb29DZXJBdXRfMjAx
// SIG // MC0wNi0yMy5jcnQwDQYJKoZIhvcNAQELBQADggIBAJ1V
// SIG // ffwqreEsH2cBMSRb4Z5yS/ypb+pcFLY+TkdkeLEGk5c9
// SIG // MTO1OdfCcTY/2mRsfNB1OW27DzHkwo/7bNGhlBgi7ulm
// SIG // ZzpTTd2YurYeeNg2LpypglYAA7AFvonoaeC6Ce5732pv
// SIG // vinLbtg/SHUB2RjebYIM9W0jVOR4U3UkV7ndn/OOPcbz
// SIG // aN9l9qRWqveVtihVJ9AkvUCgvxm2EhIRXT0n4ECWOKz3
// SIG // +SmJw7wXsFSFQrP8DJ6LGYnn8AtqgcKBGUIZUnWKNsId
// SIG // w2FzLixre24/LAl4FOmRsqlb30mjdAy87JGA0j3mSj5m
// SIG // O0+7hvoyGtmW9I/2kQH2zsZ0/fZMcm8Qq3UwxTSwethQ
// SIG // /gpY3UA8x1RtnWN0SCyxTkctwRQEcb9k+SS+c23Kjgm9
// SIG // swFXSVRk2XPXfx5bRAGOWhmRaw2fpCjcZxkoJLo4S5pu
// SIG // +yFUa2pFEUep8beuyOiJXk+d0tBMdrVXVAmxaQFEfnyh
// SIG // YWxz/gq77EFmPWn9y8FBSX5+k77L+DvktxW/tM4+pTFR
// SIG // hLy/AsGConsXHRWJjXD+57XQKBqJC4822rpM+Zv/Cuk0
// SIG // +CQ1ZyvgDbjmjJnW4SLq8CdCPSWU5nR0W2rRnj7tfqAx
// SIG // M328y+l7vzhwRNGQ8cirOoo6CGJ/2XBjU02N7oJtpQUQ
// SIG // wXEGahC0HVUzWLOhcGbyoYIDUDCCAjgCAQEwgfmhgdGk
// SIG // gc4wgcsxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJTAjBgNVBAsT
// SIG // HE1pY3Jvc29mdCBBbWVyaWNhIE9wZXJhdGlvbnMxJzAl
// SIG // BgNVBAsTHm5TaGllbGQgVFNTIEVTTjozMzAzLTA1RTAt
// SIG // RDk0NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3Rh
// SIG // bXAgU2VydmljZaIjCgEBMAcGBSsOAwIaAxUAC2xIGWZ8
// SIG // mB1ydQxm+Xxo6ZV6bbmggYMwgYCkfjB8MQswCQYDVQQG
// SIG // EwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
// SIG // BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENv
// SIG // cnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGlt
// SIG // ZS1TdGFtcCBQQ0EgMjAxMDANBgkqhkiG9w0BAQsFAAIF
// SIG // AO5b2B0wIhgPMjAyNjA5MjExNjIxNDlaGA8yMDI2MDky
// SIG // MjE2MjE0OVowdzA9BgorBgEEAYRZCgQBMS8wLTAKAgUA
// SIG // 7lvYHQIBADAKAgEAAgIHjwIB/zAHAgEAAgIT7zAKAgUA
// SIG // 7l0pnQIBADA2BgorBgEEAYRZCgQCMSgwJjAMBgorBgEE
// SIG // AYRZCgMCoAowCAIBAAIDB6EgoQowCAIBAAIDAYagMA0G
// SIG // CSqGSIb3DQEBCwUAA4IBAQBu1ff4914ZcBgeQDs6OAgi
// SIG // QYxPWtAwza6C6uwXwh3hdBp0kkLVRi7eGM7QN723gClG
// SIG // P21MgebV82FL67UoRvGa34fUWJkrHuXJ7kugZxo/BRDp
// SIG // dQzbb3ch1eJ6nNbWbMyoHnegeL8PNO3BVKyPhT61lNpc
// SIG // 41YNKSpmvznFZ+dgLqDBmihYMbSyDyJKk4WuOD/Leb9b
// SIG // 8xBcVYu6Cd29jnFpV70u6GAF/sFKYgkjuRKBCxuzdfmc
// SIG // 5LzUMZmYxmuEMGVHsRpQLMGGvYCFm2vvZ8gEy4tuQFOJ
// SIG // kOQA0Kespgh3RFzHzMTBCPh3QlneJfHRTegozhaGrPDo
// SIG // IlzJPn9BUxqhMYIEDTCCBAkCAQEwgZMwfDELMAkGA1UE
// SIG // BhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNV
// SIG // BAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBD
// SIG // b3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRp
// SIG // bWUtU3RhbXAgUENBIDIwMTACEzMAAAIhM8A1+9IPIaQA
// SIG // AQAAAiEwDQYJYIZIAWUDBAIBBQCgggFKMBoGCSqGSIb3
// SIG // DQEJAzENBgsqhkiG9w0BCRABBDAvBgkqhkiG9w0BCQQx
// SIG // IgQgCr/340TsptWrsJN/TQYT5AconfQAielsDV6bZVDc
// SIG // HTswgfoGCyqGSIb3DQEJEAIvMYHqMIHnMIHkMIG9BCAA
// SIG // 7yEHnxVVGuAScvCGcsDAL5hkinVFahJsvQPvjwo9RDCB
// SIG // mDCBgKR+MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpX
// SIG // YXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYD
// SIG // VQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNV
// SIG // BAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEw
// SIG // AhMzAAACITPANfvSDyGkAAEAAAIhMCIEIKhym2S1+X8A
// SIG // uSY9/vgb1iDWL07TYgszZJJRUfpAGLRBMA0GCSqGSIb3
// SIG // DQEBCwUABIICAFSEIO7j6XEom8CcnBnBumyWL+Xgd3U/
// SIG // kt9ogtCvoAaIS2jKSQLHTwpAh42zcXS2btwo25UKcOdY
// SIG // LGYAXN9yhEwyP6Cz1d5j8+BNtjhXJXna0KinfgNXDAVw
// SIG // Q4oCEcFBNVMoxlg5oKDV0Apz6z6ZsvrEOFDQBtfc7nI+
// SIG // 3e3TNxATY3zXlhqRzZ/+MGTVEfZqEHSKB2l4a05anFxd
// SIG // Fkfo4FKuWz2hip8r/XfxP99xyojp+5/tWyc8W5rI3GLU
// SIG // ndNDgeC8OmyksxBeW+5zP+9o3HQ3aBRywxlIVTMtYtZM
// SIG // c+lb5+hcQt6+BJhdhe0sxfIsRn1noQElhXhn99jcEL39
// SIG // ChHGTM/rqnpEgrt5k26ExY3EYFO3xgNr9W9tUi1gRxzn
// SIG // pc/c+17ZvJVsK2UJhSv6s23023KREW7iXGzVn1KquXQL
// SIG // Du7zL/lnK3F2lF+qKfus8WfutYUEpIHSKlPVmlEXOXqq
// SIG // aqyxY2WDJMcqd9YiXccwHP/9r9g2tKEfrYxlls/cTd4V
// SIG // jMot3709cWKguTwHiOcKm2aLQD+cPLAjnTIrB/Hibmav
// SIG // JjnU5uEk7STh0FcSTpErpfGmMra3W4PRpzwUNgzU/4Jc
// SIG // Qh5J9aLY0yU/mjvliqM/JGiUBXRYQqb+vY7v893BB3ov
// SIG // jUGgHtOKe/iHqX2Oq/oP6NFe3Z6lOpWktO8x
// SIG // End signature block
