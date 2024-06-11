import fs from 'fs/promises';

const getGitId = async () => {
    const gitId = await fs.readFile('.git/HEAD', 'utf8');
    if (gitId.indexOf(':') === -1) {
        return gitId;
    }
    const refPath = '.git/' + gitId.substring(5).trim();
    return await fs.readFile(refPath, 'utf8');
};
const getPackageJson = async () => {
    const packageJson = await fs.readFile('package.json', 'utf8');
    const json = JSON.parse(packageJson);
    let version = 0;
    if (json.version.indexOf('-') != -1) {
        version = (parseInt(json.version.split('-')[1]) + 1);
    }
    const newVersion = json.version.split('-')[0] + '-' + version;
    json.version = newVersion;
    await fs.writeFile('package.json', JSON.stringify(json, null, 2));
    let indexHtml = await fs.readFile('index.html', 'utf8');
    console.log(indexHtml);
    indexHtml = indexHtml.replace('@@VERSION', newVersion);
    indexHtml = indexHtml.replace('@@DATE', new Date().toISOString());
    const gitId = await getGitId();
    indexHtml = indexHtml.replace('@@GIT', gitId);
    await fs.writeFile('index.html', indexHtml);
}
await getPackageJson();
