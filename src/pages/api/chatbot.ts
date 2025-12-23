import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    let message, userInfo, conversationHistory;

    // Try to parse as JSON first
    try {
      const data = await request.json();
      message = data.message;
      userInfo = data.userInfo;
      conversationHistory = data.conversationHistory;
    } catch (jsonError) {
      // If JSON parsing fails, try form data
      const formData = await request.formData();
      message = formData.get('message') as string;
      userInfo = JSON.parse(formData.get('userInfo') as string || '{}');
      conversationHistory = JSON.parse(formData.get('conversationHistory') as string || '[]');
    }

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get Gemini response
    const geminiResponse = await getGeminiResponse(message, conversationHistory);

    // Send email notification
    await sendEmailNotification(message, geminiResponse, userInfo);

    return new Response(JSON.stringify({
      response: geminiResponse,
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function getGeminiResponse(message: string, conversationHistory: any[] = []) {
  const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not configured in environment variables');
    throw new Error('Gemini API key not configured');
  }
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Build context from conversation history
  let context = `You are NKScreates, a professional creative services provider specializing in graphic design, video editing, animation, and digital art. You help clients with their creative projects.

Key services you offer:
- Graphic Design (logos, branding, marketing materials)
- Video Editing (promotional videos, social media content)
- Animation (2D/3D animations, motion graphics)
- Digital Art (illustrations, concept art)
- Web Design & Development

Your personality: Professional, creative, helpful, enthusiastic about design and technology.

Guidelines:
- Be friendly and engaging
- Ask relevant questions to understand client needs
- Provide specific recommendations when possible
- Mention portfolio/examples when relevant
- Keep responses conversational but professional
- If they ask about pricing, direct them to contact for quotes
- Always try to move conversations toward booking services

`;

  if (conversationHistory && conversationHistory.length > 0) {
    context += "\n\nConversation history:\n";
    conversationHistory.slice(-5).forEach((msg: any) => {
      context += `${msg.sender}: ${msg.content}\n`;
    });
  }

  context += `\n\nUser's current message: ${message}\n\nRespond as NKScreates:`;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: context
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid Gemini response format');
    }

  } catch (error) {
    console.error('Gemini API error:', error);
    // Smart fallback responses based on user message
    return getSmartFallbackResponse(message.toLowerCase());
  }
}

function getSmartFallbackResponse(message: string): string {
 // Greeting responses
 if (message.includes('hi') || message.includes('hello') || message.includes('hey') || message.length < 5) {
   const greetings = [
     "Hello! Welcome to NKScreates! I'm here to help bring your creative ideas to life. What kind of design project are you working on?",
     "Hi there! Thanks for reaching out to NKScreates. I specialize in graphic design, video editing, and animation. How can I help you today?",
     "Hey! Great to hear from you. As NKScreates, I create stunning visuals and animations. What creative project can I assist you with?"
   ];
   return greetings[Math.floor(Math.random() * greetings.length)];
 }

 // Service-specific responses
 if (message.includes('logo') || message.includes('branding')) {
   return "I'd love to help you with your logo or branding project! I create modern, memorable designs that represent your brand perfectly. Could you tell me about your business and what style you're envisioning?";
 }

 if (message.includes('video') || message.includes('editing')) {
   return "Video editing is one of my specialties! I can create engaging promotional videos, social media content, or cinematic edits. What type of video project are you working on?";
 }

 if (message.includes('animation') || message.includes('motion')) {
   return "Animation is where creativity meets technology! I create 2D/3D animations and motion graphics that captivate audiences. What kind of animation project do you have in mind?";
 }

 if (message.includes('graphic') || message.includes('design')) {
   return "Graphic design is my passion! From marketing materials to digital art, I can help you create visuals that communicate your message effectively. What specific design work do you need?";
 }

 if (message.includes('website') || message.includes('web')) {
   return "I also handle web design and development! I can create modern, responsive websites that showcase your work beautifully. What kind of website are you looking for?";
 }

 if (message.includes('price') || message.includes('cost') || message.includes('budget') || message.includes('fee')) {
   return "Pricing depends on the scope and complexity of your project. I offer customized quotes based on your specific needs. Could you tell me more about your project so I can provide an accurate estimate?";
 }

 if (message.includes('portfolio') || message.includes('work') || message.includes('examples')) {
   return "I'd be happy to show you my portfolio! You can check out my recent projects on the website. Each project is crafted with attention to detail and creativity. What style interests you most?";
 }

 if (message.includes('contact') || message.includes('hire') || message.includes('work with')) {
   return "I'd love to work with you! You can reach out through the contact form or check out my services page to get started. Let's discuss your project and create something amazing together!";
 }

 // General creative responses
 if (message.includes('creative') || message.includes('idea') || message.includes('project')) {
   const creativeResponses = [
     "I love working on creative projects! Every idea has potential to become something extraordinary. Tell me more about your vision and I'll help bring it to life.",
     "Creativity is at the heart of what I do. Whether it's a bold new concept or refining an existing idea, I'm here to help. What's your project about?",
     "Let's turn your creative vision into reality! I specialize in bringing unique ideas to life through design and animation. What are you envisioning?"
   ];
   return creativeResponses[Math.floor(Math.random() * creativeResponses.length)];
 }

 // Default responses
 const defaultResponses = [
   "Thanks for your message! As NKScreates, I specialize in graphic design, video editing, animation, and digital art. What creative project can I help you with?",
   "I appreciate you reaching out! I'm passionate about creating visual content that tells stories and connects with audiences. How can I assist with your project?",
   "Great to hear from you! I combine technical expertise with artistic vision to create compelling designs and animations. What are you looking to create?",
   "Thanks for connecting with NKScreates! I love helping clients bring their creative ideas to life. What kind of project are you working on?"
 ];

 return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

async function sendEmailNotification(userMessage: string, botResponse: string, userInfo: any = {}) {
  try {
    // For server-side email sending, we'll use a service like SendGrid, Mailgun, or similar
    // Since we don't have email service configured, we'll log it for now
    // In production, you'd integrate with an email service

    const emailData = {
      to: 'nikhil.as.rajpoot@gmail.com',
      subject: 'New Chatbot Message - NKScreates',
      html: `
        <h2>New Chatbot Interaction</h2>
        <p><strong>User Info:</strong></p>
        <ul>
          <li>Name: ${userInfo.name || 'Not provided'}</li>
          <li>Email: ${userInfo.email || 'Not provided'}</li>
          <li>IP: ${userInfo.ip || 'Unknown'}</li>
          <li>User Agent: ${userInfo.userAgent || 'Unknown'}</li>
          <li>Timestamp: ${new Date().toISOString()}</li>
        </ul>

        <p><strong>User Message:</strong></p>
        <p>${userMessage}</p>

        <p><strong>Bot Response:</strong></p>
        <p>${botResponse}</p>

        <hr>
        <p><em>This message was sent from the NKScreates chatbot.</em></p>
      `
    };

    console.log('Email notification data:', emailData);

    // In a real implementation, you'd send this via an email service
    // Example with a hypothetical email service:
    /*
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: 'nikhil.as.rajpoot@gmail.com' }]
        }],
        from: { email: 'chatbot@nkscreates.com' },
        subject: 'New Chatbot Message - NKScreates',
        content: [{
          type: 'text/html',
          value: emailData.html
        }]
      })
    });
    */

  } catch (error) {
    console.error('Email sending error:', error);
    // Don't fail the API response if email fails
  }
}