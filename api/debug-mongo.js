export default function handler(req, res) {
  const uri = process.env.MONGODB_URI;
  
  // Show the connection string with sensitive parts masked
  const maskedUri = uri ? uri.replace(/:([^@]+)@/, ':****@') : 'Not set';
  
  res.status(200).json({
    hasUri: !!uri,
    uriLength: uri ? uri.length : 0,
    maskedUri: maskedUri,
    // Show parts of the URI for debugging
    parts: uri ? {
      protocol: uri.split('://')[0],
      username: uri.split('://')[1]?.split(':')[0],
      hostname: uri.split('@')[1]?.split('/')[0],
      database: uri.split('/').pop()?.split('?')[0]
    } : null
  });
} 