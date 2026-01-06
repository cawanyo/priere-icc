import SibApiV3Sdk from "sib-api-v3-sdk";

export async function POST(req) {
  const body = await req.json();
  const { email, message } = body;

  const client = SibApiV3Sdk.ApiClient.instance;
  client.authentications["api-key"].apiKey =
    process.env.BREVO_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const sendSmtpEmail = {
    sender: {
      email: "noreply@yourdomain.com", // MUST be verified in Brevo
      name: "My Website",
    },
    to: [{ email }],
    subject: "Message from my website",
    htmlContent: `<p>${message}</p>`,
  };

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
