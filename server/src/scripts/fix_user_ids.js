const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

async function runScript() {
    const client = await pool.connect();
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'fix_user_ids.sql'), 'utf8');
        await client.query(sql);
        console.log('SQL script executed successfully');
    } catch (error) {
        console.error('Error executing SQL script:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

runScript(); 