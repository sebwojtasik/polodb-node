import { test } from "node:test";
import assert from "node:assert/strict";
import { PoloDbClient } from "./index.js";

const client = new PoloDbClient("test.db");
const collection = client.collection("default");

const clearCollection = async () => await collection.deleteMany({});

test("create db client instance", async (t) => {
	assert.ok(client);
});

test("create collection", async (t) => {
	assert.ok(collection);
});

test("insert one item", async (t) => {
	await clearCollection();
	assert.ok(await collection.insertOne({}));
});

test("insert many items", async (t) => {
	await clearCollection();
	await collection.insertMany([{}, {}, {}]);
	const result = await collection.find({}).toArray();
	assert.strictEqual(result.length, 3);
});

test("find one item", async (t) => {
	await clearCollection();
	await collection.insertOne({});
	const result = await collection.findOne({});
	assert.ok(result);
});

test("find one item by field", async (t) => {
	await clearCollection();
	await collection.insertOne({ name: "Test" });
	assert.ok(await collection.findOne({ name: "Test" }));
});

test("delete one item", async (t) => {
	await clearCollection();
	await collection.insertOne({ name: "Test" });
	await collection.deleteOne({ name: "Test" });
	const result = await collection.find({}).toArray();
	assert.strictEqual(result.length, 0);
});
