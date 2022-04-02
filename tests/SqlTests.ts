import { time } from '@discordjs/builders';
import {expect, assert} from 'chai';
import SqlHandler from '../src/misc/SqlHandler';
import dotenv from 'dotenv';

describe('SqlInitTests', () => {
  before(()=> {
    dotenv.config();
  });
  it('create SqlHandler, connects to Mariadb', ()=> {
    try {
      const sqlHandler = new SqlHandler();
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('init DB does not crash', async ()=>{
    try {
      const sqlHandler = new SqlHandler();
      await sqlHandler.initDB();
    } catch (err) {
      assert.fail(err.message);
    }
  });
});

describe('SqlTests', ()=> {
  let sqlHandler: SqlHandler;
  before(async () => {
    dotenv.config();
    sqlHandler = new SqlHandler();
    await sqlHandler.initDB();
  });
  it('isSignedIn returns false with non-existent event', async ()=>{
    try {
      const result = await sqlHandler.isSignedIn(123456789, '123456789');
      expect(result).to.equal(false);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('isSignedIn returns false with non-existent user', async () => {
    try {
      // Arrange
      const id = await sqlHandler.createEvent('TestEvent', '0', true);
      // Act
      const result = await sqlHandler.isSignedIn(id, '123456789');
      // Assert
      expect(result).to.equal(false);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '0');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('isSignedIn returns true with existing event and user', async () => {
    try {
      // Arrange
      const id = await sqlHandler.createEvent('TestEvent', '0', true);
      await sqlHandler.signIn(id, '0', 0);
      // Act
      const result = await sqlHandler.isSignedIn(id, '0');
      // Assert
      expect(result).to.equal(true);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '0');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('signIn returns true if event is not existent', async() => {
    try {
      // Arrange
      // Act
      const result = await sqlHandler.signIn(123456789, '123456789', 0);
      // Assert
      expect(result).to.equal(true);
      // Teardown
      await sqlHandler.signOut(123456789, '123456789');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('signIn returns true with existing event', async() => {
    try {
      // Arrange
      const id = await sqlHandler.createEvent('TestEvent1', '0', true);
      // Act
      const result = await sqlHandler.signIn(id, '0', 0);
      // Assert
      expect(result).to.equal(true);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent1', '0');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('signOut returns false if event is not existent', async() => {
    try {
      // Arrange
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
      const id = await sqlHandler.createEvent('TestEvent2', '0', true);
      // Act
      const result = await sqlHandler.signOut(id, '0');
      // Assert
      expect(result).to.equal(false);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent2', '0');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('signOut returns true if user signed out', async() => {
    try {
      // Arrange
      const id = await sqlHandler.createEvent('TestEvent', '0', true);
      await sqlHandler.signIn(id, '0', 0);
      // Act
      const result = await sqlHandler.signOut(id, '0');
      // Assert
      expect(result).to.equal(true);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '0');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('getSignups returns empty array if event not existent', async () => {
    try {
      // Arrange
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
      const id = await sqlHandler.createEvent('TestEvent', '0', true);
      await sqlHandler.signIn(id, '0', 0);
      // Act
      const result = await sqlHandler.getSignups(id);
      // Assert
      expect(result).to.be.an('array').to.have.lengthOf(1);
      expect(result[0].userId).to.equal('0');
      expect(result[0].date).to.equal(0);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '0');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('createEvent creates Event', async () => {
    try {
      // Arrange
      // Act
      const result = await sqlHandler.createEvent('TestEvent', '0', true);
      // Assert
      expect(result).to.be.an('number').that.is.above(-1);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '0');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('deleteEvent returns false if event is not existent', async() => {
    try {
      // Arrange
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
      const id = await sqlHandler.createEvent('TestEvent', '0', true);
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
      const id = await sqlHandler.createEvent('TestEvent', '0', true);
      // Act
      const result = await sqlHandler.getEventId('TestEvent', '0');
      // Assert
      expect(result).to.be.a('number').that.is.equal(id);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '0');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('findEvents returns empty array if no events after timestamp', async () => {
    try {
      // Arrange
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
      const id = await sqlHandler.createEvent('TestEvent', '0', false);
      // Act
      const result = await sqlHandler.findEvents('1', false, false, false);
      // Assert
      const c = expect(result).to.be.an('array').to.not.be.empty;
      expect(result[0]).to.equal(id);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '0');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('findEvents returns empty array if event is closed', async () => {
    try {
      // Arrange
      const id = await sqlHandler.createEvent('TestEvent', '0', false);
      await sqlHandler.updateEventFlags(id, true, false, false);
      // Act
      const result = await sqlHandler.findEvents('1', false, false, false);
      // Assert
      expect(result).to.be.an('array').that.is.empty;
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '0');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('findEvents returns one event if is closed, formed and cta', async () => {
    try {
      // Arrange
      const id = await sqlHandler.createEvent('TestEvent', '0', true);
      await sqlHandler.updateEventFlags(id, true, true, true);
      // Act
      const result = await sqlHandler.findEvents('1', true, true, true);
      // Assert
      expect(result).to.be.an('array').to.have.lengthOf(1);
      expect(result[0]).to.equal(id);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '0');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('updateEventFlags returns true if event not existent', async () => {
    try {
      // Arrange
      // Act
      const result = await sqlHandler.updateEventFlags(999999999, true, true, true);
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('updateEventFlags returns true if event exists', async () => {
    try {
      // Arrange
      const id = await sqlHandler.createEvent('TestEvent', '999999999', true);
      // Act
      const result = await sqlHandler.updateEventFlags(id, true, true, true);
      // Assert
      expect(result).to.equal(true);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '999999999');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('isCtaEvent returns false if event not existent', async () => {
    try {
      // Arrange
      // Act
      const result = await sqlHandler.isCtaEvent(999999999);
      // Assert
      expect(result).to.equal(false);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('isCtaEvent returns false if event isCta is false', async () => {
    try {
      // Arrange
      const id = await sqlHandler.createEvent('TestEvent', '999999999', false);
      // Act
      const result = await sqlHandler.isCtaEvent(id);
      // Assert
      expect(result).to.equal(false);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '999999999');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('isCtaEvent returns true if event isCta is true', async () => {
    try {
      // Arrange
      const id = await sqlHandler.createEvent('TestEvent', '999999999', true);
      // Act
      const result = await sqlHandler.isCtaEvent(id);
      // Assert
      expect(result).to.equal(true);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '999999999');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('createDiscordMessage creates Event', async () => {
    try {
      // Arrange
      // Act
      const result = await sqlHandler.createDiscordMessage(123456789, '123456789','123456789', '123456789');
      // Assert
      expect(result).to.equal(true);
      // Teardown
      await sqlHandler.removeDiscordMessage(123456789,'123456789', '123456789', '123456789');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('removeDiscordMessage returns true if event not existent', async () => {
    try {
      // Arrange
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
      const id = await sqlHandler.createDiscordMessage(123456789, '123456789', '123456789', '123456789');
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
      // Act
      const result = await sqlHandler.isUnavailable(999999999, '123456789');
      // Assert
      expect(result).to.equal(false);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('isUnavailable returns false if user not unavailable', async () => {
    try {
      // Arrange
      const id = await sqlHandler.createEvent('TestEvent', '999999999', true);
      // Act
      const result = await sqlHandler.isUnavailable(id, '123456789');
      // Assert
      expect(result).to.equal(false);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '999999999');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('isUnavailable returns true if user is unavailable', async () => {
    try {
      // Arrange
      const id = await sqlHandler.createEvent('TestEvent', '999999999', true);
      await sqlHandler.setUnavailable(id, '123456789');
      // Act
      const result = await sqlHandler.isUnavailable(id, '123456789');
      // Assert
      expect(result).to.equal(true);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '999999999');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('setUnavailable returns true if event no existent', async () => {
    try {
      // Arrange
      // Act
      const result = await sqlHandler.setUnavailable(999999998, '123456789');
      // Assert
      expect(result).to.equal(true);
      // Teardown
      await sqlHandler.removeUnavailable(999999998, '123456789');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('setUnavailable returns true if event exists', async () => {
    try {
      // Arrange
      const id = await sqlHandler.createEvent('TestEvent', '999999999', true);
      // Act
      const result = await sqlHandler.setUnavailable(id, '123456789');
      // Assert
      expect(result).to.equal(true);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '999999999');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('removeUnavailable return true if event not existent', async () => {
    try {
      // Arrange
      // Act
      const result = await sqlHandler.removeUnavailable(999999997, '123456789');
      // Assert
      expect(result).to.equal(true);
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('removeUnavailable returns true if user not unavailable', async () => {
    try {
      // Arrange
      const id = await sqlHandler.createEvent('TestEvent3', '999999999', true);
      // Act
      const result = await sqlHandler.removeUnavailable(id, '123456789');
      // Assert
      expect(result).to.equal(true);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent3', '999999999');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('removeUnavailable returns true if user is unavailable', async () => {
    try {
      // Arrange
      const id = await sqlHandler.createEvent('TestEvent', '999999999', true);
      await sqlHandler.setUnavailable(id, '123456789');
      // Act
      const result = await sqlHandler.removeUnavailable(id, '123456789');
      // Assert
      expect(result).to.equal(true);
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '999999999');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('getUnavailables returns empty array if event not existent', async () => {
    try {
      // Arrange
      // Act
      const result = await sqlHandler.getUnavailables(999999999);
      // Assert
      expect(result).to.be.an('array');
      expect(result).to.be.empty;
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('getUnavailables returns empty array if no user unavailable', async () => {
    try {
      // Arrange
      const id = await sqlHandler.createEvent('TestEvent', '999999999', true);
      // Act
      const result = await sqlHandler.getUnavailables(id);
      // Assert
      expect(result).to.be.an('array');
      expect(result).to.be.empty;
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '999999999');
    } catch (err) {
      assert.fail(err.message);
    }
  });
  it('getUnavailable returns user if user is unavailable', async () => {
    try {
      // Arrange
      const id = await sqlHandler.createEvent('TestEvent', '999999999', true);
      await sqlHandler.setUnavailable(id, '123456789');
      // Act
      const result = await sqlHandler.getUnavailables(id);
      // Assert
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.equal('123456789');
      // Teardown
      await sqlHandler.deleteEvent('TestEvent', '999999999');
    } catch (err) {
      assert.fail(err.message);
    }
  });
})