CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(15) NOT NULL,
    avatar VARCHAR(3) NOT NULL,
    color VARCHAR(6) NOT NULL CHECK (color ~ '^([A-F0-9]{6})$') 
);