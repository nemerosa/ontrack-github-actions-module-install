// const {fetch} = require('cross-fetch');
const github = require('@actions/github');
const os = require("os");

// arch in [arm, x32, x64...] (https://nodejs.org/api/os.html#os_os_arch)
// return value in [amd64, 386, arm]
function mapArch(arch) {
    const mappings = {
        x32: '386',
        x64: 'amd64'
    };
    return mappings[arch] || arch;
}

// os in [darwin, linux, win32...] (https://nodejs.org/api/os.html#os_os_platform)
// return value in [darwin, linux, windows]
function mapOS(os) {
    const mappings = {
        win32: 'windows'
    };
    return mappings[os] || os;
}


const download = async ({version, githubToken, acceptDraft, logging}) => {
    if (!version) {
        if (logging) console.log("No version provided. Getting the latest version from GitHub.")
        if (!githubToken) {
            throw "GitHub token must be provided in order to get the latest version of the CLI."
        }
        const octokit = github.getOctokit(githubToken)
        const releases = await octokit.rest.repos.listReleases({
            owner: "nemerosa",
            repo: "ontrack-cli"
        })
        const lastRelease = releases.data.find(release => acceptDraft || !release.draft)
        if (!lastRelease) {
            if (acceptDraft) {
                throw "No release found for the yontrack CLI"
            } else {
                throw "No non-draft release found for yontrack CLI"
            }
        }
        version = lastRelease.name
    }
    if (logging) console.log(`Using version: ${version}`)

    // Information about the OS
    const osPlatform = mapOS(os.platform());
    const osArch = mapArch(os.arch());
    if (logging) console.log(`For OS platform: ${osPlatform}`);
    if (logging) console.log(`For OS arch: ${osArch}`);

    const majorVersion = parseInt(version.split(".").at(0), 10);
    const cliName = majorVersion >= 5 ? "yontrack" : "ontrack-cli";

    // Getting the URL to the CLI
    const downloadUrl = `https://github.com/nemerosa/ontrack-cli/releases/download/${version}/${cliName}-${osPlatform}-${osArch}`;
    if (logging) console.log(`Downloading CLI from ${downloadUrl}`);
};

const cli = {
    download,
}

module.exports = cli;
