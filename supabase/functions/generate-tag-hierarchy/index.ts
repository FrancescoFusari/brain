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

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      throw new Error('No tags provided or invalid tags format');
    }

    if (!userId) {
      throw new Error('No user ID provided');
    }

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
            content: `You are a tag organization expert. Analyze the provided tags and create a hierarchical structure.
            Return ONLY a JSON array of objects with parent_tag and child_tag properties, where parent tags are more general concepts and child tags are more specific.
            Example format: [{"parent_tag": "technology", "child_tag": "programming"}]
            Rules:
            - Each child tag should only appear once
            - Parent tags should be broader categories
            - Avoid creating too many parent categories (aim for 3-7)
            - Parent tags should not be existing tags unless they're truly general categories`
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
      console.error('OpenAI API error:', response.statusText);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      console.error('Unexpected OpenAI response format:', data);
      throw new Error('Unexpected response format from OpenAI');
    }

    let relationships;
    try {
      const content = data.choices[0].message.content.trim();
      relationships = JSON.parse(content);
      
      if (!Array.isArray(relationships)) {
        throw new Error('Response is not an array');
      }
      
      relationships.forEach(rel => {
        if (typeof rel !== 'object' || !rel.parent_tag || !rel.child_tag) {
          throw new Error('Invalid relationship format');
        }
      });
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      console.error('Raw content:', data.choices[0].message.content);
      throw new Error('Invalid response format from OpenAI');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Clear existing relationships for this user
    const { error: deleteError } = await supabase
      .from('tag_relationships')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting existing relationships:', deleteError);
      throw deleteError;
    }

    // Insert the new relationships
    const { error: insertError } = await supabase
      .from('tag_relationships')
      .insert(
        relationships.map(rel => ({
          ...rel,
          user_id: userId,
        }))
      );

    if (insertError) {
      console.error('Error inserting relationships:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, relationships }),
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