import * as fs from "fs";
import * as path from "path";

export interface TestUser {
  username: string;
  email: string;
  password: string;
}

export class TestDataGenerator {
  private static readonly CSV_PATH = path.join(process.cwd(), "testdata", "registered_users.csv");

  static async generateUser(): Promise<TestUser> {
    const username = `TestUser${Math.floor(Math.random() * 9000) + 1000}`;
    const domain = `fake-${Math.random().toString(36).substring(7)}.com`;
    const email = `${username}@${domain}`;
    const password = Math.random().toString(36).substring(2, 10) + "A1";

    return { username, email, password };
  }

  static saveUserToCsv(user: TestUser): void {
    const dir = path.dirname(this.CSV_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const csvLine = `${user.username},${user.email},${user.password}\n`;
    fs.appendFileSync(this.CSV_PATH, csvLine);
  }

  static async getRandomUserFromCsv(): Promise<TestUser | null> {
    try {
      if (!fs.existsSync(this.CSV_PATH)) {
        return null;
      }

      const content = fs.readFileSync(this.CSV_PATH, "utf-8");
      const lines = content.trim().split("\n");

      if (lines.length === 0) {
        return null;
      }

      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      const [username, email, password] = randomLine.split(",");

      return { username, email, password };
    } catch (error) {
      console.error("Error reading CSV file:", error);
      return null;
    }
  }

  static getTestFilePath(fileName: string): string {
    return path.join(process.cwd(), "testdata", "upload", fileName);
  }
}
