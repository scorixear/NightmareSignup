import {ISqlHandler} from '../src/interfaces/ISqlHandler';
export class TestSqlHandler implements ISqlHandler {
  public initDB() {
    return new Promise<void>((resolve)=>resolve());
  }
  public isSignedInReturn: boolean;
  public isSignedIn(event: number, userid: string) {
    return new Promise<boolean>((resolve)=>resolve(this.isSignedInReturn));
  }
  public signInReturn: boolean;
  public signIn(event: number, userid: string, date: number) {
    return new Promise<boolean>((resolve)=>resolve(this.signInReturn));
  }
  public signOutReturn: boolean;
  public signOut(event: number, userid: string) {
    return new Promise<boolean>((resolve)=>resolve(this.signOutReturn));
  }
  public getSignupsReturn: {userId: string, date: number}[];
  public getSignups(eventId: number) {
    return new Promise<{userId: string, date: number}[]>((resolve)=>resolve(this.getSignupsReturn));
  }
  public createEventReturn: number;
  public createEvent(eventName: string, eventDate: string, isCta: boolean) {
    return new Promise<number>((resolve)=>resolve(this.createEventReturn));
  }
  public deleteEventReturn: boolean;
  public deleteEvent(eventName: string, eventDate: string) {
    return new Promise<boolean>((resolve)=>resolve(this.deleteEventReturn));
  }
  public getEventIdReturn: number;
  public getEventId(eventName: string, eventDate: string) {
    return new Promise<number>((resolve)=>resolve(this.getEventIdReturn));
  }
  public findEventsReturn: number[];
  public findEvents(timestamp: string, isClosed: boolean, isFormed: boolean, isCta: boolean) {
    return new Promise<number[]>((resolve)=>resolve(this.findEventsReturn));
  }
  public updateEventFlagsReturn: boolean;
  public updateEventFlags(eventId: number, isClosed: boolean, isFormed: boolean, isCta: boolean) {
    return new Promise<boolean>((resolve)=>resolve(this.updateEventFlagsReturn));
  }
  public getEventsReturn: {name: string, date: string}[];
  public getEvents(includeClosed: boolean) {
    return new Promise<{name: string, date: string}[]>((resolve)=>resolve(this.getEventsReturn));
  }
  public isCtaEventReturn: boolean;
  public isCtaEvent(eventId: number) {
    return new Promise<boolean>((resolve)=>resolve(this.isCtaEventReturn));
  }
  public createDiscordMessageReturn: boolean;
  public createDiscordMessage(eventId: number, messageId: string, channelId: string, guildId: string) {
    return new Promise<boolean>((resolve)=>resolve(this.createDiscordMessageReturn));
  }
  public getDiscordMessageReturn: {messageId?: string, channelId?: string, guildId?: string};
  public getDiscordMessage(eventId: number) {
    return new Promise<{messageId?: string, channelId?: string, guildId?: string}>((resolve)=>resolve(this.getDiscordMessageReturn));
  }
  public removeDiscordMessageReturn: boolean;
  public removeDiscordMessage(eventId: number, messageId: string, channelId: string, guildId: string) {
    return new Promise<boolean>((resolve)=>resolve(this.removeDiscordMessageReturn));
  }
  public isUnavailableReturn: boolean;
  public isUnavailable(eventId: number, userId: string) {
    return new Promise<boolean>((resolve)=>resolve(this.isUnavailableReturn));
  }
  public setUnavailableReturn: boolean;
  public setUnavailable(eventId: number, userId: string) {
    return new Promise<boolean>((resolve)=>resolve(this.setUnavailableReturn));
  }
  public removeUnavailableReturn: boolean;
  public removeUnavailable(eventId: number, userId: string) {
    return new Promise<boolean>((resolve)=>resolve(this.removeUnavailableReturn));
  }
  public getUnavailableReturn: {userId: string, date: number}[];
  public getUnavailable(eventId: number) {
    return new Promise<{userId: string, date: number}[]>((resolve)=>resolve(this.getUnavailableReturn));
  }
  public getUnavailablesReturn: string[];
  public getUnavailables(eventId: number) {
    return new Promise<string[]>((resolve)=>resolve(this.getUnavailablesReturn));
  }
  public addRoleReturn: boolean;
  public addRole(userId: string, roleId: string) {
    return new Promise<boolean>((resolve)=>resolve(this.addRoleReturn));
  }
  public removeRoleReturn: boolean;
  public removeRole(userId: string, roleId: string) {
    return new Promise<boolean>((resolve)=>resolve(this.removeRoleReturn));
  }
  public getRolesReturn: string[];
  public getRoles(userId: string) {
    return new Promise<string[]>((resolve)=>resolve(this.getRolesReturn));
  }
  public clearRolesReturn: boolean;
  public clearRoles(userId: string): Promise<boolean> {
    return new Promise<boolean>((resolve)=>resolve(this.clearRolesReturn));
  }
}