import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { tags, userId } = await req.json();
    console.log('Processing tags:', tags);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a tag organization expert. Analyze the provided tags and create a hierarchical structure. Return ONLY a JSON array of objects with parent_tag and child_tag properties, nothing else. Example: [{"parent_tag": "technology", "child_tag": "programming"}]'
          },
          {
            role: 'user',
            content: `Create a hierarchical structure for these tags: ${JSON.stringify(tags)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    const content = data.choices[0].message.content.trim();
    console.log('Raw content:', content);

    let suggestedRelationships;
    try {
      suggestedRelationships = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse OpenAI response directly:', error);
      throw new Error('Invalid response format from OpenAI');
    }

    if (!Array.isArray(suggestedRelationships)) {
      throw new Error('OpenAI response is not an array');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert the relationships
    const { error: insertError } = await supabase
      .from('tag_relationships')
      .insert(
        suggestedRelationships.map(rel => ({
          ...rel,
          user_id: userId,
        }))
      );

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, relationships: suggestedRelationships }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-tag-hierarchy function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});