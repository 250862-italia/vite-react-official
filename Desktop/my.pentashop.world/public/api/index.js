// Minimal API for Vercel deployment
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'MY.PENTASHOP.WORLD API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
} 