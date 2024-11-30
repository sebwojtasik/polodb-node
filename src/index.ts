import { InternalPoloDbClient, type InternalPoloDbCursor, type InternalPoloDbCollection } from '../binding'
import { bsonHexToObj, objToBsonHex } from './bson'
import type { Filter } from './filter'
import type { Update } from './update'

type Sort<T> = {
  [P in keyof T]?: number
}

export declare interface Record {
  [key: string]: unknown
}

export class PoloDbClient {
  private client: InternalPoloDbClient

  constructor(path: string) {
    this.client = new InternalPoloDbClient(path)
  }

  collection<T = unknown>(name: string) {
    return new PoloDbCollection<T>(this.client, name)
  }
}

interface InsertOneResult {
  inserted_id: string
}

interface InsertManyResult {
  inserted_ids: string[]
}

interface DeleteResult {
  deleted_count: number
}

interface UpdateResult {
  matched_count: number
  modified_count: number
}

export class PoloDbCollection<T = unknown> {
  private collection: InternalPoloDbCollection

  constructor(client: InternalPoloDbClient, name: string) {
    this.collection = client.collection(name)
  }

  insertOne(doc: T): Promise<InsertOneResult> {
    return new Promise((resolve, reject) => {
      this.collection.insertOne(objToBsonHex(doc), (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(bsonHexToObj<InsertOneResult>(result))
        }
      })
    })
  }

  insertMany(docs: T[]): Promise<InsertManyResult> {
    return new Promise((resolve, reject) => {
      this.collection.insertMany(
        docs.map((doc) => objToBsonHex(doc)),
        (err, result) => {
          if (err) {
            reject(err)
          } else {
            resolve(bsonHexToObj<InsertManyResult>(result))
          }
        },
      )
    })
  }

  findOne(filter: Filter<T>): Promise<T | null> {
    return new Promise((resolve, reject) => {
      this.collection.findOne(objToBsonHex(filter), (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result ? bsonHexToObj<T>(result) : null)
        }
      })
    })
  }

  find(filter: Filter<T>) {
    const cursor = this.collection.find(objToBsonHex(filter))
    return new PoloDbCursor<T>(cursor)
  }

  updateOne(filter: Filter<T>, update: Update<T>): Promise<UpdateResult> {
    return new Promise((resolve, reject) => {
      this.collection.updateOne(objToBsonHex(filter), objToBsonHex(update), (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(bsonHexToObj<UpdateResult>(result))
        }
      })
    })
  }

  updateMany(filter: Filter<T>, update: Update<T>): Promise<UpdateResult> {
    return new Promise((resolve, reject) => {
      this.collection.updateMany(objToBsonHex(filter), objToBsonHex(update), (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(bsonHexToObj<UpdateResult>(result))
        }
      })
    })
  }

  deleteOne(filter: Filter<T>): Promise<DeleteResult> {
    return new Promise((resolve, reject) => {
      this.collection.deleteOne(objToBsonHex(filter), (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(bsonHexToObj<DeleteResult>(result))
        }
      })
    })
  }

  deleteMany(filter: Filter<T>): Promise<DeleteResult> {
    return new Promise((resolve, reject) => {
      this.collection.deleteMany(objToBsonHex(filter), (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(bsonHexToObj<DeleteResult>(result))
        }
      })
    })
  }
}

class PoloDbCursor<T = unknown> {
  private cursor: InternalPoloDbCursor
  constructor(cursor: InternalPoloDbCursor) {
    this.cursor = cursor
  }
  limit(limit: number) {
    this.cursor.limit(limit)
    return this
  }
  skip(skip: number) {
    this.cursor.skip(skip)
    return this
  }
  sort(sort: Sort<T>) {
    this.cursor.sort(objToBsonHex(sort))
    return this
  }
  toArray(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.cursor.toArray((err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(bsonHexToObj(result).results)
        }
      })
    })
  }
}
