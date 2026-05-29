const pool = require('./db')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id           SERIAL PRIMARY KEY,
        username     VARCHAR(30) UNIQUE NOT NULL,
        email        VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        wallet_address VARCHAR(100),
        elo          INTEGER DEFAULT 1000,
        credits      INTEGER DEFAULT 100,
        spins        INTEGER DEFAULT 1,
        wins         INTEGER DEFAULT 0,
        losses       INTEGER DEFAULT 0,
        daily_claimed_at DATE,
        xp           INTEGER DEFAULT 0,
        level        INTEGER DEFAULT 1,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        updated_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Cards master table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id       SERIAL PRIMARY KEY,
        name     VARCHAR(100) NOT NULL,
        type     VARCHAR(50)  NOT NULL,
        rarity   VARCHAR(20)  NOT NULL CHECK (rarity IN ('common','rare','epic','legendary')),
        mana     INTEGER NOT NULL,
        atk      INTEGER NOT NULL,
        def      INTEGER NOT NULL,
        power    VARCHAR(20),
        emoji    VARCHAR(10)  NOT NULL,
        color    VARCHAR(10)  NOT NULL
      )
    `)

    // User cards (collection)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_cards (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
        card_id     INTEGER REFERENCES cards(id),
        acquired_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, card_id)
      )
    `)

    // User powers
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_powers (
        id       SERIAL PRIMARY KEY,
        user_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
        power_id VARCHAR(20) NOT NULL,
        acquired_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, power_id)
      )
    `)

    // Battles log
    await client.query(`
      CREATE TABLE IF NOT EXISTS battles (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
        difficulty   VARCHAR(10) NOT NULL,
        result       VARCHAR(4) NOT NULL CHECK (result IN ('win','lose')),
        elo_delta    INTEGER NOT NULL,
        credits_earned INTEGER DEFAULT 0,
        played_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Transactions (premium purchases)
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
        pack_id      VARCHAR(20) NOT NULL,
        sol_amount   DECIMAL(10,4) NOT NULL,
        usd_amount   DECIMAL(10,2),
        tx_signature VARCHAR(200) UNIQUE,
        status       VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','failed')),
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Daily quests progress
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_quests (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
        quest_id    VARCHAR(30) NOT NULL,
        quest_date  DATE NOT NULL DEFAULT CURRENT_DATE,
        progress    INTEGER DEFAULT 0,
        completed   BOOLEAN DEFAULT FALSE,
        claimed     BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMPTZ,
        UNIQUE(user_id, quest_id, quest_date)
      )
    `)

    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_quests_user_date ON user_quests(user_id, quest_date)`)

    // Leaderboard view
    await client.query(`
      CREATE OR REPLACE VIEW leaderboard AS
      SELECT
        id, username, elo, wins, losses,
        RANK() OVER (ORDER BY elo DESC) AS rank,
        CASE
          WHEN elo >= 1400 THEN 'Gran Maestro'
          WHEN elo >= 1200 THEN 'Campione'
          WHEN elo >= 1050 THEN 'Veterano'
          WHEN elo >= 900  THEN 'Guerriero'
          ELSE 'Recluta'
        END AS title
      FROM users
      ORDER BY elo DESC
    `)

    // Index for performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_elo ON users(elo DESC)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_battles_user ON battles(user_id)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_cards_user ON user_cards(user_id)`)

    // Seed cards data
    await client.query(`
      INSERT INTO cards (name,type,rarity,mana,atk,def,power,emoji,color) VALUES
        ('Drago di Fiamma','Leggendaria','legendary',7,8,5,'burn','🐉','#f59e0b'),
        ('Cavaliere Oscuro','Epica','epic',4,6,4,'shield','🗡️','#a78bfa'),
        ('Mago Arcano','Epica','epic',5,7,2,'double','🧙','#8b5cf6'),
        ('Fenice Sacra','Rara','rare',6,5,3,'heal','🔥','#f97316'),
        ('Golem di Pietra','Rara','rare',4,2,9,null,'🪨','#9ca3af'),
        ('Arciere Elfico','Comune','common',2,4,2,null,'🏹','#4ade80'),
        ('Scheletro Antico','Comune','common',1,3,1,null,'💀','#d1d5db'),
        ('Unicorno Astrale','Rara','rare',3,3,5,'heal','🦄','#c084fc'),
        ('Demone del Caos','Epica','epic',6,8,3,'burn','😈','#ef4444'),
        ('Nano Guerriero','Comune','common',2,3,4,null,'⚒️','#fbbf24'),
        ('Sirena Oscura','Rara','rare',4,4,4,'double','🧜','#38bdf8'),
        ('Titan Celeste','Leggendaria','legendary',8,9,7,'double','⚡','#facc15'),
        ('Orso Berserker','Rara','rare',4,7,2,null,'🐻','#a16207'),
        ('Strega delle Nevi','Epica','epic',5,5,5,'freeze','🧊','#7dd3fc'),
        ('Vampiro Antico','Epica','epic',5,6,3,'drain','🧛','#f43f5e'),
        ('Grifone da Guerra','Rara','rare',5,5,4,null,'🦅','#fb923c'),
        ('Elementale del Fuoco','Comune','common',3,5,1,null,'🌋','#f87171'),
        ('Paladino della Luce','Leggendaria','legendary',7,6,8,'heal','🛡️','#fde047'),
        ('Assassino Fantasma','Epica','epic',4,7,2,'double','🗡️','#94a3b8'),
        ('Drago di Ghiaccio','Leggendaria','legendary',8,7,7,'freeze','❄️','#bae6fd')
      ON CONFLICT DO NOTHING
    `)

    await client.query('COMMIT')
    console.log('✓ Database migrated successfully')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Migration failed:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
