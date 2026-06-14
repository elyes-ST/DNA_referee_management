/**
 * Base HTML template for all emails
 * Professional design with DNA branding
 */
export function getBaseTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      font-size: 28px;
      margin: 0;
    }
    .header .subtitle {
      color: #b8d4e8;
      font-size: 14px;
      margin-top: 5px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    .message {
      color: #555;
      font-size: 15px;
      margin-bottom: 20px;
    }
    .credentials-box {
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .credentials-box h3 {
      color: #1e3a5f;
      margin-bottom: 15px;
      font-size: 16px;
    }
    .credential-item {
      display: flex;
      margin-bottom: 10px;
      padding: 10px;
      background-color: #ffffff;
      border-radius: 4px;
    }
    .credential-label {
      font-weight: 600;
      color: #666;
      min-width: 120px;
    }
    .credential-value {
      color: #1e3a5f;
      font-family: 'Courier New', monospace;
      word-break: break-all;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #28a745 0%, #218838 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 30px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
    }
    .button:hover {
      background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
    }
    .button-secondary {
      background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
    }
    .warning-box {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .warning-box p {
      color: #856404;
      font-size: 14px;
      margin: 0;
    }
    .info-box {
      background-color: #d1ecf1;
      border: 1px solid #17a2b8;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .info-box p {
      color: #0c5460;
      font-size: 14px;
      margin: 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      color: #6c757d;
      font-size: 13px;
      margin-bottom: 10px;
    }
    .footer .contact {
      margin-top: 15px;
    }
    .footer .contact a {
      color: #1e3a5f;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e9ecef;
      margin: 25px 0;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
      }
      .content {
        padding: 30px 20px;
      }
      .header {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏐 DNA Arbitrage</h1>
      <p class="subtitle">Direction Nationale d'Arbitrage - Volleyball Tunisie</p>
    </div>
    
    <div class="content">
      ${content}
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} DNA - Direction Nationale d'Arbitrage</p>
      <p>Fédération Tunisienne de Volleyball</p>
      <div class="contact">
        <p>📧 <a href="mailto:contact@dna.tn">contact@dna.tn</a></p>
      </div>
      <div class="divider"></div>
      <p style="font-size: 11px; color: #adb5bd;">
        Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
