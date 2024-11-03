CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(22) NOT NULL,
    login VARCHAR(10) NOT NULL,
    avatar VARCHAR(3) NOT NULL,
    color VARCHAR(6) NOT NULL CHECK (color ~ '^([A-F0-9]{6})$') 
);