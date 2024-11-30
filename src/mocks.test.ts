import { InternalPoloDbClient } from '../binding'
import { PoloDbClient } from './index'

jest.mock('../binding')

describe('PoloDbClient', () => {
  let client: PoloDbClient
  let mockInternalCollection: jest.Mocked<unknown>

  beforeEach(() => {
    jest.clearAllMocks()

    mockInternalCollection = {
      insertOne: jest.fn(),
      insertMany: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
    }
    ;(InternalPoloDbClient as jest.Mock).mockImplementation(() => ({
      collection: () => mockInternalCollection,
    }))

    client = new PoloDbClient('test.db')
  })

  describe('Collection operations', () => {
    const testError = new Error('Database error')
    const collection = 'test_collection'

    test('insertOne should reject on error', async () => {
      // @ts-ignore
      mockInternalCollection.insertOne.mockImplementation((_, callback) => callback(testError))

      await expect(client.collection(collection).insertOne({ test: 'data' })).rejects.toThrow(testError)
    })

    test('insertMany should reject on error', async () => {
      // @ts-ignore
      mockInternalCollection.insertMany.mockImplementation((_, callback) => callback(testError))

      await expect(client.collection(collection).insertMany([{ test: 'data' }])).rejects.toThrow(testError)
    })

    test('findOne should reject on error', async () => {
      // @ts-ignore
      mockInternalCollection.findOne.mockImplementation((_, callback) => callback(testError))

      await expect(client.collection(collection).findOne({ test: 'query' })).rejects.toThrow(testError)
    })

    test('findOne should return null when no document is found', async () => {
      // @ts-ignore
      mockInternalCollection.findOne.mockImplementation(
        // @ts-ignore
        (_, callback) => callback(null, null),
      )

      const result = await client.collection(collection).findOne({ test: 'nonexistent' })
      expect(result).toBeNull()
    })

    test('updateOne should reject on error', async () => {
      // @ts-ignore
      mockInternalCollection.updateOne.mockImplementation((_, __, callback) => callback(testError))

      await expect(
        client.collection(collection).updateOne({ test: 'query' }, { $set: { test: 'updated' } }),
      ).rejects.toThrow(testError)
    })

    test('updateMany should reject on error', async () => {
      // @ts-ignore
      mockInternalCollection.updateMany.mockImplementation((_, __, callback) => callback(testError))

      await expect(
        client.collection(collection).updateMany({ test: 'query' }, { $set: { test: 'updated' } }),
      ).rejects.toThrow(testError)
    })

    test('deleteOne should reject on error', async () => {
      // @ts-ignore
      mockInternalCollection.deleteOne.mockImplementation((_, callback) => callback(testError))

      await expect(client.collection(collection).deleteOne({ test: 'query' })).rejects.toThrow(testError)
    })

    test('deleteMany should reject on error', async () => {
      // @ts-ignore
      mockInternalCollection.deleteMany.mockImplementation((_, callback) => callback(testError))

      await expect(client.collection(collection).deleteMany({ test: 'query' })).rejects.toThrow(testError)
    })

    test('cursor toArray should reject on error', async () => {
      const mockCursor = {
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockImplementation((callback) => callback(testError)),
      }

      // @ts-ignore
      mockInternalCollection.find.mockReturnValue(mockCursor)

      const cursor = client.collection(collection).find({ test: 'query' })
      await expect(cursor.toArray()).rejects.toThrow(testError)
    })
  })
})
