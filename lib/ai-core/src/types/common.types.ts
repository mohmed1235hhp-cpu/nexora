/** Shared primitives used across ai-core. */
export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
export type Millis = number;
export type ISODate = string;
export type UUID = string;

export interface Timestamped {
  createdAt: ISODate;
  updatedAt?: ISODate;
}

export interface Identified {
  id: UUID;
}
