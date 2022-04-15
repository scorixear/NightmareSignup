export interface ISqlHandler {
  initDB() : Promise<void>;
  isSignedIn(event: number, userid: string): Promise<boolean>;
  signIn(event: number, userid: string, date: number): Promise<boolean>;
  signOut(event: number, userid: string): Promise<boolean>;
  getSignups(eventId: number): Promise<{userId: string, date: number}[]>;
  createEvent(eventName: string, eventDate: string, isCta: boolean): Promise<number>;
  deleteEvent(eventName: string, eventDate: string): Promise<boolean>;
  getEventId(eventName: string, eventDate: string): Promise<number>;
  findEvents(timestamp: string, isClosed: boolean, isFormed: boolean, isCta: boolean): Promise<number[]>;
  findEventObjects(timestamp: string): Promise<{id: number, date: number}[]>;
  updateEventFlags(eventId: number, isClosed: boolean, isFormed: boolean, isCta: boolean): Promise<boolean>;
  getEvents(includeClosed: boolean): Promise<{name: string, date: string}[]>;
  isCtaEvent(eventId: number): Promise<boolean>;
  createDiscordMessage(eventId: number, messageId: string, channelId: string, guildId: string): Promise<boolean>;
  getDiscordMessage(eventId: number): Promise<{messageId?: string, channelId?: string, guildId?: string}>;
  removeDiscordMessage(eventId: number, messageId: string, channelId: string, guildId: string): Promise<boolean>;
  isUnavailable(eventId: number, userId: string): Promise<boolean>;
  setUnavailable(eventId: number, userId: string): Promise<boolean>;
  removeUnavailable(eventId: number, userId: string): Promise<boolean>;
  getUnavailables(eventId: number): Promise<string[]>;
  addRole(userId: string, role: string, date: number): Promise<boolean>;
  removeRole(userId: string, role: string): Promise<boolean>;
  clearRoles(userId: string): Promise<boolean>;
  getRoles(userId: string): Promise<string[]>;
  getUsers(): Promise<{userid: string, register: number}[]>;
  getUsersWithRoles(): Promise<{role: string, count: number}[]>;
}