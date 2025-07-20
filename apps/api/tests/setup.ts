import { beforeAll, afterAll } from "vitest";

beforeAll(() => {
  // For PostgreSQL, migrations are typically handled outside of tests
  // You might want to use a separate test database
  console.log("Test setup: Using PostgreSQL database");
});

afterAll(() => {
  // Clean up test data if needed
  // Note: Be careful not to drop production data
  console.log("Test cleanup: Completed");
});
