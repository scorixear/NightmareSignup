import fs from 'fs';

const version = JSON.parse(fs.readFileSync('package.json').toString()).version;

export default {
  version,
  repository: 'https://github.com/scorixear/n1ghtmaresignup/',
  botPrefix: '/',
  signupRoles: ['Arch Corps GM'],
  armyRole: 'Arch Corps'
};
