import { faker } from "@faker-js/faker";
import { PoloDbClient } from "./index.js";
const client = new PoloDbClient("test.db");
const collection = client.collection("people");
await collection.deleteMany({});
const BATCH_SIZES = [100, 1000, 10000];
const ITERATIONS = 3;
const generateUser = () => {
	return {
		name: faker.person.fullName(),
		email: faker.internet.email(),
		address: {
			street: faker.location.streetAddress(),
			city: faker.location.city(),
			state: faker.location.state(),
			zipCode: faker.location.zipCode(),
		},
		phone: faker.phone.number(),
		company: faker.company.name(),
		createdAt: faker.date.past(),
		avatar: faker.image.avatar(),
		isActive: faker.datatype.boolean(),
		tags: Array.from({ length: 3 }, () => faker.word.sample()),
	};
};
function generateUsers(count) {
	return Array.from({ length: count }, generateUser);
}
async function runBenchmark() {
	try {
		console.log("Connected to MongoDB");
		await collection.deleteMany({});
		for (const batchSize of BATCH_SIZES) {
			console.log(`\nRunning benchmark for batch size: ${batchSize}`);
			let totalInsertTime = 0;
			let totalQueryTime = 0;
			let totalUpdateTime = 0;
			let totalDeleteTime = 0;
			for (let i = 0; i < ITERATIONS; i++) {
				console.log(`\nIteration ${i + 1}/${ITERATIONS}`);
				const users = generateUsers(batchSize);
				const insertStart = performance.now();
				await collection.insertMany(users);
				const insertEnd = performance.now();
				const insertTime = insertEnd - insertStart;
				totalInsertTime += insertTime;
				console.log(
					`Insert ${batchSize} documents: ${insertTime.toFixed(2)}ms`,
				);
				const queryStart = performance.now();
				await collection.find({ isActive: true }).limit(100).toArray();
				const queryEnd = performance.now();
				const queryTime = queryEnd - queryStart;
				totalQueryTime += queryTime;
				console.log(`Query 100 documents: ${queryTime.toFixed(2)}ms`);
				const updateStart = performance.now();
				await collection.updateMany(
					{ isActive: true },
					{ $set: { lastUpdated: new Date() } },
				);
				const updateEnd = performance.now();
				const updateTime = updateEnd - updateStart;
				totalUpdateTime += updateTime;
				console.log(`Update documents: ${updateTime.toFixed(2)}ms`);
				const deleteStart = performance.now();
				await collection.deleteMany({});
				const deleteEnd = performance.now();
				const deleteTime = deleteEnd - deleteStart;
				totalDeleteTime += deleteTime;
				console.log(`Delete documents: ${deleteTime.toFixed(2)}ms`);
			}
			console.log(`\nAverages for batch size ${batchSize}:`);
			console.log(
				`Avg Insert Time: ${(totalInsertTime / ITERATIONS).toFixed(2)}ms`,
			);
			console.log(
				`Avg Query Time: ${(totalQueryTime / ITERATIONS).toFixed(2)}ms`,
			);
			console.log(
				`Avg Update Time: ${(totalUpdateTime / ITERATIONS).toFixed(2)}ms`,
			);
			console.log(
				`Avg Delete Time: ${(totalDeleteTime / ITERATIONS).toFixed(2)}ms`,
			);
		}
	} catch (error) {
		console.error("Benchmark error:", error);
	} finally {
		console.log("\nBenchmark complete. Connection closed.");
	}
}
runBenchmark().catch(console.error);
