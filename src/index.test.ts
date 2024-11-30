import { PoloDbClient } from './index'

interface User {
  name: string
  age: number
  email: string
  createdAt: Date
  status: 'active' | 'inactive'
  loginCount?: number
  tags?: string[]
  metadata?: {
    lastLogin?: Date
    preferences?: {
      theme?: string
      notifications?: boolean
    }
  }
}

describe('PoloDB Node.js Bindings', () => {
  const client = new PoloDbClient('test.db')
  const users = client.collection<User>('users')
  beforeEach(async () => {
    await users.deleteMany({})
  })

  afterEach(async () => {
    await users.deleteMany({})
  })

  describe('Insert Operations', () => {
    test('insertOne should insert a single document', async () => {
      const user = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
        createdAt: new Date(),
        status: 'active' as const,
      }

      await users.insertOne(user)
      const found = await users.findOne({ email: 'john@example.com' })
      expect(found).toMatchObject(user)
    })

    test('insertMany should insert multiple documents', async () => {
      const newUsers = [
        {
          name: 'John Doe',
          age: 30,
          email: 'john@example.com',
          createdAt: new Date(),
          status: 'active' as const,
        },
        {
          name: 'Jane Doe',
          age: 25,
          email: 'jane@example.com',
          createdAt: new Date(),
          status: 'active' as const,
        },
      ]

      await users.insertMany(newUsers)
      const found = await users.find({}).toArray()
      expect(found).toHaveLength(2)
      expect(found).toEqual(expect.arrayContaining(newUsers.map((user) => expect.objectContaining(user))))
    })
  })

  describe('Query Operations', () => {
    beforeEach(async () => {
      await users.insertMany([
        {
          name: 'John Doe',
          age: 30,
          email: 'john@example.com',
          createdAt: new Date('2024-01-01'),
          status: 'active',
          loginCount: 10,
          tags: ['premium', 'early-adopter'],
        },
        {
          name: 'Jane Doe',
          age: 25,
          email: 'jane@example.com',
          createdAt: new Date('2024-01-02'),
          status: 'active',
          loginCount: 5,
          tags: ['free'],
        },
        {
          name: 'Bob Smith',
          age: 35,
          email: 'bob@example.com',
          createdAt: new Date('2024-01-03'),
          status: 'inactive',
          loginCount: 3,
          tags: ['premium'],
        },
      ])
    })

    test('findOne should return a single document', async () => {
      const user = await users.findOne({ email: 'john@example.com' })
      expect(user).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
      })
    })

    test('find should return multiple documents', async () => {
      const activeUsers = await users.find({ status: 'active' }).toArray()
      expect(activeUsers).toHaveLength(2)
    })

    test('should support comparison operators', async () => {
      const olderUsers = await users.find({ age: { $gt: 28 } }).toArray()
      expect(olderUsers).toHaveLength(2)

      const specificAges = await users.find({ age: { $in: [25, 35] } }).toArray()
      expect(specificAges).toHaveLength(2)
    })

    test('should support regex operators', async () => {
      const gmailUsers = await users
        .find({
          email: { $regex: /.*@example\.com/ },
        })
        .toArray()
      expect(gmailUsers).toHaveLength(3)
    })

    test('should support logical operators', async () => {
      const results = await users
        .find({
          $or: [{ age: 25 }, { status: 'inactive' }],
        })
        .toArray()
      expect(results).toHaveLength(2)
    })

    test('should support array queries', async () => {
      const premiumUsers = await users
        .find({
          age: { $in: [30, 25] },
        })
        .toArray()
      expect(premiumUsers).toHaveLength(2)
    })
  })

  describe('Update Operations', () => {
    beforeEach(async () => {
      await users.insertOne({
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
        createdAt: new Date(),
        status: 'active',
        loginCount: 5,
      })
    })

    test('updateOne should update a single document', async () => {
      const result = await users.updateOne({ email: 'john@example.com' }, { $set: { age: 31 } })
      expect(result.matched_count).toBe(1)
      expect(result.modified_count).toBe(1)

      const updated = await users.findOne({ email: 'john@example.com' })
      expect(updated?.age).toBe(31)
    })

    test('should support increment operations', async () => {
      await users.updateOne({ email: 'john@example.com' }, { $inc: { loginCount: 1 } })

      const updated = await users.findOne({ email: 'john@example.com' })
      expect(updated?.loginCount).toBe(6)
    })

    test('should support multiple update operators', async () => {
      await users.updateOne(
        { email: 'john@example.com' },
        {
          $set: { status: 'inactive' as const },
          $max: { age: 35 },
        },
      )

      const updated = await users.findOne({ email: 'john@example.com' })
      expect(updated).toMatchObject({
        status: 'inactive',
        age: 35,
      })
    })

    test('updateMany should update multiple documents', async () => {
      await users.insertOne({
        name: 'Jane Doe',
        age: 25,
        email: 'jane@example.com',
        createdAt: new Date(),
        status: 'active',
        loginCount: 3,
      })

      const result = await users.updateMany({ status: 'active' }, { $inc: { loginCount: 1 } })

      expect(result.matched_count).toBe(2)
      expect(result.modified_count).toBe(2)

      const updated = await users.find({ status: 'active' }).toArray()
      expect(updated[0].loginCount).toBe(6)
      expect(updated[1].loginCount).toBe(4)
    })
  })

  describe('Delete Operations', () => {
    beforeEach(async () => {
      await users.insertMany([
        {
          name: 'John Doe',
          age: 30,
          email: 'john@example.com',
          createdAt: new Date(),
          status: 'active',
        },
        {
          name: 'Jane Doe',
          age: 25,
          email: 'jane@example.com',
          createdAt: new Date(),
          status: 'inactive',
        },
      ])
    })

    test('deleteOne should delete a single document', async () => {
      const result = await users.deleteOne({ email: 'john@example.com' })
      expect(result.deleted_count).toBe(1)

      const remaining = await users.find({}).toArray()
      expect(remaining).toHaveLength(1)
      expect(remaining[0].email).toBe('jane@example.com')
    })

    test('deleteMany should delete multiple documents', async () => {
      const result = await users.deleteMany({
        // @ts-ignore
        $or: [{ status: 'inactive' }, { age: { $gt: 28 } }],
      })
      expect(result.deleted_count).toBe(2)

      const remaining = await users.find({}).toArray()
      expect(remaining).toHaveLength(0)
    })
  })

  describe('Cursor Operations', () => {
    beforeEach(async () => {
      await users.insertMany([
        {
          name: 'User 1',
          age: 20,
          email: 'user1@example.com',
          createdAt: new Date('2024-01-01'),
          status: 'active',
        },
        {
          name: 'User 2',
          age: 25,
          email: 'user2@example.com',
          createdAt: new Date('2024-01-02'),
          status: 'active',
        },
        {
          name: 'User 3',
          age: 30,
          email: 'user3@example.com',
          createdAt: new Date('2024-01-03'),
          status: 'active',
        },
      ])
    })

    test('should support sorting', async () => {
      // @ts-ignore
      const results = await users.find({}).sort({ age: -1 }).toArray()

      expect(results[0].age).toBe(30)
      expect(results[2].age).toBe(20)
    })

    test('should support pagination', async () => {
      const pageSize = 2
      // @ts-ignore
      const page1 = await users.find({}).sort({ createdAt: 1 }).limit(pageSize).toArray()

      // @ts-ignore
      const page2 = await users.find({}).sort({ createdAt: 1 }).skip(pageSize).limit(pageSize).toArray()

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(1)
      expect(page1[0].name).toBe('User 1')
      expect(page2[0].name).toBe('User 3')
    })

    test('should support chaining operations', async () => {
      // @ts-ignore
      const results = await users
        .find({ age: { $gte: 25 } })
        .sort({ age: 1 })
        .skip(1)
        .limit(1)
        .toArray()

      expect(results).toHaveLength(1)
      expect(results[0].age).toBe(30)
    })
  })
})
