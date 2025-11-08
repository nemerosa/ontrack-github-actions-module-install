const cli = require('./index')
const {execSync} = require('child_process')

const testVersion = '5.0.0-alpha+006'

test('downloading the CLI using a fixed version', async () => {
    const {dir, cliExecutable} = await cli.install({logging: true, version: testVersion})
    const exe = `${dir}/${cliExecutable}`

    const output = execSync(`${exe} version --cli`, {encoding: 'utf-8'}).trim()
    expect(output).toBe(testVersion)
})

test('downloading the CLI using the latest version', async () => {
    const githubToken = process.env.GITHUB_TOKEN
    if (!githubToken) {
        throw "GITHUB_TOKEN environment variable must be set to run this test."
    }
    const {dir, cliExecutable} = await cli.install({logging: true, githubToken, acceptDraft: true})
    const exe = `${dir}/${cliExecutable}`

    const output = execSync(`${exe} version --cli`, {encoding: 'utf-8'}).trim()
    expect(output).not.toBe('')
})

test('creation of the configuration', async () => {
    const yontrackUrl = process.env.YONTRACK_URL
    const yontrackToken = process.env.YONTRACK_TOKEN
    if (!yontrackUrl || !yontrackToken) {
        throw new Error('YONTRACK_URL and YONTRACK_TOKEN environment variables must be set')
    }

    const {dir, cliExecutable} = await cli.install({
        logging: true,
        version: testVersion,
        yontrackUrl,
        yontrackToken,
    })
    const exe = `${dir}/${cliExecutable}`

    const output = execSync(`${exe} version`, {encoding: 'utf-8'}).trim()
    console.log(output)
})
