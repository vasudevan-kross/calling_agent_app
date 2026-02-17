# Database Setup

This directory contains the database schema for the AI Calling Application.

## Quick Setup

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://app.supabase.com/project/lpqawgklofveutmrjaff
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `schema.sql`
5. Click **Run** or press `Ctrl+Enter`

### Option 2: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref lpqawgklofveutmrjaff

# Run the migration
supabase db push
```

## What Gets Created

### Tables

1. **leads** - Stores contact information for potential customers
   - Includes: name, phone, email, address, ratings, Google Place data
   - Auto-generated UUID primary key
   - Timestamps: created_at, updated_at

2. **calls** - Stores call history and details
   - Links to leads via foreign key
   - Stores: provider info, call status, transcripts, recordings
   - Auto-generated UUID primary key
   - Timestamps: created_at, updated_at

### Features

- ✓ UUID primary keys
- ✓ Foreign key constraints with cascade delete
- ✓ Automatic `updated_at` timestamp triggers
- ✓ JSONB columns for flexible metadata and transcripts
- ✓ Indexes on frequently queried columns
- ✓ Row Level Security ready (commented out, enable if needed)

## Verification

After running the schema, verify everything is set up correctly:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('leads', 'calls');

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;
```

## Testing

To insert a test lead:

```sql
INSERT INTO public.leads (name, business_name, phone, email, city, state, country, source)
VALUES ('Test Contact', 'Test Business', '+1234567890', 'test@example.com', 'New York', 'NY', 'USA', 'manual')
RETURNING *;
```

## Troubleshooting

### Error: "uuid-ossp extension does not exist"
**Solution:** Enable the extension in Supabase:
1. Go to Database > Extensions
2. Search for "uuid-ossp"
3. Enable it

### Error: "table already exists"
**Solution:** The schema uses `CREATE TABLE IF NOT EXISTS`, so this shouldn't happen. If you need to recreate tables:
```sql
DROP TABLE IF EXISTS public.calls CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
-- Then run schema.sql again
```

### Error: "permission denied"
**Solution:** Make sure you're using the service_role key in the Supabase dashboard or have proper permissions.

## Next Steps

After setting up the database:
1. Restart your backend server
2. Test the API at http://localhost:8000/docs
3. Try creating a lead via the API
4. Check Supabase Table Editor to see the data
