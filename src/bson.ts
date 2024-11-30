import { BSON } from 'bson'

// biome-ignore lint/suspicious/noExplicitAny:
export const objToBsonHex = (obj: any) => Buffer.from(BSON.serialize(obj)).toString('hex')
export const bsonHexToObj = <T = BSON.Document>(hex: string): T => BSON.deserialize(Buffer.from(hex, 'hex')) as T
