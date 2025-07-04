# Database Solution for Persistent Notifications

## Option 1: Vercel Postgres (Recommended)

### Setup Vercel Postgres:

1. **Install Vercel Postgres:**
   ```bash
   vercel storage create postgres
   ```

2. **Add to your project:**
   ```bash
   vercel env pull .env.local
   ```

3. **Install dependencies:**
   ```bash
   npm install @vercel/postgres
   ```

### Updated API with Database:

```javascript
// api/notify.js with Postgres
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { app, title, content } = req.body;
    
    if (!title || !app) {
      return res.status(400).json({ error: 'Title and app are required' });
    }

    const result = await sql`
      INSERT INTO notifications (app, title, content, timestamp)
      VALUES (${app}, ${title}, ${content || ''}, NOW())
      RETURNING *
    `;

    res.status(200).json({
      success: true,
      message: 'Notification saved',
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

```javascript
// api/notifications.js with Postgres
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { limit, app, sort = 'desc' } = req.query;
    
    let query = sql`SELECT * FROM notifications`;
    const params = [];
    
    if (app) {
      query = sql`SELECT * FROM notifications WHERE app ILIKE ${'%' + app + '%'}`;
    }
    
    query = query + sql` ORDER BY timestamp ${sort === 'asc' ? 'ASC' : 'DESC'}`;
    
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query + sql` LIMIT ${limitNum}`;
      }
    }

    const result = await query;
    
    res.status(200).json({
      count: result.rows.length,
      notifications: result.rows
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Database Schema:

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  app VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## Option 2: MongoDB Atlas

### Setup MongoDB:

1. **Create MongoDB Atlas account**
2. **Install MongoDB driver:**
   ```bash
   npm install mongodb
   ```

3. **Add connection string to Vercel environment variables**

### Updated API with MongoDB:

```javascript
// api/notify.js with MongoDB
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    await client.connect();
    const database = client.db('notifications');
    const collection = database.collection('notifications');

    const { app, title, content } = req.body;
    
    if (!title || !app) {
      return res.status(400).json({ error: 'Title and app are required' });
    }

    const notification = {
      app,
      title,
      content: content || '',
      timestamp: new Date()
    };

    const result = await collection.insertOne(notification);

    res.status(200).json({
      success: true,
      message: 'Notification saved',
      notification: { ...notification, id: result.insertedId }
    });
  } catch (error) {
    console.error('Error saving notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await client.close();
  }
}
```

## Option 3: Supabase (Free Tier Available)

### Setup Supabase:

1. **Create Supabase account**
2. **Install Supabase client:**
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Add environment variables to Vercel**

### Updated API with Supabase:

```javascript
// api/notify.js with Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { app, title, content } = req.body;
    
    if (!title || !app) {
      return res.status(400).json({ error: 'Title and app are required' });
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([
        { app, title, content: content || '' }
      ])
      .select();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Notification saved',
      notification: data[0]
    });
  } catch (error) {
    console.error('Error saving notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Quick Implementation Guide:

1. **Choose your database** (Vercel Postgres recommended)
2. **Set up the database** following the provider's guide
3. **Update the API files** with the database code above
4. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

## Benefits of Database Solution:

- ✅ **Persistent storage** - Notifications survive function restarts
- ✅ **Scalable** - Handle thousands of notifications
- ✅ **Reliable** - No data loss
- ✅ **Queryable** - Advanced filtering and search
- ✅ **Production-ready** - Suitable for real applications 