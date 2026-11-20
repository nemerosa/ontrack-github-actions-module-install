const cli = require('./index')
const {execSync} = require('child_process')
const path = require('path')
const os = require('os')
const fs = require('fs')

const testVersion = '5.0.0-alpha+006'

const hasGithubToken = !!process.env.GITHUB_TOKEN
const hasYontrack = !!(process.env.YONTRACK_URL && process.env.YONTRACK_TOKEN)
const testWithToken = hasGithubToken ? test : test.skip
const testWithYontrack = hasYontrack ? test : test.skip

test('downloading the CLI using a fixed version', async () => {
    const {dir, cliExecutable} = await cli.install({logging: true, version: testVersion})
    const exe = path.join(dir, cliExecutable)

    const output = execSync(`${exe} version --cli`, {encoding: 'utf-8'}).trim()
    expect(output).toBe(testVersion)
})

test('downloading the CLI on Windows x64 fetches the .exe release asset', async () => {
    const platform = jest.spyOn(os, 'platform').mockReturnValue('win32')
    const arch = jest.spyOn(os, 'arch').mockReturnValue('x64')
    const fetchSpy = jest.spyOn(globalThis, 'fetch')
    try {
        const {dir, cliExecutable} = await cli.install({version: '6.1.0'})

        expect(fetchSpy).toHaveBeenCalledWith('https://github.com/yontrack/yontrack-cli/releases/download/6.1.0/yontrack-windows-amd64.exe')
        expect(cliExecutable).toBe('yontrack.exe')
        expect(fs.existsSync(path.join(dir, 'yontrack.exe'))).toBe(true)
    } finally {
        platform.mockRestore()
        arch.mockRestore()
        fetchSpy.mockRestore()
    }
})

testWithToken('downloading the CLI using the latest version', async () => {
    const {dir, cliExecutable} = await cli.install({
        logging: true,
        githubToken: process.env.GITHUB_TOKEN,
        acceptDraft: true,
    })
    const exe = path.join(dir, cliExecutable)

    const output = execSync(`${exe} version --cli`, {encoding: 'utf-8'}).trim()
    expect(output).not.toBe('')
})

testWithYontrack('creation of the configuration', async () => {
    const configPath = path.join(process.cwd(), '.yontrack-config.yaml')
    await require('fs').promises.rm(configPath, { force: true })

    const {dir, cliExecutable} = await cli.install({
        logging: true,
        version: testVersion,
        yontrackUrl: process.env.YONTRACK_URL,
        yontrackToken: process.env.YONTRACK_TOKEN,
    })
    const exe = path.join(dir, cliExecutable)

    const output = execSync(`${exe} version`, {encoding: 'utf-8'}).trim()
    console.log(output)
})
