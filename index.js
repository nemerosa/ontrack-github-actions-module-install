// const {fetch} = require('cross-fetch');
const github = require('@actions/github');

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
};

const cli = {
    download,
}

module.exports = cli;
