const cli = require('./index')
const {execSync} = require('child_process')

test('downloading the CLI using a fixed version', async () => {
    await cli.download({logging: true, version: '5.0.0-alpha+006'})

    const output = execSync('./yontrack version', {encoding: 'utf-8'}).trim()
    expect(output).toBe('5.0.0-alpha+006')
})

test('downloading the CLI using the latest version', async () => {
    const githubToken = process.env.GITHUB_TOKEN
    if (!githubToken) {
        throw "GITHUB_TOKEN environment variable must be set to run this test."
    }
    await cli.download({logging: true, githubToken, acceptDraft: true})

    const output = execSync('./yontrack version', {encoding: 'utf-8'}).trim()
    expect(output).not.toBe('')
})
