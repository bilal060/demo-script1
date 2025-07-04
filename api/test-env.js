export default function handler(req, res) {
  const mongoUri = process.env.MONGODB_URI;
  
  res.status(200).json({
    hasMongoUri: !!mongoUri,
    mongoUriLength: mongoUri ? mongoUri.length : 0,
    mongoUriPreview: mongoUri ? mongoUri.substring(0, 20) + '...' : 'Not set',
    allEnvVars: Object.keys(process.env).filter(key => key.includes('MONGO'))
  });
} 