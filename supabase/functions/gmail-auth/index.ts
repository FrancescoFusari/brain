import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)

    // Handle OAuth callback
    if (code) {
      console.log('Received OAuth callback with code:', code)
      
      const redirectUri = `${SUPABASE_URL}/functions/v1/gmail-auth`
      
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })

      const tokens = await tokenResponse.json()
      console.log('Received tokens from Google:', { ...tokens, access_token: '[REDACTED]' })

      if (tokens.error) {
        throw new Error(tokens.error_description || tokens.error)
      }

      // Get authorization header from request
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        throw new Error('Missing authorization header')
      }

      // Get user session from Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      )
      
      if (authError || !user) {
        throw new Error('Not authenticated')
      }

      // Store the tokens in the gmail_integrations table
      const { error: insertError } = await supabase
        .from('gmail_integrations')
        .upsert({
          user_id: user.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })

      if (insertError) {
        throw insertError
      }

      // Redirect back to the application
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${SUPABASE_URL}/gmail?success=true`,
        },
      })
    }

    // Handle initial auth URL generation
    const { action } = await req.json()
    
    if (action === 'get-auth-url') {
      const redirectUri = `${SUPABASE_URL}/functions/v1/gmail-auth`
      const scope = 'https://www.googleapis.com/auth/gmail.readonly'
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
      
      console.log('Generated auth URL:', authUrl)
      
      return new Response(
        JSON.stringify({ authUrl }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    throw new Error('Invalid action')
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})