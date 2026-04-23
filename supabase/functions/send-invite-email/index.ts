import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the request has a valid auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { inviteeEmail, ownerName, ownerEmail } = await req.json();

    if (!inviteeEmail || !ownerName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: inviteeEmail, ownerName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending invitation email to ${inviteeEmail} from ${ownerName}`);

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: #f59e0b; color: white; font-size: 24px; line-height: 48px; text-align: center;">♪</div>
          <h1 style="font-size: 22px; font-weight: 700; margin: 16px 0 0; color: #111;">Setlist Builder</h1>
        </div>
        <div style="background: #fafafa; border-radius: 12px; padding: 32px; border: 1px solid #e5e5e5;">
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 12px; color: #111;">You've been invited to collaborate!</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 20px;">
            <strong>${ownerName}</strong> (${ownerEmail}) has invited you to collaborate on their song library and gigs in Setlist Builder.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 20px;">
            As a collaborator, you'll be able to view and edit songs, manage gigs, and build setlists together.
          </p>
          <div style="text-align: center; margin: 28px 0 8px;">
            <p style="font-size: 13px; color: #888; margin: 0;">
              Log in to your Setlist Builder account to accept the invitation.
            </p>
          </div>
        </div>
        <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 24px;">
          If you don't have an account yet, sign up with this email address (${inviteeEmail}) and the invitation will be waiting for you.
        </p>
      </div>
    `;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Setlist Builder <onboarding@resend.dev>',
        to: [inviteeEmail],
        subject: `${ownerName} invited you to collaborate on Setlist Builder`,
        html: emailHtml,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error('Resend API error:', JSON.stringify(resendData));
      return new Response(
        JSON.stringify({ error: `Resend: ${resendData.message || 'Failed to send email'}` }),
        { status: resendRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Email sent successfully:', resendData.id);

    return new Response(
      JSON.stringify({ success: true, emailId: resendData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('send-invite-email error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
