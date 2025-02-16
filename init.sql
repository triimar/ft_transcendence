CREATE TABLE IF NOT EXISTS transcendence_users (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(22) NOT NULL UNIQUE,
    login VARCHAR(10) NOT NULL UNIQUE,
    avatar VARCHAR(3) NOT NULL CHECK (avatar ~ '^.{3}$'),
    color VARCHAR(6) NOT NULL CHECK (color ~ '^[a-fA-F0-9]{6}$')
);

