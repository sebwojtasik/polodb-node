# PoloDB Node.js Bindings

[PoloDB](https://github.com/PoloDB/PoloDB) is a lightweight embedded database that provides MongoDB-like syntax. This package provides Node.js bindings for PoloDB, allowing you to use PoloDB in your Node.js applications.

## Installation

```bash
pnpm add @sebwojtasik/polodb
```

## Quick Start

```typescript
import { PoloDbClient } from '@sebwojtasik/polodb'

// Create a new database or connect to an existing one
const client = new PoloDbClient('path/to/database.db')

// Get a collection
const collection = client.collection('users')

// Insert a document
await collection.insertOne({ name: 'John', age: 30 })

// Query documents
const user = await collection.findOne({ name: 'John' })
```

## API Reference

### PoloDbClient

The main client class for interacting with PoloDB.

```typescript
const client = new PoloDbClient(path: string);
```

### Collection Operations

#### Inserting Documents

```typescript
// Insert a single document
const user = await collection.insertOne({
  name: 'John Doe',
  age: 30,
  email: 'john@example.com',
  createdAt: new Date(),
})

// Insert multiple documents
const users = await collection.insertMany([
  { name: 'Jane Doe', age: 25, email: 'jane@example.com' },
  { name: 'Bob Smith', age: 35, email: 'bob@example.com' },
  { name: 'Alice Johnson', age: 28, email: 'alice@example.com' },
])
```

#### Querying Documents

```typescript
// Find one document
const user = await collection.findOne({ name: 'John Doe' })

// Find with complex conditions
const seniorUser = await collection.findOne({
  age: { $gte: 30 },
  email: { $regex: '@example.com$' },
})

// Find multiple documents
const activeUsers = await collection
  .find({
    lastLoginDate: { $gte: new Date('2024-01-01') },
    status: 'active',
  })
  .toArray()

// Find with $or operator
const results = await collection
  .find({
    $or: [{ age: { $lt: 25 } }, { premium: true }],
  })
  .toArray()
```

#### Updating Documents

```typescript
// Update one document
const updateResult = await collection.updateOne(
  { email: 'john@example.com' },
  {
    $set: { lastLoginDate: new Date() },
    $inc: { loginCount: 1 },
  },
)

// Update multiple documents
const bulkUpdate = await collection.updateMany(
  { age: { $lt: 30 } },
  {
    $set: { category: 'young' },
    $inc: { age: 1 },
  },
)

// Update with multiple operators
const complexUpdate = await collection.updateOne(
  { userId: '123' },
  {
    $set: { updatedAt: new Date() },
    $inc: { points: 10 },
    $max: { highScore: 1000 },
    $rename: { oldField: 'newField' },
    $unset: { temporaryFlag: '' },
  },
)
```

#### Deleting Documents

```typescript
// Delete one document
const deleteOne = await collection.deleteOne({
  email: 'john@example.com',
})

// Delete multiple documents
const deleteInactive = await collection.deleteMany({
  lastLoginDate: { $lt: new Date('2023-01-01') },
  status: 'inactive',
})

// Delete with complex conditions
const deleteBulk = await collection.deleteMany({
  $or: [{ status: 'deleted' }, { expirationDate: { $lt: new Date() } }],
})
```

### Cursor Operations

The cursor returned by `find()` supports several operations:

```typescript
// Sorting, limiting, and skipping results
const topUsers = await collection
  .find({ status: 'active' })
  .sort({ score: -1 }) // -1 for descending order
  .limit(10)
  .toArray()

// Pagination example
const pageSize = 20
const pageNumber = 2
const paginatedUsers = await collection
  .find({ age: { $gte: 18 } })
  .sort({ createdAt: -1 })
  .skip((pageNumber - 1) * pageSize)
  .limit(pageSize)
  .toArray()

// Complex query with multiple operations
const filteredUsers = await collection
  .find({
    age: { $gte: 18, $lte: 65 },
    status: 'active',
    subscriptionLevel: { $in: ['premium', 'pro'] },
  })
  .sort({
    subscriptionLevel: -1,
    createdAt: 1,
  })
  .skip(100)
  .limit(50)
  .toArray()
```

## Advanced features

Transactions, indexes and aggregation are currently not supported. I have no plan to support them for now.

## TypeScript Support

PoloDB bindings are written in TypeScript and provide (some) type safety. You can specify the document type when creating a collection:

```typescript
interface User {
  name: string
  age: number
  email: string
  createdAt: Date
  lastLoginDate?: Date
  status: 'active' | 'inactive'
  subscriptionLevel?: 'free' | 'premium' | 'pro'
  points?: number
  highScore?: number
}

const users = client.collection<User>('users')

// TypeScript will now provide type checking and autocompletion
const newUser = await users.insertOne({
  name: 'John Doe',
  age: 30,
  email: 'john@example.com',
  createdAt: new Date(),
  status: 'active',
})
```

## License

Binding code is released under the MIT license.
