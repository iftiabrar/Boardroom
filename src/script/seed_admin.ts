import { dataSourceOptions } from "@/config/.";
import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";

// Creates the admin account from ADMIN_EMAIL and ADMIN_PASSWORD in .env (runs only once)
const run = async () => {
  const ds = await new DataSource(dataSourceOptions).initialize();
  const email = process.env.ADMIN_EMAIL as string;
  const found = await ds.query("SELECT id FROM users WHERE email = $1", [email]);
  if (!found.length) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD as string, 12);
    await ds.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'ROLE_ADMIN')",
      ["Admin", email, hash],
    );
  }
  console.log("Admin account is ready");
  await ds.destroy();
};

run();
