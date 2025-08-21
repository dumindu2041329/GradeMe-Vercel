import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupExtraBuckets() {
  try {
    // List all existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    console.log('Current buckets:', buckets?.map(b => b.name));

    // Define allowed buckets
    const allowedBuckets = ['exam-papers', 'profile-images'];
    
    // Find buckets to remove
    const bucketsToRemove = buckets?.filter(bucket => 
      !allowedBuckets.includes(bucket.name)
    ) || [];

    if (bucketsToRemove.length === 0) {
      console.log('No extra buckets to remove');
      return;
    }

    console.log('Buckets to remove:', bucketsToRemove.map(b => b.name));

    // Remove extra buckets
    for (const bucket of bucketsToRemove) {
      console.log(`Removing bucket: ${bucket.name}`);
      
      // First, try to empty the bucket
      try {
        const { data: files } = await supabase.storage.from(bucket.name).list();
        if (files && files.length > 0) {
          const fileNames = files.map(f => f.name);
          await supabase.storage.from(bucket.name).remove(fileNames);
          console.log(`Emptied bucket ${bucket.name}`);
        }
      } catch (error) {
        console.log(`Could not empty bucket ${bucket.name}:`, error);
      }

      // Then remove the bucket
      const { error } = await supabase.storage.deleteBucket(bucket.name);
      if (error) {
        console.error(`Error removing bucket ${bucket.name}:`, error);
      } else {
        console.log(`Successfully removed bucket: ${bucket.name}`);
      }
    }

  } catch (error) {
    console.error('Error during bucket cleanup:', error);
  }
}

// Run cleanup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupExtraBuckets();
}

export { cleanupExtraBuckets };