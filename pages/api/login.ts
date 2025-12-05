import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcryptjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password, role } = req.body;

    console.log('[LOGIN] Attempt:', { username, role });

    // Validate inputs
    if (!username || !password) {
      console.log('[LOGIN] Missing credentials');
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (role && !['master_admin', 'volunteer', 'verification_staff', 'panel'].includes(role)) {
      console.log('[LOGIN] Invalid role:', role);
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Fetch user from database
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username);

    console.log('[LOGIN] Database response:', { 
      found: users?.length || 0, 
      error: error?.message,
      hasUsers: !!users 
    });

    if (error) {
      console.error('[LOGIN] Database error:', error);
      return res.status(500).json({ 
        error: 'Database error',
        details: error.message 
      });
    }

    if (!users || users.length === 0) {
      console.log('[LOGIN] User not found');
      return res.status(401).json({ 
        error: 'Invalid credentials',
        details: 'User not found'
      });
    }

    const user = users[0];
    console.log('[LOGIN] User found:', { username: user.username, role: user.role, hasPassword: !!user.password_hash });

    // Check if role matches (if specified)
    if (role && user.role !== role) {
      console.log('[LOGIN] Role mismatch:', { expected: role, actual: user.role });
      return res.status(403).json({ 
        error: 'Access denied for this role',
        details: `Expected ${role}, got ${user.role}`
      });
    }

    // Verify password - handle both hashed and plain text
    let isPasswordValid = false;
    const storedPassword = user.password_hash || user.password;
    
    if (!storedPassword) {
      console.error('[LOGIN] No password stored for user');
      return res.status(500).json({ error: 'Account configuration error' });
    }
    
    // Check if password looks like a bcrypt hash
    if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
      console.log('[LOGIN] Checking bcrypt hash...');
      try {
        isPasswordValid = await bcrypt.compare(password, storedPassword);
        console.log('[LOGIN] Bcrypt result:', isPasswordValid);
      } catch (bcryptError) {
        console.error('[LOGIN] Bcrypt error:', bcryptError);
        return res.status(500).json({ error: 'Password verification error' });
      }
    } else {
      console.log('[LOGIN] Checking plain text password...');
      isPasswordValid = password === storedPassword;
      console.log('[LOGIN] Plain text result:', isPasswordValid);
    }

    if (!isPasswordValid) {
      console.log('[LOGIN] Invalid password');
      return res.status(401).json({ 
        error: 'Invalid credentials',
        details: 'Wrong password'
      });
    }

    console.log('[LOGIN] Successful!');

    // Return user data (without password)
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('💥 Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
