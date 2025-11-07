const github = require('@actions/github');
const os = require("os");
const fs = require("fs");
const path = require("path");
const io = require('@actions/io');
const { Readable } = require('stream');

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

/**
 * Downloads a file from a URL to a temporary location
 * @param url URL to download from
 * @return Path to the downloaded file
 */
async function downloadFile(url) {
    const tempDir = os.tmpdir();
    const fileName = path.basename(url);
    const filePath = path.join(tempDir, fileName);

    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }

    const fileStream = fs.createWriteStream(filePath);
    
    // Convert Web ReadableStream to Node.js stream and pipe it
    const nodeStream = Readable.fromWeb(response.body);

    return new Promise((resolve, reject) => {
        nodeStream.pipe(fileStream);
        fileStream.on('finish', () => resolve(filePath));
        fileStream.on('error', reject);
        nodeStream.on('error', reject);
    });
}

/**
 * Downloads the CLI and returns the path where it is installed.
 * @param downloadUrl URL to download the CLI from
 * @param cliName Name of the CLI to download (yontrack by default)
 * @param logging Whether to log the download process
 * @return `cliExecutable` (name of the CLI) and `dir` (directory where the CLI is installed)
 */
async function downloadAndSetup({downloadUrl, cliName, logging}) {
    const cliPath = await downloadFile(downloadUrl);
    if (logging) console.log(`Downloaded at ${cliPath}`)

    // Make the download executable
    if (!os.platform().startsWith('win')) {
        await fs.chmodSync(cliPath, '766')
    }

    const dir = path.dirname(cliPath)
    if (logging) console.log(`Directory is ${dir}`)

    // If we're on Windows, then the executable ends with .exe
    const exeSuffix = os.platform().startsWith('win') ? '.exe' : '';

    const cliExecutable = `${cliName}${exeSuffix}`;
    await io.mv(cliPath, [dir, cliExecutable].join(path.sep))

    return {
        dir,
        cliExecutable,
    }
}

/**
 * Downloads the CLI and returns the path where it is installed.
 * @param version Version of the CLI to download (if not provided, the latest version is downloaded)
 * @param githubToken GitHub token to use to download the latest version of the CLI (not used if a version is provided)
 * @param acceptDraft Whether to accept draft releases
 * @param logging Whether to log the download process
 * @return `cliExecutable` (name of the CLI) and `dir` (directory where the CLI is installed)
 */
const install = async ({version, githubToken, acceptDraft = false, logging = false}) => {
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

    // Downloading
    return await downloadAndSetup({downloadUrl, cliName, logging})
};

const cli = {
    install,
}

module.exports = cli;
