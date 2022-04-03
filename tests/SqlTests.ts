import { time } from '@discordjs/builders';
import {expect, assert} from 'chai';
import SqlHandler from '../src/misc/SqlHandler';
import dotenv from 'dotenv';
import { TestMariaDB } from './TestMariaDb';

describe('SqlInitTests', () => {
  before(()=> {
    dotenv.config();
  });
  it('create SqlHandler, connects to Mariadb', ()=> {
    try {
      const sqlHandler = new SqlHandler(new TestMariaDB());
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('init DB does not crash', async ()=>{
    try {
      const sqlHandler = new SqlHandler(new TestMariaDB());
      await sqlHandler.initDB();
    } catch (err) {
      assert.fail(err.message);
    }
  });
});

describe('SqlTests', ()=> {
  let sqlHandler: SqlHandler;
  let mariadb: TestMariaDB;

  before(async () => {
    dotenv.config();
    mariadb = new TestMariaDB();
    sqlHandler = new SqlHandler(mariadb);
    await sqlHandler.initDB();
  });
  it('isSignedIn returns false with non-existent event', async ()=>{
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.isSignedIn(123456789, '123456789');
      // Assert
      expect(result).to.equal(false);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('isSignedIn returns false with non-existent user', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.isSignedIn(123456789, '123456789');
      // Assert
      expect(result).to.equal(false);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('isSignedIn returns true with existing event and user', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{}]
      // Act
      const result = await sqlHandler.isSignedIn(123456789, '0');
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('signIn returns true if event is not existent', async() => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.signIn(123456789, '123456789', 0);
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('signIn returns true with existing event', async() => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.signIn(123456789, '0', 0);
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('signOut returns false if event is not existent', async() => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.signOut(123456789, '123456789');
      // Assert
      expect(result).to.equal(false);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('signOut returns false with not signed in user', async() => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.signOut(123456789, '0');
      // Assert
      expect(result).to.equal(false);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('signOut returns true if user signed out', async() => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{}];
      // Act
      const result = await sqlHandler.signOut(123456789, '0');
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('getSignups returns empty array if event not existent', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.getSignups(123456789);
      // Assert
      expect(result).to.be.an('array').that.is.empty;
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('getSignups returns array with one user', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{userid: '0', date: 0}];
      // Act
      const result = await sqlHandler.getSignups(123456789);
      // Assert
      expect(result).to.be.an('array').to.have.lengthOf(1);
      expect(result[0].userId).to.equal('0');
      expect(result[0].date).to.equal(0);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('createEvent creates Event', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{id: 0}];
      // Act
      const result = await sqlHandler.createEvent('TestEvent', '0', true);
      // Assert
      expect(result).to.be.an('number').that.is.equal(0);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('deleteEvent returns false if event is not existent', async() => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.deleteEvent('TestEvent', '0');
      // Assert
      expect(result).to.equal(false);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('deleteEvent returns true if event exists', async() => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{id: 0}];
      // Act
      const result = await sqlHandler.deleteEvent('TestEvent', '0');
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('getEventId returns undefined if event not existent', async() => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.getEventId('TestEvent', '0');
      // Assert
      expect(result).to.be.undefined;
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('getEventId returns number if event exists', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{id: 0}];
      // Act
      const result = await sqlHandler.getEventId('TestEvent', '0');
      // Assert
      expect(result).to.be.a('number').that.is.equal(0);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('findEvents returns empty array if no events after timestamp', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.findEvents('0', false, false, false);
      // Assert
      expect(result).to.be.an('array').that.is.empty;
      // Teardown
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('findEvents returns one event if is not closed, not formed and not cta', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{id: 0}];
      // Act
      const result = await sqlHandler.findEvents('1', false, false, false);
      // Assert
      const c = expect(result).to.be.an('array').to.not.be.empty;
      expect(result[0]).to.equal(0);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('updateEventFlags returns true when called', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.updateEventFlags(0, true, true, true);
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('getEvents returns empty array if no event exists', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.getEvents(false);
      // Assert
      expect(result).to.be.an('array').that.is.empty;
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('getEvents returns one event if one event exists', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{name: 'TestEvent', date: 0}];
      // Act
      const result = await sqlHandler.getEvents(false);
      // Assert
      expect(result).to.be.an('array').to.be.not.empty;
      expect(result[0].name).to.equal('TestEvent');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('isCtaEvent returns false if event not existent', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.isCtaEvent(0);
      // Assert
      expect(result).to.equal(false);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('isCtaEvent returns false if event isCta is false', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{is_cta: [0]}];
      // Act
      const result = await sqlHandler.isCtaEvent(0);
      // Assert
      expect(result).to.equal(false);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('isCtaEvent returns true if event isCta is true', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{is_cta: [1]}];
      // Act
      const result = await sqlHandler.isCtaEvent(0);
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('createDiscordMessage creates Event', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{id: 0}];
      // Act
      const result = await sqlHandler.createDiscordMessage(123456789, '123456789','123456789', '123456789');
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('getDiscordMessage returns empty object if discord message not existent', async() => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.getDiscordMessage(123456789);
      // Assert
      expect(result).to.be.an('object');
      expect(result.guildId).to.be.undefined;
      expect(result.channelId).to.be.undefined;
      expect(result.messageId).to.be.undefined;
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('getDiscordMessage return object if discord message exists', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{guildId: 0, channelId: 0, messageId: 0}];
      // Act
      const result = await sqlHandler.getDiscordMessage(123456789);
      // Assert
      expect(result).to.be.an('object')
      expect(result.guildId).to.equal(0);
      expect(result.channelId).to.equal(0);
      expect(result.messageId).to.equal(0);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('removeDiscordMessage returns true if event not existent', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.removeDiscordMessage(123456789, '123456789', '123456789', '123456789');
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('removeDiscordMessage returns true if event exists', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{id: 0}];
      // Act
      const result = await sqlHandler.removeDiscordMessage(123456789, '123456789', '123456789', '123456789');
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('isUnavailable returns false if event not existent', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.isUnavailable(0, '123456789');
      // Assert
      expect(result).to.equal(false);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('isUnavailable returns false if user not unavailable', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.isUnavailable(0, '123456789');
      // Assert
      expect(result).to.equal(false);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('isUnavailable returns true if user is unavailable', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{id: 0}];
      // Act
      const result = await sqlHandler.isUnavailable(0, '123456789');
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('setUnavailable returns true if event no existent', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.setUnavailable(0, '123456789');
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('setUnavailable returns true if event exists', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{id: 0}];
      // Act
      const result = await sqlHandler.setUnavailable(0, '123456789');
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('removeUnavailable return true if event not existent', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.removeUnavailable(0, '123456789');
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('removeUnavailable returns true if user is unavailable', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{id: 0}];
      // Act
      const result = await sqlHandler.removeUnavailable(0, '123456789');
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('getUnavailables returns empty array if event not existent', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [];
      // Act
      const result = await sqlHandler.getUnavailables(0);
      // Assert
      expect(result).to.be.an('array');
      expect(result).to.be.empty;
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('getUnavailable returns user if user is unavailable', async () => {
    try {
      // Arrange
      mariadb.Pool.Connection.ThrowError = false;
      mariadb.Pool.Connection.QueryReturn = [{userId: '0'}];
      // Act
      const result = await sqlHandler.getUnavailables(0);
      // Assert
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.equal('0');
    } catch (err) {
      assert.fail(err.message);
    }
  });
})