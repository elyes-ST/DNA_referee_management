import { getBaseTemplate } from './base.template';

export interface WelcomeEmailData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  loginUrl?: string;
}

/**
 * Welcome email template with user credentials
 * Sent when a new user account is created
 */
export function getWelcomeEmailTemplate(data: WelcomeEmailData): string {
  const roleLabels: Record<string, string> = {
    ADMIN_DNA: 'Administrateur DNA',
    CRA: 'Président CRA',
    ARBITRE: 'Arbitre',
    INSPECTEUR: 'Inspecteur',
  };

  const roleLabel = roleLabels[data.role] || data.role;
  const loginUrl = data.loginUrl || 'https://dna.tn/login';

  const content = `
    <p class="greeting">Bonjour ${data.firstName} ${data.lastName},</p>
    
    <p class="message">
      Bienvenue sur la plateforme <strong>DNA Arbitrage</strong> ! 
      Votre compte <strong>${roleLabel}</strong> a été créé avec succès.
    </p>
    
    <div class="credentials-box">
      <h3>🔐 Vos identifiants de connexion</h3>
      <div class="credential-item">
        <span class="credential-label">Email :</span>
        <span class="credential-value">${data.email}</span>
      </div>
      <div class="credential-item">
        <span class="credential-label">Mot de passe :</span>
        <span class="credential-value">${data.password}</span>
      </div>
    </div>
    
    <div class="warning-box">
      <p>
        ⚠️ <strong>Important :</strong> Pour des raisons de sécurité, nous vous recommandons 
        de changer votre mot de passe dès votre première connexion.
      </p>
    </div>
    
    <div style="text-align: center;">
      <a href="${loginUrl}" class="button">
        🚀 Se connecter maintenant
      </a>
    </div>
    
    <div class="divider"></div>
    
    <div class="info-box">
      <p>
        💡 <strong>Besoin d'aide ?</strong> Consultez notre guide d'utilisation ou 
        contactez l'administrateur de votre région.
      </p>
    </div>
    
    <p class="message">
      Cordialement,<br>
      <strong>L'équipe DNA</strong>
    </p>
  `;

  return getBaseTemplate(content, 'Bienvenue sur DNA Arbitrage');
}

/**
 * Get plain text version for email clients that don't support HTML
 */
export function getWelcomeEmailPlainText(data: WelcomeEmailData): string {
  return `
Bonjour ${data.firstName} ${data.lastName},

Bienvenue sur la plateforme DNA Arbitrage !
Votre compte a été créé avec succès.

VOS IDENTIFIANTS DE CONNEXION
==============================
Email : ${data.email}
Mot de passe : ${data.password}

IMPORTANT : Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe dès votre première connexion.

Connectez-vous ici : ${data.loginUrl || 'https://dna.tn/login'}

Cordialement,
L'équipe DNA

---
© ${new Date().getFullYear()} DNA - Direction Nationale d'Arbitrage
Fédération Tunisienne de Volleyball
  `.trim();
}
