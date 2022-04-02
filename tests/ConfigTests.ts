import {expect} from 'chai';
import fs from 'fs';
describe('Config Tests', () => {
    it('read Config.json contains correct values', () => {
        const config = require("../src/config");
        expect(config.version).to.equal(JSON.parse(fs.readFileSync('package.json').toString()).version);
        expect(config.botPrefix).to.equal('/');
    });
});