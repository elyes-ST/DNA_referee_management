import { getBaseTemplate } from './base.template';

export interface PasswordResetEmailData {
  firstName: string;
  lastName: string;
  resetToken: string;
  resetUrl?: string;
  expiresIn?: string;
}

/**
 * Password reset email template
 * Sent when user requests password reset
 */
export function getPasswordResetEmailTemplate(
  data: PasswordResetEmailData,
): string {
  const resetUrl =
    data.resetUrl || `https://dna.tn/reset-password?token=${data.resetToken}`;
  const expiresIn = data.expiresIn || '15 minutes';

  const content = `
    <p class="greeting">Bonjour ${data.firstName} ${data.lastName},</p>
    
    <p class="message">
      Vous avez demandé la réinitialisation de votre mot de passe sur 
      <strong>DNA Arbitrage</strong>.
    </p>
    
    <p class="message">
      Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
    </p>
    
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button button-secondary">
        🔑 Réinitialiser mon mot de passe
      </a>
    </div>
    
    <div class="credentials-box">
      <h3>🔗 Lien alternatif</h3>
      <p style="word-break: break-all; font-size: 13px; color: #666;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <a href="${resetUrl}" style="color: #1e3a5f;">${resetUrl}</a>
      </p>
    </div>
    
    <div class="warning-box">
      <p>
        ⚠️ <strong>Attention :</strong> Ce lien expire dans <strong>${expiresIn}</strong>. 
        Passé ce délai, vous devrez effectuer une nouvelle demande.
      </p>
    </div>
    
    <div class="divider"></div>
    
    <div class="info-box">
      <p>
        🛡️ <strong>Vous n'avez pas fait cette demande ?</strong><br>
        Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email. 
        Votre mot de passe restera inchangé.
      </p>
    </div>
    
    <p class="message">
      Cordialement,<br>
      <strong>L'équipe DNA</strong>
    </p>
  `;

  return getBaseTemplate(content, 'Réinitialisation de mot de passe - DNA');
}

/**
 * Get plain text version
 */
export function getPasswordResetEmailPlainText(
  data: PasswordResetEmailData,
): string {
  const resetUrl =
    data.resetUrl || `https://dna.tn/reset-password?token=${data.resetToken}`;
  const expiresIn = data.expiresIn || '15 minutes';

  return `
Bonjour ${data.firstName} ${data.lastName},

Vous avez demandé la réinitialisation de votre mot de passe sur DNA Arbitrage.

RÉINITIALISER VOTRE MOT DE PASSE
=================================
Cliquez sur ce lien : ${resetUrl}

ATTENTION : Ce lien expire dans ${expiresIn}.

Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.

Cordialement,
L'équipe DNA

---
© ${new Date().getFullYear()} DNA - Direction Nationale d'Arbitrage
  `.trim();
}
