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

    // Call OpenAI to analyze tags and suggest hierarchical relationships
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
            content: 'You are a tag organization expert. Given a list of tags, suggest parent-child relationships between them to create a meaningful hierarchy. Return ONLY a JSON array of objects with parent_tag and child_tag properties, nothing else. Example: [{"parent_tag": "technology", "child_tag": "programming"}]'
          },
          {
            role: 'user',
            content: `Analyze these tags and suggest hierarchical relationships between them: ${JSON.stringify(tags)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    // Extract the content and ensure it's valid JSON
    const content = data.choices[0].message.content.trim();
    console.log('Raw content:', content);

    // Try to parse the content directly
    let suggestedRelationships;
    try {
      suggestedRelationships = JSON.parse(content);
      console.log('Parsed relationships:', suggestedRelationships);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      // If parsing fails, try to extract JSON from markdown
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        suggestedRelationships = JSON.parse(jsonMatch[0]);
        console.log('Parsed relationships from markdown:', suggestedRelationships);
      } else {
        throw new Error('Failed to parse relationships from OpenAI response');
      }
    }

    // Validate the structure of the relationships
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
        suggestedRelationships.map((rel: any) => ({
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