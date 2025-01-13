import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, filename, contentType } = await req.json();

    if (!image) {
      throw new Error('No image data provided');
    }

    console.log('Processing image:', filename);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(authHeader ?? '');
    if (!user) throw new Error('Not authenticated');

    // Convert base64 to Blob
    const base64Data = image.split(',')[1];
    const byteString = atob(base64Data);
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: contentType });

    // Upload file to storage
    const fileExt = filename.split('.').pop();
    const filePath = `${crypto.randomUUID()}.${fileExt}`;

    console.log('Uploading image to storage...');

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('note_images')
      .upload(filePath, blob, {
        contentType,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('note_images')
      .getPublicUrl(filePath);

    console.log('Image uploaded successfully, analyzing with OpenAI...');

    // Analyze image with OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) throw new Error('OpenAI API key not configured');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an AI that analyzes images and provides detailed descriptions with relevant tags and categories. Return ONLY raw JSON without any markdown formatting or code blocks. The JSON should contain three fields: "description" (string), "tags" (array of strings), and "category" (string). Example: {"description": "A scenic mountain landscape", "tags": ["nature", "mountains", "landscape"], "category": "Nature"}'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and provide a detailed description, relevant tags, and a category. Return ONLY raw JSON.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: publicUrl
                }
              }
            ]
          }
        ]
      }),
    });

    if (!openAIResponse.ok) {
      console.error('OpenAI API Error:', await openAIResponse.text());
      throw new Error(`Failed to analyze image with OpenAI: ${openAIResponse.status}`);
    }

    const analysisData = await openAIResponse.json();
    console.log('Raw OpenAI response:', JSON.stringify(analysisData));
    
    if (!analysisData.choices?.[0]?.message?.content) {
      console.error('Unexpected OpenAI response format:', analysisData);
      throw new Error('Invalid response from OpenAI');
    }

    let analysis;
    try {
      // Clean up the response content by removing any markdown formatting
      const content = analysisData.choices[0].message.content.trim()
        .replace(/```json\n?/g, '') // Remove ```json
        .replace(/```\n?/g, '')     // Remove closing ```
        .trim();
      
      console.log('Cleaned content for parsing:', content);
      analysis = JSON.parse(content);
      
      // Validate the required fields
      if (!analysis.description || !Array.isArray(analysis.tags) || !analysis.category) {
        console.error('Invalid analysis structure:', analysis);
        throw new Error('Missing required fields in analysis');
      }
      
      console.log('Successfully parsed analysis:', analysis);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Response content:', analysisData.choices[0].message.content);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }

    // Create note with image analysis
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        content: analysis.description,
        category: analysis.category,
        tags: analysis.tags,
        input_type: 'image',
        source_image_path: filePath
      })
      .select()
      .single();

    if (noteError) {
      console.error('Error creating note:', noteError);
      throw noteError;
    }

    console.log('Successfully created note:', note);

    return new Response(
      JSON.stringify({ success: true, note }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing image:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});